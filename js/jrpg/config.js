/**
 * config.js — Parámetros globales del combate. Todo lo "tuneable" vive aquí.
 *
 * Parámetros de URL (útiles para depurar o enseñar):
 *   ?stage=dungeon     usa la mazmorra (fondo_combate.jpg) en vez del reactor procedural
 *   ?atb=active        el ATB sigue corriendo con el menú abierto (por defecto: "wait")
 *   ?seed=1234         combate reproducible (PRNG determinista)
 *   ?party=3&foes=3    formaciones 3 vs 3 para probar grupos
 *   ?debug=1           superposición con estado de la FSM, cola de acciones y FPS
 */
const params = new URLSearchParams(globalThis.location?.search ?? '');
const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const PARTY_POOL = ['sergio', 'ada', 'linus'];
const FOE_POOL = ['bugFatal', 'larva', 'larva'];
const clampCount = (value, fallback) => Math.min(3, Math.max(1, Number.parseInt(value, 10) || fallback));

export const CONFIG = Object.freeze({
  /** Área segura en unidades de mundo: siempre visible, el resto se rellena con fondo. */
  world: { safeWidth: 600, safeHeight: 340 },

  /** Simulación a 240 Hz con paso fijo (ver core/game-loop.js). */
  step: 1 / 240,

  atb: {
    /** 'wait': el ATB se congela mientras eliges comando (FFVII "Wait"). 'active': nunca se para. */
    mode: params.get('atb') === 'active' ? 'active' : 'wait',
    /** Segundos para llenar la barra con velocidad 10. Velocidad 13 ≈ 1,9 s. */
    baseSeconds: 2.5,
    /** El ATB del resto sigue llenándose mientras otro actúa (genera cola de acciones). */
    tickDuringActions: true,
  },

  rules: {
    variance: [0.9, 1.1],
    critMultiplier: 1.5,
    weakMultiplier: 1.5,
    resistMultiplier: 0.5,
    defendMultiplier: 0.5,
    /** Límite ganado = daño / vida máxima × gainRate (60 % de vida perdida ≈ barra llena). */
    limitGainRate: 1.7,
  },

  encounter: {
    heroes: PARTY_POOL.slice(0, clampCount(params.get('party'), 1)),
    enemies: FOE_POOL.slice(0, clampCount(params.get('foes'), 2)),
  },

  /** 'reactor' (procedural) o el nombre de un escenario pintado (render/background.js). */
  stage: params.get('stage') ?? 'reactor',
  seed: params.has('seed') ? Number(params.get('seed')) >>> 0 : undefined,
  debug: params.get('debug') === '1',

  fx: {
    reducedMotion,
    crt: !reducedMotion,
    vignette: true,
    maxParticles: 900,
    /** Multiplicadores de accesibilidad: con "reducir movimiento" se suavizan sacudidas y destellos. */
    shakeScale: reducedMotion ? 0.3 : 1,
    flashScale: reducedMotion ? 0.35 : 1,
  },

  flow: {
    victoryRedirect: 'juegos.html',
    skipRedirect: 'juegos.html',
    redirectDelay: 2.4,
  },
});
