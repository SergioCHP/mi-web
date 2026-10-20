/**
 * combatant-view.js — Representación visual de un Combatant.
 *
 * Lee el modelo (hp, estados…) pero nunca lo modifica. Gestiona: animación de sprites,
 * posición/desplazamientos (tweens del Director), sombra en el suelo, destello de impacto,
 * retroceso, temblor, imágenes residuales, disolución al morir y resaltado de objetivo.
 */
import { Animator } from './sprite.js';
import { clamp, lerp } from '../core/utils.js';

const DEPTH_NEAR_Y = 150;
const DEPTH_FAR_Y = 40;

export class CombatantView {
  /**
   * @param {import('../battle/combatant.js').Combatant} unit
   * @param {object} o
   * @param {object} o.clips   Clips del personaje (data/sprites.js)
   * @param {Map<string, import('./sprite.js').SpriteSheet>} o.sheets
   * @param {{x:number, y:number}} o.home  Posición de formación (pies)
   * @param {boolean} o.flip   true = mira a la izquierda
   */
  constructor(unit, { clips, sheets, home, flip }) {
    this.unit = unit;
    this.anim = new Animator(clips, sheets);
    this.home = { ...home };
    this.x = home.x;
    this.y = home.y;
    this.flip = flip;
    this.tint = unit.template.tint ?? null;
    /** Unidades voladoras (p. ej. un dron): altura de levitación sobre su sombra. */
    this.hover = unit.template.hover ?? 0;
    // Escala en perspectiva: la fila trasera se ve un poco más pequeña.
    const depthT = clamp((home.y - DEPTH_FAR_Y) / (DEPTH_NEAR_Y - DEPTH_FAR_Y), 0, 1);
    this.scale = unit.template.pixelScale * lerp(0.92, 1.05, depthT);

    // Valores animables (tweens del Director)
    this.lift = 0; // altura sobre el suelo (saltos)
    this.alpha = 1;
    this.flash = 0; // 0..1 silueta blanca
    this.flashColor = 'white';
    this.recoil = 0; // empuje horizontal al recibir golpe
    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.tilt = 0;
    this.dissolve = 0; // 0..1 (K.O. enemigo)
    this.collapsed = 0; // 0..1 (K.O. héroe)
    this.squash = 0; // -1..1 estiramiento al aterrizar/saltar
    this.aura = 0; // 0..1 brillo de canalización
    this.auraColor = '#5ad8ff';

    this.targeted = false;
    this.hovered = false;
    this.ghosting = false;
    this.ghosts = [];
    this.ghostTimer = 0;
    this.time = Math.random() * 10;
  }

  get sheet() {
    return this.anim.sheet;
  }

  /** Altura aproximada del cuerpo en unidades de mundo (frame 0 del idle). */
  get bodyHeight() {
    const idle = this.anim.sheets.get(this.anim.resolve('idle').sheet);
    return (idle?.anchor.y ?? 80) * this.scale * 0.95;
  }

  get bodyWidth() {
    const idle = this.anim.sheets.get(this.anim.resolve('idle').sheet);
    return (idle?.frameWidth ?? 60) * this.scale * 0.6;
  }

  /** Punto del pecho (impactos, proyectiles). */
  /** Elevación total sobre el suelo: saltos + levitación con balanceo suave. */
  get elevation() {
    return this.lift + (this.hover ? this.hover + Math.sin(this.time * 2.4) * 3 : 0);
  }

  chest() {
    return { x: this.x + this.recoil, y: this.y - this.elevation - this.bodyHeight * 0.55 };
  }

  /**
   * Boca del arma para disparos: dato `muzzle` del clip actual (px de la hoja respecto a los
   * pies, mirando a la derecha). Sin dato, un punto delante del pecho.
   */
  muzzle() {
    const dir = this.flip ? -1 : 1;
    const m = this.anim.clip?.muzzle;
    if (!m) {
      const c = this.chest();
      return { x: c.x + dir * this.bodyWidth * 0.7, y: c.y };
    }
    return { x: this.x + this.recoil + dir * m.x * this.scale, y: this.y - this.elevation - m.y * this.scale };
  }

  head() {
    return { x: this.x, y: this.y - this.elevation - this.bodyHeight };
  }

