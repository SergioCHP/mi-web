/**
 * background.js — Escenarios con parallax multicapa.
 *
 * Cada capa tiene una "profundidad" (depth): 0 = infinito (no se mueve), 1 = plano de los
 * personajes, >1 = primer plano. El renderer aplica a cada capa una fracción del movimiento y
 * del zoom de la cámara → parallax real en travellings, zooms y sacudidas.
 *
 * Las capas estáticas se "hornean" UNA vez (y al redimensionar) en canvases de baja
 * resolución: 1 texel ≈ 1 píxel de los sprites (densidad 1/1,45). Se dibujan con suavizado
 * desactivado, así el fondo comparte el grano del pixel art y además cuesta muy poco.
 * Encima se pintan en vivo solo las partes animadas (núcleo Mako, luces, motas, suelo).
 */
import { Rng, smoothNoise } from '../core/utils.js';

export const HORIZON_Y = -8;
const DENSITY = 1 / 1.45;

const C = {
  skyTop: '#020409',
  skyMid: '#04121a',
  skyLow: '#0a2a2b',
  far: '#06121a',
  farLight: '#0e2a30',
  mid: '#08141a',
  midRim: 'rgba(60, 255, 190, 0.28)',
  near: '#0b1a1f',
  nearLight: '#1f4d52',
  floorTop: '#122126',
  floorBottom: '#070b0d',
  mako: '#3dffb2',
  makoSoft: '#8dffd9',
  amber: '#ffb03a',
};

function bake(view, depth, painter, { marginX = 220, marginY = 140 } = {}) {
  const halfW = view.halfW / 0.9 + marginX;
  const halfH = view.halfH / 0.9 + marginY;
  const bounds = { x0: view.homeX - halfW, x1: view.homeX + halfW, y0: view.homeY - halfH, y1: view.homeY + halfH };
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((bounds.x1 - bounds.x0) * DENSITY);
  canvas.height = Math.ceil((bounds.y1 - bounds.y0) * DENSITY);
  const g = canvas.getContext('2d');
  g.scale(DENSITY, DENSITY);
  g.translate(-bounds.x0, -bounds.y0);
  painter(g, bounds);
  return { canvas, bounds, depth };
}

