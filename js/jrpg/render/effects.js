/**
 * effects.js — Efectos procedurales que no son partículas sueltas: tajos, rayos,
 * proyectiles, círculos mágicos, columnas de luz y escudos. Todo vectorial en canvas.
 *
 * Contrato de un efecto: update(dt) → false cuando termina; draw(ctx) en coords de mundo;
 * `layer` = 'back' (bajo los sprites, p. ej. círculos en el suelo) o 'front'.
 */
import { Ease, clamp, hexToRgb } from '../core/utils.js';
import { Shape } from './particles.js';

const TAU = Math.PI * 2;
const rgba = (hex, a) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

class Effect {
  constructor(life, layer = 'front') {
    this.life = life;
    this.maxLife = life;
    this.layer = layer;
  }

  get t() {
    return clamp(1 - this.life / this.maxLife, 0, 1);
  }

  update(dt) {
    this.life -= dt;
    return this.life > 0;
  }
}

/** Media luna de corte que barre un arco (espadas, zarpazos grandes). */
export class Slash extends Effect {
  constructor({ x, y, radius = 46, angle = -0.6, sweep = 2.4, width = 14, color = '#7fe3ff', life = 0.26, flip = false }) {
    super(life);
    Object.assign(this, { x, y, radius, angle, sweep: flip ? -sweep : sweep, width, color });
  }

  draw(ctx) {
    const t = this.t;
    const head = Ease.outCubic(Math.min(1, t / 0.55));
    const tail = Ease.inQuad(clamp((t - 0.25) / 0.75, 0, 1));
    const a0 = this.angle + this.sweep * tail;
    const a1 = this.angle + this.sweep * head;
    if (Math.abs(a1 - a0) < 0.01) return;
    const ccw = this.sweep < 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, 0.72);
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, alpha, col] of [
      [this.width, 0.35, this.color],
      [this.width * 0.45, 0.9, '#ffffff'],
    ]) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + w / 2, a0, a1, ccw);
      ctx.arc(0, 0, this.radius - w / 2, a1, a0, !ccw);
      ctx.closePath();
      ctx.fillStyle = rgba(col, alpha * (1 - t * 0.6));
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Tres arañazos paralelos. */
export class ClawMarks extends Effect {
  constructor({ x, y, size = 40, color = '#ff3b5c', life = 0.3, flip = false }) {
    super(life);
    Object.assign(this, { x, y, size, color, dir: flip ? -1 : 1 });
  }

