/**
 * particles.js — Sistema de partículas nativo en canvas + números flotantes.
 *
 * Diseño orientado a rendimiento:
 *   · Pool fijo con "struct of arrays" (Float32Array): cero objetos nuevos por partícula,
 *     así el recolector de basura no provoca tirones a mitad de un combo.
 *   · Borrado por intercambio con la última (O(1)).
 *   · Brillos con sprites radiales pre-renderizados + composición 'lighter' (aditiva),
 *     en lugar de shadowBlur, que es muy caro en canvas.
 */
import { hexToRgb } from '../core/utils.js';

export const Shape = Object.freeze({ PIXEL: 0, GLOW: 1, SPARK: 2, RING: 3 });

const FIELDS = ['x', 'y', 'vx', 'vy', 'ax', 'ay', 'drag', 'life', 'maxLife', 'size0', 'size1', 'alpha0', 'alpha1'];

export class ParticleSystem {
  constructor(max = 900) {
    this.max = max;
    this.count = 0;
    for (const f of FIELDS) this[f] = new Float32Array(max);
    this.shape = new Uint8Array(max);
    this.additive = new Uint8Array(max);
    this.color = new Uint16Array(max);

    /** Registro de colores: índice → '#rrggbb' y su sprite de brillo cacheado. */
    this.palette = [];
    this.paletteIndex = new Map();
    this.glowSprites = [];
  }

  colorId(hex) {
    let id = this.paletteIndex.get(hex);
    if (id === undefined) {
      id = this.palette.length;
      this.palette.push(hex);
      this.paletteIndex.set(hex, id);
      this.glowSprites.push(null); // se crea perezosamente al dibujar
    }
    return id;
  }

