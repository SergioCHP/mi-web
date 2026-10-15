/**
 * game-loop.js — Bucle único con requestAnimationFrame y paso de simulación FIJO.
 *
 * Por qué paso fijo: con `setInterval(16ms)` + velocidad "por tick", un monitor de 144 Hz
 * (o un rAF a 240 Hz) aceleraba o frenaba el juego. Aquí la simulación siempre avanza en
 * pasos de `step` segundos usando un acumulador; el render va a la tasa del monitor.
 *
 *   frame real (variable) ──► acumulador += dt × timeScale
 *                             while (acumulador ≥ step) update(step)   ← lógica determinista
 *                             render(dt)                               ← lo que se ve
 *
 * Extras: tope de dt (evita la "espiral de la muerte" al volver de otra pestaña),
 * timeScale global (cámara lenta) y hit-stop (congelación breve en impactos).
 */
export class GameLoop {
  #raf = 0;
  #last = 0;
  #acc = 0;
  #hitStop = 0;
  #hitStopScale = 0;

  /**
   * @param {object} o
   * @param {(dt:number) => void} o.update  Simulación (paso fijo, tiempo de juego).
   * @param {(dtGame:number, dtReal:number) => void} o.render  Dibujo (una vez por frame).
   * @param {number} [o.step=1/240]  240 Hz: error ≤ 4 ms en cualquier monitor, coste mínimo.
   * @param {number} [o.maxFrame=0.25]  Tope del dt real por frame.
   */
  constructor({ update, render, step = 1 / 240, maxFrame = 0.25 }) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxFrame = maxFrame;
    this.maxSteps = Math.ceil(maxFrame / step);
    this.timeScale = 1;
    this.running = false;
    this.fps = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.#last = performance.now();
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.#raf = requestAnimationFrame(this.#frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.#raf);
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  /** Congela la simulación `seconds` (tiempo real) para dar peso a un impacto. */
  hitStop(seconds, scale = 0) {
    this.#hitStop = Math.max(this.#hitStop, seconds);
    this.#hitStopScale = scale;
  }

  #frame = (now) => {
    if (!this.running) return;
    this.#raf = requestAnimationFrame(this.#frame);

    let dtReal = (now - this.#last) / 1000;
    this.#last = now;
    if (dtReal < 0) dtReal = 0;
    if (dtReal > this.maxFrame) dtReal = this.maxFrame;
    this.fps = this.fps * 0.9 + (dtReal > 0 ? 1 / dtReal : 0) * 0.1;

    let scale = this.timeScale;
    if (this.#hitStop > 0) {
      this.#hitStop -= dtReal;
      scale *= this.#hitStopScale;
    }

    const dtGame = dtReal * scale;
    this.#acc += dtGame;
    let steps = 0;
    while (this.#acc >= this.step && steps < this.maxSteps) {
      this.update(this.step);
      this.#acc -= this.step;
      steps++;
    }
    if (steps >= this.maxSteps) this.#acc = 0;

    this.render(dtGame, dtReal);
  };

  #onVisibility = () => {
    // Al volver a la pestaña no recuperamos el tiempo perdido: el combate estaba "en pausa".
    if (!document.hidden) {
      this.#last = performance.now();
      this.#acc = 0;
    }
  };
}
