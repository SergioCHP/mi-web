/**
 * units.js — Plantillas de personajes y enemigos + IA enemiga.
 *
 * Una plantilla son DATOS (stats, elementos, habilidades). La instancia viva es un
 * `Combatant` (battle/combatant.js) y su representación visual un `CombatantView`.
 * `sprite` apunta a un juego de animaciones de data/sprites.js; `tint` recolorea la hoja
 * para crear variantes sin dibujar sprites nuevos.
 */
export const UNITS = Object.freeze({
  // ───────────────────────────── Héroes ─────────────────────────────
  sergio: {
    nameKey: 'unit.sergio',
    portrait: 'assets/Heroe.webp',
    sprite: 'hero',
    pixelScale: 1.6,
    stats: { hp: 250, mp: 45, atk: 50, mag: 40, def: 12, mdef: 10, spd: 13 },
    commands: ['attack', 'magic', 'defend'],
    spells: ['fire', 'thunder', 'cure', 'haste', 'barrier'],
    limit: 'refactor',
    elements: { weak: [], resist: [] },
  },
  // Miembros extra para probar formaciones de 2-3 héroes (?party=3). Reutilizan el sprite tintado.
  ada: {
    nameKey: 'unit.ada',
    portrait: 'assets/Heroe.webp',
    portraitFilter: 'hue-rotate(110deg) saturate(1.3)',
    sprite: 'hero',
    tint: '#ff5fb4',
    pixelScale: 1.52,
    stats: { hp: 210, mp: 70, atk: 38, mag: 52, def: 9, mdef: 15, spd: 12 },
    commands: ['attack', 'magic', 'defend'],
    spells: ['fire', 'thunder', 'cure', 'haste', 'barrier'],
    limit: 'refactor',
    elements: { weak: [], resist: [] },
  },
  linus: {
    nameKey: 'unit.linus',
    portrait: 'assets/Heroe.webp',
    portraitFilter: 'hue-rotate(200deg) saturate(1.2)',
    sprite: 'hero',
    tint: '#ffc04d',
    pixelScale: 1.65,
    stats: { hp: 290, mp: 30, atk: 56, mag: 26, def: 15, mdef: 8, spd: 11 },
    commands: ['attack', 'magic', 'defend'],
    spells: ['fire', 'thunder', 'cure'],
    limit: 'refactor',
    elements: { weak: [], resist: [] },
  },

  // ──────────────────────────── Enemigos ────────────────────────────
  bugFatal: {
    nameKey: 'unit.bugFatal',
    portrait: 'assets/Monstruo.webp',
    sprite: 'bug',
    pixelScale: 1.7,
    stats: { hp: 380, mp: 0, atk: 22, mag: 20, def: 12, mdef: 8, spd: 7 },
    elements: { weak: ['thunder'], resist: ['fire'] },
    ai: 'bugFatal',
  },
  larva: {
    nameKey: 'unit.larva',
    portrait: 'assets/Monstruo.webp',
    sprite: 'bug',
    tint: '#6dff8e',
    pixelScale: 1.15,
    stats: { hp: 150, mp: 0, atk: 12, mag: 10, def: 6, mdef: 5, spd: 9 },
    elements: { weak: ['fire'], resist: ['thunder'] },
    ai: 'larva',
  },
  // Soldado de Élite: blindaje táctico (débil a Electro); dispara a distancia y remata con la
  // espada corta. Equilibrado con tools/simulate.mjs: quien solo pulsa Atacar gana ~8 de cada 10.
  soldado: {
    nameKey: 'unit.soldado',
    sprite: 'soldier',
    pixelScale: 1.6,
    stats: { hp: 180, mp: 0, atk: 15, mag: 10, def: 10, mdef: 6, spd: 9 },
    elements: { weak: ['thunder'], resist: [] },
    ai: 'soldado',
  },
});

const lowestHp = (units) => units.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));

/**
 * IA enemiga: función pura (unidad, batalla, rng) → { skill, targets }.
 * Se ejecuta cuando la barra ATB del enemigo se llena; la acción entra en la cola.
 */
export const AI = Object.freeze({
  bugFatal(self, battle, rng) {
    const heroes = battle.alive('heroes');
    if (self.hp / self.maxHp < 0.5 && !self.hasStatus('barrier') && rng.chance(0.35)) {
      return { skill: 'enemyBarrier', targets: [self] };
    }
    const target = rng.chance(0.5) ? lowestHp(heroes) : rng.pick(heroes);
    return { skill: rng.chance(0.3) ? 'claw' : 'enemyAttack', targets: [target] };
  },

  larva(self, battle, rng) {
    const heroes = battle.alive('heroes');
    const healthy = heroes.filter((h) => !h.hasStatus('poison'));
    if (healthy.length && rng.chance(0.55)) {
      return { skill: 'toxicBite', targets: [rng.pick(healthy)] };
    }
    return { skill: 'enemyAttack', targets: [rng.pick(heroes)] };
  },

  /** Táctico: remata al héroe más débil con el Asalto táctico; si no, ataque normal. */
  soldado(self, battle, rng) {
    const heroes = battle.alive('heroes');
    const weakest = lowestHp(heroes);
    if (weakest.hp / weakest.maxHp < 0.6 && rng.chance(0.5)) {
      return { skill: 'tacticalStrike', targets: [weakest] };
    }
    return { skill: rng.chance(0.3) ? 'tacticalStrike' : 'soldierAttack', targets: [rng.pick(heroes)] };
  },
});
