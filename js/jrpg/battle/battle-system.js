/**
 * battle-system.js — Orquestador de la batalla: ATB, cola de acciones y FSM.
 *
 * Flujo (FSM):
 *
 *   INTRO ─► IDLE ─────────────► SELECTING_TARGET ─┐ (confirmar/cancelar)
 *             ▲ │ (cola con acciones)              │
 *             │ ▼                                  ▼
 *             │ EXECUTING_ACTION ─► RESOLVING_EFFECTS ─► CHECK_STATUS ─┬─► VICTORY
 *             │                                                        ├─► GAME_OVER
 *             └────────────────────────────────────────────────────────┤
 *                                       (más acciones en cola) ─► EXECUTING_ACTION
 *
 * - IDLE: corre el ATB. Al llenarse, un enemigo decide (IA) y encola; un héroe entra en la
 *   cola de entrada y se le abre el menú. Si no hay menú abierto y la cola tiene acciones, se ejecuta.
 * - EXECUTING_ACTION: corre la corrutina de la habilidad (skills.js). El resto del ATB sigue
 *   llenándose → la cola absorbe turnos simultáneos sin colisiones.
 * - RESOLVING_EFFECTS: animaciones de K.O., ticks de Veneno, expiración de estados.
 * - CHECK_STATUS: victoria/derrota o siguiente acción. Si un héroe espera orden, tiene prioridad.
 *
 * No toca DOM ni canvas: comunica hechos por `events` y pide visuales al `presenter`.
 */
import { StateMachine } from '../core/fsm.js';
import { ActionQueue } from './action-queue.js';
import { Combatant } from './combatant.js';
import { computeDamage, computeHeal, computePoisonTick } from './damage.js';

export const BattleState = Object.freeze({
  INTRO: 'INTRO',
  IDLE: 'IDLE',
  SELECTING_TARGET: 'SELECTING_TARGET',
  EXECUTING_ACTION: 'EXECUTING_ACTION',
  RESOLVING_EFFECTS: 'RESOLVING_EFFECTS',
  CHECK_STATUS: 'CHECK_STATUS',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER',
});

const S = BattleState;

const TRANSITIONS = {
  [S.INTRO]: [S.IDLE],
  [S.IDLE]: [S.SELECTING_TARGET, S.EXECUTING_ACTION, S.CHECK_STATUS],
  [S.SELECTING_TARGET]: [S.IDLE],
  [S.EXECUTING_ACTION]: [S.RESOLVING_EFFECTS],
  [S.RESOLVING_EFFECTS]: [S.CHECK_STATUS],
  [S.CHECK_STATUS]: [S.IDLE, S.EXECUTING_ACTION, S.VICTORY, S.GAME_OVER],
  [S.VICTORY]: [],
  [S.GAME_OVER]: [],
};

const opposite = (team) => (team === 'heroes' ? 'enemies' : 'heroes');

