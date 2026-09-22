/* =========================================================
   script.js — Interacción, Spotlight, Tilt 3D y Controles
   ========================================================= */

(function () {
  const root = document.documentElement;
  const accentButton = document.getElementById("accentToggle");
  const themeButton = document.getElementById("themeToggle");
  const yearElement = document.getElementById("year");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  root.classList.add("js");

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Año dinámico ---------- */
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* ---------- Tema Claro / Oscuro ---------- */
  let theme = "dark";
  try {
    const savedTheme = localStorage.getItem("sergio-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      theme = savedTheme;
    } else if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      theme = "light";
    }
  } catch (e) {}
  root.setAttribute("data-theme", theme);

  const updateThemeUI = () => {
    const isLight = root.getAttribute("data-theme") === "light";
    const label = isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro";
    if (themeButton) {
      themeButton.setAttribute("aria-label", label);
      themeButton.setAttribute("title", label);
      themeButton.setAttribute("aria-pressed", String(isLight));
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", isLight ? "#f3efe4" : "#07070a");
    }
  };

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", theme);
      try {
        localStorage.setItem("sergio-theme", theme);
      } catch (e) {}
      updateThemeUI();
    });
  }

  updateThemeUI();

  /* ---------- Acento Rosa / Azul ---------- */
  let accent = "pink";
  try {
    const savedAccent = localStorage.getItem("sergio-accent");
    if (savedAccent === "blue" || savedAccent === "pink") {
      accent = savedAccent;
    }
  } catch (e) {}
  root.setAttribute("data-accent", accent);

  const updateAccentUI = () => {
    const isBlue = root.getAttribute("data-accent") === "blue";
    const label = isBlue ? "Cambiar a acento rosa" : "Cambiar a acento azul";
    if (accentButton) {
      accentButton.setAttribute("aria-label", label);
      accentButton.setAttribute("title", label);
      accentButton.setAttribute("aria-pressed", String(isBlue));
    }
  };

  if (accentButton) {
    accentButton.addEventListener("click", () => {
      accent = accent === "pink" ? "blue" : "pink";
      root.setAttribute("data-accent", accent);
      try {
        localStorage.setItem("sergio-accent", accent);
      } catch (e) {}
      updateAccentUI();
    });
  }

  updateAccentUI();

 /* ---------- Selector de Idioma (ES / VA) Completo ---------- */
  const langButton = document.getElementById("langToggle");
  let currentLang = "es";

  try {
    const savedLang = localStorage.getItem("sergio-lang");
    if (savedLang === "es" || savedLang === "va") {
      currentLang = savedLang;
    }
  } catch (e) {}

  const translations = {
    es: {
      btnLabel: "VA",
      btnTitle: "Canviar a valencià",
      nav: ["Sobre mí", "Trayectoria", "Intereses", "Proyectos", "Contacto"],
      status: "Disponible para nuevos retos & proyectos",
      heroText: "Estudiante de 1º DAM en el IES Simarro. Enfocado en el desarrollo de software como motor para crear herramientas prácticas, explorar tecnologías modernas y diseñar interfaces intuitivas.",
      
      // Sección Sobre mí
      sobreMiTitle: "Sobre mí",
      sobreMiSub: "Perfil personal, académico y motivación principal.",
      aboutPs: [
        "Soy Sergio Chorques, estudiante del ciclo superior de 1º DAM en el IES Simarro.",
        "He asumido el reto personal de adentrarme en el mundo de la programación para darle un nuevo rumbo a mis intereses y habilidades analíticas.",
        "Me parece fascinante cómo se pueden construir universos interactivos y herramientas útiles desde cero a base de código limpio. Continúo explorando arquitectura de datos y desarrollo web para materializar proyectos funcionales."
      ],

      // Sección Trayectoria (Lo que he hecho)
      trayectoriaTitle: "Lo que he hecho",
      trayectoriaSub: "Experiencias recientes, formación previa e hitos personales.",
      trayectoriaCards: [
        { title: "Formación Base", desc: "Módulo de Grado Medio de SMR (Sistemas Microinformáticos y Redes) completado con éxito." },
        { title: "Reto Programación", desc: "Salto a 1º DAM orientado al dominio de desarrollo en lenguajes estructurados y POO." },
        { title: "Colección & Datos", desc: "Catalogación estructurada y gestión de colección personal de cómics, novelas y cine." },
        { title: "Desconexión", desc: "Viajes de desconexión en familia, costas de Cádiz y recarga de energía creativa." }
      ],

      // Sección Intereses (Me gusta)
      interesesTitle: "Me gusta",
      interesesSub: "Aficiones, entretenimiento y áreas de inspiración.",
      interesesCards: [
        { title: "Videojuegos", desc: "Jugador en PS5, priorizando títulos con narrativa elaborada, mecánicas pulidas y diseño inmersivo." },
        { title: "Cine & Anime", desc: "Apreciación del lenguaje audiovisual contemporáneo y series clásicas de animación japonesa." },
        { title: "Lectura", desc: "Constante interés por novelas de ciencia ficción, literatura técnica, cómic independiente y manga." }
      ],

      // Sección Proyectos
      proyectosTitle: "Proyectos",
      proyectosSub: "Prácticas, experimentos y aplicaciones donde aplico código real y diseño de interfaces.",
      filterAll: "Todos",
      projectCards: [
        { desc: "Portal personal con soporte para temas dinámicos, microinteracciones reactivas y accesibilidad integrada.", link: "Ver código" },
        { desc: "Aplicación orientada a organizar colecciones de libros y mangas mediante estructuras de datos ordenadas y persistencia lógica.", link: "Ver código" },
        { desc: "Prototipo de dashboard con estética Cyberpunk/HUD, animaciones con aceleración gráfica por hardware y componentes modulares.", link: "Ver código" }
      ],

      // Sección Contacto
      contactTitle: "Contacto",
      contactSub: "¿Interesado en hablar sobre desarrollo de software, proyectos o colaborar? Escríbeme.",
      contactAddress: "Abierto a consultas académicas, proyectos compartidos y conexiones profesionales.",
      contactSend: "Enviar Correo",
      copy: "© " + (yearElement ? yearElement.textContent : new Date().getFullYear()) + " Sergio Chorques · Web personal."
    },
    va: {
      btnLabel: "ES",
      btnTitle: "Cambiar a castellano",
      nav: ["Sobre mi", "Trajectòria", "Interessos", "Projectes", "Contacte"],
      status: "Disponible per a nous reptes & projectes",
      heroText: "Estudiant de 1r DAM a l'IES Simarro. Enfocat en el desenvolupament de programari com a motor per a crear ferramentes pràctiques, explorar tecnologies modernes i dissenyar interfícies intuïtives.",
      
      // Sección Sobre mi
      sobreMiTitle: "Sobre mi",
      sobreMiSub: "Perfil personal, acadèmic i motivació principal.",
      aboutPs: [
        "Sóc Sergio Chorques, estudiant del cicle superior de 1r DAM a l'IES Simarro.",
        "He assumit el repte personal d'endinsar-me en el món de la programació per a donar un nou rumb als meus interessos i habilitats analítiques.",
        "Em sembla fascinant com es poden construir universos interactius i ferramentes útils des de zero a base de codi net. Continue explorant arquitectura de dades i desenvolupament web per a materialitzar projectes funcionals."
      ],

      // Sección Trajectòria (El que he fet)
      trayectoriaTitle: "El que he fet",
      trayectoriaSub: "Experiències recents, formació prèvia i fites personals.",
      trayectoriaCards: [
        { title: "Formació Base", desc: "Mòdul de Grau Mitjà de SMR (Sistemes Microinformàtics i Xarxes) completat amb èxit." },
        { title: "Repte Programació", desc: "Salt a 1r DAM orientat al domini de desenvolupament en llenguatges estructurats i POO." },
        { title: "Col·lecció & Dades", desc: "Catalogació estructurada i gestió de col·lecció personal de còmics, novel·les i cinema." },
        { title: "Desconnexió", desc: "Viatges de desconnexió en família, costes de Cadis i recàrrega d'energia creativa." }
      ],

      // Sección Interessos (M'agrada)
      interesesTitle: "M'agrada",
      interesesSub: "Aficions, entreteniment i àrees d'inspiració.",
      interesesCards: [
        { title: "Videojocs", desc: "Jugador en PS5, prioritzant títols amb narrativa elaborada, mecàniques polides i disseny immersiu." },
        { title: "Cinema & Anime", desc: "Apreciació del llenguatge audiovisual contemporani i sèries clàssiques d'animació japonesa." },
        { title: "Lectura", desc: "Interès constant per novel·les de ciència-ficció, literatura tècnica, còmic independent i manga." }
      ],

      // Sección Projectes
      proyectosTitle: "Projectes",
      proyectosSub: "Pràctiques, experiments i aplicacions on aplique codi real i disseny d'interfícies.",
      filterAll: "Tots",
      projectCards: [
        { desc: "Portal personal amb suport per a temes dinàmics, microinteraccions reactives i accessibilitat integrada.", link: "Veure codi" },
        { desc: "Aplicació orientada a organitzar col·leccions de llibres i mangues mitjançant estructures de dades ordenades i persistència lògica.", link: "Veure codi" },
        { desc: "Prototip de panell amb estètica Cyberpunk/HUD, animacions amb acceleració gràfica per maquinari i components modulars.", link: "Veure codi" }
      ],

      // Sección Contacte
      contactTitle: "Contacte",
      contactSub: "Interessat en parlar sobre desenvolupament de programari, projectes o col·laborar? Escriu-me.",
      contactAddress: "Obert a consultes acadèmiques, projectes compartits i connexions professionals.",
      contactSend: "Enviar Correu",
      copy: "© " + (yearElement ? yearElement.textContent : new Date().getFullYear()) + " Sergio Chorques · Web personal."
    }
  };

  const applyLanguage = (lang) => {
    const t = translations[lang];
    if (!t) return;

    root.setAttribute("lang", lang);

    // Botón
    if (langButton) {
      const langSpan = langButton.querySelector("span");
      if (langSpan) langSpan.textContent = t.btnLabel;
      langButton.setAttribute("title", t.btnTitle);
      langButton.setAttribute("aria-label", t.btnTitle);
    }

    // Navegación
    const navLinks = document.querySelectorAll(".nav-links a");
    t.nav.forEach((text, i) => {
      if (navLinks[i]) navLinks[i].textContent = text;
    });

    // Hero & Status
    const statusText = document.querySelector(".status-pill span:last-child");
    if (statusText) statusText.textContent = t.status;

    const heroP = document.querySelector(".hero-text");
    if (heroP) heroP.textContent = t.heroText;

    // Sección: Sobre mí
    const smTitle = document.getElementById("sobre-mi-title");
    if (smTitle) {
      smTitle.textContent = t.sobreMiTitle;
      if (smTitle.nextElementSibling) {
        smTitle.nextElementSibling.textContent = t.sobreMiSub;
      }
    }

    const aboutPs = document.querySelectorAll(".about-card > p");
    t.aboutPs.forEach((text, idx) => {
      if (aboutPs[idx]) aboutPs[idx].textContent = text;
    });

    // Sección: Trayectoria (Lo que he hecho)
    const hechoTitle = document.getElementById("hecho-title");
    if (hechoTitle) {
      hechoTitle.textContent = t.trayectoriaTitle;
      if (hechoTitle.nextElementSibling) {
        hechoTitle.nextElementSibling.textContent = t.trayectoriaSub;
      }
    }

    const trayectoriaCards = document.querySelectorAll("#lo-que-he-hecho .card");
    t.trayectoriaCards.forEach((cardData, idx) => {
      const card = trayectoriaCards[idx];
      if (!card) return;

      const h3 = card.querySelector("h3");
      const p = card.querySelector("p");

      if (h3) h3.textContent = cardData.title;
      if (p) p.textContent = cardData.desc;
    });

    // Sección: Intereses (Me gusta)
    const gustaTitle = document.getElementById("gusta-title");
    if (gustaTitle) {
      gustaTitle.textContent = t.interesesTitle;
      if (gustaTitle.nextElementSibling) {
        gustaTitle.nextElementSibling.textContent = t.interesesSub;
      }
    }

    const interesesCards = document.querySelectorAll("#me-gusta .card");
    t.interesesCards.forEach((cardData, idx) => {
      const card = interesesCards[idx];
      if (!card) return;

      const h3 = card.querySelector("h3");
      const p = card.querySelector("p");

      if (h3) h3.textContent = cardData.title;
      if (p) p.textContent = cardData.desc;
    });

    // Sección: Proyectos
    const proyTitle = document.getElementById("proyectos-title");
    if (proyTitle) {
      proyTitle.textContent = t.proyectosTitle;
      if (proyTitle.nextElementSibling) {
        proyTitle.nextElementSibling.textContent = t.proyectosSub;
      }
    }

    const filterBtnAll = document.querySelector('.filter-btn[data-filter="all"]');
    if (filterBtnAll) filterBtnAll.textContent = t.filterAll;

    const projectCardsLang = document.querySelectorAll(".project-card");
    t.projectCards.forEach((cardData, idx) => {
      const card = projectCardsLang[idx];
      if (!card) return;

      const pDesc = card.querySelector(".project-desc");
      const aLink = card.querySelector(".project-link");

      if (pDesc) pDesc.textContent = cardData.desc;
      if (aLink) aLink.textContent = cardData.link;
    });

    // Sección: Contacto y Footer
    const contactoTitle = document.getElementById("contacto-title");
    if (contactoTitle) {
      contactoTitle.textContent = t.contactTitle;
      if (contactoTitle.nextElementSibling) {
        contactoTitle.nextElementSibling.textContent = t.contactSub;
      }
    }

    const address = document.querySelector(".contact-address");
    if (address) address.textContent = t.contactAddress;

    const mailLink = document.querySelector('.contact-links a[href^="mailto:"]');
    if (mailLink) mailLink.textContent = t.contactSend;

    const copyP = document.querySelector(".copy");
    if (copyP) {
      copyP.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> Sergio Chorques · ${lang === 'va' ? 'Web personal.' : 'Web personal.'}`;
    }
  };

  if (langButton) {
    langButton.addEventListener("click", () => {
      currentLang = currentLang === "es" ? "va" : "es";
      try {
        localStorage.setItem("sergio-lang", currentLang);
      } catch (e) {}
      applyLanguage(currentLang);
    });
  }

  try {
    applyLanguage(currentLang);
  } catch (e) {
    console.warn("No se pudo aplicar el idioma:", e);
  }

  /* ---------- Reveal con IntersectionObserver ---------- */
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Luz de Fondo Reactiva (Mouse Glow) ---------- */
  if (!prefersReducedMotion) {
    window.addEventListener("pointermove", (e) => {
      root.style.setProperty("--mouse-x", `${e.clientX}px`);
      root.style.setProperty("--mouse-y", `${e.clientY}px`);
    });
  }

  /* ---------- Efecto Spotlight en Tarjetas ---------- */
  const spotlightCards = document.querySelectorAll(".spotlight-card");
  spotlightCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--card-x", `${x}px`);
      card.style.setProperty("--card-y", `${y}px`);
    });
  });

  /* ---------- Máquina de escribir ---------- */
  (function typewriter() {
    const textEl = document.getElementById("typeText");
    if (!textEl) return;

    const phrases = [
      "Construyo universos interactivos desde cero.",
      "Estudiante de 1º DAM en el IES Simarro.",
      "Del código nacen proyectos funcionales y limpios.",
      "Gamer, lector y futuro desarrollador de software."
    ];

    if (prefersReducedMotion) {
      textEl.textContent = phrases[0];
      return;
    }

    const typeSpeed = 50;
    const deleteSpeed = 25;
    const pauseEnd = 1600;
    const pauseStart = 400;

    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    textEl.textContent = "";

    function tick() {
      const current = phrases[phraseIdx];

      if (!deleting) {
        charIdx++;
        textEl.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(tick, pauseEnd);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        charIdx--;
        textEl.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, pauseStart);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }

    setTimeout(tick, 500);
  })();

  /* ---------- Cursor Personalizado Fluido ---------- */
  (function customCursor() {
    const wrap = document.getElementById("cursorWrap");
    const ring = document.getElementById("cursorRing");
    const dot = document.getElementById("cursorDot");
    if (!wrap || !ring || !dot) return;

    const hasFinePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!hasFinePointer || prefersReducedMotion) return;

    root.classList.add("js-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;

    const updatePosition = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dotX += (mouseX - dotX) * 0.75;
      dotY += (mouseY - dotY) * 0.75;

      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      dot.style.transform = `translate(${dotX}px, ${dotY}px)`;

      requestAnimationFrame(updatePosition);
    };
    requestAnimationFrame(updatePosition);

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      wrap.style.opacity = "1";
    });

    document.addEventListener("mouseleave", () => {
      wrap.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
      wrap.style.opacity = "1";
    });

    const hoverTargets = "a, button, .card, .tags li, .filter-btn";

    document.addEventListener("mouseover", (e) => {
      const target = e.target && e.target.closest ? e.target.closest(hoverTargets) : null;
      if (target) wrap.classList.add("cursor--hover");
    });

    document.addEventListener("mouseout", (e) => {
      const target = e.target && e.target.closest ? e.target.closest(hoverTargets) : null;
      if (target) wrap.classList.remove("cursor--hover");
    });
  })();

  /* ---------- Filtro de Proyectos ---------- */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });

      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      projectCards.forEach((card) => {
        const categories = card.dataset.category || "";
        const isVisible = filter === "all" || categories.includes(filter);
        card.classList.toggle("is-hidden", !isVisible);
      });
    });
  });

  /* ---------- Tilt 3D sin retrasos ---------- */
  if (
    !prefersReducedMotion &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover)").matches
  ) {
    const tiltCards = document.querySelectorAll(".tilt");

    tiltCards.forEach((card) => {
      const reset = () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      };

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y / rect.height) - 0.5) * -10;
        const rotateY = ((x / rect.width) - 0.5) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener("mouseleave", reset);
    });
  }

 /* ---------- Spy Scroll (Indicador activo en el menú) ---------- */
  const navLinksList = document.querySelectorAll(".nav-links a");
  const trackedSections = document.querySelectorAll("section[id], footer[id]");

  if ("IntersectionObserver" in window && navLinksList.length > 0) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute("id");
            navLinksList.forEach((link) => {
              const href = link.getAttribute("href");
              if (href === `#${currentId}`) {
                link.classList.add("is-active");
              } else {
                link.classList.remove("is-active");
              }
            });
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px" // Detecta la sección cuando está en el tercio superior de la pantalla
      }
    );

    trackedSections.forEach((section) => spyObserver.observe(section));
  } 

  /* ---------- Barra de progreso de scroll ---------- */
  const progressBar = document.getElementById("scrollProgressBar");

  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- Botón Volver Arriba ---------- */
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (scrollTopBtn) {
    const updateScrollTopVisibility = () => {
      // Se muestra al bajar más de 350px
      if (window.scrollY > 350) {
        scrollTopBtn.classList.add("is-visible");
      } else {
        scrollTopBtn.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    updateScrollTopVisibility();

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
})();

/* =========================================================
   MODAL ¿TE LLAMO? + envío por Formspree
   ========================================================= */
(() => {
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/TU_ID"; // <-- CAMBIA TU_ID

  const modal = document.getElementById("callModal");
  const openBtn = document.getElementById("openCall");
  const form = document.getElementById("callForm");
  const submitBtn = document.getElementById("callSubmit");
  const statusEl = document.getElementById("callStatus");
  const successEl = document.getElementById("callSuccess");

  if (!modal || !openBtn || !form) return;

  let lastFocus = null;

  const focusables = () =>
    modal.querySelectorAll('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])');

  const setSubmitState = (disabled, text) => {
    if (!submitBtn) return;
    submitBtn.disabled = disabled;
    submitBtn.textContent = text;
  };

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.className = isError ? "modal__status is-error" : "modal__status";
  };

  const showSuccess = (visible) => {
    if (!successEl) return;
    successEl.hidden = !visible;
  };

  const openModal = () => {
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const first = modal.querySelector("#cf-name");
    if (first) first.focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocus) lastFocus.focus();
  };

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll("[data-close-modal]").forEach((el) =>
    el.addEventListener("click", closeModal)
  );

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key === "Tab") { // focus trap
      const f = Array.from(focusables()).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;

      const first = f[0];
      const last = f[f.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", false);

    if (FORMSPREE_ENDPOINT.includes("TU_ID")) {
      setStatus("Falta configurar Formspree (cambia TU_ID en script.js).", true);
      return;
    }

    setSubmitState(true, "Enviando…");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        form.hidden = true;
        showSuccess(true);
        setStatus("", false);

        setTimeout(() => {
          closeModal();
          form.reset();
          form.hidden = false;
          showSuccess(false);
          setSubmitState(false, "Enviar solicitud");
        }, 2600);
      } else {
        const data = await res.json().catch(() => null);
        setStatus(
          (data && data.errors && data.errors[0] && data.errors[0].message) ||
          "No se pudo enviar. Inténtalo de nuevo.",
          true
        );
        setSubmitState(false, "Enviar solicitud");
      }
    } catch {
      setStatus("Error de conexión. Revisa tu red.", true);
      setSubmitState(false, "Enviar solicitud");
    }
  });
})();