/**
 * main.js — Punto de entrada del minijuego JRPG (minijuego.html).
 *
 * Arquitectura (capas, de dentro afuera):
 *
 *   core/     bucle, FSM, corrutinas, eventos, utilidades      ← sin DOM
 *   data/     unidades, habilidades, estados, sprites, textos  ← datos puros
 *   battle/   reglas: ATB, cola, daño, estados, Límite         ← sin DOM ni canvas
 *   render/   cámara, parallax, sprites, partículas, post-FX   ← canvas
 *   ui/       HUD DOM accesible + teclado/puntero               ← DOM
 *
 * La lógica habla con la vista solo por dos vías: eventos (hechos ya ocurridos) y el
 * Presenter (peticiones de coreografía). Por eso tools/simulate.mjs ejecuta la misma
 * batalla en Node, sin navegador.
 */
import { CONFIG } from './config.js';
import { GameLoop } from './core/game-loop.js';
import { Scheduler } from './core/scheduler.js';
import { EventBus } from './core/events.js';
import { Rng } from './core/utils.js';
import { BattleSystem } from './battle/battle-system.js';
import { UNITS, AI } from './data/units.js';
import { SKILLS } from './data/skills.js';
import { SHEETS, ANIMATIONS } from './data/sprites.js';
import { getLang, setLang, t, translateDom } from './data/i18n.js';
import { SpriteSheet, loadImage } from './render/sprite.js';
import { Camera } from './render/camera.js';
import { ParticleSystem, FloatingTexts } from './render/particles.js';
import { EffectLayer } from './render/effects.js';
import { PostFX } from './render/postfx.js';
import { createStage } from './render/background.js';
import { Renderer } from './render/renderer.js';
import { Director } from './render/director.js';
import { Hud } from './ui/hud.js';
import { Input } from './ui/input.js';

const $ = (sel) => document.querySelector(sel);

async function loadSheets() {
  const entries = await Promise.allSettled(
    Object.entries(SHEETS).map(async ([name, meta]) => [name, new SpriteSheet(await loadImage(meta.src), meta)]),
  );
  const sheets = new Map();
  for (const entry of entries) {
    if (entry.status === 'fulfilled') sheets.set(...entry.value);
    else console.warn('[JRPG]', entry.reason.message);
  }
  return sheets;
}

/** Imágenes de los escenarios pintados (solo se descarga el del escenario activo). */
const STAGE_IMAGES = {
  dungeon: { dungeon: 'assets/combat/fondo_mazmorra.webp' },
  // highway: { highwayFar: 'assets/combat/autopista_far.webp', highwayMid: 'assets/combat/autopista_mid.webp', highwayFloor: 'assets/combat/autopista_floor.webp' },
};

async function loadStageImages(stage) {
  const entries = Object.entries(STAGE_IMAGES[stage] ?? {});
  const loaded = await Promise.all(entries.map(([key, src]) => loadImage(src).then((img) => [key, img]).catch(() => [key, null])));
  return Object.fromEntries(loaded);
}

function readCrtPreference() {
  try {
    const saved = localStorage.getItem('jrpg-crt');
    return saved === null ? CONFIG.fx.crt : saved === '1';
  } catch {
    return CONFIG.fx.crt;
  }
}