  draw(ctx) {
    const t = this.t;
    const draw = Ease.outExpo(Math.min(1, t / 0.35));
    const fade = 1 - Ease.inQuad(clamp((t - 0.35) / 0.65, 0, 1));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const ox = i * this.size * 0.28;
      const x0 = ox - this.size * 0.45 * this.dir;
      const y0 = -this.size * 0.55;
      const x1 = x0 + (ox + this.size * 0.45 * this.dir - x0) * draw;
      const y1 = y0 + this.size * 1.1 * draw;
      for (const [w, a, c] of [
        [7, 0.4 * fade, this.color],
        [2.2, 0.95 * fade, '#ffffff'],
      ]) {
        ctx.strokeStyle = rgba(c, a);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** Rayo quebrado con ramas que se regenera varias veces por segundo (parpadeo eléctrico). */
export class Bolt extends Effect {
  constructor({ x0, y0, x1, y1, color = '#ffe45c', life = 0.42, width = 3, jitter = 22 }) {
    super(life);
    Object.assign(this, { x0, y0, x1, y1, color, width, jitter });
    this.timer = 0;
    this.points = [];
    this.branches = [];
    this.#regen();
  }

  #regen() {
    const segs = 12;
    this.points = [];
    for (let i = 0; i <= segs; i++) {
      const k = i / segs;
      const off = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * this.jitter * (1 - Math.abs(k - 0.5));
      this.points.push([this.x0 + (this.x1 - this.x0) * k + off, this.y0 + (this.y1 - this.y0) * k]);
    }
    this.branches = [];
    for (let b = 0; b < 3; b++) {
      const start = this.points[2 + Math.floor(Math.random() * (segs - 4))];
      const len = 18 + Math.random() * 26;
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.branches.push([start, [start[0] + dir * len, start[1] + len * 0.6], [start[0] + dir * len * 1.4, start[1] + len * 1.3]]);
    }
  }

  update(dt) {
    this.timer += dt;
    if (this.timer > 0.045) {
      this.timer = 0;
      this.#regen();
    }
    return super.update(dt);
  }

  draw(ctx) {
    const flicker = Math.random() < 0.18 ? 0.35 : 1;
    const fade = 1 - Ease.inQuad(this.t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    const stroke = (pts, w, style) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };
    stroke(this.points, this.width * 4, rgba(this.color, 0.25 * fade * flicker));
    stroke(this.points, this.width * 1.8, rgba(this.color, 0.7 * fade * flicker));
    stroke(this.points, this.width * 0.7, rgba('#ffffff', fade * flicker));
    for (const br of this.branches) stroke(br, this.width * 0.8, rgba(this.color, 0.6 * fade * flicker));
    ctx.restore();
  }
}

/** Orbe que viaja con estela de partículas y avisa al llegar. */
export class Projectile extends Effect {
  constructor({ from, to, duration = 0.32, color = '#ff7a2f', core = '#ffe2a8', size = 9, particles, arc = -30 }) {
    super(duration);
    Object.assign(this, { from, to, color, core, size, particles, arc });
    this.x = from.x;
    this.y = from.y;
    this.emit = 0;
  }

  get arrived() {
    return this.life <= 0;
  }

  update(dt) {
    const alive = super.update(dt);
    const t = Ease.inQuad(this.t);
    this.x = this.from.x + (this.to.x - this.from.x) * t;
    this.y = this.from.y + (this.to.y - this.from.y) * t + Math.sin(Math.PI * t) * this.arc;
    this.emit += dt;
    while (this.emit > 0.012) {
      this.emit -= 0.012;
      this.particles.spawn({
        x: this.x + (Math.random() - 0.5) * 6,
        y: this.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 30,
        life: 0.35 + Math.random() * 0.2,
        size: this.size * 0.9,
        sizeEnd: 1,
        color: Math.random() < 0.5 ? this.color : this.core,
        shape: Shape.GLOW,
      });
    }
    return alive;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.4);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, rgba(this.core, 0.95));
    g.addColorStop(0.6, rgba(this.color, 0.5));
    g.addColorStop(1, rgba(this.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** Círculo rúnico en el suelo bajo el lanzador (vista en perspectiva: elipse aplastada). */
export class MagicCircle extends Effect {
  constructor({ x, y, radius = 42, color = '#5ad8ff', life = 0.9 }) {
    super(life, 'back');
    Object.assign(this, { x, y, radius, color });
  }

  draw(ctx) {
    const t = this.t;
    const grow = Ease.outBack(Math.min(1, t / 0.3));
    const fade = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    const r = this.radius * grow;
    const rot = t * 3.2;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, 0.32);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(this.color, 0.85 * fade);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, TAU);
    ctx.stroke();
    // Runas: pequeños segmentos que giran entre los dos anillos.
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = rot + (i / 12) * TAU;
      const a2 = a + 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.86, a, a2);
      ctx.stroke();
    }
    // Estrella interior girando en sentido contrario.
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = -rot * 0.7 + (i * 2 * TAU) / 5;
      const px = Math.cos(a) * r * 0.7;
      const py = Math.sin(a) * r * 0.7;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba(this.color, 0.28 * fade));
    g.addColorStop(1, rgba(this.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** Columna vertical de luz (curación, invocación). */
export class LightColumn extends Effect {
  constructor({ x, y, width = 46, height = 170, color = '#7dffb2', life = 0.85 }) {
    super(life);
    Object.assign(this, { x, y, width, height, color });
  }

  draw(ctx) {
    const t = this.t;
    const open = Ease.outCubic(Math.min(1, t / 0.25));
    const fade = t > 0.55 ? 1 - (t - 0.55) / 0.45 : 1;
    const w = this.width * (0.3 + 0.7 * open) * (1 - t * 0.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(this.x - w / 2, 0, this.x + w / 2, 0);
    g.addColorStop(0, rgba(this.color, 0));
    g.addColorStop(0.5, rgba(this.color, 0.55 * fade));
    g.addColorStop(1, rgba(this.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(this.x - w / 2, this.y - this.height * open, w, this.height * open);
    const core = ctx.createLinearGradient(0, this.y - this.height, 0, this.y);
    core.addColorStop(0, rgba('#ffffff', 0));
    core.addColorStop(1, rgba('#ffffff', 0.7 * fade));
    ctx.fillStyle = core;
    ctx.fillRect(this.x - w * 0.12, this.y - this.height * open, w * 0.24, this.height * open);
    ctx.restore();
  }
}

/** Burbuja hexagonal (Coraza / Defensa). */
export class ShieldBubble extends Effect {
  constructor({ x, y, radius = 52, color = '#59c3ff', life = 0.9 }) {
    super(life);
    Object.assign(this, { x, y, radius, color });
  }

  draw(ctx) {
    const t = this.t;
    const grow = Ease.outBack(Math.min(1, t / 0.3));
    const fade = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
    const r = this.radius * grow;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
    g.addColorStop(0, rgba(this.color, 0));
    g.addColorStop(0.85, rgba(this.color, 0.25 * fade));
    g.addColorStop(1, rgba(this.color, 0.6 * fade));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    // Retícula hexagonal tenue
    ctx.strokeStyle = rgba('#ffffff', 0.35 * fade);
    ctx.lineWidth = 1;
    const hex = r / 3.2;
    for (let q = -3; q <= 3; q++) {
      for (let s = -3; s <= 3; s++) {
        const cx = q * hex * 1.5;
        const cy = (s + (q % 2 ? 0.5 : 0)) * hex * Math.sqrt(3);
        if (cx * cx + cy * cy > r * r * 0.8) continue;
        ctx.beginPath();
        for (let k = 0; k <= 6; k++) {
          const a = (k / 6) * TAU;
          const px = cx + Math.cos(a) * hex * 0.5;
          const py = cy + Math.sin(a) * hex * 0.5;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** Gestor de efectos con dos capas (detrás / delante de los sprites). */
export class EffectLayer {
  constructor() {
    this.items = [];
  }

  add(effect) {
    this.items.push(effect);
    return effect;
  }

  update(dt) {
    this.items = this.items.filter((e) => e.update(dt));
  }

  clear() {
    this.items.length = 0;
  }

  draw(ctx, layer) {
    for (const e of this.items) if (e.layer === layer) e.draw(ctx);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
