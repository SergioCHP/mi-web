/**
 * skills.js — Habilidades: datos + coreografía.
 *
 * Cada habilidad declara sus reglas (tipo, elemento, coste, objetivo) y un generador `run(ctx)`
 * que describe la secuencia. El generador NO dibuja ni toca el DOM: pide cosas al presentador
 * (`ctx.pres`, implementado por render/director.js) y aplica efectos con la API lógica de `ctx`:
 *
 *   ctx.valid(u)        → u si sigue vivo; si no, otro objetivo válido del mismo bando (o null)
 *   ctx.hit(u, opts)    → calcula y aplica daño (crítico, elementos, Coraza, Defensa) y emite eventos
 *   ctx.heal(u, opts)   → cura
 *   ctx.addStatus(u, id, chance)
 *   ctx.defend()        → el actor se defiende hasta su próximo turno
 *   ctx.randomFoe()     → enemigo vivo aleatorio del actor
 *
 * Con un presentador "headless" (sin render) la misma habilidad se ejecuta al instante:
 * así se simulan cientos de combates para equilibrar números (tools/simulate.mjs).
 *
 * target: 'enemy' | 'ally' | 'self' | 'foes-random'
 */

/** Ataque cuerpo a cuerpo genérico (héroe y enemigos). */
function melee({ fx = 'slash', hit = {}, status = null } = {}) {
  return function* run(ctx) {
    const { actor, pres } = ctx;
    let target = ctx.valid(ctx.target);
    if (!target) return;
    yield* pres.approach(actor, target);
    target = ctx.valid(target);
    if (!target) return yield* pres.retreat(actor);

    const anim = pres.playAnim(actor, 'attack');
    yield anim.hitTime;
    pres.fx(fx, target, { from: actor });
    const result = ctx.hit(target, hit);
    if (result && status) ctx.addStatus(target, status.id, status.chance);
    yield Math.max(0.18, anim.duration - anim.hitTime);
    yield* pres.retreat(actor);
  };
}

/** Hechizo ofensivo elemental. */
function elementalSpell(element) {
  return function* run(ctx) {
    const { actor, pres } = ctx;
    if (!ctx.valid(ctx.target)) return;
    yield* pres.cast(actor, element);
    const target = ctx.valid(ctx.target);
    if (!target) return;
    yield* pres.spell(element, actor, target); // termina en el instante del impacto
    ctx.hit(target, { kind: 'magic', element });
    yield 0.5;
  };
}

/** Hechizo de apoyo (estado positivo). */
function supportSpell(element, statusId) {
  return function* run(ctx) {
    const { actor, pres } = ctx;
    yield* pres.cast(actor, element);
    const target = ctx.valid(ctx.target);
    if (!target) return;
    yield* pres.spell(element, actor, target);
    ctx.addStatus(target, statusId, 1);
    yield 0.45;
  };
}

export const SKILLS = Object.freeze({
  // ─────────────────────────── Héroes ───────────────────────────
  attack: {
    id: 'attack',
    nameKey: 'skill.attack',
    type: 'physical',
    target: 'enemy',
    power: 1,
    crit: 0.1,
    announce: false,
    run: melee({ fx: 'slash' }),
  },
  defend: {
    id: 'defend',
    nameKey: 'skill.defend',
    type: 'defend',
    target: 'self',
    *run(ctx) {
      ctx.defend();
      ctx.pres.fx('defend', ctx.actor);
      yield 0.45;
    },
  },
  fire: {
    id: 'fire',
    nameKey: 'skill.fire',
    type: 'magic',
    element: 'fire',
    mp: 8,
    power: 1.8,
    target: 'enemy',
    run: elementalSpell('fire'),
  },
  thunder: {
    id: 'thunder',
    nameKey: 'skill.thunder',
    type: 'magic',
    element: 'thunder',
    mp: 8,
    power: 1.8,
    target: 'enemy',
    run: elementalSpell('thunder'),
  },
  cure: {
    id: 'cure',
    nameKey: 'skill.cure',
    type: 'heal',
    element: 'cure',
    mp: 10,
    power: 2.2,
    target: 'ally',
    *run(ctx) {
      const { actor, pres } = ctx;
      yield* pres.cast(actor, 'cure');
      const target = ctx.valid(ctx.target);
      if (!target) return;
      yield* pres.spell('cure', actor, target);
      ctx.heal(target, { power: ctx.skill.power });
      yield 0.5;
    },
  },
  haste: {
    id: 'haste',
    nameKey: 'skill.haste',
    type: 'support',
    element: 'haste',
    mp: 12,
    target: 'ally',
    run: supportSpell('haste', 'haste'),
  },
  barrier: {
    id: 'barrier',
    nameKey: 'skill.barrier',
    type: 'support',
    element: 'barrier',
    mp: 10,
    target: 'ally',
    run: supportSpell('barrier', 'barrier'),
  },

  /**
   * Límite: 6 tajos a enemigos aleatorios con cinemática (oscurecido, barras de cine,
   * destellos, imágenes residuales, sacudida fuerte y hit-stop). Sin selección de objetivo.
   */
  refactor: {
    id: 'refactor',
    nameKey: 'skill.refactor',
    type: 'limit',
    target: 'foes-random',
    hits: 6,
    *run(ctx) {
      const { actor, pres, skill } = ctx;
      yield* pres.limitIntro(actor, skill);
      for (let i = 0; i < skill.hits; i++) {
        const target = ctx.randomFoe();
        if (!target) break;
        const final = i === skill.hits - 1;
        yield* pres.limitStrike(actor, target, i, skill.hits);
        ctx.hit(target, { kind: 'physical', power: final ? 2 : 0.95, critChance: 0.2, limit: true });
        pres.fx('limitSlash', target, { index: i, final });
        yield final ? 0.4 : 0.1;
      }
      yield* pres.limitOutro(actor);
    },
  },

  // ─────────────────────────── Enemigos ──────────────────────────
  enemyAttack: {
    id: 'enemyAttack',
    nameKey: 'skill.attack',
    type: 'physical',
    target: 'enemy',
    power: 1,
    crit: 0.08,
    announce: false,
    run: melee({ fx: 'claw' }),
  },
  claw: {
    id: 'claw',
    nameKey: 'skill.claw',
    type: 'physical',
    target: 'enemy',
    power: 1.6,
    crit: 0.1,
    run: melee({ fx: 'clawHeavy' }),
  },
  toxicBite: {
    id: 'toxicBite',
    nameKey: 'skill.toxicBite',
    type: 'physical',
    target: 'enemy',
    power: 1,
    crit: 0.05,
    run: melee({ fx: 'bite', status: { id: 'poison', chance: 0.75 } }),
  },
  enemyBarrier: {
    id: 'enemyBarrier',
    nameKey: 'skill.enemyBarrier',
    type: 'support',
    element: 'barrier',
    target: 'self',
    run: supportSpell('barrier', 'barrier'),
  },
});
