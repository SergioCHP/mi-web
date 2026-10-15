/**
 * director.js — Implementación visual del Presenter: la "dirección de escena".
 *
 * Traduce peticiones de la lógica ("acércate", "lanza Piro", "cae K.O.") en tweens,
 * animaciones de sprites, partículas, cámara y post-procesado. También reacciona a los
 * hechos del bus de eventos (daño, curas, estados) con números flotantes y sacudidas.
 *
 * Los métodos generadores se ejecutan dentro de la corrutina de la habilidad, así que su
 * duración marca el ritmo del combate; todo corre en tiempo de juego (respeta hit-stop).
 */
import { Presenter } from '../battle/presenter.js';
import { CombatantView } from './combatant-view.js';
import { Slash, ClawMarks, Bolt, Projectile, MagicCircle, LightColumn, ShieldBubble } from './effects.js';
import { Shape } from './particles.js';
import { Ease, clamp, damp } from '../core/utils.js';
import { STATUSES } from '../data/statuses.js';
import { t } from '../data/i18n.js';

/** Posiciones de formación (pies) por bando y número de miembros. */
const FORMATIONS = {
  heroes: {
    1: [[-180, 98]],
    2: [[-165, 74], [-215, 130]],
    3: [[-132, 52], [-188, 98], [-244, 144]],
  },
  enemies: {
    1: [[175, 96]],
    2: [[150, 70], [218, 128]],
    3: [[132, 52], [190, 98], [248, 144]],
  },
};

const COLORS = {
  fire: '#ff7a2f',
  fireCore: '#ffe2a8',
  thunder: '#ffe45c',
  cure: '#7dffb2',
  haste: '#ffd23f',
  barrier: '#59c3ff',
  slash: '#7fe3ff',
  claw: '#ff3b5c',
  poison: '#8cff5a',
  limit: '#ff2e97',
};

const rand = (a, b) => a + Math.random() * (b - a);

export class Director extends Presenter {
  constructor({ events, scheduler, renderer, camera, particles, texts, effects, post, loop, sheets, animations, config }) {
    super();
    Object.assign(this, { events, scheduler, renderer, camera, particles, texts, effects, post, loop, sheets, animations, config });
    this.views = new Map();
    this.offs = [];
    this.pixelCache = new Map();
  }

  // ───────────────────────────── Montaje ─────────────────────────────

