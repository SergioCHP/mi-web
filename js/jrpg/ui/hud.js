/**
 * hud.js — Interfaz DOM: menú de comandos, submenú de Magia, filas del grupo y mensajes.
 *
 * Se usa DOM (y no canvas) para el HUD porque da texto nítido, foco de teclado, lectores de
 * pantalla y botones reales gratis. Para no provocar "layout thrashing", las barras se mueven
 * con `transform: scaleX()` (solo composición) y únicamente cuando el valor cambia.
 */
import { t } from '../data/i18n.js';
import { STATUSES } from '../data/statuses.js';
import { ICON_COLORS } from '../render/icons.js';

const MESSAGE_TIME = 1500;

export class Hud {
  constructor(root) {
    this.root = root;
    this.cmdRoot = root.querySelector('#cmdRoot');
    this.cmdSub = root.querySelector('#cmdSub');
    this.cmdIdle = root.querySelector('#cmdIdle');
    this.party = root.querySelector('#partyStatus');
    this.message = root.querySelector('#battleMessage');
    this.hint = root.querySelector('#targetHint');
    this.template = root.querySelector('#tplPartyRow');
    this.rows = new Map();
    this.offs = [];
    this.msgTimer = 0;
    this.mode = 'idle'; // idle | root | sub | target
  }

