/**
 * refresh-rate-test.mjs — Comprueba que el combate va igual a 30, 60, 144 y 240 Hz.
 *
 * Simula requestAnimationFrame a distintas frecuencias (con algo de jitter) y ejecuta la
 * misma batalla con la misma semilla. Con paso fijo, el ATB del héroe debe llenarse en el
 * mismo tiempo y el estado final (vida de todos) debe coincidir en todas las frecuencias.
 *
 *   node tools/refresh-rate-test.mjs
 */
import { GameLoop } from '../js/jrpg/core/game-loop.js';
import { BattleSystem } from '../js/jrpg/battle/battle-system.js';
import { Presenter } from '../js/jrpg/battle/presenter.js';
import { EventBus } from '../js/jrpg/core/events.js';
import { Scheduler } from '../js/jrpg/core/scheduler.js';
import { Rng } from '../js/jrpg/core/utils.js';
import { CONFIG } from '../js/jrpg/config.js';
import { UNITS, AI } from '../js/jrpg/data/units.js';
import { SKILLS } from '../js/jrpg/data/skills.js';

class TimedPresenter extends Presenter {
  *approach() { yield 0.3; }
  *retreat() { yield 0.3; }
  playAnim() { return { duration: 0.43, hitTime: 0.29 }; }
  *cast() { yield 0.6; }
  *spell() { yield 0.3; }
  *knockOut() { yield 0.6; }
}

function runAt(hz, seconds = 25) {
  // Entorno mínimo de navegador para el GameLoop
  let now = 0;
  let pending = null;
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = (cb) => ((pending = cb), 1);
  globalThis.cancelAnimationFrame = () => {};

  const events = new EventBus();
  const scheduler = new Scheduler();
  const battle = new BattleSystem({ encounter: { heroes: ['sergio'], enemies: ['bugFatal', 'larva'] }, units: UNITS, ai: AI, skills: SKILLS, config: CONFIG, presenter: new TimedPresenter(), events, scheduler, rng: new Rng(42) });
  let firstReady = null;
  events.on('atb:ready', ({ unit }) => {
    if (unit.isHero && firstReady === null) firstReady = battle.elapsed;
  });

  const loop = new GameLoop({
    step: CONFIG.step,
    update: (dt) => {
      if (battle.menuHero && battle.state === 'IDLE') {
        battle.selectSkill('attack');
        battle.confirmTarget();
      }
      battle.update(dt);
      scheduler.update(dt);
    },
    render: () => {},
  });
  battle.start();
  loop.start();

  const frame = 1000 / hz;
  let jitterSeed = 1;
  while (now < seconds * 1000) {
    jitterSeed = (jitterSeed * 16807) % 2147483647;
    now += frame * (0.85 + 0.3 * (jitterSeed / 2147483647)); // ±15 % de jitter de frame
    const cb = pending;
    pending = null;
    cb(now);
  }
  loop.stop();
  return {
    hz,
    gameTime: battle.elapsed.toFixed(3),
    heroFirstReady: firstReady.toFixed(3),
    state: battle.state,
    hp: battle.units.map((u) => u.hp).join('/'),
  };
}

const results = [30, 60, 144, 240].map((hz) => runAt(hz));
console.table(results);
const same = results.every((r) => r.hp === results[0].hp && r.heroFirstReady === results[0].heroFirstReady);
console.log(same ? '✓ Mismo resultado a cualquier frecuencia de refresco' : '✗ El resultado depende de la frecuencia');
process.exit(same ? 0 : 1);