export class BattleSystem {
  /**
   * @param {object} o
   * @param {{heroes:string[], enemies:string[]}} o.encounter
   * @param {object} o.units   Plantillas (data/units.js)
   * @param {object} o.ai      Funciones de IA (data/units.js)
   * @param {object} o.skills  Habilidades (data/skills.js)
   * @param {object} o.config  CONFIG
   * @param {import('./presenter.js').Presenter} o.presenter
   * @param {import('../core/events.js').EventBus} o.events
   * @param {import('../core/scheduler.js').Scheduler} o.scheduler
   * @param {import('../core/utils.js').Rng} o.rng
   */
  constructor({ encounter, units, ai, skills, config, presenter, events, scheduler, rng }) {
    this.skills = skills;
    this.ai = ai;
    this.config = config;
    this.rules = config.rules;
    this.pres = presenter;
    this.events = events;
    this.scheduler = scheduler;
    this.rng = rng;

    const make = (team) => (key, slot) => {
      if (!units[key]) throw new Error(`Unidad desconocida: ${key}`);
      return new Combatant(units[key], { team, slot, key });
    };
    this.heroes = encounter.heroes.map(make('heroes'));
    this.enemies = encounter.enemies.map(make('enemies'));
    this.units = [...this.heroes, ...this.enemies];

    // Valores iniciales de ATB escalonados (como en FFVII): nadie empieza a cero exacto.
    for (const u of this.units) u.atb = this.rng.range(0.1, 0.45) * (u.isHero ? 1.2 : 1);

    this.queue = new ActionQueue();
    /** Héroes con ATB lleno esperando orden del jugador (FIFO). */
    this.inputQueue = [];
    /** Héroe con el menú abierto (o null). */
    this.menuHero = null;
    /** Estado de selección de objetivo: { hero, skill, candidates, index }. */
    this.targeting = null;
    this.current = null;
    this.result = null;
    this.elapsed = 0;

    this.#lastTarget = new Map();
    this.#koThisTurn = [];

    this.fsm = new StateMachine({
      transitions: TRANSITIONS,
      onChange: (from, to) => this.events.emit('state', { from, to }),
      states: {
        [S.INTRO]: {
          enter: () => {
            this.#task = this.scheduler.start(this.pres.intro());
          },
          update: () => {
            if (this.#task.done) {
              this.events.emit('message', { key: 'msg.start' });
              this.fsm.transition(S.IDLE);
            }
          },
        },

        [S.IDLE]: {
          update: (dt) => {
            const frozen = this.menuHero && this.config.atb.mode === 'wait';
            if (!frozen) this.#tickAtb(dt);
            if (!this.menuHero && this.inputQueue.length) {
              this.#openMenu(this.inputQueue[0]);
              return;
            }
            if (!this.menuHero && this.queue.length) {
              const next = this.#dequeueValid();
              if (next) this.fsm.transition(S.EXECUTING_ACTION, next);
            }
          },
        },

        [S.SELECTING_TARGET]: {
          enter: ({ hero, skill }) => {
            const candidates = this.#candidatesFor(hero, skill);
            const remembered = this.#lastTarget.get(`${hero.id}:${skill.target}`);
            let index = candidates.indexOf(remembered);
            if (index < 0) {
              index =
                skill.type === 'heal'
                  ? candidates.indexOf(candidates.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)))
                  : skill.target === 'ally'
                    ? Math.max(0, candidates.indexOf(hero))
                    : 0;
            }
            this.targeting = { hero, skill, candidates, index };
            this.events.emit('target:start', { ...this.targeting, target: candidates[index] });
          },
          update: (dt) => {
            if (this.config.atb.mode === 'active') this.#tickAtb(dt);
          },
          exit: () => {
            this.targeting = null;
          },
        },

        [S.EXECUTING_ACTION]: {
          enter: (action) => this.#beginAction(action),
          update: (dt) => {
            if (this.config.atb.tickDuringActions) this.#tickAtb(dt);
            if (this.#task.done) this.fsm.transition(S.RESOLVING_EFFECTS);
          },
        },

        [S.RESOLVING_EFFECTS]: {
          enter: () => {
            this.#task = this.scheduler.start(this.#resolveEffects(this.current), {
              onError: () => this.#koThisTurn.splice(0),
            });
          },
          update: (dt) => {
            if (this.config.atb.tickDuringActions) this.#tickAtb(dt);
            if (this.#task.done) this.fsm.transition(S.CHECK_STATUS);
          },
        },

        [S.CHECK_STATUS]: {
          enter: () => {
            this.events.emit('action:end', { action: this.current });
            this.current = null;
            if (!this.alive('enemies').length) return this.fsm.transition(S.VICTORY);
            if (!this.alive('heroes').length) return this.fsm.transition(S.GAME_OVER);
            // Prioridad del jugador: si un héroe espera orden, se le abre el menú antes de seguir.
            if (this.inputQueue.length) return this.fsm.transition(S.IDLE);
            const next = this.#dequeueValid();
            return this.fsm.transition(next ? S.EXECUTING_ACTION : S.IDLE, next ?? undefined);
          },
        },

        [S.VICTORY]: {
          enter: () => this.#finish('victory', this.pres.victory(this.alive('heroes'))),
          update: () => this.#emitEndWhenDone(),
        },

        [S.GAME_OVER]: {
          enter: () => this.#finish('defeat', this.pres.defeat()),
          update: () => this.#emitEndWhenDone(),
        },
      },
    });
  }

  #task = { done: true };
  #lastTarget;
  #koThisTurn;
  #endEmitted = false;

  // ───────────────────────────── Ciclo de vida ─────────────────────────────

  start() {
    this.fsm.transition(S.INTRO);
  }

  update(dt) {
    if (this.fsm.current === null) return;
    this.elapsed += dt;
    this.fsm.update(dt);
  }

  get state() {
    return this.fsm.current;
  }

  alive(team) {
    return (team === 'heroes' ? this.heroes : this.enemies).filter((u) => u.alive);
  }

  // ─────────────────────────── API para la interfaz ───────────────────────────

  /** Comandos raíz del héroe. Con el Límite lleno, "Atacar" se sustituye por "Límite" (FFVII). */
  commandsFor(hero) {
    return hero.template.commands.map((id) => {
      if (id === 'attack' && hero.limitReady) {
        return { id: 'limit', labelKey: 'cmd.limit', skillId: hero.template.limit, enabled: true, highlight: true };
      }
      if (id === 'magic') {
        return { id, labelKey: 'cmd.magic', submenu: true, enabled: (hero.template.spells ?? []).length > 0 };
      }
      return { id, labelKey: `cmd.${id}`, skillId: id, enabled: true };
    });
  }

  spellsFor(hero) {
    return (hero.template.spells ?? []).map((id) => {
      const skill = this.skills[id];
      return { id, skillId: id, labelKey: skill.nameKey, mp: skill.mp ?? 0, element: skill.element, enabled: hero.canPay(skill.mp) };
    });
  }

  /** El jugador elige una habilidad del menú del héroe activo. */
  selectSkill(skillId) {
    const hero = this.menuHero;
    const skill = this.skills[skillId];
    if (!hero || !skill || !this.fsm.is(S.IDLE)) return false;
    if (!hero.canPay(skill.mp)) {
      this.events.emit('message', { key: 'msg.noMp' });
      return false;
    }
    if (skill.type === 'limit' && !hero.limitReady) return false;

    if (skill.target === 'enemy' || skill.target === 'ally') {
      return this.fsm.transition(S.SELECTING_TARGET, { hero, skill });
    }
    const targets = skill.target === 'self' ? [hero] : [];
    this.#commit(hero, skill, targets);
    return true;
  }

  moveTarget(step) {
    const tg = this.targeting;
    if (!tg) return;
    tg.index = (tg.index + step + tg.candidates.length) % tg.candidates.length;
    this.events.emit('target:change', { target: tg.candidates[tg.index] });
  }

  setTarget(unit) {
    const tg = this.targeting;
    if (!tg) return false;
    const index = tg.candidates.indexOf(unit);
    if (index < 0) return false;
    if (index !== tg.index) {
      tg.index = index;
      this.events.emit('target:change', { target: unit });
    }
    return true;
  }

  confirmTarget() {
    const tg = this.targeting;
    if (!tg || !this.fsm.is(S.SELECTING_TARGET)) return false;
    const target = tg.candidates[tg.index];
    this.#lastTarget.set(`${tg.hero.id}:${tg.skill.target}`, target);
    const { hero, skill } = tg;
    this.events.emit('target:end', { cancelled: false });
    this.fsm.transition(S.IDLE);
    this.#commit(hero, skill, [target]);
    return true;
  }

  cancelTarget() {
    const tg = this.targeting;
    if (!tg) return false;
    this.events.emit('target:end', { cancelled: true, skill: tg.skill, hero: tg.hero });
    this.fsm.transition(S.IDLE);
    return true;
  }

  /** Cede el menú al siguiente héroe listo (como el botón "cambiar" de FFVII). */
  cycleHero() {
    if (this.inputQueue.length < 2 || !this.fsm.is(S.IDLE)) return;
    this.inputQueue.push(this.inputQueue.shift());
    this.#closeMenu();
    this.#openMenu(this.inputQueue[0]);
  }

  debugInfo() {
    return {
      state: this.fsm.current,
      queue: this.queue.toArray().map((a) => `${a.actor.key}:${a.skill.id}`),
      input: this.inputQueue.map((h) => h.key),
      menu: this.menuHero?.key ?? '-',
      tasks: this.scheduler.activeCount,
    };
  }

  // ───────────────────────────── Internos: ATB ─────────────────────────────

  #tickAtb(dt) {
    const ready = [];
    const base = this.config.atb.baseSeconds;
    for (const u of this.units) {
      if (!u.alive || u.atbFull) continue;
      u.atb += u.atbRate(base) * dt;
      if (u.atb >= 1) {
        ready.push({ u, overflow: u.atb - 1 });
        u.atb = 1;
      }
    }
    if (!ready.length) return;
    // Desempate determinista en el mismo paso: quien más "se pasó" es más rápido → primero.
    // Después héroes antes que enemigos y, por último, la posición en la formación.
    ready.sort(
      (a, b) =>
        b.overflow - a.overflow || Number(b.u.isHero) - Number(a.u.isHero) || a.u.slot - b.u.slot,
    );
    for (const { u } of ready) this.#onReady(u);
  }

  #onReady(unit) {
    unit.defending = false; // la Defensa dura hasta el siguiente turno propio
    this.events.emit('atb:ready', { unit });
    if (unit.isHero) {
      this.inputQueue.push(unit);
      return;
    }
    const decide = this.ai[unit.template.ai];
    const decision = decide
      ? decide(unit, this, this.rng)
      : { skill: 'enemyAttack', targets: [this.rng.pick(this.alive('heroes'))] };
    this.queue.push({ actor: unit, skill: this.skills[decision.skill], targets: decision.targets });
  }

  #openMenu(hero) {
    this.menuHero = hero;
    this.events.emit('command:open', { hero });
  }

  #closeMenu() {
    this.menuHero = null;
    this.events.emit('command:close', {});
  }

  #commit(hero, skill, targets) {
    this.queue.push({ actor: hero, skill, targets });
    this.inputQueue = this.inputQueue.filter((h) => h !== hero);
    this.#closeMenu();
  }

  #dequeueValid() {
    let action = this.queue.shift();
    while (action && !action.actor.alive) action = this.queue.shift();
    return action;
  }

  #candidatesFor(hero, skill) {
    const team = skill.target === 'ally' ? hero.team : opposite(hero.team);
    return this.alive(team);
  }

  // ─────────────────────────── Internos: ejecución ───────────────────────────

  #beginAction(action) {
    this.current = action;
    const { actor, skill } = action;
    if (skill.mp) actor.spendMp(skill.mp);
    if (skill.type === 'limit') actor.limit = 0;

    this.events.emit('action:start', { action });
    if (skill.announce !== false) this.events.emit('message', { key: skill.nameKey, actor, big: skill.type === 'limit' });

    this.#task = this.scheduler.start(skill.run(this.#context(action)), {
      // Si una coreografía falla, la batalla continúa: la tarea se da por terminada.
      onError: (err) => this.events.emit('error', { err, action }),
    });
  }

  /** API lógica que reciben las habilidades (ver data/skills.js). */
  #context(action) {
    const battle = this;
    const { actor, skill } = action;
    return {
      actor,
      skill,
      targets: action.targets,
      pres: this.pres,
      rng: this.rng,
      get target() {
        return this.targets[0];
      },
      valid: (unit) => battle.#validTarget(actor, skill, unit),
      hit: (unit, opts) => battle.#hit(actor, unit, skill, opts),
      heal: (unit, opts) => battle.#heal(actor, unit, opts),
      addStatus: (unit, id, chance) => battle.#addStatus(unit, id, chance),
      defend: () => {
        actor.defending = true;
        battle.events.emit('defend', { unit: actor });
      },
      randomFoe: () => battle.rng.pick(battle.alive(opposite(actor.team))),
    };
  }

  /** Reasignación de objetivo estilo FF: si el elegido cayó, se busca otro del mismo bando. */
  #validTarget(actor, skill, unit) {
    if (unit?.alive) return unit;
    if (skill.target === 'self') return actor.alive ? actor : null;
    const team = unit ? unit.team : skill.target === 'ally' ? actor.team : opposite(actor.team);
    const pool = this.alive(team);
    if (!pool.length) return null;
    if (skill.type === 'heal') return pool.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
    return this.rng.pick(pool);
  }

  #hit(actor, unit, skill, opts = {}) {
    const target = this.#validTarget(actor, skill, unit);
    if (!target) return null;
    const result = computeDamage({ actor, target, skill, opts, rng: this.rng, rules: this.rules });
    const amount = target.takeDamage(result.amount);
    if (result.element) target.revealed.add(result.element);

    this.events.emit('damage', {
      source: actor,
      target,
      ...result,
      amount,
      lethal: !target.alive,
      limit: Boolean(opts.limit),
    });
    this.#afterDamage(target, amount);
    return { ...result, amount, target };
  }

  #afterDamage(target, amount) {
    if (target.isHero && amount > 0 && target.alive) {
      const gain = (amount / target.maxHp) * this.rules.limitGainRate;
      if (target.gainLimit(gain)) this.events.emit('limit:ready', { unit: target });
    }
    if (!target.alive) this.#knockOut(target);
  }

  #heal(actor, unit, { power = 1 } = {}) {
    const target = this.#validTarget(actor, { target: 'ally', type: 'heal' }, unit);
    if (!target) return 0;
    const amount = target.heal(computeHeal({ actor, power, rng: this.rng, rules: this.rules }));
    this.events.emit('heal', { source: actor, target, amount });
    return amount;
  }

  #addStatus(unit, id, chance = 1) {
    if (!unit?.alive) return false;
    if (!this.rng.chance(chance)) return false;
    const isNew = unit.addStatus(id);
    this.events.emit('status:add', { unit, id, refreshed: !isNew });
    return true;
  }

  #knockOut(unit) {
    unit.knockOut();
    this.queue.removeActor(unit);
    this.inputQueue = this.inputQueue.filter((h) => h !== unit);
    this.#koThisTurn.push(unit);
    this.events.emit('ko', { unit });
  }

  /** Corrutina de RESOLVING_EFFECTS. */
  *#resolveEffects(action) {
    yield* this.#playKnockOuts();

    const actor = action?.actor;
    if (actor?.alive) {
      for (const [id, status] of [...actor.statuses]) {
        if (id === 'poison') {
          yield* this.pres.statusTick(actor, id);
          const amount = actor.takeDamage(computePoisonTick(actor));
          this.events.emit('damage', { source: null, target: actor, amount, kind: 'poison', crit: false, tag: null, element: null, lethal: !actor.alive });
          this.#afterDamage(actor, amount);
          if (!actor.alive) break;
        }
        status.turns -= 1;
        if (status.turns <= 0) {
          actor.removeStatus(id);
          this.events.emit('status:remove', { unit: actor, id });
        }
      }
      yield* this.#playKnockOuts();
    }
    if (actor?.alive) actor.atb = 0;
  }

  *#playKnockOuts() {
    while (this.#koThisTurn.length) {
      const unit = this.#koThisTurn.shift();
      yield* this.pres.knockOut(unit);
    }
  }

  #finish(result, sequence) {
    this.result = result;
    this.#closeMenuIfOpen();
    this.#task = this.scheduler.start(sequence);
    this.events.emit('message', { key: result === 'victory' ? 'msg.victory' : 'msg.defeat', sticky: true });
  }

  #closeMenuIfOpen() {
    if (this.menuHero) this.#closeMenu();
  }

  #emitEndWhenDone() {
    if (this.#task.done && !this.#endEmitted) {
      this.#endEmitted = true;
      this.events.emit('battle:end', { result: this.result });
    }
  }
}
