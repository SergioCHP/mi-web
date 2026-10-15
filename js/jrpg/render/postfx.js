/**
 * postfx.js — Post-procesado en espacio de pantalla.
 *
 * · Flash: destello a pantalla completa (blanco en críticos, de color en magias).
 * · Oscurecido: atenúa el escenario en cinemáticas (Límite) sin tocar a los personajes.
 * · Barras de cine (letterbox), desaturación (derrota), viñeta y scanlines CRT.
 * · Rótulos (banners) cinematográficos.
 * Viñeta y scanlines se pre-renderizan en cada resize: dibujarlas cuesta un drawImage.
 */
import { Ease, clamp, hexToRgb } from '../core/utils.js';

export class PostFX {
  constructor({ crt = true, vignette = true, flashScale = 1, font = '"Chakra Petch", sans-serif' } = {}) {
    this.crt = crt;
    this.vignetteOn = vignette;
    this.flashScale = flashScale;
    this.font = font;

    this.flashAlpha = 0;
    this.flashDecay = 4;
    this.flashColor = '#ffffff';
    /** Valores animables por tweens del Director. */
    this.state = { darken: 0, letterbox: 0, desaturate: 0, fade: 0 };
    this.banners = [];
    this.time = 0;
    this.vignette = null;
    this.scanlines = null;
  }

  /** @param {number} alpha intensidad 0..1 @param {number} duration segundos hasta desaparecer */
  flash(color = '#ffffff', alpha = 0.7, duration = 0.25) {
    const a = alpha * this.flashScale;
    if (a >= this.flashAlpha) {
      this.flashAlpha = a;
      this.flashColor = color;
      this.flashDecay = a / Math.max(0.05, duration);
    }
  }

  banner(text, { style = 'normal', duration = 1.4, color = '#ffffff' } = {}) {
    this.banners.push({ text, style, duration, life: duration, color });
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));

    this.vignette = document.createElement('canvas');
    this.vignette.width = w;
    this.vignette.height = h;
    const vg = this.vignette.getContext('2d');
    const grad = vg.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.32, w / 2, h * 0.48, Math.hypot(w, h) * 0.58);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.62)');
    vg.fillStyle = grad;
    vg.fillRect(0, 0, w, h);

    // Scanlines: 1 línea oscura cada 3 píxeles físicos + leve máscara de apertura.
    this.scanlines = document.createElement('canvas');
    this.scanlines.width = w;
    this.scanlines.height = h;
    const sg = this.scanlines.getContext('2d');
    sg.fillStyle = 'rgba(0,0,0,0.22)';
    const period = Math.max(2, Math.round(dpr * 3));
    for (let y = 0; y < h; y += period) sg.fillRect(0, y, w, Math.max(1, Math.round(dpr)));
    sg.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 0; x < w; x += period * 2) sg.fillRect(x, 0, 1, h);
  }

  update(dtReal) {
    this.time += dtReal;
    this.flashAlpha = Math.max(0, this.flashAlpha - this.flashDecay * dtReal);
    for (const b of this.banners) b.life -= dtReal;
    this.banners = this.banners.filter((b) => b.life > 0);
  }

  /** Capa entre el fondo y los personajes. */
  drawDarken(ctx) {
    if (this.state.darken <= 0.001) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = `rgba(2, 3, 8, ${this.state.darken})`;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Capas finales sobre todo lo demás. */
  drawOverlay(ctx) {
    const { width: w, height: h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.state.desaturate > 0.001) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = `rgba(128,128,128,${this.state.desaturate})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (this.state.letterbox > 0.001) {
      const bar = h * 0.11 * Ease.outCubic(this.state.letterbox);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, bar);
      ctx.fillRect(0, h - bar, w, bar);
    }

    this.#drawBanners(ctx, w, h);

    if (this.flashAlpha > 0.001) {
      const [r, g, b] = hexToRgb(this.flashColor);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp(this.flashAlpha, 0, 1)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (this.state.fade > 0.001) {
      ctx.fillStyle = `rgba(0,0,0,${this.state.fade})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.vignetteOn && this.vignette) ctx.drawImage(this.vignette, 0, 0);
    if (this.crt && this.scanlines) {
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(this.time * 60); // micro-parpadeo de fósforo
      ctx.drawImage(this.scanlines, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  #drawBanners(ctx, w, h) {
    for (const b of this.banners) {
      const t = 1 - b.life / b.duration;
      const appear = Ease.outBack(clamp(t / 0.18, 0, 1));
      const vanish = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const big = b.style === 'limit' || b.style === 'title';
      const size = Math.round(Math.min(w * (big ? 0.075 : 0.05), big ? 54 : 34));
      const y = big ? h * 0.42 : h * 0.3;

      ctx.save();
      ctx.globalAlpha = vanish;
      if (big) {
        // Franja diagonal tras el texto (estilo cinemática de Límite)
        const band = size * 1.7;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, y - band * 0.62, w * appear, band);
        ctx.fillStyle = b.color;
        ctx.fillRect(0, y - band * 0.62, w * appear, 2);
        ctx.fillRect(w * (1 - appear), y + band * 0.38 - 2, w * appear, 2);
      }
      ctx.translate(w / 2 + (1 - appear) * (big ? -w * 0.2 : 0), y);
      ctx.scale(big ? 1 : 0.6 + 0.4 * appear, big ? 1 : 0.6 + 0.4 * appear);
      ctx.font = `700 ${size}px ${this.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.letterSpacing = big ? '6px' : '3px';
      ctx.lineWidth = Math.max(4, size * 0.16);
      ctx.strokeStyle = 'rgba(3,4,8,0.95)';
      ctx.strokeText(b.text, 0, 0);
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, 0, 0);
      ctx.restore();
    }
  }
}
