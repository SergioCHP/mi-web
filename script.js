/* =========================================================
   script.js — Interacción, Spotlight, Tilt 3D y Controles
   Versión corregida: typewriter multilenguaje, scroll spy
   mejorado, aria-pressed correcto y traducción completa.
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
      // aria-pressed debe indicar si el botón está "activado".
      // El modo por defecto es oscuro, así que el botón NO está presionado
      // cuando estamos en oscuro y SÍ cuando estamos en claro.
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

  /* =========================================================
     Selector de Idioma (ES / VA) Completo
     ========================================================= */
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
      heroText:
        "Estudiante de 1º DAM en el IES Simarro. Enfocado en el desarrollo de software como motor para crear herramientas prácticas, explorar tecnologías modernas y diseñar interfaces intuitivas.",

      // Frases del typewriter
      typePhrases: [
        "Construyo universos interactivos desde cero.",
        "Estudiante de 1º DAM en el IES Simarro.",
        "Del código nacen proyectos funcionales y limpios.",
        "Gamer, lector y futuro desarrollador de software."
      ],

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
        {
          title: "Formación Base",
          desc: "Módulo de Grado Medio de SMR (Sistemas Microinformáticos y Redes) completado con éxito."
        },
        {
          title: "Reto Programación",
          desc: "Salto a 1º DAM orientado al dominio de desarrollo en lenguajes estructurados y POO."
        },
        {
          title: "Colección & Datos",
          desc: "Catalogación estructurada y gestión de colección personal de cómics, novelas y cine."
        },
        {
          title: "Desconexión",
          desc: "Viajes de desconexión en familia, costas de Cádiz y recarga de energía creativa."
        }
      ],

      // Sección Intereses (Me gusta)
      interesesTitle: "Me gusta",
      interesesSub: "Aficiones, entretenimiento y áreas de inspiración.",
      interesesCards: [
        {
          title: "Videojuegos",
          desc: "Jugador en PS5, priorizando títulos con narrativa elaborada, mecánicas pulidas y diseño inmersivo."
        },
        {
          title: "Cine & Anime",
          desc: "Apreciación del lenguaje audiovisual contemporáneo y series clásicas de animación japonesa."
        },
        {
          title: "Lectura",
          desc: "Constante interés por novelas de ciencia ficción, literatura técnica, cómic independiente y manga."
        }
      ],

      // Sección Proyectos
      proyectosTitle: "Proyectos",
      proyectosSub:
        "Prácticas, experimentos y aplicaciones donde aplico código real y diseño de interfaces.",
      filterAll: "Todos",
      projectCards: [
        {
          desc: "Portal personal con soporte para temas dinámicos, microinteracciones reactivas y accesibilidad integrada.",
          link: "Ver código",
          aria: "Ver código del proyecto Mi web personal"
        },
        {
          desc: "Aplicación orientada a organizar colecciones de libros y mangas mediante estructuras de datos ordenadas y persistencia lógica.",
          link: "Ver código",
          aria: "Ver código del proyecto Gestor de biblioteca"
        },
        {
          desc: "Prototipo de dashboard con estética Cyberpunk/HUD, animaciones con aceleración gráfica por hardware y componentes modulares.",
          link: "Ver código",
          aria: "Ver código del proyecto Interfaz gamer"
        }
      ],

      // Sección Contacto + Modal
      contactTitle: "Contacto",
      contactSub:
        "¿Interesado en hablar sobre desarrollo de software, proyectos o colaborar? Escríbeme.",
      contactAddress:
        "Abierto a consultas académicas, proyectos compartidos y conexiones profesionales.",
      contactSend: "Enviar Correo",
      contactCallBtn: "¿Te llamo?",
      modalKicker: "Contacto directo",
      modalTitle: "¿Te llamo?",
      modalLead:
        "Déjame tus datos y te llamo cuando te venga bien. Sin compromiso.",
      modalName: "Nombre",
      modalNamePh: "Tu nombre",
      modalEmail: "Email",
      modalPhone: "Teléfono",
      modalWhen: "¿Cuándo te va bien?",
      modalWhenDefault: "Elige una franja",
      modalWhenOpts: [
        "Mañanas (9–13h)",
        "Mediodía (13–16h)",
        "Tardes (16–20h)",
        "Da igual, cuando puedas"
      ],
      modalMsg: "¿Sobre qué?",
      modalMsgOpt: "(opcional)",
      modalMsgPh: "Proyecto, práctica, colaboración…",
      modalSubmit: "Enviar solicitud",
      modalSuccessTitle: "¡Solicitud enviada!",
      modalSuccessDesc: "Te llamaré muy pronto."
    },
    va: {
      btnLabel: "ES",
      btnTitle: "Cambiar a castellano",
      nav: ["Sobre mi", "Trajectòria", "Interessos", "Projectes", "Contacte"],
      status: "Disponible per a nous reptes & projectes",
      heroText:
        "Estudiant de 1r DAM a l'IES Simarro. Enfocat en el desenvolupament de programari com a motor per a crear ferramentes pràctiques, explorar tecnologies modernes i dissenyar interfícies intuïtives.",

      // Frases del typewriter
      typePhrases: [
        "Construeix universos interactius des de zero.",
        "Estudiant de 1r DAM a l'IES Simarro.",
        "Del codi naixen projectes funcionals i nets.",
        "Gamer, lector i futur desenvolupador de programari."
      ],

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
        {
          title: "Formació Base",
          desc: "Mòdul de Grau Mitjà de SMR (Sistemes Microinformàtics i Xarxes) completat amb èxit."
        },
        {
          title: "Repte Programació",
          desc: "Salt a 1r DAM orientat al domini de desenvolupament en llenguatges estructurats i POO."
        },
        {
          title: "Col·lecció & Dades",
          desc: "Catalogació estructurada i gestió de col·lecció personal de còmics, novel·les i cinema."
        },
        {
          title: "Desconnexió",
          desc: "Viatges de desconnexió en família, costes de Cadis i recàrrega d'energia creativa."
        }
      ],

      // Sección Interessos (M'agrada)
      interesesTitle: "M'agrada",
      interesesSub: "Aficions, entreteniment i àrees d'inspiració.",
      interesesCards: [
        {
          title: "Videojocs",
          desc: "Jugador en PS5, prioritzant títols amb narrativa elaborada, mecàniques polides i disseny immersiu."
        },
        {
          title: "Cinema & Anime",
          desc: "Apreciació del llenguatge audiovisual contemporani i sèries clàssiques d'animació japonesa."
        },
        {
          title: "Lectura",
          desc: "Interès constant per novel·les de ciència-ficció, literatura tècnica, còmic independent i manga."
        }
      ],

      // Sección Projectes
      proyectosTitle: "Projectes",
      proyectosSub:
        "Pràctiques, experiments i aplicacions on aplique codi real i disseny d'interfícies.",
      filterAll: "Tots",
      projectCards: [
        {
          desc: "Portal personal amb suport per a temes dinàmics, microinteraccions reactives i accessibilitat integrada.",
          link: "Veure codi",
          aria: "Veure codi del projecte La meua web personal"
        },
        {
          desc: "Aplicació orientada a organitzar col·leccions de llibres i mangues mitjançant estructures de dades ordenades i persistència lògica.",
          link: "Veure codi",
          aria: "Veure codi del projecte Gestor de biblioteca"
        },
        {
          desc: "Prototip de panell amb estètica Cyberpunk/HUD, animacions amb acceleració gràfica per maquinari i components modulars.",
          link: "Veure codi",
          aria: "Veure codi del projecte Interfície gamer"
        }
      ],

      // Sección Contacte + Modal
      contactTitle: "Contacte",
      contactSub:
        "Interessat en parlar sobre desenvolupament de programari, projectes o col·laborar? Escriu-me.",
      contactAddress:
        "Obert a consultes acadèmiques, projectes compartits i connexions professionals.",
      contactSend: "Enviar Correu",
      contactCallBtn: "Et cride?",
      modalKicker: "Contacte directe",
      modalTitle: "Et cride?",
      modalLead:
        "Deixa'm les teues dades i et cride quan et vinga bé. Sense compromís.",
      modalName: "Nom",
      modalNamePh: "El teu nom",
      modalEmail: "Correu electrònic",
      modalPhone: "Telèfon",
      modalWhen: "Quan et va bé?",
      modalWhenDefault: "Tria una franja",
      modalWhenOpts: [
        "Matins (9–13h)",
        "Migdia (13–16h)",
        "Vesprades (16–20h)",
        "Tant se val, quan pugues"
      ],
      modalMsg: "Sobre què?",
      modalMsgOpt: "(opcional)",
      modalMsgPh: "Projecte, pràctica, col·laboració…",
      modalSubmit: "Enviar sol·licitud",
      modalSuccessTitle: "Sol·licitud enviada!",
      modalSuccessDesc: "Et cridaré ben prompte."
    }
  };

  /* ---------- Typewriter multilenguaje ---------- */
  const typewriterCtrl = (function () {
    const textEl = document.getElementById("typeText");
    if (!textEl) return { restart: () => {} };

    let phrases = translations[currentLang].typePhrases;
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timerId = null;

    const typeSpeed = 50;
    const deleteSpeed = 25;
    const pauseEnd = 1600;
    const pauseStart = 400;

    function clearTimer() {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    }

    function tick() {
      const current = phrases[phraseIdx] || "";

      if (!deleting) {
        charIdx++;
        textEl.textContent = current.slice(0, charIdx);
        if (charIdx >= current.length) {
          deleting = true;
          timerId = setTimeout(tick, pauseEnd);
          return;
        }
        timerId = setTimeout(tick, typeSpeed);
      } else {
        charIdx--;
        textEl.textContent = current.slice(0, Math.max(0, charIdx));
        if (charIdx <= 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timerId = setTimeout(tick, pauseStart);
          return;
        }
        timerId = setTimeout(tick, deleteSpeed);
      }
    }

    function start() {
      clearTimer();
      phrases = translations[currentLang].typePhrases;
      phraseIdx = 0;
      charIdx = 0;
      deleting = false;

      if (prefersReducedMotion) {
        textEl.textContent = phrases[0];
        return;
      }

      textEl.textContent = "";
      timerId = setTimeout(tick, 500);
    }

    // Arranque inicial
    start();

    return {
      restart: start
    };
  })();

  /* ---------- Aplicar idioma ---------- */
  const applyLanguage = (lang) => {
    const t = translations[lang];
    if (!t) return;

    root.setAttribute("lang", lang);

    // Botón de idioma
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

    const trayectoriaCards = document.querySelectorAll(
      "#lo-que-he-hecho .card"
    );
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
      if (aLink) {
        aLink.textContent = cardData.link;
        if (cardData.aria) aLink.setAttribute("aria-label", cardData.aria);
      }
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
      copyP.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> Sergio Chorques · Web personal.`;
    }

    // Botón de llamada en footer
    const callBtnSpan = document.querySelector("#openCall span");
    if (callBtnSpan) callBtnSpan.textContent = t.contactCallBtn;

    // Elementos del Modal
    const modalKicker = document.querySelector(".modal__kicker");
    if (modalKicker) modalKicker.textContent = t.modalKicker;

    const modalTitle = document.getElementById("callTitle");
    if (modalTitle) modalTitle.textContent = t.modalTitle;

    const modalLead = document.querySelector(".modal__lead");
    if (modalLead) modalLead.textContent = t.modalLead;

    // Campos del formulario
    const nameLabel = document.querySelector('label[for="cf-name"]');
    if (nameLabel) nameLabel.textContent = t.modalName;
    const nameInput = document.getElementById("cf-name");
    if (nameInput) nameInput.placeholder = t.modalNamePh;

    const emailLabel = document.querySelector('label[for="cf-email"]');
    if (emailLabel) emailLabel.textContent = t.modalEmail;

    const phoneLabel = document.querySelector('label[for="cf-phone"]');
    if (phoneLabel) phoneLabel.textContent = t.modalPhone;

    const whenLabel = document.querySelector('label[for="cf-when"]');
    if (whenLabel) whenLabel.textContent = t.modalWhen;

    const whenSelect = document.getElementById("cf-when");
    if (whenSelect && whenSelect.options.length > 0) {
      // Resetear selección para que el placeholder se re-traduzca bien
      whenSelect.selectedIndex = 0;
      whenSelect.options[0].textContent = t.modalWhenDefault;
      t.modalWhenOpts.forEach((text, i) => {
        if (whenSelect.options[i + 1]) {
          whenSelect.options[i + 1].textContent = text;
        }
      });
    }

    const msgLabel = document.querySelector('label[for="cf-msg"]');
    if (msgLabel) {
      msgLabel.innerHTML = `${t.modalMsg} <span class="opt">${t.modalMsgOpt}</span>`;
    }
    const msgInput = document.getElementById("cf-msg");
    if (msgInput) msgInput.placeholder = t.modalMsgPh;

    const submitBtn = document.getElementById("callSubmit");
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.textContent = t.modalSubmit;
    }

    const successEl = document.getElementById("callSuccess");
    if (successEl) {
      const successP = successEl.querySelector("p");
      if (successP) {
        successP.innerHTML = `<strong>${t.modalSuccessTitle}</strong><br>${t.modalSuccessDesc}`;
      }
    }

    // Reiniciar typewriter con el nuevo idioma
    typewriterCtrl.restart();
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
        card.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      };

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = (y / rect.height - 0.5) * -10;
        const rotateY = (x / rect.width - 0.5) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener("mouseleave", reset);
    });
  }

  /* =========================================================
     Spy Scroll mejorado (indicador activo en el menú)
     ========================================================= */
  const navLinksList = document.querySelectorAll(".nav-links a");
  const trackedSections = document.querySelectorAll("section[id], footer[id]");

  if ("IntersectionObserver" in window && navLinksList.length > 0) {
    // Guardamos la sección visible más cercana al top para evitar parpadeos
    const visibleSections = new Map();

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          if (entry.isIntersecting) {
            visibleSections.set(id, entry.boundingClientRect.top);
          } else {
            visibleSections.delete(id);
          }
        });

        if (visibleSections.size === 0) return;

        // Elegimos la sección más cercana al top (la primera visible)
        let closestId = null;
        let closestTop = Infinity;
        visibleSections.forEach((top, id) => {
          if (top < closestTop) {
            closestTop = top;
            closestId = id;
          }
        });

        if (!closestId) return;

        navLinksList.forEach((link) => {
          const href = link.getAttribute("href");
          if (href === `#${closestId}`) {
            link.classList.add("is-active");
          } else {
            link.classList.remove("is-active");
          }
        });
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
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
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
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
      if (window.scrollY > 350) {
        scrollTopBtn.classList.add("is-visible");
      } else {
        scrollTopBtn.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", updateScrollTopVisibility, {
      passive: true
    });
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

  // Textos según idioma activo
  const getSubmitLabel = () =>
    document.documentElement.getAttribute("lang") === "va"
      ? "Enviar sol·licitud"
      : "Enviar solicitud";

  const getSendingLabel = () =>
    document.documentElement.getAttribute("lang") === "va"
      ? "Enviant…"
      : "Enviando…";

  const getErrorMsg = () =>
    document.documentElement.getAttribute("lang") === "va"
      ? "No s'ha pogut enviar. Torna-ho a provar."
      : "No se pudo enviar. Inténtalo de nuevo.";

  const getNetworkErrorMsg = () =>
    document.documentElement.getAttribute("lang") === "va"
      ? "Error de connexió. Revisa la teua xarxa."
      : "Error de conexión. Revisa tu red.";

  const getFormspreeMissingMsg = () =>
    document.documentElement.getAttribute("lang") === "va"
      ? "Falta configurar Formspree (canvia TU_ID a script.js)."
      : "Falta configurar Formspree (cambia TU_ID en script.js).";

  const focusables = () =>
    modal.querySelectorAll(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
    );

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

    if (e.key === "Tab") {
      const f = Array.from(focusables()).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
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
      setStatus(getFormspreeMissingMsg(), true);
      return;
    }

    setSubmitState(true, getSendingLabel());

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
          setSubmitState(false, getSubmitLabel());
        }, 2600);
      } else {
        const data = await res.json().catch(() => null);
        setStatus(
          (data &&
            data.errors &&
            data.errors[0] &&
            data.errors[0].message) ||
            getErrorMsg(),
          true
        );
        setSubmitState(false, getSubmitLabel());
      }
    } catch {
      setStatus(getNetworkErrorMsg(), true);
      setSubmitState(false, getSubmitLabel());
    }
  });
})();