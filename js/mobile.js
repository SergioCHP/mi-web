/* =========================================================
   mobile.js — Mejoras móviles compartidas (vanilla, sin dependencias)
   1) Menú hamburguesa accesible para .nav-links / .nav-links-games
      (el botón se inyecta aquí: no hay que tocar el HTML de la navbar)
   2) Dock de anime: centra la miniatura activa cuando hay scroll lateral
   Cargar al final del <body> en index, juegos, cine, anime y libros.
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const NAV_BP = window.matchMedia("(max-width: 860px)"); // = breakpoint de mobile.css
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // libros.html usa lang="ca-ES-valencia"; el resto "va"
  const isVa = () => {
    const l = (root.getAttribute("lang") || "es").toLowerCase();
    return l === "va" || l.startsWith("ca");
  };

  const onMediaChange = (mq, fn) => {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn); // Safari < 14
  };

  /* -------------------------------------------------------
     1) MENÚ MÓVIL
     ------------------------------------------------------- */
  function initNav() {
    const wrapper = document.querySelector(".navbar-wrapper");
    const navbar = wrapper && wrapper.querySelector(".navbar");
    const menu = navbar && navbar.querySelector(".nav-links, .nav-links-games");
    if (!menu || navbar.querySelector(".nav-toggle")) return;

    if (!menu.id) menu.id = "navMenu";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span class="nav-toggle__bars" aria-hidden="true"></span>';
    navbar.appendChild(toggle);
    wrapper.classList.add("has-nav-toggle"); // activa el panel en mobile.css

    let open = false;

    function sync() {
      const va = isVa();
      const label = open
        ? va ? "Tancar el menú" : "Cerrar el menú"
        : va ? "Obrir el menú" : "Abrir el menú";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      wrapper.classList.toggle("is-nav-open", open);
    }

    function setOpen(next) {
      if (open === next) return;
      open = next;
      sync();
    }

    toggle.addEventListener("click", (e) => {
      setOpen(!open);
      // Activado con teclado (detail === 0): llevar el foco al primer enlace
      if (open && e.detail === 0) {
        const first = menu.querySelector("a");
        if (first) first.focus();
      }
    });

    // Elegir un enlace cierra el panel (en index, antes del scroll suave)
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    // Toque fuera de la navbar
    document.addEventListener("click", (e) => {
      if (open && !navbar.contains(e.target)) setOpen(false);
    });

    // Escape devuelve el foco al botón
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Tabular fuera del menú lo cierra
    navbar.addEventListener("focusout", (e) => {
      if (open && e.relatedTarget && !navbar.contains(e.relatedTarget)) setOpen(false);
    });

    // Al pasar a escritorio el panel deja de existir
    onMediaChange(NAV_BP, () => {
      if (!NAV_BP.matches) setOpen(false);
    });

    // Todas las páginas cambian <html lang> al pulsar VA / ES
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["lang"] });

    sync();
  }

  /* -------------------------------------------------------
     2) DOCK DE ANIME: miniatura activa siempre visible
     ------------------------------------------------------- */
  function initDock() {
    const dock = document.getElementById("dockContainer");
    if (!dock) return;

    let raf = 0;

    function centerSelected() {
      raf = 0;
      if (dock.scrollWidth <= dock.clientWidth + 1) return; // cabe entero: nada que hacer
      const sel = dock.querySelector(".is-selected");
      if (!sel) return;
      const s = sel.getBoundingClientRect();
      const c = dock.getBoundingClientRect();
      const delta = s.left + s.width / 2 - (c.left + c.width / 2);
      if (Math.abs(delta) < 2) return;
      dock.scrollBy({ left: delta, behavior: REDUCED ? "auto" : "smooth" });
    }

    // anime.html alterna .is-selected en selectAnime(): se reacciona a ese cambio
    new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(centerSelected);
    }).observe(dock, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  /* -------------------------------------------------------
     3) ANIME: fondo desenfocado del póster (relleno lateral)
     ------------------------------------------------------- */
  function initPosterFill() {
    const img = document.getElementById("mainPoster");
    const box = img && img.closest(".showcase-poster");
    if (!box) return;

    const update = () => {
      const src = img.getAttribute("src");
      if (src) box.style.setProperty("--poster-img", "url(" + JSON.stringify(src) + ")");
    };

    // renderAnime() cambia el src al seleccionar otra obra
    new MutationObserver(update).observe(img, { attributes: true, attributeFilter: ["src"] });
    update();
  }

  function init() {
    initNav();
    initDock();
    initPosterFill();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
