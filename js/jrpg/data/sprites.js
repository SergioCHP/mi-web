/**
 * sprites.js — Atlas de spritesheets y animaciones.
 *
 * SHEETS: metadatos de cada PNG en cuadrícula (una fila). Los valores salen de
 * tools/sprite_repack.py (frameWidth, frameHeight, anchor). El ancla es el punto de los PIES:
 * el motor coloca ese píxel sobre la posición del combatiente, así no hay "bailes" entre frames.
 *
 * ANIMATIONS: clips por personaje. Si un clip no tiene hoja propia (aún no generada), usa
 * `fallback` y el motor compensa con efectos procedurales (retroceso, aura, saltito).
 *
 * Para añadir una hoja nueva (p. ej. heroe_hurt.png):
 *   1) python tools/sprite_repack.py ia.png --frames 3 --key ff00ff --match-height 82 -o assets/combat/heroe_hurt.png --json hurt.json
 *   2) Copia el JSON en SHEETS y apunta el clip `hurt` a 'heroe_hurt'.
 */
export const SHEETS = Object.freeze({
  heroe_idle: { src: 'assets/combat/heroe_idle.webp', frames: 6, frameWidth: 63, frameHeight: 86, anchor: { x: 43, y: 84 } },
  heroe_ataque: { src: 'assets/combat/heroe_ataque.webp', frames: 6, frameWidth: 109, frameHeight: 80, anchor: { x: 59, y: 79 } },
  monstruo_idle: { src: 'assets/combat/monstruo_idle.webp', frames: 6, frameWidth: 97, frameHeight: 95, anchor: { x: 40, y: 91 } },
  monstruo_ataque: { src: 'assets/combat/monstruo_ataque.webp', frames: 5, frameWidth: 149, frameHeight: 103, anchor: { x: 72, y: 101 } },

  // ── Hojas futuras (ver docs/GUIA_SPRITES.md). Descomenta al generarlas: ──
  // heroe_hurt:    { src: 'assets/combat/heroe_hurt.png',    frames: 3, frameWidth: 0, frameHeight: 0, anchor: { x: 0, y: 0 } },
  // heroe_cast:    { src: 'assets/combat/heroe_cast.png',    frames: 4, frameWidth: 0, frameHeight: 0, anchor: { x: 0, y: 0 } },
  // heroe_victory: { src: 'assets/combat/heroe_victory.png', frames: 6, frameWidth: 0, frameHeight: 0, anchor: { x: 0, y: 0 } },
  // heroe_limit:   { src: 'assets/combat/heroe_limit.png',   frames: 8, frameWidth: 0, frameHeight: 0, anchor: { x: 0, y: 0 } },
});

/**
 * Clips: sheet, fps, loop, hitFrame (índice desde 0 del frame del impacto: sincroniza el daño).
 * Todas las hojas miran a la derecha; el motor voltea a los enemigos.
 */
export const ANIMATIONS = Object.freeze({
  hero: {
    clips: {
      idle: { sheet: 'heroe_idle', fps: 7, loop: true },
      attack: { sheet: 'heroe_ataque', fps: 14, loop: false, hitFrame: 4 },
      hurt: { fallback: 'idle' },
      cast: { fallback: 'idle' },
      victory: { fallback: 'idle' },
      limit: { fallback: 'attack' },
      // Cuando existan las hojas:
      // hurt:    { sheet: 'heroe_hurt',    fps: 12, loop: false },
      // cast:    { sheet: 'heroe_cast',    fps: 8,  loop: true },
      // victory: { sheet: 'heroe_victory', fps: 8,  loop: true },
      // limit:   { sheet: 'heroe_limit',   fps: 18, loop: false, hitFrame: 4 },
    },
  },
  bug: {
    clips: {
      idle: { sheet: 'monstruo_idle', fps: 7, loop: true },
      attack: { sheet: 'monstruo_ataque', fps: 10, loop: false, hitFrame: 3 },
      hurt: { fallback: 'idle' },
      cast: { fallback: 'idle' },
      victory: { fallback: 'idle' },
      limit: { fallback: 'attack' },
    },
  },
});
