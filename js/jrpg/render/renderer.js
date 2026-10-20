/**
 * renderer.js — Composición de cada frame en el canvas.
 *
 * Orden de dibujo (de atrás hacia delante):
 *   1. Escenario (capas parallax lejanas → suelo)
 *   2. Oscurecido de cinemática (afecta al fondo, no a los personajes)
 *   3. Efectos de suelo (círculos mágicos) y sombras de contacto
 *   4. Combatientes ordenados por Y (los de la fila delantera tapan a los de atrás)
 *   5. Efectos frontales y partículas
 *   6. Primer plano parallax (depth > 1)
 *   7. Interfaz en pantalla: placas de enemigos, iconos de estado, cursor, números flotantes
 *   8. Post-procesado: desaturación, barras de cine, rótulos, flash, viñeta, scanlines
 *
 * Coordenadas: "mundo" = unidades lógicas (área segura de CONFIG.world, origen en el centro).
 * El canvas se ajusta a devicePixelRatio (tope 2) para nitidez sin coste excesivo en móviles.
 */
import { drawIcon, ICON_COLORS } from './icons.js';
import { damp } from '../core/utils.js';

const ELEMENTS = ['fire', 'thunder'];

export class Renderer {
  constructor({ canvas, config, camera, stage, particles, texts, effects, post, font }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.config = config;
    this.camera = camera;
    this.stage = stage;
    this.particles = particles;
    this.texts = texts;
    this.effects = effects;
    this.post = post;
    this.font = font;
    this.views = [];
    this.cursorTime = 0;
    this.debugLines = null;
    this.cssWidth = 1;
    this.cssHeight = 1;
    this.dpr = 1;
    this.viewScale = 1;
    this.#snapNext = true;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  #snapNext;

  setViews(views) {
    this.views = views;
  }

  setStage(stage) {
    this.stage = stage;
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (w === this.cssWidth && h === this.cssHeight && dpr === this.dpr && !this.#snapNext) return;

    this.cssWidth = w;
    this.cssHeight = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    // Pantallas verticales: área segura más estrecha y formación más compacta → sprites
    // ~20 % más grandes en móvil sin que nadie se salga del plano.
    this.compact = w / h < 0.9;
    this.formationScale = this.compact ? 0.8 : 1;
    const safeWidth = this.config.world.safeWidth * (this.compact ? 0.84 : 1);
    const { safeHeight } = this.config.world;
    this.viewScale = Math.min(w / safeWidth, h / safeHeight);
    this.halfW = w / (2 * this.viewScale);
    this.halfH = h / (2 * this.viewScale);
    // Encuadre: en pantallas altas (móvil vertical) el combate se apoya abajo, cerca del HUD,
    // y el espacio sobrante muestra el cielo del escenario.
    const homeY = Math.min(14, safeHeight / 2 + 15 - this.halfH);
    this.camera.setHome(0, homeY, 1);
    this.camera.setFrame(this.halfW, this.halfH, this.compact);
    if (this.#snapNext) {
      this.camera.reset();
      this.camera.snap();
      this.#snapNext = false;
    } else if (this.camera.target.zoom === 1) {
      this.camera.reset();
    }

    this.stage?.resize({ halfW: this.halfW, halfH: this.halfH, homeX: 0, homeY });
    this.post.resize(w, h, dpr);
    this.onResize?.();
  }

  /** Transformación para una capa con profundidad `depth` (1 = plano de los personajes). */
  layer(depth) {
    const cam = this.camera;
    const zoom = 1 + (cam.zoom - 1) * depth;
    const s = this.viewScale * zoom * this.dpr;
    const cx = cam.home.x + (cam.viewX - cam.home.x) * depth;
    const cy = cam.home.y + (cam.viewY - cam.home.y) * depth;
    const cos = Math.cos(cam.angle);
    const sin = Math.sin(cam.angle);
    this.ctx.setTransform(s * cos, s * sin, -s * sin, s * cos, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.translate(-cx, -cy);
  }

  /** Mundo → píxeles CSS (plano de los personajes). */
  project = (wx, wy) => {
    const cam = this.camera;
    const s = this.viewScale * cam.zoom;
    const dx = wx - cam.viewX;
    const dy = wy - cam.viewY;
    const cos = Math.cos(cam.angle);
    const sin = Math.sin(cam.angle);
    return { x: this.cssWidth / 2 + (dx * cos - dy * sin) * s, y: this.cssHeight / 2 + (dx * sin + dy * cos) * s };
  };

  /** Píxeles CSS → mundo (para clics/toques). */
  unproject(px, py) {
    const cam = this.camera;
    const s = this.viewScale * cam.zoom;
    const dx = (px - this.cssWidth / 2) / s;
    const dy = (py - this.cssHeight / 2) / s;
    const cos = Math.cos(-cam.angle);
    const sin = Math.sin(-cam.angle);
    return { x: cam.viewX + dx * cos - dy * sin, y: cam.viewY + dx * sin + dy * cos };
  }

  /** Devuelve la vista bajo el punteo (con margen generoso para dedos), o null. */
  pick(px, py, candidates) {
    const p = this.unproject(px, py);
    const pad = 14;
    let best = null;
    let bestDist = Infinity;
    for (const view of candidates) {
      const b = view.bounds();
      if (p.x < b.x0 - pad || p.x > b.x1 + pad || p.y < b.y0 - pad || p.y > b.y1 + pad) continue;
      const d = Math.hypot(p.x - (b.x0 + b.x1) / 2, p.y - (b.y0 + b.y1) / 2);
      if (d < bestDist) {
        best = view;
        bestDist = d;
      }
    }
    return best;
  }

  render(dtGame, dtReal) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.stage.drawBack(ctx, this);
    this.post.drawDarken(ctx);

    this.layer(1);
    this.effects.draw(ctx, 'back');
    for (const v of this.views) v.drawShadow(ctx);
    ctx.imageSmoothingEnabled = false;
    const sorted = [...this.views].sort((a, b) => a.y - b.y);
    for (const v of sorted) v.draw(ctx);
    ctx.imageSmoothingEnabled = true;
    this.effects.draw(ctx, 'front');
    this.particles.draw(ctx);

    this.stage.drawFront(ctx, this);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.cursorTime += dtReal;
    this.#drawUnitOverlays(ctx, dtReal);
    this.texts.draw(ctx, this.project);
    this.post.drawOverlay(ctx);
    if (this.debugLines) this.#drawDebug(ctx);
  }

  // ───────────────────────── Interfaz sobre el canvas ─────────────────────────

  #drawUnitOverlays(ctx, dt) {
    const small = this.cssWidth < 520;
    for (const view of this.views) {
      const unit = view.unit;
      // Barras con "daño fantasma": la blanca va detrás de la roja (lectura clara del golpe).
      view.hpShown = view.hpShown ?? unit.hp;
      view.hpGhost = view.hpGhost ?? unit.hp;
      view.hpShown = damp(view.hpShown, unit.hp, 14, dt);
      view.hpGhost = unit.hp > view.hpGhost ? unit.hp : damp(view.hpGhost, unit.hp, 2.6, dt);

      const fade = view.alpha * (1 - view.dissolve);
      if (fade <= 0.02) continue;
      const head = this.project(view.x, view.y - view.elevation - view.bodyHeight - 6);
      let y = head.y;

      if (!unit.isHero && unit.alive) {
        y = this.#drawEnemyPlate(ctx, view, head.x, y, fade, small);
      }
      if (unit.statuses.size && unit.alive) {
        y -= 4;
        const size = small ? 12 : 14;
        const ids = [...unit.statuses.keys()];
        let x = head.x - ((ids.length - 1) * (size + 4)) / 2;
        for (const id of ids) {
          drawIcon(ctx, id, x, y - size / 2, size, { alpha: fade });
          ctx.font = `700 ${Math.round(size * 0.62)}px ${this.font}`;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#fff';
          ctx.fillText(String(unit.statuses.get(id).turns), x + size * 0.32, y - size * 0.05);
          x += size + 4;
        }
        y -= size + 2;
      }
      if (view.targeted) this.#drawCursor(ctx, head.x, y - 4, unit);
    }
  }

  #drawEnemyPlate(ctx, view, x, y, alpha, small) {
    const unit = view.unit;
    const width = small ? 54 : 70;
    const barY = y - 6;
    const name = view.label ?? unit.key;
    // La placa no se sale del canvas: con nombres largos ("Soldado de Élite") y el enemigo en
    // el borde (móvil vertical), el nombre se cortaba. Se desplaza lo justo hacia dentro.
    ctx.font = `700 ${small ? 10 : 12}px ${this.font}`;
    const half = Math.max(width / 2, ctx.measureText(name).width / 2) + 6;
    if (this.cssWidth > half * 2) x = Math.min(this.cssWidth - half, Math.max(half, x));
    ctx.globalAlpha = alpha;

    // Iconos de debilidad (se revelan al probar cada elemento, estilo Octopath Traveler)
    const iconSize = small ? 10 : 12;
    let ix = x - ((ELEMENTS.length - 1) * (iconSize + 5)) / 2;
    for (const el of ELEMENTS) {
      const known = unit.revealed.has(el);
      const weak = unit.template.elements.weak?.includes(el);
      const resist = unit.template.elements.resist?.includes(el);
      if (!known) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(ix - iconSize * 0.62, barY + 9 - iconSize * 0.62, iconSize * 1.24, iconSize * 1.24);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = `700 ${Math.round(iconSize * 0.9)}px ${this.font}`;
        ctx.textAlign = 'center';
        ctx.fillText('?', ix, barY + 9 + iconSize * 0.33);
      } else {
        drawIcon(ctx, el, ix, barY + 9, iconSize, {
          alpha: alpha * (resist ? 0.45 : 1),
          frameColor: weak ? 'rgba(255,46,151,0.85)' : 'rgba(0,0,0,0.65)',
        });
      }
      ix += iconSize + 5;
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - width / 2 - 1, barY - 1, width + 2, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - width / 2, barY, (width * view.hpGhost) / unit.maxHp, 4);
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(x - width / 2, barY, (width * view.hpShown) / unit.maxHp, 4);

    ctx.font = `700 ${small ? 10 : 12}px ${this.font}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(name, x, barY - 5);
    ctx.fillStyle = '#ffd6e4';
    ctx.fillText(name, x, barY - 5);
    ctx.globalAlpha = 1;
    return barY - 18;
  }

  /** Cursor de selección: flecha que rebota + etiqueta del nombre en aliados. */
  #drawCursor(ctx, x, y, unit) {
    const bob = Math.sin(this.cursorTime * 8) * 4;
    ctx.save();
    ctx.translate(x, y - 10 + bob);
    ctx.fillStyle = unit.isHero ? ICON_COLORS.barrier : '#ff2e97';
    ctx.strokeStyle = '#05060a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  #drawDebug(ctx) {
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(6, 6, 300, 14 * this.debugLines.length + 8);
    ctx.fillStyle = '#7dffb2';
    this.debugLines.forEach((line, i) => ctx.fillText(line, 12, 22 + i * 14));
  }

  destroy() {
    this.resizeObserver.disconnect();
  }
}

