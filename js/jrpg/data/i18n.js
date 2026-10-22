/**
 * i18n.js — Textos del minijuego en castellano y valenciano.
 * Respeta la misma preferencia que el resto de la web (localStorage "sergio-lang").
 */
const STRINGS = {
  es: {
    'ui.encounter': '¡Encuentro!',
    'ui.introText': 'Juega para avanzar y desbloquear el siguiente nivel.',
    'ui.controls': 'Ratón o táctil · Teclado: ↑↓ elegir · Enter confirmar · Esc volver',
    'ui.play': 'Jugar',
    'ui.skip': 'Saltar',
    'ui.skipBattle': 'Saltar ➔',
    'ui.skipTitle': 'Saltar combate',
    'ui.retry': 'Reintentar',
    'ui.loading': 'Cargando…',
    'ui.waiting': 'Esperando turno…',
    'ui.back': '◂ Volver',
    'ui.chooseTarget': 'Elige objetivo · Esc para volver',
    'ui.chooseAlly': 'Elige aliado · Esc para volver',
    'ui.commands': 'Comandos',
    'ui.party': 'Grupo',
    'ui.crt': 'CRT',
    'ui.crtTitle': 'Activar o desactivar el filtro CRT',
    'ui.canvasLabel': 'Escenario del combate',
    'ui.defeatTitle': 'Has sido derrotado',
    'ui.defeatText': 'El bug sigue en producción. ¿Otro intento?',
    'ui.limitReady': '¡Límite listo!',
    'ui.ko': 'K.O.',
    'ui.victory': '¡VICTORIA!',
    'ui.defeat': 'DERROTA',

    'cmd.attack': 'Atacar',
    'cmd.magic': 'Magia',
    'cmd.defend': 'Defender',
    'cmd.limit': 'Límite',

    'skill.attack': 'Ataque',
    'skill.fire': 'Piro',
    'skill.thunder': 'Electro',
    'skill.cure': 'Cura',
    'skill.haste': 'Prisa',
    'skill.barrier': 'Coraza',
    'skill.defend': 'Defensa',
    'skill.refactor': 'REFACTOR TOTAL',
    'skill.claw': 'Zarpazo',
    'skill.toxicBite': 'Mordisco tóxico',
    'skill.tacticalStrike': 'Asalto táctico',
    'skill.enemyBarrier': 'Coraza',

    'status.poison': 'Veneno',
    'status.haste': 'Prisa',
    'status.barrier': 'Coraza',

    'element.fire': 'Piro',
    'element.thunder': 'Electro',

    'unit.sergio': 'S. Chorques',
    'unit.ada': 'Ada',
    'unit.linus': 'Linus',
    'unit.bugFatal': 'Bug Fatal',
    'unit.larva': 'Larva Glitch',
    'unit.soldado': 'Soldado de Élite',

    'msg.start': '¡Combate iniciado!',
    'msg.yourTurn': 'Turno de {name}',
    'msg.noMp': 'MP insuficiente',
    'msg.victory': '¡VICTORIA! Accediendo…',
    'msg.defeat': 'HAS SIDO DERROTADO',
    'msg.limitReady': '¡{name}: Límite listo!',

    'pop.crit': '¡CRÍTICO!',
    'pop.resist': 'RESISTIDO',
    'pop.weak': '¡CRÍTICO!',
  },
  va: {
    'ui.encounter': 'Encontre!',
    'ui.introText': 'Juga per a avançar i desbloquejar el següent nivell.',
    'ui.controls': 'Ratolí o tàctil · Teclat: ↑↓ triar · Enter confirmar · Esc tornar',
    'ui.play': 'Jugar',
    'ui.skip': 'Saltar',
    'ui.skipBattle': 'Saltar ➔',
    'ui.skipTitle': 'Saltar el combat',
    'ui.retry': 'Tornar a provar',
    'ui.loading': 'Carregant…',
    'ui.waiting': 'Esperant torn…',
    'ui.back': '◂ Tornar',
    'ui.chooseTarget': 'Tria objectiu · Esc per a tornar',
    'ui.chooseAlly': 'Tria aliat · Esc per a tornar',
    'ui.commands': 'Ordres',
    'ui.party': 'Grup',
    'ui.crt': 'CRT',
    'ui.crtTitle': 'Activar o desactivar el filtre CRT',
    'ui.canvasLabel': 'Escenari del combat',
    'ui.defeatTitle': 'Has sigut derrotat',
    'ui.defeatText': 'El bug continua en producció. Un altre intent?',
    'ui.limitReady': 'Límit preparat!',
    'ui.ko': 'K.O.',
    'ui.victory': 'VICTÒRIA!',
    'ui.defeat': 'DERROTA',

    'cmd.attack': 'Atacar',
    'cmd.magic': 'Màgia',
    'cmd.defend': 'Defendre',
    'cmd.limit': 'Límit',

    'skill.attack': 'Atac',
    'skill.fire': 'Piro',
    'skill.thunder': 'Electro',
    'skill.cure': 'Cura',
    'skill.haste': 'Pressa',
    'skill.barrier': 'Cuirassa',
    'skill.defend': 'Defensa',
    'skill.refactor': 'REFACTOR TOTAL',
    'skill.claw': 'Urpada',
    'skill.toxicBite': 'Mossegada tòxica',
    'skill.tacticalStrike': 'Assalt tàctic',
    'skill.enemyBarrier': 'Cuirassa',

    'status.poison': 'Verí',
    'status.haste': 'Pressa',
    'status.barrier': 'Cuirassa',

    'element.fire': 'Piro',
    'element.thunder': 'Electro',

    'unit.sergio': 'S. Chorques',
    'unit.ada': 'Ada',
    'unit.linus': 'Linus',
    'unit.bugFatal': 'Bug Fatal',
    'unit.larva': 'Larva Glitch',
    'unit.soldado': "Soldat d'Elit",

    'msg.start': 'Combat iniciat!',
    'msg.yourTurn': 'Torn de {name}',
    'msg.noMp': 'MP insuficient',
    'msg.victory': 'VICTÒRIA! Accedint…',
    'msg.defeat': 'HAS SIGUT DERROTAT',
    'msg.limitReady': '{name}: Límit preparat!',

    'pop.crit': 'CRÍTIC!',
    'pop.resist': 'RESISTIT',
    'pop.weak': 'CRÍTIC!',
  },
};

export function getLang() {
  let lang = null;
  try {
    lang = localStorage.getItem('sergio-lang');
  } catch {
    /* almacenamiento bloqueado (modo privado estricto) */
  }
  if (lang !== 'es' && lang !== 'va') {
    const attr = (document.documentElement.getAttribute('lang') || 'es').toLowerCase();
    lang = attr === 'va' || attr.startsWith('ca') ? 'va' : 'es';
  }
  return lang;
}

let current = 'es';

export function setLang(lang) {
  current = STRINGS[lang] ? lang : 'es';
  // Que el lector de pantalla pronuncie en el idioma que se ve
  if (typeof document !== 'undefined') document.documentElement.lang = current === 'va' ? 'ca-ES-valencia' : 'es';
}

/** Traduce una clave con interpolación simple: t('msg.yourTurn', { name: 'Ada' }). */
export function t(key, params) {
  const text = STRINGS[current][key] ?? STRINGS.es[key] ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '') : text;
}

/** Traduce los nodos estáticos del HTML marcados con data-i18n / data-i18n-title / data-i18n-aria. */
export function translateDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}