function drawBaked(ctx, renderer, layer) {
  renderer.layer(layer.depth);
  ctx.imageSmoothingEnabled = false;
  const b = layer.bounds;
  ctx.drawImage(layer.canvas, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
}

/** Motas de energía que suben lentamente (atmósfera). */
class Motes {
  constructor(count, colors, rng) {
    this.colors = colors;
    this.items = Array.from({ length: count }, () => ({
      x: rng.range(-600, 600),
      y: rng.range(-260, 220),
      speed: rng.range(6, 22),
      size: rng.range(1.2, 2.8),
      phase: rng.range(0, 6.28),
      color: rng.pick(colors),
    }));
  }

  update(dt, time) {
    for (const m of this.items) {
      m.y -= m.speed * dt;
      m.x += Math.sin(time * 0.6 + m.phase) * 5 * dt;
      if (m.y < -300) m.y = 240;
    }
  }

  draw(ctx, time) {
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.items) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + m.phase);
      ctx.fillStyle = m.color;
      ctx.fillRect(m.x, m.y, m.size, m.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ═══════════════════════════ Escenario: Reactor Mako ═══════════════════════════ */

class ReactorStage {
  constructor() {
    this.time = 0;
    this.intensity = 1;
    this.dip = 0;
    this.nextDip = 2.5;
    this.lights = [];
    this.motes = new Motes(70, [C.mako, C.makoSoft, '#3fd4ff'], new Rng(77));
  }

  resize(view) {
    this.view = view;
    this.lights = [];
    this.far = bake(view, 0.08, (g, b) => this.#paintFar(g, b));
    this.mid = bake(view, 0.35, (g, b) => this.#paintMid(g, b));
    this.near = bake(view, 0.7, (g, b) => this.#paintNear(g, b), { marginY: 60 });
    this.fore = bake(view, 1.35, (g, b) => this.#paintFore(g, b), { marginX: 120, marginY: 80 });
  }

  update(dtReal) {
    this.time += dtReal;
    // Parpadeo del núcleo: respiración lenta + ruido + "bajones" esporádicos de tensión.
    this.nextDip -= dtReal;
    if (this.nextDip <= 0) {
      this.dip = 0.14;
      this.nextDip = 2 + Math.random() * 4.5;
    }
    this.dip = Math.max(0, this.dip - dtReal);
    const flicker = this.dip > 0 ? (Math.random() < 0.5 ? 0.45 : 0.7) : 1;
    this.intensity = (0.82 + 0.12 * Math.sin(this.time * 1.7) + 0.06 * smoothNoise(this.time * 3, 2)) * flicker;
    this.motes.update(dtReal, this.time);
  }

  drawBack(ctx, r) {
    drawBaked(ctx, r, this.far);
    this.#drawCoreGlow(ctx, r);
    drawBaked(ctx, r, this.mid);
    this.#drawLights(ctx, r);
    r.layer(0.55);
    this.motes.draw(ctx, this.time);
    drawBaked(ctx, r, this.near);
    this.#drawFloor(ctx, r);
  }

  drawFront(ctx, r) {
    drawBaked(ctx, r, this.fore);
  }

  // ── Capas horneadas ──

  #paintFar(g, b) {
    const sky = g.createLinearGradient(0, b.y0, 0, HORIZON_Y);
    sky.addColorStop(0, C.skyTop);
    sky.addColorStop(0.55, C.skyMid);
    sky.addColorStop(1, C.skyLow);
    g.fillStyle = sky;
    g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);

    const rng = new Rng(11);
    // Torres lejanas con tuberías verticales que se pierden en la oscuridad
    for (let i = 0; i < 16; i++) {
      const x = rng.range(b.x0, b.x1);
      if (Math.abs(x) < 150) continue;
      const w = rng.range(14, 34);
      const top = rng.range(-300, -120);
      g.fillStyle = C.far;
      g.fillRect(x, top, w, HORIZON_Y - top);
      g.fillStyle = C.farLight;
      g.fillRect(x, top, 2, HORIZON_Y - top);
      for (let y = top + 10; y < HORIZON_Y; y += rng.range(18, 40)) g.fillRect(x, y, w, 2);
    }

    // Reactor central: cilindro con anillos, contrafuertes y ranura del núcleo
    const cx = 0;
    const halfW = 92;
    const top = -270;
    g.fillStyle = '#071820';
    g.beginPath();
    g.moveTo(cx - halfW - 40, HORIZON_Y);
    g.lineTo(cx - halfW, top + 40);
    g.lineTo(cx + halfW, top + 40);
    g.lineTo(cx + halfW + 40, HORIZON_Y);
    g.closePath();
    g.fill();
    g.fillStyle = '#0a2229';
    g.fillRect(cx - halfW - 10, top, (halfW + 10) * 2, 44);
    for (let y = top + 60; y < HORIZON_Y - 10; y += 30) {
      const spread = halfW + ((y - top) / (HORIZON_Y - top)) * 40;
      g.fillStyle = '#0f2d33';
      g.fillRect(cx - spread, y, spread * 2, 4);
      g.fillStyle = '#163d40';
      for (let rx = -spread + 8; rx < spread; rx += 16) g.fillRect(cx + rx, y + 1, 2, 2);
    }
    // Tubos que suben desde la tapa
    g.fillStyle = '#081a20';
    for (const px of [-70, -38, 30, 64]) g.fillRect(cx + px, b.y0, 12, top - b.y0 + 4);
    // Ranura del núcleo (base apagada: el brillo se pinta en vivo)
    g.fillStyle = '#0f3d34';
    g.fillRect(cx - 16, top + 52, 32, HORIZON_Y - top - 64);

    // Grandes tuberías diagonales hacia los laterales
    g.lineCap = 'butt';
    for (const side of [-1, 1]) {
      g.strokeStyle = '#091c22';
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(cx + side * 70, top + 90);
      g.quadraticCurveTo(cx + side * 260, top + 60, cx + side * 600, top + 140);
      g.stroke();
      g.strokeStyle = '#123138';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx + side * 70, top + 80);
      g.quadraticCurveTo(cx + side * 260, top + 50, cx + side * 600, top + 130);
      g.stroke();
    }

    // Neblina baja del horizonte
    const haze = g.createLinearGradient(0, HORIZON_Y - 90, 0, HORIZON_Y);
    haze.addColorStop(0, 'rgba(30, 120, 100, 0)');
    haze.addColorStop(1, 'rgba(30, 120, 100, 0.35)');
    g.fillStyle = haze;
    g.fillRect(b.x0, HORIZON_Y - 90, b.x1 - b.x0, 90);
  }

  #paintMid(g, b) {
    const rng = new Rng(23);
    let x = b.x0;
    while (x < b.x1) {
      const nearCenter = Math.abs(x) < 150;
      const type = rng.int(0, 3);
      const w = type === 1 ? rng.range(26, 46) : rng.range(44, 96);
      const maxH = nearCenter ? 52 : 190;
      const h = rng.range(36, maxH);
      const top = HORIZON_Y - h;
      g.fillStyle = C.mid;

      if (type === 0) {
        // Tanque con cúpula
        g.fillRect(x, top + w * 0.25, w, h - w * 0.25);
        g.beginPath();
        g.ellipse(x + w / 2, top + w * 0.25, w / 2, w * 0.25, 0, Math.PI, 0);
        g.fill();
        g.fillStyle = C.midRim;
        g.fillRect(x, top + w * 0.25, 2, h - w * 0.25);
        for (let y = top + w * 0.4; y < HORIZON_Y; y += 22) g.fillRect(x, y, w, 1.5);
      } else if (type === 1) {
        // Haz de tuberías verticales
        let px = x;
        while (px < x + w) {
          const pw = rng.range(6, 12);
          const ph = h * rng.range(0.6, 1);
          g.fillStyle = C.mid;
          g.fillRect(px, HORIZON_Y - ph, pw, ph);
          g.fillStyle = C.midRim;
          g.fillRect(px, HORIZON_Y - ph, 1.5, ph);
          g.fillRect(px - 1, HORIZON_Y - ph, pw + 2, 3);
          px += pw + 2;
        }
      } else if (type === 2) {
        // Bloque de maquinaria con rejillas y ventanas
        g.fillRect(x, top, w, h);
        g.fillStyle = C.midRim;
        g.fillRect(x, top, w, 1.5);
        g.fillRect(x, top, 1.5, h);
        g.fillStyle = 'rgba(80, 255, 200, 0.16)';
        for (let vy = top + 10; vy < HORIZON_Y - 10; vy += 14) {
          for (let vx = x + 8; vx < x + w - 10; vx += 14) if (rng.chance(0.35)) g.fillRect(vx, vy, 6, 3);
        }
      } else {
        // Torre de celosía con brazo de grúa
        const tw = 18;
        g.strokeStyle = C.mid;
        g.lineWidth = 3;
        g.strokeRect(x, top, tw, h);
        g.beginPath();
        for (let y = top; y < HORIZON_Y; y += 16) {
          g.moveTo(x, y);
          g.lineTo(x + tw, y + 16);
          g.moveTo(x + tw, y);
          g.lineTo(x, y + 16);
        }
        g.stroke();
        if (!nearCenter) {
          g.fillStyle = C.mid;
          g.fillRect(x - 40, top, 110, 6);
          g.fillRect(x + 60, top + 6, 2, 50);
        }
      }

      // Luces de aviso (se animan en vivo)
      if (rng.chance(0.55)) this.lights.push({ x: x + rng.range(4, w - 4), y: top + rng.range(4, 18), phase: rng.range(0, 6.28), rate: rng.range(0.6, 1.8), color: rng.chance(0.75) ? C.amber : '#ff3d5a' });
      x += w + rng.range(6, 30);
    }

    // Tubería horizontal continua con bridas
    g.fillStyle = '#0a191e';
    g.fillRect(b.x0, HORIZON_Y - 40, b.x1 - b.x0, 12);
    g.fillStyle = '#16343a';
    g.fillRect(b.x0, HORIZON_Y - 40, b.x1 - b.x0, 2);
    for (let fx = b.x0; fx < b.x1; fx += 70) g.fillRect(fx, HORIZON_Y - 43, 5, 18);
  }

  #paintNear(g, b) {
    // Barandilla del puente metálico (borde lejano de la pasarela donde se lucha)
    const railTop = HORIZON_Y - 30;
    g.fillStyle = C.near;
    g.fillRect(b.x0, HORIZON_Y - 6, b.x1 - b.x0, 10);
    for (let x = Math.floor(b.x0 / 48) * 48; x < b.x1; x += 48) {
      g.fillStyle = C.near;
      g.fillRect(x, railTop, 5, HORIZON_Y - railTop);
      g.fillStyle = C.nearLight;
      g.fillRect(x, railTop, 1.5, HORIZON_Y - railTop);
    }
    for (const y of [railTop, railTop + 13]) {
      g.fillStyle = C.near;
      g.fillRect(b.x0, y, b.x1 - b.x0, 4);
      g.fillStyle = C.nearLight;
      g.fillRect(b.x0, y, b.x1 - b.x0, 1);
    }
  }

  #paintFore(g, b) {
    // Tubería gigante en primer plano (esquinas): da escala y profundidad sin tapar el combate.
    const v = this.view;
    const bottom = v.homeY + v.halfH;
    for (const side of [-1, 1]) {
      const edge = v.homeX + side * (v.halfW + 30);
      g.fillStyle = '#030607';
      g.beginPath();
      g.ellipse(edge, bottom + 30, 120, 64, side * 0.2, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(60, 255, 190, 0.18)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(edge, bottom + 30, 120, 64, side * 0.2, Math.PI * 1.1, Math.PI * 1.6);
      g.stroke();
    }
    // Cables colgando del techo
    g.strokeStyle = '#030607';
    g.lineWidth = 4;
    const top = v.homeY - v.halfH - 10;
    for (const [x0, x1, sag] of [
      [v.homeX - v.halfW - 40, v.homeX - v.halfW * 0.45, 60],
      [v.homeX + v.halfW * 0.5, v.homeX + v.halfW + 50, 46],
    ]) {
      g.beginPath();
      g.moveTo(x0, top);
      g.quadraticCurveTo((x0 + x1) / 2, top + sag * 2, x1, top);
      g.stroke();
    }
  }

  // ── Partes animadas ──

  #drawCoreGlow(ctx, r) {
    r.layer(0.08);
    const k = this.intensity;
    ctx.globalCompositeOperation = 'lighter';
    const slit = ctx.createLinearGradient(-30, 0, 30, 0);
    slit.addColorStop(0, 'rgba(61,255,178,0)');
    slit.addColorStop(0.5, `rgba(141,255,217,${0.9 * k})`);
    slit.addColorStop(1, 'rgba(61,255,178,0)');
    ctx.fillStyle = slit;
    ctx.fillRect(-30, -218, 60, 200);
    const halo = ctx.createRadialGradient(0, -120, 10, 0, -120, 260);
    halo.addColorStop(0, `rgba(61,255,178,${0.32 * k})`);
    halo.addColorStop(0.5, `rgba(30,160,130,${0.12 * k})`);
    halo.addColorStop(1, 'rgba(30,160,130,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-300, -380, 600, 420);
    // Haz vertical que sube hacia la oscuridad
    const beam = ctx.createLinearGradient(0, -560, 0, -220);
    beam.addColorStop(0, 'rgba(61,255,178,0)');
    beam.addColorStop(1, `rgba(61,255,178,${0.22 * k})`);
    ctx.fillStyle = beam;
    ctx.fillRect(-22, -560, 44, 340);
    ctx.globalCompositeOperation = 'source-over';
  }

  #drawLights(ctx, r) {
    r.layer(0.35);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const on = Math.sin(this.time * l.rate * 3 + l.phase) > 0.2;
      if (!on) continue;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = l.color;
      ctx.fillRect(l.x - 1, l.y - 1, 2.5, 2.5);
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Suelo en perspectiva: la línea del horizonte se desplaza menos que el borde inferior (3D simulado). */
  #drawFloor(ctx, r) {
    r.layer(1);
    const v = this.view;
    const cam = r.camera;
    const top = HORIZON_Y;
    const bottom = v.homeY + v.halfH / 0.85 + 80;
    const left = v.homeX - v.halfW / 0.85 - 400;
    const right = v.homeX + v.halfW / 0.85 + 400;
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, C.floorTop);
    grad.addColorStop(1, C.floorBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, right - left, bottom - top);

    // Reflejo del núcleo Mako en las planchas
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, top + 10, 0, 0, top + 10, 260);
    glow.addColorStop(0, `rgba(61,255,178,${0.16 * this.intensity})`);
    glow.addColorStop(1, 'rgba(61,255,178,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-300, top, 600, 200);
    ctx.globalCompositeOperation = 'source-over';

    const dx = cam.viewX - cam.home.x;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(90, 170, 165, 0.16)';
    ctx.beginPath();
    for (let i = -16; i <= 16; i++) {
      const xt = i * 64 * 0.34 + dx * 0.32; // en el horizonte: se mueve menos (lejos)
      const xb = i * 64 * 1.5 - dx * 0.35; // abajo: se mueve más (cerca)
      ctx.moveTo(xt, top);
      ctx.lineTo(xb, bottom);
    }
    for (let k = 1; k <= 12; k++) {
      const y = top + (bottom - top) * Math.pow(k / 12, 1.9);
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    // Borde del puente
    ctx.fillStyle = 'rgba(120, 255, 210, 0.22)';
    ctx.fillRect(left, top, right - left, 1.2);
  }
}