  #glow(id) {
    if (this.glowSprites[id]) return this.glowSprites[id];
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    const [r, gr, b] = hexToRgb(this.palette[id]);
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, `rgba(${r},${gr},${b},0.95)`);
    grad.addColorStop(0.5, `rgba(${r},${gr},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    this.glowSprites[id] = canvas;
    return canvas;
  }

  /**
   * Emite una partícula. Campos: x, y, vx, vy, ax, ay, drag, life, size, sizeEnd,
   * alpha, alphaEnd, color ('#hex'), shape (Shape.*), additive (bool).
   */
  spawn(p) {
    if (this.count >= this.max) return;
    const i = this.count++;
    this.x[i] = p.x;
    this.y[i] = p.y;
    this.vx[i] = p.vx ?? 0;
    this.vy[i] = p.vy ?? 0;
    this.ax[i] = p.ax ?? 0;
    this.ay[i] = p.ay ?? 0;
    this.drag[i] = p.drag ?? 0;
    this.life[i] = this.maxLife[i] = p.life ?? 0.6;
    this.size0[i] = p.size ?? 3;
    this.size1[i] = p.sizeEnd ?? p.size ?? 3;
    this.alpha0[i] = p.alpha ?? 1;
    this.alpha1[i] = p.alphaEnd ?? 0;
    this.shape[i] = p.shape ?? Shape.PIXEL;
    this.additive[i] = p.additive === false ? 0 : 1;
    this.color[i] = this.colorId(p.color ?? '#ffffff');
  }

  /**
   * Ráfaga radial. `angle` y `spread` en radianes (spread = 2π → círculo completo).
   */
  burst({ x, y, count = 12, speed = [60, 160], angle = 0, spread = Math.PI * 2, life = [0.3, 0.7], colors = ['#ffffff'], ...rest }, rng = Math.random) {
    for (let n = 0; n < count; n++) {
      const a = angle + (rng() - 0.5) * spread;
      const v = speed[0] + rng() * (speed[1] - speed[0]);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life[0] + rng() * (life[1] - life[0]),
        color: colors[Math.floor(rng() * colors.length)],
        ...rest,
      });
    }
  }

  #remove(i) {
    const last = --this.count;
    if (i === last) return;
    for (const f of FIELDS) this[f][i] = this[f][last];
    this.shape[i] = this.shape[last];
    this.additive[i] = this.additive[last];
    this.color[i] = this.color[last];
  }

  update(dt) {
    for (let i = this.count - 1; i >= 0; i--) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.#remove(i);
        continue;
      }
      this.vx[i] += this.ax[i] * dt;
      this.vy[i] += this.ay[i] * dt;
      if (this.drag[i] > 0) {
        const k = Math.exp(-this.drag[i] * dt);
        this.vx[i] *= k;
        this.vy[i] *= k;
      }
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
    }
  }

  clear() {
    this.count = 0;
  }

  /** Dibuja en coordenadas de mundo (el renderer ya aplicó la transformación de cámara). */
  draw(ctx) {
    if (!this.count) return;
    // Dos pasadas: normal y aditiva, para minimizar cambios de globalCompositeOperation.
    for (const additive of [0, 1]) {
      ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
      for (let i = 0; i < this.count; i++) {
        if (this.additive[i] !== additive) continue;
        const t = 1 - this.life[i] / this.maxLife[i];
        const size = this.size0[i] + (this.size1[i] - this.size0[i]) * t;
        // Aparición rápida (primer 8 %) para evitar "pops" bruscos.
        const fadeIn = t < 0.08 ? t / 0.08 : 1;
        const alpha = (this.alpha0[i] + (this.alpha1[i] - this.alpha0[i]) * t) * fadeIn;
        if (alpha <= 0.01 || size <= 0.05) continue;
        ctx.globalAlpha = alpha > 1 ? 1 : alpha;
        const x = this.x[i];
        const y = this.y[i];
        const color = this.palette[this.color[i]];

        switch (this.shape[i]) {
          case Shape.GLOW: {
            const s = size * 2;
            ctx.drawImage(this.#glow(this.color[i]), x - s, y - s, s * 2, s * 2);
            break;
          }
          case Shape.SPARK: {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(0.6, size * 0.45);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - this.vx[i] * 0.035, y - this.vy[i] * 0.035);
            ctx.stroke();
            break;
          }
          case Shape.RING: {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(0.8, 4 * (1 - t));
            ctx.beginPath();
            ctx.ellipse(x, y, size, size * 0.42, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          default: {
            ctx.fillStyle = color;
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Números y etiquetas flotantes (daño, curas, "¡CRÍTICO!"). Se anclan a un punto del
 * mundo pero se dibujan en espacio de pantalla: tamaño de letra legible a cualquier zoom.
 */
export class FloatingTexts {
  constructor(font = '"Chakra Petch", system-ui, sans-serif') {
    this.font = font;
    this.items = [];
  }

  /**
   * @param {object} o
   * @param {string} o.text
   * @param {number} o.x  Mundo
   * @param {number} o.y  Mundo
   * @param {string} [o.color]
   * @param {number} [o.size] px de pantalla
   * @param {number} [o.delay] segundos antes de aparecer
   * @param {number} [o.life]
   */
  spawn({ text, x, y, color = '#ffffff', size = 26, delay = 0, life = 1.05, rise = 46, weight = 700, drift = 0 }) {
    this.items.push({ text: String(text), x, y, color, size, delay, life, maxLife: life, rise, weight, drift });
  }

  update(dt) {
    for (const it of this.items) {
      if (it.delay > 0) it.delay -= dt;
      else it.life -= dt;
    }
    this.items = this.items.filter((it) => it.life > 0);
  }

  clear() {
    this.items.length = 0;
  }

  /** @param {(x:number, y:number) => {x:number, y:number}} project  Mundo → pantalla (px CSS). */
  draw(ctx, project) {
    if (!this.items.length) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    for (const it of this.items) {
      if (it.delay > 0) continue;
      const t = 1 - it.life / it.maxLife;
      // Curva "pop": crece a 1,3 y asienta en 1; sube con ease-out; se desvanece al final.
      const pop = t < 0.12 ? 0.4 + (t / 0.12) * 0.9 : t < 0.22 ? 1.3 - ((t - 0.12) / 0.1) * 0.3 : 1;
      const rise = (1 - Math.pow(1 - Math.min(1, t / 0.6), 3)) * it.rise;
      const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      const p = project(it.x, it.y);
      const px = Math.round(it.size * pop);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `${it.weight} ${px}px ${this.font}`;
      ctx.lineWidth = Math.max(3, px * 0.2);
      ctx.strokeStyle = 'rgba(5, 6, 10, 0.92)';
      ctx.strokeText(it.text, p.x + it.drift * t, p.y - rise);
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, p.x + it.drift * t, p.y - rise);
    }
    ctx.globalAlpha = 1;
  }
}