  /** Conecta el HUD a una batalla nueva (se llama también al reintentar). */
  bind(battle, events) {
    this.unbind();
    this.battle = battle;
    this.events = events;
    this.#buildParty();
    this.#showIdle();

    const on = (type, fn) => this.offs.push(events.on(type, fn));
    on('command:open', ({ hero }) => this.#openRoot(hero));
    on('command:close', () => this.#showIdle());
    on('target:start', ({ skill }) => this.#showTargeting(skill));
    on('target:end', ({ cancelled, skill, hero }) => {
      this.hint.hidden = true;
      if (!cancelled) return;
      const fromSpells = hero.template.spells?.includes(skill.id);
      if (fromSpells) this.#openSpells(hero);
      else this.#openRoot(hero);
    });
    on('message', ({ key, sticky }) => this.say(t(key), sticky));
    on('limit:ready', ({ unit }) => this.say(t('msg.limitReady', { name: t(unit.nameKey) })));
    on('status:add', () => this.#refreshChips());
    on('status:remove', () => this.#refreshChips());
    on('ko', () => this.#refreshChips());
  }

  unbind() {
    this.offs.forEach((off) => off());
    this.offs = [];
  }

  say(text, sticky = false) {
    this.message.textContent = text;
    this.message.classList.add('is-visible');
    clearTimeout(this.msgTimer);
    if (!sticky) this.msgTimer = setTimeout(() => this.message.classList.remove('is-visible'), MESSAGE_TIME);
  }

  /** Llamado cada frame: sincroniza barras y estados con el modelo (solo si cambian). */
  update() {
    if (!this.battle) return;
    for (const [unit, row] of this.rows) {
      setScale(row.hp, unit.hp / unit.maxHp, row, 'hp');
      setScale(row.ghost, unit.hp / unit.maxHp, row, 'ghost');
      setScale(row.mp, unit.maxMp ? unit.mp / unit.maxMp : 0, row, 'mp');
      setScale(row.atb, unit.atb, row, 'atb');
      setScale(row.limit, unit.limit, row, 'limit');
      setText(row.hpText, `${unit.hp}/${unit.maxHp}`, row, 'hpText');
      setText(row.mpText, `${unit.mp}/${unit.maxMp}`, row, 'mpText');
      row.el.classList.toggle('is-ready', unit.atbFull && unit.alive);
      row.el.classList.toggle('is-limit', unit.limitReady && unit.alive);
      row.el.classList.toggle('is-ko', !unit.alive);
      row.el.classList.toggle('is-low', unit.alive && unit.hp / unit.maxHp < 0.3);
      row.el.classList.toggle('is-active', this.battle.menuHero === unit);
    }
  }

  // ─────────────────────────────── Grupo ───────────────────────────────

  #buildParty() {
    this.party.replaceChildren();
    this.rows.clear();
    for (const hero of this.battle.heroes) {
      const el = this.template.content.firstElementChild.cloneNode(true);
      const img = el.querySelector('.status-portrait');
      img.src = hero.template.portrait;
      img.alt = t(hero.nameKey);
      if (hero.template.portraitFilter) img.style.filter = hero.template.portraitFilter;
      el.querySelector('.js-name').textContent = t(hero.nameKey);
      el.querySelector('.atb-label').textContent = 'ATB';
      el.querySelector('.limit-label').textContent = t('cmd.limit');
      // Clic en la fila de otro héroe listo → cederle el menú
      el.addEventListener('click', () => {
        if (this.battle.inputQueue.includes(hero) && this.battle.menuHero !== hero) this.battle.cycleHero();
      });
      this.party.append(el);
      this.rows.set(hero, {
        el,
        hp: el.querySelector('.hp-fill'),
        ghost: el.querySelector('.bar-ghost'),
        mp: el.querySelector('.mp-fill'),
        atb: el.querySelector('.atb-fill'),
        limit: el.querySelector('.limit-fill'),
        hpText: el.querySelector('.js-hp'),
        mpText: el.querySelector('.js-mp'),
        chips: el.querySelector('.status-chips'),
        cache: {},
      });
    }
  }

  #refreshChips() {
    for (const [unit, row] of this.rows) {
      const signature = [...unit.statuses.keys()].join();
      if (row.cache.chips === signature) continue;
      row.cache.chips = signature;
      row.chips.replaceChildren(
        ...[...unit.statuses.keys()].map((id) => {
          const chip = document.createElement('span');
          chip.className = 'status-chip';
          chip.style.setProperty('--chip', STATUSES[id].color);
          chip.textContent = STATUSES[id].short;
          chip.title = t(STATUSES[id].nameKey);
          return chip;
        }),
      );
    }
  }

  // ─────────────────────────────── Menús ───────────────────────────────

  #showIdle() {
    this.mode = 'idle';
    this.cmdRoot.replaceChildren();
    this.cmdSub.replaceChildren();
    this.cmdRoot.hidden = true;
    this.cmdSub.hidden = true;
    this.cmdIdle.hidden = false;
    this.hint.hidden = true;
  }

  #openRoot(hero) {
    this.mode = 'root';
    this.hero = hero;
    this.cmdIdle.hidden = true;
    this.cmdSub.hidden = true;
    this.cmdRoot.hidden = false;
    this.cmdRoot.replaceChildren(
      ...this.battle.commandsFor(hero).map((cmd) =>
        this.#button(t(cmd.labelKey) + (cmd.submenu ? ' ▸' : ''), {
          disabled: !cmd.enabled,
          className: cmd.highlight ? 'cmd-btn--limit' : '',
          onClick: () => (cmd.submenu ? this.#openSpells(hero) : this.battle.selectSkill(cmd.skillId)),
          data: { cmd: cmd.id },
        }),
      ),
    );
    this.say(t('msg.yourTurn', { name: t(hero.nameKey) }));
    this.#focusFirst(this.cmdRoot);
  }

  #openSpells(hero) {
    this.mode = 'sub';
    this.cmdIdle.hidden = true;
    this.cmdRoot.hidden = true;
    this.cmdSub.hidden = false;
    const back = this.#button(t('ui.back'), { className: 'cmd-btn--back', onClick: () => this.#openRoot(hero) });
    const spells = this.battle.spellsFor(hero).map((s) => {
      const btn = this.#button('', {
        disabled: !s.enabled,
        onClick: () => this.battle.selectSkill(s.skillId),
        data: { cmd: s.id },
      });
      const dot = document.createElement('span');
      dot.className = 'cmd-elem';
      dot.style.setProperty('--elem', ICON_COLORS[s.element] ?? '#7dffb2');
      const label = document.createElement('span');
      label.textContent = t(s.labelKey);
      const cost = document.createElement('span');
      cost.className = 'cmd-cost';
      cost.textContent = `${s.mp} MP`;
      btn.append(dot, label, cost);
      return btn;
    });
    this.cmdSub.replaceChildren(...spells, back);
    this.#focusFirst(this.cmdSub);
  }

  #showTargeting(skill) {
    this.mode = 'target';
    this.cmdRoot.hidden = true;
    this.cmdSub.hidden = false;
    const title = document.createElement('p');
    title.className = 'cmd-title';
    title.textContent = t(skill.nameKey);
    const back = this.#button(t('ui.back'), { className: 'cmd-btn--back', onClick: () => this.battle.cancelTarget() });
    this.cmdSub.replaceChildren(title, back);
    this.hint.textContent = t(skill.target === 'ally' ? 'ui.chooseAlly' : 'ui.chooseTarget');
    this.hint.hidden = false;
    // El foco pasa al escenario: Enter confirma el objetivo en lugar de pulsar "Volver".
    this.root.querySelector('#arena').focus({ preventScroll: true });
  }

  #button(text, { disabled = false, className = '', onClick, data = {} }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cmd-btn active ${className}`.trim();
    btn.textContent = text;
    btn.disabled = disabled;
    btn.setAttribute('role', 'menuitem');
    Object.assign(btn.dataset, data);
    btn.addEventListener('click', onClick);
    return btn;
  }

  #focusFirst(list) {
    const first = list.querySelector('.cmd-btn:not(:disabled)');
    first?.focus({ preventScroll: true });
  }

  /** Navegación con flechas dentro del menú visible (roving focus). Devuelve true si la consumió. */
  handleKey(event) {
    if (this.mode !== 'root' && this.mode !== 'sub') return false;
    const list = this.mode === 'root' ? this.cmdRoot : this.cmdSub;
    const buttons = [...list.querySelectorAll('.cmd-btn:not(:disabled)')];
    if (!buttons.length) return false;
    const index = buttons.indexOf(document.activeElement);
    const key = event.key;
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      buttons[(index + 1 + buttons.length) % buttons.length].focus();
      return true;
    }
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      buttons[(index - 1 + buttons.length) % buttons.length].focus();
      return true;
    }
    if (key === 'ArrowRight' && document.activeElement?.dataset.cmd === 'magic') {
      document.activeElement.click();
      return true;
    }
    if ((key === 'Escape' || key === 'Backspace' || key === 'ArrowLeft' || key === 'x' || key === 'X') && this.mode === 'sub') {
      this.#openRoot(this.hero);
      return true;
    }
    if (index < 0 && (key === 'Enter' || key === ' ')) {
      buttons[0].focus();
      return true;
    }
    return false;
  }
}

function setScale(el, value, row, key) {
  const v = Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
  if (row.cache[key] === v) return;
  row.cache[key] = v;
  el.style.transform = `scaleX(${v})`;
}

function setText(el, text, row, key) {
  if (row.cache[key] === text) return;
  row.cache[key] = text;
  el.textContent = text;
}
