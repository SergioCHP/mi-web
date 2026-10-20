/**
 * presenter.js — Contrato entre la lógica de batalla y su representación.
 *
 * La lógica (battle-system.js, skills.js) solo conoce esta interfaz. Hay dos implementaciones:
 *   · Director (render/director.js): cámara, sprites, partículas, cinemáticas.
 *   · Presenter (esta clase base): no-op instantáneo → simulaciones headless y tests en Node.
 *
 * Convención: los métodos generadores (*) son "esperables" con `yield*`; el resto son
 * disparar-y-olvidar. playAnim devuelve la duración del clip y el instante de impacto.
 */
export class Presenter {
  *intro() {}
  *approach(_actor, _target) {}
  *retreat(_actor) {}
  /** Encuadre previo a un ataque a distancia (sin desplazamiento). */
  *aim(_actor, _target) {}
  /** @returns {{duration:number, hitTime:number}} */
  playAnim(_actor, _clip) {
    return { duration: 0, hitTime: 0 };
  }
  *cast(_actor, _element) {}
  *spell(_element, _actor, _target) {}
  fx(_name, _target, _opts) {}
  *limitIntro(_actor, _skill) {}
  *limitStrike(_actor, _target, _index, _total) {}
  *limitOutro(_actor) {}
  *statusTick(_unit, _statusId) {}
  *knockOut(_unit) {}
  *victory(_heroes) {}
  *defeat() {}
}