/* ═══════════════════════ Escenarios a partir de imágenes ═══════════════════════ */

/**
 * Escenario pintado (una o varias capas de imagen) con vida añadida en canvas:
 * fuentes de luz que titilan y motas en suspensión.
 *
 * Cada capa: { image, depth, floorLine, darken, fit, height, focusY, overscan }
 *   · depth: 0.1 lejos … 1 plano de los personajes (parallax).
 *   · floorLine: proporción vertical de la imagen donde empieza el suelo. Se alinea con el
 *     horizonte del motor y el borde inferior con la base del área segura → los pies apoyan bien.
 *   · height: alto fijo en unidades de mundo (en vez de deducirlo de floorLine); la línea de
 *     suelo sigue apoyada en el horizonte. Útil para capas medias "posadas" en el horizonte.
 *   · fit: 'cover' → la capa cubre toda la vista (con margen `overscan` para parallax y
 *     sacudidas), centrada; `focusY` es la fracción de la imagen que cae en el centro de la vista.
 *     Para la capa lejana: se ve entera en escritorio y en móvil vertical.
 *   · coverWidth: amplía la capa si la vista es más ancha que ella (útil para el suelo).
 * Las capas medias/frontales deben tener transparencia (PNG/WebP con alfa).
 */
class ImageStage {
  constructor(layers, { lights = [], lightColor = '255,170,80', lightRadius = 120, motes = ['#ffcf8a', '#ffe9c4'] } = {}) {
    this.layers = layers.map((l) => ({ floorLine: 0.71, depth: 0.85, darken: 0, focusY: 0.5, overscan: 1.18, ...l }));
    this.lights = lights;
    this.lightColor = lightColor;
    this.lightRadius = lightRadius;
    this.time = 0;
    this.motes = new Motes(45, motes, new Rng(5));
  }

