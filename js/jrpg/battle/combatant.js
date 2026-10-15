/**
 * combatant.js — Entidad de combate (SOLO datos y reglas; nada de render).
 *
 * La vista (render/combatant-view.js) lee este objeto para dibujarlo, pero el combatiente
 * no sabe que existe: la misma clase funciona en el navegador y en la simulación de Node.
 */
import { STATUSES } from '../data/statuses.js';

let nextId = 1;

export class Combatant {
  /**
   * @param {object} template Plantilla de data/units.js
   * @param {object} o
   * @param {'heroes'|'enemies'} o.team
   * @param {number} o.slot Posición en la formación (0-2)
   * @param {string} o.key Clave de la plantilla
   */
  constructor(template, { team, slot, key }) {
    this.id = `${key}#${nextId++}`;
    this.key = key;
    this.template = template;
    this.team = team;
    this.slot = slot;
    this.nameKey = template.nameKey;
    this.stats = { ...template.stats };
    this.maxHp = template.stats.hp;
    this.maxMp = template.stats.mp ?? 0;
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    /** Barra ATB normalizada 0..1. */
    this.atb = 0;
    /** Barra de Límite 0..1 (solo héroes con `limit`). */
    this.limit = 0;
    this.defending = false;
    /** @type {Map<string, {turns:number}>} */
    this.statuses = new Map();
    /** Elementos que el jugador ya ha descubierto (estilo Octopath: se revelan al golpear). */
    this.revealed = new Set();
  }

  get isHero() {
    return this.team === 'heroes';
  }

  get alive() {
    return this.hp > 0;
  }

  get atbFull() {
    return this.atb >= 1;
  }

  get limitReady() {
    return Boolean(this.template.limit) && this.limit >= 1;
  }

  hasStatus(id) {
    return this.statuses.has(id);
  }

  /** Añade o refresca un estado. Devuelve true si es nuevo. */
  addStatus(id) {
    const def = STATUSES[id];
    if (!def) throw new Error(`Estado desconocido: ${id}`);
    const isNew = !this.statuses.has(id);
    this.statuses.set(id, { turns: def.turns });
    return isNew;
  }

  removeStatus(id) {
    return this.statuses.delete(id);
  }

  /** Velocidad de llenado del ATB por segundo, con Prisa aplicada. */
  atbRate(baseSeconds) {
    const haste = this.hasStatus('haste') ? STATUSES.haste.atbMultiplier : 1;
    return (this.stats.spd / 10 / baseSeconds) * haste;
  }

  takeDamage(amount) {
    const dealt = Math.min(this.hp, Math.max(0, Math.round(amount)));
    this.hp -= dealt;
    return dealt;
  }

  heal(amount) {
    const healed = Math.min(this.maxHp - this.hp, Math.max(0, Math.round(amount)));
    this.hp += healed;
    return healed;
  }

  canPay(mp = 0) {
    return this.mp >= mp;
  }

  spendMp(mp = 0) {
    if (!this.canPay(mp)) return false;
    this.mp -= mp;
    return true;
  }

  gainLimit(amount) {
    if (!this.template.limit || !this.alive) return false;
    const wasReady = this.limitReady;
    this.limit = Math.min(1, this.limit + amount);
    return !wasReady && this.limitReady;
  }

  /** Al caer: se vacían ATB y defensa, se limpian los estados. */
  knockOut() {
    this.hp = 0;
    this.atb = 0;
    this.defending = false;
    this.statuses.clear();
  }
}
