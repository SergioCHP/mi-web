/**
 * action-queue.js — Cola de acciones FIFO con prioridad.
 *
 * Si dos combatientes llenan su ATB en el mismo paso de simulación, ambas acciones entran
 * aquí con un número de secuencia creciente: se ejecutan una detrás de otra, nunca a la vez,
 * y ningún turno se pierde. El orden de empate se decide antes de encolar (battle-system.js).
 */
let seq = 0;

export class ActionQueue {
  /** @type {{actor:any, skill:object, targets:any[], priority:number, seq:number}[]} */
  #items = [];

  push({ actor, skill, targets, priority = 0 }) {
    const action = { actor, skill, targets, priority, seq: seq++ };
    this.#items.push(action);
    // Orden estable: prioridad descendente y, a igualdad, orden de llegada.
    this.#items.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
    return action;
  }

  shift() {
    return this.#items.shift() ?? null;
  }

  peek() {
    return this.#items[0] ?? null;
  }

  has(actor) {
    return this.#items.some((a) => a.actor === actor);
  }

  /** Elimina las acciones de un combatiente (p. ej. al caer K.O.). */
  removeActor(actor) {
    this.#items = this.#items.filter((a) => a.actor !== actor);
  }

  clear() {
    this.#items.length = 0;
  }

  get length() {
    return this.#items.length;
  }

  toArray() {
    return [...this.#items];
  }
}
