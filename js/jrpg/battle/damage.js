/**
 * damage.js — Fórmulas de daño y curación (funciones puras: fáciles de testear).
 *
 * Físico: ATK × poder × 100 / (100 + DEF)
 * Mágico: MAG × poder × 100 / (100 + MDEF)
 * Después: varianza ±10 %, crítico (solo físico) ×1,5, debilidad ×1,5 / resistencia ×0,5,
 * Coraza ×0,5 al daño físico y Defensa ×0,5.
 */
import { STATUSES } from '../data/statuses.js';

/**
 * @returns {{amount:number, crit:boolean, tag:'weak'|'resist'|null, element:string|null, kind:string}}
 */
export function computeDamage({ actor, target, skill, opts = {}, rng, rules }) {
  const kind = opts.kind ?? (skill.type === 'magic' ? 'magic' : 'physical');
  const element = opts.element ?? skill.element ?? null;
  const power = opts.power ?? skill.power ?? 1;

  const offense = kind === 'magic' ? actor.stats.mag : actor.stats.atk;
  const defense = kind === 'magic' ? target.stats.mdef : target.stats.def;
  let value = offense * power * (100 / (100 + defense));
  value *= rng.range(rules.variance[0], rules.variance[1]);

  let crit = false;
  if (kind === 'physical') {
    crit = rng.chance(opts.critChance ?? skill.crit ?? 0.08);
    if (crit) value *= rules.critMultiplier;
  }

  let tag = null;
  const affinity = target.template.elements ?? {};
  if (element && affinity.weak?.includes(element)) {
    value *= rules.weakMultiplier;
    tag = 'weak';
  } else if (element && affinity.resist?.includes(element)) {
    value *= rules.resistMultiplier;
    tag = 'resist';
  }

  if (kind === 'physical' && target.hasStatus('barrier')) value *= STATUSES.barrier.physicalMultiplier;
  if (target.defending) value *= rules.defendMultiplier;

  return { amount: Math.max(1, Math.round(value)), crit, tag, element, kind };
}

export function computeHeal({ actor, power, rng, rules }) {
  const value = (actor.stats.mag * power + 10) * rng.range(rules.variance[0], rules.variance[1]);
  return Math.max(1, Math.round(value));
}

export function computePoisonTick(unit) {
  const def = STATUSES.poison.tick;
  return Math.max(def.min, Math.round(unit.maxHp * def.pctMaxHp));
}
