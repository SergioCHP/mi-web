/**
 * simulate.mjs — Simulación headless del combate (sin navegador, sin render).
 *
 * Demuestra el desacoplamiento lógica/vista: la misma BattleSystem corre en Node con un
 * presentador que solo "gasta tiempo" (duraciones aproximadas de las animaciones reales).
 * Sirve para equilibrar números y detectar bloqueos de la FSM.
 *
 *   node tools/simulate.mjs            → 300 combates por estrategia
 *   node tools/simulate.mjs 1000 3 3   → 1000 combates, 3 héroes vs 3 enemigos
 */
import { BattleSystem } from '../js/jrpg/battle/battle-system.js';
import { Presenter } from '../js/jrpg/battle/presenter.js';
import { EventBus } from '../js/jrpg/core/events.js';
import { Scheduler } from '../js/jrpg/core/scheduler.js';
import { Rng } from '../js/jrpg/core/utils.js';
import { CONFIG } from '../js/jrpg/config.js';
import { UNITS, AI } from '../js/jrpg/data/units.js';
import { SKILLS } from '../js/jrpg/data/skills.js';

/** Presentador que imita la duración de las animaciones del Director. */
class TimedPresenter extends Presenter {
  *intro() { yield 1.4; }
  *approach() { yield 0.3; }
  *retreat() { yield 0.32; }
  playAnim(actor) { return actor.isHero ? { duration: 0.43, hitTime: 0.29 } : { duration: 0.5, hitTime: 0.3 }; }
  *cast() { yield 0.7; }
  *spell() { yield 0.35; }
  *limitIntro() { yield 1.3; }
  *limitStrike() { yield 0.22; }
  *limitOutro() { yield 0.8; }
  *statusTick() { yield 0.35; }
  *knockOut() { yield 0.7; }
  *victory() { yield 1; }
  *defeat() { yield 1; }
}

const STRATEGIES = {
  /** Visitante casual: ataca siempre y usa el Límite cuando aparece. */
  masher(battle, hero) {
    if (hero.limitReady) return battle.selectSkill(hero.template.limit);
    battle.selectSkill('attack');
    battle.confirmTarget();
  },
  /** Jugador que cura y explota debilidades. */
  smart(battle, hero) {
    if (hero.limitReady) return battle.selectSkill(hero.template.limit);
    const weakest = battle.alive('heroes').reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
    if (weakest.hp / weakest.maxHp < 0.4 && hero.canPay(SKILLS.cure.mp)) {
      battle.selectSkill('cure');
      battle.setTarget(weakest);
      return battle.confirmTarget();
    }
    for (const foe of battle.alive('enemies')) {
      const weak = foe.template.elements.weak[0];
      if (weak && hero.template.spells.includes(weak) && hero.canPay(SKILLS[weak].mp + 10)) {
        battle.selectSkill(weak);
        battle.setTarget(foe);
        return battle.confirmTarget();
      }
    }
    battle.selectSkill('attack');
    battle.confirmTarget();
  },
};

function run(strategy, seed, heroes, foes) {
  const events = new EventBus();
  const scheduler = new Scheduler();
  const battle = new BattleSystem({
    encounter: { heroes, enemies: foes },
    units: UNITS,
    ai: AI,
    skills: SKILLS,
    config: CONFIG,
    presenter: new TimedPresenter(),
    events,
    scheduler,
    rng: new Rng(seed),
  });
  let damageTaken = 0;
  let limits = 0;
  const counts = {};
  events.on('damage', (e) => {
    if (e.target.isHero) damageTaken += e.amount;
  });
  events.on('action:start', ({ action }) => {
    counts[action.skill.id] = (counts[action.skill.id] ?? 0) + 1;
    if (action.skill.type === 'limit') limits++;
  });
  let ended = null;
  events.on('battle:end', ({ result }) => (ended = result));

  battle.start();
  const step = CONFIG.step;
  let t = 0;
  let lastState = null;
  let stateSince = 0;
  while (!ended && t < 600) {
    if (battle.menuHero && battle.state === 'IDLE') STRATEGIES[strategy](battle, battle.menuHero);
    battle.update(step);
    scheduler.update(step);
    t += step;
    if (battle.state !== lastState) {
      lastState = battle.state;
      stateSince = t;
    }
    if (t - stateSince > 30 && battle.state !== 'IDLE') {
      return { stuck: true, state: battle.state, t, info: battle.debugInfo() };
    }
  }
  return { result: ended ?? 'timeout', time: t, damageTaken, limits, counts };
}

const n = Number(process.argv[2] ?? 300);
const heroes = ['sergio', 'ada', 'linus'].slice(0, Number(process.argv[3] ?? 1));
const foes = ['bugFatal', 'larva', 'larva'].slice(0, Number(process.argv[4] ?? 2));

for (const strategy of Object.keys(STRATEGIES)) {
  const runs = Array.from({ length: n }, (_, i) => run(strategy, 1000 + i, heroes, foes));
  const stuck = runs.filter((r) => r.stuck);
  const done = runs.filter((r) => !r.stuck);
  const wins = done.filter((r) => r.result === 'victory');
  const avg = (arr, f) => (arr.length ? arr.reduce((s, r) => s + f(r), 0) / arr.length : 0);
  console.log(
    `${strategy.padEnd(7)} | ${heroes.length}v${foes.length} | victorias ${((wins.length / n) * 100).toFixed(1)}% ` +
      `| duración media ${avg(done, (r) => r.time).toFixed(1)}s | daño recibido ${avg(done, (r) => r.damageTaken).toFixed(0)} ` +
      `| límites/combate ${avg(done, (r) => r.limits).toFixed(2)} | bloqueos ${stuck.length} | timeouts ${done.filter((r) => r.result === 'timeout').length}`,
  );
  if (stuck.length) console.log('  ejemplo de bloqueo:', stuck[0]);
}
