/**
 * fsm.js — Máquina de estados finita genérica.
 *
 * - Cada estado define hooks opcionales: enter(payload, from), update(dt), exit(to).
 * - `transitions` declara qué saltos son legales: un salto no previsto se rechaza y se registra,
 *   lo que convierte errores de flujo silenciosos en errores visibles durante el desarrollo.
 * - Las transiciones pedidas DENTRO de un enter/exit se encolan y se aplican al terminar,
 *   evitando reentradas (estado A entrando mientras B aún sale).
 */
export class StateMachine {
  #states;
  #transitions;
  #current = null;
  #busy = false;
  #pending = [];

  /**
   * @param {object} options
   * @param {Record<string, {enter?:Function, update?:Function, exit?:Function}>} options.states
   * @param {Record<string, string[]>} [options.transitions] Mapa estado → destinos permitidos.
   * @param {(from:string|null, to:string, payload:any) => void} [options.onChange]
   */
  constructor({ states, transitions = null, onChange = null }) {
    this.#states = states;
    this.#transitions = transitions;
    this.onChange = onChange;
    this.history = [];
  }

  get current() {
    return this.#current;
  }

  is(...names) {
    return names.includes(this.#current);
  }

  canTransition(to) {
    if (!this.#states[to]) return false;
    if (!this.#transitions || this.#current === null) return true;
    return (this.#transitions[this.#current] ?? []).includes(to);
  }

  transition(to, payload) {
    if (this.#busy) {
      this.#pending.push([to, payload]);
      return true;
    }
    if (!this.canTransition(to)) {
      console.error(`[FSM] Transición no permitida: ${this.#current} → ${to}`);
      return false;
    }

    this.#busy = true;
    const from = this.#current;
    try {
      if (from) this.#states[from].exit?.(to);
      this.#current = to;
      this.history.push(to);
      if (this.history.length > 50) this.history.shift();
      this.onChange?.(from, to, payload);
      this.#states[to].enter?.(payload, from);
    } finally {
      this.#busy = false;
    }

    // Aplica las transiciones solicitadas durante enter/exit, en orden.
    if (this.#pending.length) {
      const [next, nextPayload] = this.#pending.shift();
      this.transition(next, nextPayload);
    }
    return true;
  }

  update(dt) {
    if (this.#current) this.#states[this.#current].update?.(dt);
  }
}
