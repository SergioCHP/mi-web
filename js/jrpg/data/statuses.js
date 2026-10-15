/**
 * statuses.js — Estados alterados y mejoras temporales.
 * La duración se mide en TURNOS del afectado (se descuenta al terminar su acción).
 */
export const STATUSES = Object.freeze({
  poison: {
    id: 'poison',
    nameKey: 'status.poison',
    short: 'VEN',
    color: '#8cff5a',
    turns: 3,
    harmful: true,
    /** Daño por tick al final de cada turno del envenenado. */
    tick: { pctMaxHp: 0.05, min: 4 },
  },
  haste: {
    id: 'haste',
    nameKey: 'status.haste',
    short: 'PRI',
    color: '#ffd23f',
    turns: 4,
    harmful: false,
    /** Multiplicador de velocidad de llenado del ATB. */
    atbMultiplier: 1.5,
  },
  barrier: {
    id: 'barrier',
    nameKey: 'status.barrier',
    short: 'COR',
    color: '#59c3ff',
    turns: 3,
    harmful: false,
    /** Multiplicador del daño físico recibido. */
    physicalMultiplier: 0.5,
  },
});