  bounds() {
    const w = this.bodyWidth;
    const h = this.bodyHeight;
    return { x0: this.x - w / 2, x1: this.x + w / 2, y0: this.y - this.elevation - h, y1: this.y - this.elevation + 4 };
  }

  play(clip, opts) {
    return this.anim.play(clip, opts);
  }

  hurt(strength = 1, fromLeft = true) {
    this.flash = 1;
    this.flashColor = 'white';
    this.recoil = (fromLeft ? 1 : -1) * 10 * strength;
    this.shakeTime = 0.22 + 0.1 * strength;
    this.shakeAmp = 3 + 3 * strength;
    if (this.anim.isNative('hurt')) this.play('hurt');
  }

  update(dt) {
    this.time += dt;
    this.anim.update(dt);
    this.flash = Math.max(0, this.flash - dt * 6);
    this.recoil *= Math.exp(-dt * 9);
    if (Math.abs(this.recoil) < 0.05) this.recoil = 0;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.squash *= Math.exp(-dt * 10);

    if (this.ghosting) {
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0 && this.sheet) {
        this.ghostTimer = 0.03;
        this.ghosts.push({ x: this.x, y: this.y - this.elevation, frame: this.anim.frame, sheet: this.sheet, life: 0.22 });
      }
    }
    for (const g of this.ghosts) g.life -= dt;
    this.ghosts = this.ghosts.filter((g) => g.life > 0);
  }

  drawShadow(ctx) {
    if (this.alpha <= 0.01 || this.dissolve >= 1) return;
    const w = this.bodyWidth * 0.75;
    const lift = clamp(this.elevation / 120, 0, 0.8);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.42 * this.alpha * (1 - lift) * (1 - this.dissolve)})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 1, w * (1 - lift * 0.5), w * 0.22 * (1 - lift * 0.5), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(ctx) {
    const sheet = this.sheet;
    if (!sheet || this.alpha <= 0.01 || this.dissolve >= 1) return;

    // Imágenes residuales (aditivas, cian)
    if (this.ghosts.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const g of this.ghosts) {
        ctx.globalAlpha = (g.life / 0.22) * 0.45;
        g.sheet.draw(ctx, g.sheet.variant('ghost'), g.frame, g.x, g.y, this.scale, this.flip);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    const shake = this.shakeTime > 0 ? Math.sin(this.time * 90) * this.shakeAmp * (this.shakeTime / 0.3) : 0;
    const x = this.x + this.recoil + shake;
    const y = this.y - this.elevation;
    const sx = 1 + this.squash * 0.12;
    const sy = 1 - this.squash * 0.12;

    ctx.save();
    ctx.translate(x, y);
    if (this.tilt || this.collapsed) ctx.rotate((this.flip ? 1 : -1) * (this.tilt + this.collapsed * 0.25));
    ctx.scale(sx, sy * (1 - this.collapsed * 0.25));
    const baseAlpha = this.alpha * (1 - this.dissolve) * (1 - this.collapsed * 0.35);
    const frame = this.anim.frame;
    const source = sheet.variant(this.tint, 0.75);

    // Contorno de selección: silueta blanca desplazada en 4 direcciones bajo el sprite.
    if (this.targeted || this.hovered) {
      const pulse = this.targeted ? 0.55 + 0.35 * Math.sin(this.time * 9) : 0.35;
      ctx.globalAlpha = baseAlpha * pulse;
      const outline = sheet.variant('white');
      const o = 1.6;
      for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) sheet.draw(ctx, outline, frame, ox, oy, this.scale, this.flip);
    }

    // Aura de canalización: silueta de color aditiva y palpitante.
    if (this.aura > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = this.aura * (0.35 + 0.2 * Math.sin(this.time * 14));
      const glow = sheet.variant(`solid:${this.auraColor}`);
      for (const [ox, oy] of [[-2.5, 0], [2.5, 0], [0, -2.5]]) sheet.draw(ctx, glow, frame, ox, oy, this.scale, this.flip);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.globalAlpha = baseAlpha;
    sheet.draw(ctx, source, frame, 0, 0, this.scale, this.flip);

    if (this.flash > 0.01) {
      ctx.globalAlpha = baseAlpha * this.flash;
      sheet.draw(ctx, sheet.variant(this.flashColor === 'white' ? 'white' : `solid:${this.flashColor}`), frame, 0, 0, this.scale, this.flip);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
