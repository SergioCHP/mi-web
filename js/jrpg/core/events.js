/**
 * events.js — Bus de eventos mínimo (publicar/suscribir).
 * La lógica de batalla emite hechos ("daño", "KO", "estado añadido") y la vista/HUD
 * reaccionan sin que la lógica conozca el DOM ni el canvas.
 */
export class EventBus {
  #handlers = new Map();

  /** Suscribe y devuelve la función para desuscribirse. */
  on(type, handler) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(handler);
    return () => this.#handlers.get(type)?.delete(handler);
  }

  once(type, handler) {
    const off = this.on(type, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  emit(type, payload) {
    const set = this.#handlers.get(type);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (err) {
        // Un suscriptor roto no debe tumbar el bucle de juego.
        console.error(`[EventBus] Error en el manejador de "${type}"`, err);
      }
    }
  }

  clear() {
    this.#handlers.clear();
  }
}