async function boot() {
  setLang(getLang());
  translateDom();
  document.documentElement.classList.add('jrpg-loading');

  const root = $('#jrpg');
  const canvas = $('#battleCanvas');
  const overlay = $('#introOverlay');
  const startBtn = $('#btnStartGame');
  const goTo = (url) => {
    window.location.href = url;
  };
  // "Saltar" son enlaces normales (funcionan incluso si este módulo no llega a cargar)
  for (const link of document.querySelectorAll('#btnIntroSkip, #btnQuickSkip')) link.href = CONFIG.flow.skipRedirect;

  // Fuente del canvas = fuente display del sitio (variable CSS --font-display)
  const font = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || '"Chakra Petch", sans-serif';
  const [sheets, stageImages] = await Promise.all([
    loadSheets(),
    loadStageImages(CONFIG.stage),
    document.fonts?.load(`700 16px ${font}`).catch(() => null),
  ]);

  if (!sheets.has('heroe_idle') || !sheets.has('monstruo_idle')) {
    $('#introText').textContent = 'No se pudieron cargar los sprites. Puedes saltar el combate.';
    startBtn.disabled = true;
    return;
  }

  // ── Sistemas persistentes (sobreviven a "Reintentar") ──
  const camera = new Camera({ shakeScale: CONFIG.fx.shakeScale, swayScale: CONFIG.fx.reducedMotion ? 0.3 : 1 });
  const particles = new ParticleSystem(CONFIG.fx.maxParticles);
  const texts = new FloatingTexts(font);
  const effects = new EffectLayer();
  const post = new PostFX({ crt: readCrtPreference(), vignette: CONFIG.fx.vignette, flashScale: CONFIG.fx.flashScale, font });
  const stage = createStage(CONFIG.stage, stageImages);
  const renderer = new Renderer({ canvas, config: CONFIG, camera, stage, particles, texts, effects, post, font });
  const scheduler = new Scheduler();
  const hud = new Hud(root);
  const input = new Input({ canvas, hud, renderer });

  let battle = null;
  let director = null;

  const loop = new GameLoop({
    step: CONFIG.step,
    update: (dt) => {
      battle?.update(dt);
      scheduler.update(dt);
      director?.update(dt);
    },
    render: (dtGame, dtReal) => {
      director?.renderUpdate(dtGame, dtReal);
      hud.update();
      if (CONFIG.debug && battle) {
        const info = battle.debugInfo();
        renderer.debugLines = [
          `FSM  ${info.state ?? '—'}`,
          `cola [${info.queue.join(', ')}]`,
          `menú ${info.menu} · espera [${info.input.join(', ')}]`,
          `corrutinas ${info.tasks} · partículas ${particles.count}`,
          `${loop.fps.toFixed(0)} fps · ATB ${CONFIG.atb.mode} · semilla ${battle.rng.seed}`,
        ];
      }
      renderer.render(dtGame, dtReal);
    },
  });

  /** Crea (o recrea) una batalla completa con su dirección de escena. */
  function createBattle() {
    director?.detach();
    scheduler.clear();
    particles.clear();
    texts.clear();
    effects.clear();
    Object.assign(post.state, { darken: 0, letterbox: 0, desaturate: 0, fade: 0 });
    camera.trauma = 0;
    camera.reset();
    camera.snap();

    const events = new EventBus();
    director = new Director({ events, scheduler, renderer, camera, particles, texts, effects, post, loop, sheets, animations: ANIMATIONS, config: CONFIG });
    battle = new BattleSystem({
      encounter: CONFIG.encounter,
      units: UNITS,
      ai: AI,
      skills: SKILLS,
      config: CONFIG,
      presenter: director,
      events,
      scheduler,
      rng: new Rng(CONFIG.seed),
    });
    director.attach(battle);
    hud.bind(battle, events);
    input.bind(battle, director);

    events.on('error', ({ err }) => console.error('[JRPG] Error en una acción', err));
    events.on('battle:end', ({ result }) => {
      if (result === 'victory') {
        scheduler.start(function* () {
          yield CONFIG.flow.redirectDelay;
          goTo(CONFIG.flow.victoryRedirect);
        });
      } else {
        showDefeat();
      }
    });
  }

  function showDefeat() {
    $('#introTitle').textContent = t('ui.defeatTitle');
    $('#introText').textContent = t('ui.defeatText');
    startBtn.textContent = t('ui.retry');
    startBtn.dataset.mode = 'retry';
    overlay.classList.remove('hidden');
    startBtn.focus({ preventScroll: true });
  }

  startBtn.addEventListener('click', () => {
    if (startBtn.dataset.mode === 'retry') createBattle();
    overlay.classList.add('hidden');
    hud.say(t('msg.start'));
    battle.start();
  });

  // Conmutador del filtro CRT (se recuerda entre visitas)
  const fxBtn = $('#btnFx');
  const syncFx = () => fxBtn.setAttribute('aria-pressed', String(post.crt));
  syncFx();
  fxBtn.addEventListener('click', () => {
    post.crt = !post.crt;
    syncFx();
    try {
      localStorage.setItem('jrpg-crt', post.crt ? '1' : '0');
    } catch {
      /* sin almacenamiento: solo dura esta visita */
    }
  });

  createBattle();
  loop.start(); // el escenario ya se ve vivo detrás del cartel de inicio
  document.documentElement.classList.remove('jrpg-loading');
  startBtn.disabled = false;
  startBtn.focus({ preventScroll: true });

  // Acceso para depurar desde la consola: window.__jrpg.battle.debugInfo()
  if (CONFIG.debug) window.__jrpg = { get battle() { return battle; }, loop, camera, post, renderer };
}

boot().catch((err) => {
  console.error('[JRPG] Error al iniciar', err);
  const text = document.querySelector('#introText');
  if (text) text.textContent = 'Error al iniciar el combate. Puedes saltarlo.';
});
