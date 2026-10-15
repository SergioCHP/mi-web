/**
 * scheduler.js — Corrutinas (generadores) y tweens sobre el reloj del juego.
 *
 * Sustituye a `await sleep(ms)` + `setTimeout`, que corren en tiempo de pared: se
 * desincronizan del bucle, siguen contando con la pestaña en segundo plano y no respetan
 * la cámara lenta ni el hit-stop. Aquí todo avanza solo cuando el GameLoop llama a update(dt).
 *
 * Dentro de una corrutina:
 *   yield 0.25            → espera 0,25 s de tiempo de juego
 *   yield () => cond      → espera hasta que la condición sea verdadera
 *   yield tween / task    → espera a que ese tween o tarea termine (objetos con .done)
 *   yield                 → espera un tick
 *   yield* otraCorrutina() → composición (sub-secuencias reutilizables)
 */
import { Ease } from './utils.js';

const MAX_STEPS_PER_TICK = 256; // salvaguarda ante bucles de "yield 0" infinitos

class Task {
  constructor(generator, tag, onError) {
    this.gen = generator;
    this.tag = tag;
    this.onError = onError;
    this.wait = 0;
    this.waitFor = null;
    this.done = false;
    this.cancelled = false;
  }

  cancel() {
    if (this.done) return;
    this.cancelled = true;
    this.done = true;
    try {
      this.gen.return?.();
    } catch {
      /* el generador ya estaba cerrado */
    }
  }
}

class Tween {
  constructor(target, to, duration, ease, delay, onUpdate) {
    this.target = target;
    this.to = to;
    this.keys = Object.keys(to);
    this.from = null;
    this.duration = Math.max(0, duration);
    this.ease = ease;
    this.delay = delay;
    this.elapsed = 0;
    this.onUpdate = onUpdate;
    this.done = false;
  }

  cancel() {
    this.done = true;
  }

  update(dt) {
    if (this.done) return;
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay > 0) return;
      dt = -this.delay;
    }
    if (!this.from) {
      // Los valores iniciales se capturan al arrancar (no al crear): encadenar tweens funciona.
      this.from = {};
      for (const k of this.keys) this.from[k] = this.target[k];
    }
    this.elapsed += dt;
    const t = this.duration === 0 ? 1 : Math.min(1, this.elapsed / this.duration);
    const e = this.ease(t);
    for (const k of this.keys) this.target[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
    this.onUpdate?.(this.target, t);
    if (t >= 1) this.done = true;
  }
}

export class Scheduler {
  #tasks = [];
  #tweens = [];

  /**
   * Arranca una corrutina. Acepta un generador o una función generadora.
   * @returns {Task} objeto "esperable" (tiene .done) y cancelable.
   */
  start(genOrFn, { tag = null, onError = null } = {}) {
    const gen = typeof genOrFn === 'function' ? genOrFn() : genOrFn;
    const task = new Task(gen, tag, onError);
    this.#tasks.push(task);
    // Primer paso inmediato: la corrutina empieza en el mismo tick en que se crea.
    this.#step(task, 0);
    return task;
  }

  /**
   * Interpola propiedades numéricas de `target`. Si otro tween animaba alguna de esas
   * propiedades del mismo objeto, se cancela (sobrescritura automática, sin "peleas").
   */
  tween(target, to, duration, ease = Ease.outCubic, { delay = 0, onUpdate = null } = {}) {
    const keys = Object.keys(to);
    for (const tw of this.#tweens) {
      if (!tw.done && tw.target === target && tw.keys.some((k) => keys.includes(k))) tw.cancel();
    }
    const tween = new Tween(target, to, duration, ease, delay, onUpdate);
    this.#tweens.push(tween);
    return tween;
  }

  cancelTag(tag) {
    for (const t of this.#tasks) if (t.tag === tag) t.cancel();
  }

  clear() {
    for (const t of this.#tasks) t.cancel();
    this.#tasks.length = 0;
    this.#tweens.length = 0;
  }

  get activeCount() {
    return this.#tasks.length;
  }

  update(dt) {
    // Tweens primero: las corrutinas que esperan a un tween lo ven terminado en el mismo tick.
    for (const tw of this.#tweens) tw.update(dt);
    this.#tweens = this.#tweens.filter((tw) => !tw.done);

    // Copia: una corrutina puede lanzar otras durante su paso.
    for (const task of [...this.#tasks]) this.#step(task, dt);
    this.#tasks = this.#tasks.filter((t) => !t.done);
  }

  #step(task, dt) {
    if (task.done) return;

    if (task.waitFor) {
      if (!task.waitFor()) return;
      task.waitFor = null;
      task.wait = 0;
    } else if (task.wait > 0) {
      task.wait -= dt;
      if (task.wait > 0) return;
      // El sobrante negativo se conserva: la siguiente espera lo compensa (sin deriva temporal).
    }

    for (let i = 0; i < MAX_STEPS_PER_TICK; i++) {
      let result;
      try {
        result = task.gen.next();
      } catch (err) {
        task.done = true;
        console.error('[Scheduler] Error dentro de una corrutina', err);
        task.onError?.(err);
        return;
      }
      if (result.done) {
        task.done = true;
        return;
      }

      const value = result.value;
      if (value === undefined || value === null) return; // un tick
      if (typeof value === 'number') {
        task.wait += value;
        if (task.wait > 0) return;
        continue;
      }
      if (typeof value === 'function') {
        if (!value()) {
          task.waitFor = value;
          return;
        }
        continue;
      }
      if (typeof value === 'object' && 'done' in value) {
        if (!value.done) {
          task.waitFor = () => value.done;
          return;
        }
        continue;
      }
      return;
    }
    console.warn('[Scheduler] Corrutina sin esperas reales: se pausa un tick.');
  }
}