  attach(battle) {
    this.battle = battle;
    this.views.clear();
    for (const team of ['heroes', 'enemies']) {
      const units = battle[team];
      const slots = FORMATIONS[team][units.length];
      units.forEach((unit, i) => {
        const [x, y] = slots[i];
        const clips = this.animations[unit.template.sprite].clips;
        const home = { x: x * this.renderer.formationScale, y };
        const view = new CombatantView(unit, { clips, sheets: this.sheets, home, flip: team === 'enemies' });
        view.baseX = x;
        view.label = t(unit.nameKey);
        this.views.set(unit, view);
      });
    }
    this.renderer.setViews([...this.views.values()]);
    this.renderer.onResize = () => this.relayout();

    const on = (type, fn) => this.offs.push(this.events.on(type, fn));
    on('damage', (e) => this.#onDamage(e));
    on('heal', (e) => this.#onHeal(e));
    on('status:add', (e) => this.#onStatus(e));
    on('target:start', (e) => this.#setTargeted(e.target));
    on('target:change', (e) => this.#setTargeted(e.target));
    on('target:end', () => this.#setTargeted(null));
    on('limit:ready', ({ unit }) => this.#burstAt(this.view(unit).chest(), COLORS.limit, 26));
  }

  detach() {
    this.offs.forEach((off) => off());
    this.offs = [];
  }

  view(unit) {
    return this.views.get(unit);
  }

  /** Al girar el móvil o redimensionar: recoloca la formación (compacta en vertical). */
  relayout() {
    for (const v of this.views.values()) {
      const x = v.baseX * this.renderer.formationScale;
      if (Math.abs(v.x - v.home.x) < 1) v.x = x; // solo si está en su sitio (no en mitad de un ataque)
      v.home.x = x;
    }
  }

  /** Paso fijo (tiempo de juego): sprites sincronizados con las corrutinas. */
  update(dt) {
    for (const v of this.views.values()) {
      v.update(dt);
      // Aura rosa palpitante mientras el Límite está listo (si no hay otra aura activa).
      if (!v.auraLocked) {
        const target = v.unit.limitReady && v.unit.alive ? 0.5 + 0.2 * Math.sin(v.time * 4) : 0;
        v.auraColor = COLORS.limit;
        v.aura = damp(v.aura, target, 8, dt);
      }
    }
  }

  /** Una vez por frame: sistemas puramente visuales. */
  renderUpdate(dtGame, dtReal) {
    this.particles.update(dtGame);
    this.effects.update(dtGame);
    this.texts.update(dtGame);
    this.camera.update(dtReal);
    this.post.update(dtReal);
  }

  // ───────────────────────────── Presenter ─────────────────────────────

  *intro() {
    const views = [...this.views.values()];
    for (const v of views) {
      v.x = v.home.x + (v.unit.isHero ? -260 : 260);
      v.alpha = 0;
    }
    this.camera.focus(this.camera.home.x, this.camera.home.y - 10, 1.28, 99);
    this.camera.snap();
    this.camera.reset(2.2);
    this.post.flash('#ffffff', 0.75, 0.45);
    this.post.banner(t('ui.encounter'), { style: 'title', duration: 1.3 });
    views.forEach((v, i) => {
      this.scheduler.tween(v, { x: v.home.x, alpha: 1 }, 0.7, Ease.outCubic, { delay: 0.1 + i * 0.08 });
    });
    yield 1.15;
  }

  *approach(actor, target) {
    const v = this.view(actor);
    const tv = this.view(target);
    const dir = v.home.x < tv.x ? -1 : 1;
    const gap = tv.bodyWidth * 0.5 + v.bodyWidth * 0.45 + 6;
    const spot = { x: tv.x + dir * gap, y: tv.y + 1 };

    this.camera.focus((v.x + tv.x) / 2, tv.y - 50, 1.12, 4);
    this.#dust(v.x, v.y, -dir);
    v.ghosting = actor.isHero;
    const tw = this.scheduler.tween(v, { x: spot.x, y: spot.y }, 0.26, Ease.inOutQuad, {
      onUpdate: (_, k) => (v.lift = Math.sin(Math.PI * k) * 10),
    });
    yield tw;
    v.lift = 0;
    v.ghosting = false;
    v.squash = 0.5;
  }

  *retreat(actor) {
    const v = this.view(actor);
    if (!actor.alive) return;
    this.camera.reset(3.5);
    const tw = this.scheduler.tween(v, { x: v.home.x, y: v.home.y }, 0.3, Ease.inOutQuad, {
      onUpdate: (_, k) => (v.lift = Math.sin(Math.PI * k) * 22),
    });
    yield tw;
    v.lift = 0;
    v.squash = 0.6;
    this.#dust(v.x, v.y, 0);
  }

  playAnim(actor, clip, opts) {
    return this.view(actor).play(clip, opts);
  }

  *cast(actor, element) {
    const v = this.view(actor);
    const color = COLORS[element] ?? COLORS.barrier;
    v.play('cast');
    v.auraLocked = true;
    v.auraColor = color;
    this.scheduler.tween(v, { aura: 1 }, 0.2);
    this.effects.add(new MagicCircle({ x: v.x, y: v.y, radius: v.bodyWidth * 1.15, color, life: 0.95 }));
    this.camera.focus(v.x + (actor.isHero ? 40 : -40), v.y - 50, 1.1, 3);

    // Orbes que convergen en el pecho del lanzador
    const c = v.chest();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const r = rand(46, 70);
      const life = rand(0.42, 0.55);
      this.particles.spawn({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.8, vx: (-Math.cos(a) * r) / life, vy: (-Math.sin(a) * r * 0.8) / life, life, size: rand(2.5, 4.5), sizeEnd: 1, color: i % 3 ? color : '#ffffff', shape: Shape.GLOW, alpha: 0.9, alphaEnd: 0.6 });
    }
    yield 0.5;
    this.particles.burst({ x: c.x, y: c.y, count: 16, speed: [40, 120], life: [0.25, 0.45], colors: [color, '#ffffff'], shape: Shape.GLOW, size: 4, sizeEnd: 0 });
    this.post.flash(color, 0.18, 0.25);
    this.scheduler.tween(v, { aura: 0 }, 0.3);
    this.scheduler.start(function* () {
      yield 0.3;
      v.auraLocked = false;
    });
    yield 0.12;
  }

  *spell(element, actor, target) {
    const v = this.view(actor);
    const tv = this.view(target);
    const at = tv.chest();
    this.camera.focus((v.x + tv.x) / 2, at.y, 1.08, 3);

    switch (element) {
      case 'fire': {
        const p = this.effects.add(new Projectile({ from: v.chest(), to: at, duration: 0.34, color: COLORS.fire, core: COLORS.fireCore, particles: this.particles }));
        yield () => p.life <= 0;
        this.particles.burst({ x: at.x, y: at.y, count: 46, speed: [60, 220], life: [0.35, 0.8], colors: [COLORS.fire, COLORS.fireCore, '#ff3b1f'], shape: Shape.GLOW, size: 6, sizeEnd: 1, drag: 3, ay: -60 });
        this.particles.spawn({ x: at.x, y: at.y + 20, life: 0.45, size: 12, sizeEnd: 80, color: COLORS.fire, shape: Shape.RING, alpha: 0.9 });
        this.particles.burst({ x: at.x, y: at.y, count: 14, speed: [20, 60], life: [0.8, 1.3], colors: ['#2a1a18', '#3a2420'], shape: Shape.PIXEL, size: 5, sizeEnd: 9, ay: -40, additive: false, alpha: 0.7 });
        this.post.flash(COLORS.fire, 0.28, 0.3);
        this.camera.addTrauma(0.4);
        break;
      }
      case 'thunder': {
        this.particles.burst({ x: at.x, y: at.y - 30, count: 10, speed: [20, 60], life: [0.15, 0.25], colors: [COLORS.thunder], shape: Shape.SPARK, size: 3 });
        yield 0.12;
        const top = this.camera.viewY - this.renderer.halfH - 40;
        this.effects.add(new Bolt({ x0: at.x + rand(-30, 30), y0: top, x1: at.x, y1: at.y + 10, color: COLORS.thunder, life: 0.45, width: 3.4, jitter: 34 }));
        this.effects.add(new Bolt({ x0: at.x + rand(-60, 60), y0: top, x1: at.x + rand(-8, 8), y1: at.y, color: '#bfe9ff', life: 0.3, width: 2, jitter: 26 }));
        this.particles.burst({ x: at.x, y: at.y, count: 34, speed: [120, 320], life: [0.15, 0.4], colors: [COLORS.thunder, '#ffffff', '#bfe9ff'], shape: Shape.SPARK, size: 4, drag: 4 });
        this.post.flash('#ffffff', 0.55, 0.22);
        this.camera.addTrauma(0.55);
        break;
      }
      case 'cure': {
        this.effects.add(new LightColumn({ x: tv.x, y: tv.y, width: tv.bodyWidth * 1.3, height: tv.bodyHeight * 1.6, color: COLORS.cure }));
        for (let i = 0; i < 26; i++) {
          this.particles.spawn({ x: tv.x + rand(-28, 28), y: tv.y - rand(0, 30), vy: -rand(40, 110), vx: rand(-10, 10), life: rand(0.6, 1), size: rand(2, 4), sizeEnd: 0.5, color: i % 4 ? COLORS.cure : '#ffffff', shape: Shape.GLOW });
        }
        yield 0.3;
        break;
      }
      case 'haste': {
        for (let i = 0; i < 4; i++) {
          this.particles.spawn({ x: tv.x, y: tv.y - i * 22, vy: -60, life: 0.6 + i * 0.08, size: 14 + i * 4, sizeEnd: 40, color: COLORS.haste, shape: Shape.RING });
        }
        this.particles.burst({ x: tv.x, y: tv.y - 40, count: 20, speed: [80, 180], angle: Math.PI, spread: 0.5, life: [0.25, 0.45], colors: [COLORS.haste, '#ffffff'], shape: Shape.SPARK, size: 3 });
        yield 0.3;
        break;
      }
      case 'barrier': {
        this.effects.add(new ShieldBubble({ x: at.x, y: at.y, radius: tv.bodyHeight * 0.62, color: COLORS.barrier }));
        yield 0.28;
        break;
      }
      default:
        yield 0.2;
    }
  }

  fx(name, target, opts = {}) {
    const tv = this.view(target);
    if (!tv) return;
    const c = tv.chest();
    const fromLeft = opts.from ? this.view(opts.from).x < tv.x : true;

    switch (name) {
      case 'slash':
        this.effects.add(new Slash({ x: c.x, y: c.y, radius: tv.bodyWidth * 0.75, angle: fromLeft ? -2.2 : -0.9, sweep: 2.2, flip: !fromLeft, color: COLORS.slash }));
        this.particles.burst({ x: c.x, y: c.y, count: 18, speed: [120, 300], angle: fromLeft ? 0 : Math.PI, spread: 1.6, life: [0.12, 0.3], colors: ['#ffffff', COLORS.slash], shape: Shape.SPARK, size: 3, drag: 5 });
        break;
      case 'claw':
      case 'clawHeavy': {
        const heavy = name === 'clawHeavy';
        this.effects.add(new ClawMarks({ x: c.x, y: c.y, size: heavy ? 58 : 40, color: COLORS.claw, flip: !fromLeft }));
        if (heavy) this.effects.add(new Slash({ x: c.x, y: c.y, radius: 42, angle: -0.7, sweep: 2, flip: true, color: COLORS.claw, width: 18 }));
        this.particles.burst({ x: c.x, y: c.y, count: heavy ? 26 : 14, speed: [100, 260], angle: fromLeft ? 0 : Math.PI, spread: 1.4, life: [0.15, 0.35], colors: [COLORS.claw, '#ffffff'], shape: Shape.SPARK, size: 3, drag: 5 });
        break;
      }
      case 'bite':
        this.effects.add(new ClawMarks({ x: c.x, y: c.y, size: 30, color: COLORS.poison, flip: !fromLeft }));
        for (let i = 0; i < 12; i++) {
          this.particles.spawn({ x: c.x + rand(-12, 12), y: c.y + rand(-8, 8), vx: rand(-20, 20), vy: -rand(20, 70), life: rand(0.5, 0.9), size: rand(2.5, 4.5), sizeEnd: 1, color: COLORS.poison, shape: Shape.GLOW });
        }
        break;
      case 'defend':
        this.effects.add(new ShieldBubble({ x: c.x, y: c.y, radius: tv.bodyHeight * 0.55, color: '#c9d6e8', life: 0.6 }));
        this.texts.spawn({ text: t('skill.defend'), x: c.x, y: c.y - 30, color: '#c9d6e8', size: 15 });
        break;
      case 'limitSlash': {
        const final = Boolean(opts.final);
        const angle = rand(-2.6, -0.4);
        this.effects.add(new Slash({ x: c.x, y: c.y, radius: tv.bodyWidth * (final ? 1.3 : 0.9), angle, sweep: 2.6, width: final ? 26 : 16, color: final ? COLORS.limit : '#9ff3ff', life: final ? 0.4 : 0.22, flip: opts.index % 2 === 1 }));
        if (final) this.effects.add(new Slash({ x: c.x, y: c.y, radius: tv.bodyWidth * 1.3, angle: angle + 1.6, sweep: 2.6, width: 26, color: '#9ff3ff', life: 0.45, flip: true }));
        this.particles.burst({ x: c.x, y: c.y, count: final ? 60 : 22, speed: [140, final ? 460 : 320], life: [0.15, 0.45], colors: ['#ffffff', '#9ff3ff', COLORS.limit], shape: Shape.SPARK, size: 3.5, drag: 4 });
        this.camera.addTrauma(final ? 0.95 : 0.4);
        this.loop.hitStop(final ? 0.14 : 0.045);
        this.post.flash('#ffffff', final ? 0.85 : 0.25, final ? 0.35 : 0.12);
        break;
      }
      default:
        break;
    }
  }

  *limitIntro(actor, skill) {
    const v = this.view(actor);
    this.scheduler.tween(this.post.state, { darken: 0.78, letterbox: 1 }, 0.35, Ease.outCubic);
    this.camera.focus(v.x + 30, v.y - 50, 1.42, 6);
    v.auraLocked = true;
    v.auraColor = COLORS.limit;
    this.scheduler.tween(v, { aura: 1 }, 0.3);
    this.post.banner(t(skill.nameKey), { style: 'limit', duration: 1.5 });
    for (let i = 0; i < 16; i++) {
      for (let k = 0; k < 3; k++) {
        this.particles.spawn({ x: v.x + rand(-26, 26), y: v.y - rand(0, 10), vx: rand(-10, 10), vy: -rand(80, 170), life: rand(0.4, 0.7), size: rand(3, 6), sizeEnd: 0.5, color: k ? COLORS.limit : '#ffffff', shape: Shape.GLOW });
      }
      yield 0.05;
    }
    this.post.flash('#ffffff', 0.85, 0.3);
    this.loop.hitStop(0.08);
    this.camera.addTrauma(0.35);
    v.ghosting = true;
    yield 0.2;
  }

  *limitStrike(actor, target, index) {
    const v = this.view(actor);
    const tv = this.view(target);
    const side = index % 2 === 0 ? -1 : 1;
    const spot = { x: tv.x + side * (tv.bodyWidth * 0.55 + 16), y: tv.y + ((index % 3) - 1) * 6 + 1 };
    v.flip = side > 0; // ataca desde la derecha → mira a la izquierda
    this.camera.focus(tv.x, tv.y - 45, 1.28, 9);
    const tw = this.scheduler.tween(v, { x: spot.x, y: spot.y }, 0.09, Ease.outQuad, {
      onUpdate: (_, k) => (v.lift = Math.sin(Math.PI * k) * 34),
    });
    yield tw;
    v.lift = 0;
    const anim = v.play('limit', { speed: 2.2 });
    yield anim.hitTime;
  }

  *limitOutro(actor) {
    const v = this.view(actor);
    v.flip = !actor.isHero;
    this.scheduler.tween(this.post.state, { darken: 0, letterbox: 0 }, 0.45, Ease.inOutQuad);
    this.scheduler.tween(v, { aura: 0 }, 0.4);
    this.camera.reset(3.5);
    const tw = this.scheduler.tween(v, { x: v.home.x, y: v.home.y }, 0.35, Ease.inOutCubic, {
      onUpdate: (_, k) => (v.lift = Math.sin(Math.PI * k) * 40),
    });
    yield tw;
    v.lift = 0;
    v.ghosting = false;
    v.auraLocked = false;
    v.squash = 0.7;
    yield 0.2;
  }

  *statusTick(unit, statusId) {
    const v = this.view(unit);
    const color = STATUSES[statusId]?.color ?? COLORS.poison;
    v.flash = 0.9;
    v.flashColor = color;
    const c = v.chest();
    for (let i = 0; i < 10; i++) {
      this.particles.spawn({ x: c.x + rand(-14, 14), y: c.y + rand(-10, 10), vy: -rand(30, 70), life: rand(0.5, 0.8), size: rand(2.5, 4), sizeEnd: 1, color, shape: Shape.GLOW });
    }
    yield 0.32;
  }

  *knockOut(unit) {
    const v = this.view(unit);
    if (unit.isHero) {
      v.play('idle');
      this.scheduler.tween(v, { collapsed: 1 }, 0.4, Ease.outCubic);
      v.flashColor = '#ff3366';
      v.flash = 1;
      yield 0.45;
      return;
    }
    // Enemigo: destello blanco y se desintegra en sus propios píxeles.
    v.flash = 1;
    v.flashColor = 'white';
    yield 0.12;
    this.#disintegrate(v);
    this.post.flash('#ff2e97', 0.18, 0.3);
    this.camera.addTrauma(0.25);
    yield this.scheduler.tween(v, { dissolve: 1 }, 0.35, Ease.inQuad);
    yield 0.3;
  }

  *victory(heroes) {
    const views = heroes.map((h) => this.view(h));
    const cx = views.reduce((s, v) => s + v.x, 0) / Math.max(1, views.length);
    this.camera.focus(cx + 60, views[0]?.y - 55 || 0, 1.18, 2.5);
    this.post.banner(t('ui.victory'), { style: 'title', duration: 1.8, color: '#ffe9a8' });
    for (const v of views) {
      v.play('victory');
      // Sin hoja de victoria: dos saltitos de celebración procedurales.
      if (!v.anim.isNative('victory')) this.scheduler.start(this.#hops(v, 2));
    }
    for (let i = 0; i < 30; i++) {
      const v = views[i % views.length];
      if (!v) break;
      this.particles.spawn({ x: v.x + rand(-40, 40), y: v.y - rand(0, 80), vy: -rand(20, 60), vx: rand(-15, 15), life: rand(0.8, 1.4), size: rand(2, 3.5), sizeEnd: 0.5, color: i % 2 ? '#ffe9a8' : '#ffffff', shape: Shape.GLOW });
    }
    yield 1.6;
  }

  *defeat() {
    this.scheduler.tween(this.post.state, { desaturate: 1, darken: 0.35 }, 1.2, Ease.inOutQuad);
    this.camera.focus(this.camera.home.x, this.camera.home.y, 0.96, 1.2);
    this.post.banner(t('ui.defeat'), { style: 'title', duration: 1.8, color: '#ff8aa8' });
    yield 1.5;
  }

  // ───────────────────────── Reacciones a eventos ─────────────────────────

  #onDamage(e) {
    const v = this.view(e.target);
    if (!v) return;
    const c = v.chest();
    v.popStack = (v.popStack ?? 0) + 1;
    this.scheduler.start(function* () {
      yield 0.5;
      v.popStack = Math.max(0, v.popStack - 1);
    });
    const stackOffset = (v.popStack - 1) * 16;
    const drift = rand(-14, 14);

    if (e.kind === 'poison') {
      this.texts.spawn({ text: e.amount, x: c.x, y: c.y - 10 - stackOffset, color: COLORS.poison, size: 22, drift });
      return;
    }

    const src = e.source ? this.view(e.source) : null;
    const strength = clamp((e.amount / e.target.maxHp) * 4, 0.3, 1.6);
    v.hurt(strength, src ? src.x < v.x : !e.target.isHero);
    this.camera.addTrauma(0.14 + 0.22 * strength + (e.crit || e.tag === 'weak' ? 0.25 : 0));

    const highlight = e.crit || e.tag === 'weak';
    const color = highlight ? '#ffd23f' : e.tag === 'resist' ? '#9aa4b2' : '#ffffff';
    this.texts.spawn({ text: e.amount, x: c.x, y: c.y - 10 - stackOffset, color, size: highlight ? 34 : e.tag === 'resist' ? 22 : 27, drift });
    if (highlight) {
      this.texts.spawn({ text: t(e.tag === 'weak' ? 'pop.weak' : 'pop.crit'), x: c.x, y: c.y - 48 - stackOffset, color: '#ffd23f', size: 15, life: 0.95, rise: 30 });
      if (!e.limit) {
        this.post.flash('#ffffff', 0.32, 0.16);
        this.loop.hitStop(0.07);
      }
    } else if (e.tag === 'resist') {
      this.texts.spawn({ text: t('pop.resist'), x: c.x, y: c.y - 44 - stackOffset, color: '#9aa4b2', size: 13, life: 0.9, rise: 26 });
    }
    // Chispas de impacto genéricas
    this.particles.burst({ x: c.x, y: c.y, count: 8, speed: [80, 200], life: [0.1, 0.25], colors: ['#ffffff'], shape: Shape.SPARK, size: 2.5, drag: 6 });
  }

  #onHeal(e) {
    const v = this.view(e.target);
    const c = v.chest();
    this.texts.spawn({ text: e.amount, x: c.x, y: c.y - 10, color: COLORS.cure, size: 27 });
    v.flash = 0.6;
    v.flashColor = COLORS.cure;
  }

  #onStatus({ unit, id }) {
    const v = this.view(unit);
    const def = STATUSES[id];
    const c = v.chest();
    this.texts.spawn({ text: t(def.nameKey), x: c.x, y: c.y - 40, color: def.color, size: 15, delay: 0.15, rise: 28 });
    this.#burstAt(c, def.color, 14);
  }

  #setTargeted(unit) {
    for (const v of this.views.values()) v.targeted = v.unit === unit;
  }

  // ───────────────────────────── Ayudantes ─────────────────────────────

  *#hops(v, count) {
    for (let i = 0; i < count; i++) {
      yield this.scheduler.tween(v, { lift: 22 }, 0.18, Ease.outQuad);
      yield this.scheduler.tween(v, { lift: 0 }, 0.16, Ease.inQuad);
      v.squash = 0.6;
      yield 0.12;
    }
  }

  #burstAt(p, color, count) {
    this.particles.burst({ x: p.x, y: p.y, count, speed: [40, 130], life: [0.3, 0.6], colors: [color, '#ffffff'], shape: Shape.GLOW, size: 3.5, sizeEnd: 0.5, drag: 3 });
  }

  #dust(x, y, dir) {
    for (let i = 0; i < 7; i++) {
      this.particles.spawn({ x: x + rand(-10, 10), y: y - 2, vx: dir * rand(10, 50) + rand(-20, 20), vy: -rand(5, 25), life: rand(0.35, 0.6), size: rand(3, 5), sizeEnd: rand(7, 11), color: '#4a5a60', shape: Shape.PIXEL, additive: false, alpha: 0.45 });
    }
  }

