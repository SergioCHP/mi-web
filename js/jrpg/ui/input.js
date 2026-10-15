/**
 * input.js — Teclado y puntero (ratón/táctil) → órdenes a la batalla.
 *
 * · Selección de objetivo: flechas/WASD para cambiar, Enter/Espacio/Z para confirmar,
 *   Esc/Retroceso/X para volver. Con ratón, pasar por encima selecciona y el clic confirma;
 *   en táctil, un toque sobre el objetivo lo elige y confirma de una vez.
 * · Menús: los botones son <button> nativos; aquí solo se añade la navegación con flechas.
 */
import { BattleState } from '../battle/battle-system.js';

export class Input {
  constructor({ canvas, hud, renderer }) {
    this.canvas = canvas;
    this.hud = hud;
    this.renderer = renderer;
    this.battle = null;
    this.director = null;

    window.addEventListener('keydown', this.#onKey);
    canvas.addEventListener('pointermove', this.#onPointerMove);
    canvas.addEventListener('pointerup', this.#onPointerUp);
    canvas.addEventListener('pointerleave', () => this.#hover(null));
  }

  bind(battle, director) {
    this.battle = battle;
    this.director = director;
  }

  get #targeting() {
    return this.battle?.state === BattleState.SELECTING_TARGET ? this.battle.targeting : null;
  }

  #candidateViews() {
    const tg = this.#targeting;
    return tg ? tg.candidates.map((u) => this.director.view(u)) : [];
  }

  #pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    return this.renderer.pick(event.clientX - rect.left, event.clientY - rect.top, this.#candidateViews());
  }

  #hover(view) {
    this.canvas.style.cursor = view ? 'pointer' : '';
  }

  #onPointerMove = (event) => {
    if (!this.#targeting || event.pointerType === 'touch') return;
    const view = this.#pick(event);
    this.#hover(view);
    if (view) this.battle.setTarget(view.unit);
  };

  #onPointerUp = (event) => {
    if (!this.#targeting) return;
    const view = this.#pick(event);
    if (!view) return;
    this.battle.setTarget(view.unit);
    this.battle.confirmTarget();
    this.#hover(null);
  };

  #onKey = (event) => {
    if (!this.battle || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key;

    if (this.#targeting) {
      const map = {
        ArrowLeft: () => this.battle.moveTarget(-1),
        ArrowUp: () => this.battle.moveTarget(-1),
        a: () => this.battle.moveTarget(-1),
        w: () => this.battle.moveTarget(-1),
        ArrowRight: () => this.battle.moveTarget(1),
        ArrowDown: () => this.battle.moveTarget(1),
        d: () => this.battle.moveTarget(1),
        s: () => this.battle.moveTarget(1),
        Enter: () => this.battle.confirmTarget(),
        ' ': () => this.battle.confirmTarget(),
        z: () => this.battle.confirmTarget(),
        Escape: () => this.battle.cancelTarget(),
        Backspace: () => this.battle.cancelTarget(),
        x: () => this.battle.cancelTarget(),
      };
      const action = map[key] ?? map[key.toLowerCase()];
      if (action) {
        event.preventDefault();
        action();
      }
      return;
    }

    if (this.hud.handleKey(event)) event.preventDefault();
  };

  destroy() {
    window.removeEventListener('keydown', this.#onKey);
  }
}
