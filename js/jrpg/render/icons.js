/**
 * icons.js — Iconos vectoriales mínimos para estados y elementos (dibujados en canvas,
 * sin imágenes extra). Coordenadas en píxeles de pantalla, centrados en (x, y), tamaño s.
 */
export const ICON_COLORS = Object.freeze({
  fire: '#ff7a2f',
  thunder: '#ffe45c',
  poison: '#8cff5a',
  haste: '#ffd23f',
  barrier: '#59c3ff',
});

const PATHS = {
  fire(ctx, s) {
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.45, -s * 0.1, s * 0.4, s * 0.45, 0, s * 0.48);
    ctx.bezierCurveTo(-s * 0.4, s * 0.45, -s * 0.42, 0, -s * 0.12, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.05, s * 0.05, s * 0.08, -s * 0.2, 0, -s * 0.5);
  },
  thunder(ctx, s) {
    ctx.moveTo(s * 0.12, -s * 0.5);
    ctx.lineTo(-s * 0.3, s * 0.06);
    ctx.lineTo(-s * 0.02, s * 0.06);
    ctx.lineTo(-s * 0.14, s * 0.5);
    ctx.lineTo(s * 0.32, -s * 0.08);
    ctx.lineTo(s * 0.04, -s * 0.08);
    ctx.closePath();
  },
  poison(ctx, s) {
    ctx.moveTo(0, -s * 0.48);
    ctx.bezierCurveTo(s * 0.12, -s * 0.2, s * 0.38, 0, s * 0.38, s * 0.16);
    ctx.arc(0, s * 0.16, s * 0.38, 0, Math.PI);
    ctx.bezierCurveTo(-s * 0.38, 0, -s * 0.12, -s * 0.2, 0, -s * 0.48);
  },
  haste(ctx, s) {
    for (const ox of [-s * 0.22, s * 0.14]) {
      ctx.moveTo(ox - s * 0.12, -s * 0.36);
      ctx.lineTo(ox + s * 0.18, 0);
      ctx.lineTo(ox - s * 0.12, s * 0.36);
      ctx.lineTo(ox - s * 0.02, s * 0.36);
      ctx.lineTo(ox + s * 0.3, 0);
      ctx.lineTo(ox - s * 0.02, -s * 0.36);
      ctx.closePath();
    }
  },
  barrier(ctx, s) {
    ctx.moveTo(0, -s * 0.48);
    ctx.lineTo(s * 0.4, -s * 0.32);
    ctx.lineTo(s * 0.34, s * 0.12);
    ctx.quadraticCurveTo(s * 0.2, s * 0.38, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.38, -s * 0.34, s * 0.12);
    ctx.lineTo(-s * 0.4, -s * 0.32);
    ctx.closePath();
  },
};

/**
 * @param {'fire'|'thunder'|'poison'|'haste'|'barrier'} id
 * @param {object} [o]
 * @param {number} [o.alpha]
 * @param {boolean} [o.frame]  Dibuja un marco cuadrado detrás (chips de estado / debilidades)
 * @param {string} [o.frameColor]
 */
export function drawIcon(ctx, id, x, y, s, { alpha = 1, frame = true, frameColor = 'rgba(0,0,0,0.65)', color } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (frame) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(-s * 0.62, -s * 0.62, s * 1.24, s * 1.24);
  }
  ctx.beginPath();
  PATHS[id]?.(ctx, s * 0.82);
  ctx.fillStyle = color ?? ICON_COLORS[id] ?? '#fff';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.stroke();
  ctx.restore();
}
