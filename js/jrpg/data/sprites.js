/**
 * sprites.js — Atlas de spritesheets y animaciones.
 *
 * SHEETS: metadatos de cada hoja en cuadrícula (una fila). Los valores salen de
 * tools/sprite_repack.py (frameWidth, frameHeight, anchor). El ancla es el punto de los PIES:
 * el motor coloca ese píxel sobre la posición del combatiente, así no hay "bailes" entre frames.
 *
 * ANIMATIONS: clips por personaje. Si un clip no tiene hoja propia (aún no generada), usa
 * `fallback` y el motor compensa con efectos procedurales (retroceso, aura, saltito).
 *
 * Para añadir una hoja nueva (p. ej. heroe_victory):
 *   1) python tools/sprite_repack.py ia.jpg --frames 6 --rows 2 --key ff00ff --tol 80 --strip-lines \
 *        --scale 0.08 -o assets/combat/heroe_victory.png --json victory.json
 *   2) Convierte a WebP, copia el JSON en SHEETS y apunta el clip `victory` a 'heroe_victory'.
 *   La escala de cada hoja se ajustó comparando la cabeza con heroe_idle (ver docs/GUIA_SPRITES.md).
 */
export const SHEETS = Object.freeze({
  // ── Héroe ──
  heroe_idle: { src: 'assets/combat/heroe_idle.webp', frames: 6, frameWidth: 63, frameHeight: 86, anchor: { x: 43, y: 84 } },
  heroe_ataque: { src: 'assets/combat/heroe_ataque.webp', frames: 6, frameWidth: 109, frameHeight: 80, anchor: { x: 59, y: 79 } },
  heroe_hurt: { src: 'assets/combat/heroe_hurt.webp', frames: 3, frameWidth: 81, frameHeight: 80, anchor: { x: 56, y: 80 } },
  heroe_cast: { src: 'assets/combat/heroe_cast.webp', frames: 4, frameWidth: 80, frameHeight: 81, anchor: { x: 44, y: 81 } },
  heroe_limit: { src: 'assets/combat/heroe_limit.webp', frames: 8, frameWidth: 95, frameHeight: 93, anchor: { x: 47, y: 90 } },
  heroe_victory: { src: 'assets/combat/heroe_victory.webp', frames: 6, frameWidth: 79, frameHeight: 85, anchor: { x: 59, y: 84 } },

  // ── Bug Fatal / Larva ──
  monstruo_idle: { src: 'assets/combat/monstruo_idle.webp', frames: 6, frameWidth: 97, frameHeight: 95, anchor: { x: 40, y: 91 } },
  monstruo_ataque: { src: 'assets/combat/monstruo_ataque.webp', frames: 5, frameWidth: 149, frameHeight: 103, anchor: { x: 72, y: 101 } },

  // ── Soldado de Élite ──
  soldado_idle: { src: 'assets/combat/soldado_idle.webp', frames: 4, frameWidth: 53, frameHeight: 88, anchor: { x: 32, y: 88 } },
  soldado_ataque: { src: 'assets/combat/soldado_ataque.webp', frames: 6, frameWidth: 104, frameHeight: 89, anchor: { x: 30, y: 89 } },
});

/**
 * Clips: sheet, fps, loop, hitFrame (índice desde 0 del frame del impacto: sincroniza el daño).
 *   · from / to: tramo de frames de la hoja (una hoja puede servir a varios clips).
 *   · hold: al terminar, se queda en el último frame (pose sostenida) en vez de volver al idle;
 *     quien la pide debe soltarla (el Director lo hace, y además al terminar cada acción).
 *   · muzzle: boca del arma en px de la hoja respecto a los pies (para disparos).
 * Todas las hojas miran a la derecha; el motor voltea a los enemigos.
 */
export const ANIMATIONS = Object.freeze({
  hero: {
    clips: {
      idle: { sheet: 'heroe_idle', fps: 7, loop: true },
      attack: { sheet: 'heroe_ataque', fps: 14, loop: false, hitFrame: 4 },
      hurt: { sheet: 'heroe_hurt', fps: 12, loop: false },
      // Defensa: el frame 2 de la hoja de daño (guardia con la espada) se mantiene mientras dura.
      defend: { sheet: 'heroe_hurt', fps: 8, loop: false, from: 2, to: 2, hold: true },
      // Canalización: 4 frames hasta la máxima concentración y se sostiene hasta el impacto.
      // (Antes era un bucle sin fin: el héroe se quedaba en esta postura tras lanzar la magia.)
      cast: { sheet: 'heroe_cast', fps: 8, loop: false, hold: true },
      victory: { sheet: 'heroe_victory', fps: 8, loop: true },
      // Límite: el Director la reproduce por tramos (carga 0, embestida 1-4, final 5-7).
      limit: { sheet: 'heroe_limit', fps: 18, loop: false, hitFrame: 4 },
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
  soldier: {
    clips: {
      idle: { sheet: 'soldado_idle', fps: 6, loop: true },
      // Hoja de ataque: alza el fusil · apunta · ráfaga | desenvaina · tajo · guardia
      attack: { sheet: 'soldado_ataque', fps: 11, loop: false, hitFrame: 4 },
      // Disparo: sostiene el frame de la ráfaga mientras vuelan las balas (la habilidad lo suelta).
      shoot: { sheet: 'soldado_ataque', fps: 9, loop: false, from: 0, to: 2, hitFrame: 2, hold: true, muzzle: { x: 50, y: 64 } },
      slash: { sheet: 'soldado_ataque', fps: 11, loop: false, from: 3, to: 5, hitFrame: 4 },
      hurt: { fallback: 'idle' },
      cast: { fallback: 'idle' },
      victory: { fallback: 'idle' },
      limit: { fallback: 'attack' },
    },
  },
});