  /**
   * Desintegración: muestrea píxeles reales del frame actual y los lanza como partículas.
   * Si el canvas está "contaminado" (abriendo el HTML con file://) usa una paleta genérica.
   */
  #disintegrate(v) {
    const sheet = v.sheet;
    const source = sheet.variant(v.tint, 0.75);
    let data = this.pixelCache.get(source);
    if (data === undefined) {
      try {
        const ctx = source.getContext ? source.getContext('2d') : null;
        if (ctx) {
          data = ctx.getImageData(0, 0, source.width, source.height);
        } else {
          const c = document.createElement('canvas');
          c.width = source.width;
          c.height = source.height;
          const g = c.getContext('2d');
          g.drawImage(source, 0, 0);
          data = g.getImageData(0, 0, c.width, c.height);
        }
      } catch {
        data = null;
      }
      this.pixelCache.set(source, data);
    }

    const fw = sheet.frameWidth;
    const fh = sheet.frameHeight;
    const frame = v.anim.frame;
    const count = 170;
    for (let i = 0; i < count; i++) {
      let px = Math.floor(Math.random() * fw);
      let py = Math.floor(Math.random() * fh);
      let color = '#ff3366';
      if (data) {
        let found = false;
        for (let tries = 0; tries < 8 && !found; tries++) {
          const idx = (py * data.width + frame * fw + px) * 4;
          if (data.data[idx + 3] > 120) {
            const q = (n) => (n & 0xf0).toString(16).padStart(2, '0');
            color = `#${q(data.data[idx])}${q(data.data[idx + 1])}${q(data.data[idx + 2])}`;
            found = true;
          } else {
            px = Math.floor(Math.random() * fw);
            py = Math.floor(Math.random() * fh);
          }
        }
        if (!found) continue;
      }
      const wx = v.x + (v.flip ? -1 : 1) * (px - sheet.anchor.x) * v.scale;
      const wy = v.y - v.elevation + (py - sheet.anchor.y) * v.scale;
      const up = (fh - py) / fh;
      this.particles.spawn({
        x: wx,
        y: wy,
        vx: rand(-30, 30) + (v.flip ? 25 : -25),
        vy: -rand(20, 90) * (0.4 + up),
        ay: -40,
        drag: 0.8,
        life: rand(0.5, 1.2) + up * 0.3,
        size: v.scale * 1.5,
        sizeEnd: v.scale * 0.6,
        color,
        shape: Shape.PIXEL,
        additive: false,
        alpha: 1,
      });
    }
    this.particles.burst({ x: v.chest().x, y: v.chest().y, count: 24, speed: [60, 200], life: [0.3, 0.6], colors: ['#ff2e97', '#ffffff'], shape: Shape.GLOW, size: 4, sizeEnd: 0 });
  }
}
