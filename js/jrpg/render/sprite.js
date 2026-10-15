/**
 * sprite.js — Carga de imágenes, hojas de sprites con variantes cacheadas y animador.
 */

/** Carga una imagen y la decodifica fuera del hilo principal cuando el navegador lo permite. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => (img.decode ? img.decode().catch(() => {}).then(() => resolve(img)) : resolve(img));
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/**
 * Hoja en cuadrícula de una fila. Genera y cachea variantes (silueta blanca para el
 * destello de impacto, tintes de color para enemigos alternativos, fantasma cian para
 * imágenes residuales). Pre-renderizar evita filtros caros en cada frame.
 */
export class SpriteSheet {
  constructor(image, meta) {
    this.image = image;
    this.frames = meta.frames;
    this.frameWidth = meta.frameWidth;
    this.frameHeight = meta.frameHeight;
    this.anchor = meta.anchor;
    this.variants = new Map();
  }

  /**
   * @param {string} key  'white', 'ghost', 'solid:#rrggbb' (silueta) o '#rrggbb' (tinte que conserva el sombreado).
   * @param {number} [strength=0.85] Intensidad del tinte (solo colores).
   */
  variant(key, strength = 0.85) {
    if (!key) return this.image;
    const cacheKey = `${key}@${strength}`;
    if (this.variants.has(cacheKey)) return this.variants.get(cacheKey);

    const { width, height } = this.image;
    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.image, 0, 0);

    if (key === 'white' || key === 'ghost' || key.startsWith('solid:')) {
      // Silueta sólida de un color (destellos, contornos, auras).
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = key === 'white' ? '#ffffff' : key === 'ghost' ? '#6fdcff' : key.slice(6);
      ctx.fillRect(0, 0, width, height);
    } else {
      // Modo "color": conserva la luminancia del pixel art y sustituye tono/saturación.
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = strength;
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(this.image, 0, 0);
    }
    this.variants.set(cacheKey, canvas);
    return canvas;
  }

  /**
   * Dibuja un frame con el ancla (pies) en (x, y).
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx, source, frame, x, y, scale, flip) {
    const fw = this.frameWidth;
    const fh = this.frameHeight;
    const sx = (frame % this.frames) * fw;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(source, sx, 0, fw, fh, -this.anchor.x * scale, -this.anchor.y * scale, fw * scale, fh * scale);
    ctx.restore();
  }
}

/**
 * Animador de clips con resolución de "fallback": si un clip pedido (p. ej. 'hurt') aún no
 * tiene hoja, se reproduce su sustituto y la vista lo compensa con efectos procedurales.
 */
export class Animator {
  /**
   * @param {Record<string, object>} clips  Clips de data/sprites.js
   * @param {Map<string, SpriteSheet>} sheets
   */
  constructor(clips, sheets) {
    this.clips = clips;
    this.sheets = sheets;
    this.requested = 'idle';
    this.clip = null;
    this.sheet = null;
    this.time = 0;
    this.frame = 0;
    this.speed = 1;
    this.finished = false;
    this.returnTo = 'idle';
    this.play('idle');
  }

  /** Devuelve el clip real (con hoja cargada) tras seguir la cadena de fallbacks. */
  resolve(name) {
    let current = name;
    for (let i = 0; i < 5; i++) {
      const clip = this.clips[current];
      if (!clip) break;
      if (clip.sheet && this.sheets.has(clip.sheet)) return { name: current, ...clip };
      current = clip.fallback ?? 'idle';
    }
    const idle = this.clips.idle;
    return { name: 'idle', ...idle };
  }

  /** ¿El clip tiene hoja propia o es un sustituto? */
  isNative(name) {
    return this.resolve(name).name === name;
  }

  play(name, { speed = 1, returnTo = 'idle', restart = true } = {}) {
    const clip = this.resolve(name);
    if (!restart && this.clip && this.clip.name === clip.name) return this.timing(name, speed);
    this.requested = name;
    this.clip = clip;
    this.sheet = this.sheets.get(clip.sheet);
    this.time = 0;
    this.frame = 0;
    this.speed = speed;
    this.finished = false;
    this.returnTo = returnTo;
    return this.timing(name, speed);
  }

  /** Duración del clip y momento del impacto (segundos), escalados por la velocidad. */
  timing(name, speed = 1) {
    const clip = this.resolve(name);
    const sheet = this.sheets.get(clip.sheet);
    const frames = sheet?.frames ?? 1;
    const duration = frames / clip.fps / speed;
    const hitFrame = clip.hitFrame ?? Math.floor(frames * 0.6);
    return { duration, hitTime: hitFrame / clip.fps / speed };
  }

  update(dt) {
    if (!this.clip || !this.sheet) return;
    this.time += dt * this.speed;
    const index = Math.floor(this.time * this.clip.fps);
    const frames = this.sheet.frames;
    if (this.clip.loop) {
      this.frame = index % frames;
    } else if (index >= frames) {
      this.frame = frames - 1;
      if (!this.finished) {
        this.finished = true;
        if (this.returnTo) this.play(this.returnTo);
      }
    } else {
      this.frame = index;
    }
  }
}
