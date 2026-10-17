/* =========================================================
   particles.js — Fondo de partículas con el color de acento
   Componente compartido por juegos, cine y anime
   (antes estaba copiado en las tres páginas).
   Necesita en el HTML: <canvas id="particles-canvas" aria-hidden="true">
   - Se pausa con la pestaña oculta (no gasta batería).
   - Respeta prefers-reduced-motion (dibuja un fotograma fijo).
   - Lee el color de acento solo cuando cambia, no en cada fotograma.
   - Menos partículas en móvil y la animación empieza tras la carga.
   ========================================================= */
(function () {
  "use strict";

  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Densidad según el tamaño de pantalla: 130 en escritorio, ~40 en móvil
  const MAX = 130;
  const count = () => Math.max(30, Math.min(MAX, Math.round((window.innerWidth * window.innerHeight) / 9000)));

  let width = 0;
  let height = 0;
  let particles = [];
  let color = "#ff2e97";
  let raf = 0;

  function readColor() {
    color = getComputedStyle(root).getPropertyValue("--accent").trim() || "#ff2e97";
  }

  function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = Array.from({ length: count() }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.45 + 0.35
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;

    for (const p of particles) {
      if (!REDUCED) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (REDUCED) { draw(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // La barra de direcciones del móvil cambia la altura al hacer scroll:
  // solo se regeneran las partículas si cambia el ANCHO (evita el salto del fondo).
  window.addEventListener("resize", () => {
    if (window.innerWidth !== width) init();
    else height = canvas.height = window.innerHeight;
    if (REDUCED) draw();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // El acento o el tema cambian → nuevo color
  new MutationObserver(() => {
    readColor();
    if (REDUCED) draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-accent", "data-theme"] });

  readColor();
  init();
  // La animación arranca cuando la página ya ha cargado: el fondo no compite
  // con las portadas y el texto por el procesador (mejor LCP en móvil)
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
