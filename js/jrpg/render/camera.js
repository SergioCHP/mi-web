/**
 * camera.js — Cámara 2D con foco suavizado, balanceo ocioso y sacudida por "trauma".
 *
 * Sacudida (modelo de trauma de Squirrel Eiserloh):
 *   · Cada impacto suma trauma (0..1). El trauma decae linealmente con el tiempo.
 *   · Intensidad = trauma²  → los golpes pequeños apenas se notan y los grandes pegan fuerte.
 *   · Desplazamiento = intensidad × máximo × ruidoSuave(t) en X, Y y rotación, con fases
 *     distintas por eje → sacudida multidireccional, orgánica y amortiguada (no aleatoria a saltos).
 */
import { clamp, damp, smoothNoise } from '../core/utils.js';

export class Camera {
  constructor({ shakeScale = 1, swayScale = 1 } = {}) {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.home = { x: 0, y: 0, zoom: 1 };
    this.target = { x: 0, y: 0, zoom: 1 };
    /** Velocidad de seguimiento (más alto = más rápido). Cambia en cinemáticas. */
    this.followSpeed = 5;

    this.trauma = 0;
    this.traumaDecay = 1.25; // trauma por segundo
    this.maxOffset = 14; // unidades de mundo
    this.maxAngle = 0.035; // radianes
    this.shakeScale = shakeScale;
    this.swayScale = swayScale;

    this.time = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.angle = 0;
    this.swayX = 0;
    this.swayY = 0;
  }

  setHome(x, y, zoom = 1) {
    this.home = { x, y, zoom };
  }

  /**
   * Encuadre visible (semiancho/semialto en unidades de mundo a zoom 1). Limita los
   * travellings para que un zoom no saque del plano a los combatientes, y en pantallas
   * estrechas (`compact`, móvil vertical) suaviza los zooms.
   */
  setFrame(halfW, halfH, compact = false) {
    this.frame = { halfW, halfH };
    this.zoomScale = compact ? 0.5 : 1;
  }

  /** Enfoca un punto del mundo; `speed` controla la rapidez del travelling. */
  focus(x, y, zoom = 1.2, speed = 5) {
    const z = 1 + (zoom - 1) * (this.zoomScale ?? 1);
    const f = this.frame;
    if (f) {
      // El zoom solo puede "recortar hacia" el punto de interés, sin enseñar fuera del encuadre.
      const panX = Math.max(0, f.halfW * (1 - 1 / z)) + 30;
      const panY = Math.max(0, f.halfH * (1 - 1 / z)) + 12;
      x = clamp(x, this.home.x - panX, this.home.x + panX);
      y = clamp(y, this.home.y - panY, this.home.y + panY);
    }
    this.target = { x, y, zoom: z };
    this.followSpeed = speed;
  }

  reset(speed = 4) {
    this.target = { ...this.home };
    this.followSpeed = speed;
  }

  snap() {
    this.x = this.target.x;
    this.y = this.target.y;
    this.zoom = this.target.zoom;
  }

  addTrauma(amount) {
    this.trauma = clamp(this.trauma + amount * this.shakeScale, 0, 1);
  }

  /** Usa tiempo REAL: la cámara sigue temblando durante el hit-stop (sensación de impacto). */
  update(dtReal) {
    this.time += dtReal;
    this.x = damp(this.x, this.target.x, this.followSpeed, dtReal);
    this.y = damp(this.y, this.target.y, this.followSpeed, dtReal);
    this.zoom = damp(this.zoom, this.target.zoom, this.followSpeed, dtReal);

    this.trauma = Math.max(0, this.trauma - this.traumaDecay * dtReal);
    const intensity = this.trauma * this.trauma;
    const t = this.time * 22;
    this.shakeX = this.maxOffset * intensity * smoothNoise(t, 1);
    this.shakeY = this.maxOffset * intensity * smoothNoise(t, 7);
    this.angle = this.maxAngle * intensity * smoothNoise(t, 13);

    // Balanceo lento: hace visible el parallax incluso en reposo.
    this.swayX = Math.sin(this.time * 0.23) * 7 * this.swayScale;
    this.swayY = Math.sin(this.time * 0.17 + 1.3) * 2 * this.swayScale;
  }

  /** Posición final que usa el renderer. */
  get viewX() {
    return this.x + this.shakeX + this.swayX;
  }

  get viewY() {
    return this.y + this.shakeY + this.swayY;
  }
}
