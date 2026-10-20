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
 *
 * Tramos y poses sostenidas: un clip (o una llamada a `play`) puede limitarse a un tramo de
 * frames (`from`/`to`) y quedarse congelado en el último (`hold`) en lugar de volver a `idle`.
 * Así una sola hoja sirve para varias fases de una coreografía (p. ej. el Límite: carga,
 * embestida, impacto y aterrizaje) sin saltos al idle entre golpes.
 *
 * Regla de oro: quien deja una pose sostenida (hold o bucle distinto de idle) es responsable
 * de soltarla con `play('idle')`. El Director lo garantiza además al terminar cada acción.
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
    this.from = 0;
    this.to = 0;
    this.speed = 1;
    this.hold = false;
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

  /**
   * @param {string} name  Clip pedido ('idle', 'attack', 'cast', 'limit'…)
   * @param {object} [o]
   * @param {number} [o.speed=1]
   * @param {string|null} [o.returnTo='idle']  Clip al terminar (solo clips sin bucle).
   * @param {boolean} [o.restart=true]  false = si ya suena ese clip, no lo reinicia.
   * @param {number} [o.from]  Primer frame del tramo (por defecto el del clip, o 0).
   * @param {number} [o.to]    Último frame del tramo (por defecto el del clip, o el último).
   * @param {boolean} [o.hold] Al acabar, se queda en el último frame (pose sostenida).
   * @returns {{duration:number, hitTime:number}} Segundos reales del tramo y del impacto.
   */
  play(name, { speed = 1, returnTo = 'idle', restart = true, from, to, hold } = {}) {
    if (!restart && this.clip && this.requested === name && !this.finished) return this.#timing();
    const clip = this.resolve(name);
    const native = clip.name === name;
    const sheet = this.sheets.get(clip.sheet) ?? null;
    const last = Math.max(0, (sheet?.frames ?? 1) - 1);
    // Los tramos se refieren a la hoja propia del clip: con un sustituto se usa el clip entero.
    const f0 = clampInt((native ? from : undefined) ?? clip.from ?? 0, 0, last);
    const f1 = clampInt((native ? to : undefined) ?? clip.to ?? last, f0, last);
    this.requested = name;
    this.clip = clip;
    this.sheet = sheet;
    this.time = 0;
    this.from = f0;
    this.to = f1;
    this.frame = f0;
    this.speed = Math.max(0.05, speed);
    this.hold = Boolean(hold ?? clip.hold);
    this.finished = false;
    this.returnTo = returnTo;
    return this.#timing();
  }

  /** ¿Está en una pose que no se suelta sola (bucle distinto de idle o pose sostenida)? */
  get posed() {
    if (this.requested === 'idle') return false;
    return Boolean(this.clip?.loop) || (this.finished && this.hold);
  }

  /** Segundos reales transcurridos desde que empezó el clip actual. */
  get elapsed() {
    return this.time / this.speed;
  }

  /** Duración del tramo actual y momento del impacto (segundos reales). */
  #timing() {
    const fps = this.clip?.fps ?? 8;
    const count = this.to - this.from + 1;
    const hitFrame = clampInt(this.clip?.hitFrame ?? this.from + Math.floor(count * 0.6), this.from, this.to);
    // El impacto cae un poco DENTRO del frame de impacto (no en su borde exacto): así el número
    // de daño y las partículas nunca aparecen con el frame anterior todavía en pantalla.
    const hitAt = hitFrame - this.from + (hitFrame > this.from ? 0.2 : 0);
    return { duration: count / fps / this.speed, hitTime: hitAt / fps / this.speed };
  }

  update(dt) {
    if (!this.clip || !this.sheet) return;
    this.time += dt * this.speed;
    const step = Math.floor(this.time * this.clip.fps);
    const count = this.to - this.from + 1;
    if (this.clip.loop) {
      this.frame = this.from + (step % count);
    } else if (step >= count) {
      this.frame = this.to;
      if (!this.finished) {
        this.finished = true;
        if (!this.hold && this.returnTo) this.play(this.returnTo);
      }
    } else {
      this.frame = this.from + step;
    }
  }
}

function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