  resize(view) {
    this.view = view;
    for (const l of this.layers) {
      const aspect = l.image.width / l.image.height;
      if (l.fit === 'cover') {
        const h = Math.max(view.halfH * 2 * l.overscan, (view.halfW * 2 * l.overscan) / aspect);
        const w = h * aspect;
        l.rect = { x: view.homeX - w / 2, y: view.homeY - h * l.focusY, w, h };
        continue;
      }
      let h = l.height ?? (view.homeY + view.halfH + 20 - HORIZON_Y) / (1 - l.floorLine);
      // coverWidth: en vistas muy anchas (HUD alto, 3 vs 3, monitores 21:9) la capa se amplía
      // hasta cubrir el ancho; la línea de suelo sigue en el horizonte y el exceso queda abajo.
      if (l.coverWidth) h = Math.max(h, (view.halfW * 2 * l.overscan) / aspect);
      const w = h * aspect;
      l.rect = { x: -w / 2, y: HORIZON_Y - h * l.floorLine, w, h };
    }
  }

  update(dtReal) {
    this.time += dtReal;
    this.motes.update(dtReal, this.time);
  }

  drawBack(ctx, r) {
    this.layers.forEach((l, i) => {
      r.layer(l.depth);
      ctx.imageSmoothingEnabled = true;
      if (i === 0) {
        ctx.fillStyle = '#05060a';
        ctx.fillRect(l.rect.x - 2000, l.rect.y - 2000, l.rect.w + 4000, l.rect.h + 4000);
      }
      ctx.drawImage(l.image, l.rect.x, l.rect.y, l.rect.w, l.rect.h);
      if (l.darken) {
        // Oscurecido para que los sprites destaquen sobre fondos muy detallados
        ctx.fillStyle = `rgba(4, 5, 10, ${l.darken})`;
        ctx.fillRect(l.rect.x, l.rect.y, l.rect.w, l.rect.h);
      }
    });

    // Luces: coordenadas [u, v] relativas a la primera capa (0..1)
    const base = this.layers[0];
    r.layer(base.depth);
    ctx.globalCompositeOperation = 'lighter';
    for (const [u, v] of this.lights) {
      const x = base.rect.x + u * base.rect.w;
      const y = base.rect.y + v * base.rect.h;
      const k = 0.75 + 0.25 * smoothNoise(this.time * 6, u * 10);
      const radius = this.lightRadius;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(${this.lightColor},${0.35 * k})`);
      g.addColorStop(1, `rgba(${this.lightColor},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    r.layer(0.9);
    this.motes.draw(ctx, this.time);
  }

  drawFront() {}
}

/**
 * Fábrica de escenarios. Un fondo generado con IA (docs/GUIA_SPRITES.md) se añade aquí como
 * ImageStage con sus capas; las imágenes se cargan en main.js (función loadStageImages).
 */
export function createStage(name, images = {}) {
  // Reactor Mako pintado (docs/GUIA_SPRITES.md §4.7 A). Capas preparadas con tools/stage_layer.py.
  // Si falta alguna imagen se usa el reactor procedural, que no necesita descargas.
  if (name === 'mako' && images.makoFar && images.makoMid && images.makoFloor) {
    return new ImageStage([
      { image: images.makoFar, depth: 0.12, fit: 'cover', focusY: 0.5, darken: 0.12 },
      { image: images.makoMid, depth: 0.45, floorLine: 0.84, height: 240 },
      { image: images.makoFloor, depth: 1, floorLine: 0.49, darken: 0.08, coverWidth: true },
    ], { lights: [[0.5, 0.42]], lightColor: '61,255,178', lightRadius: 170, motes: ['#3dffb2', '#8dffd9', '#3fd4ff'] });
  }
  if (name === 'dungeon' && images.dungeon) {
    return new ImageStage([{ image: images.dungeon, depth: 0.85, floorLine: 0.71, darken: 0.42 }], {
      lights: [[0.213, 0.4], [0.808, 0.4]],
    });
  }
  // Ejemplo con capas generadas por IA (descomentar al tener las imágenes):
  // if (name === 'highway' && images.highwayFar) {
  //   return new ImageStage([
  //     { image: images.highwayFar, depth: 0.15, floorLine: 0.71 },
  //     { image: images.highwayMid, depth: 0.5, floorLine: 0.71 },
  //     { image: images.highwayFloor, depth: 1, floorLine: 0.71 },
  //   ], { lights: [[0.3, 0.35]], lightColor: '255,46,151', motes: ['#ff2e97', '#38bdf8'] });
  // }
  return new ReactorStage();
}
