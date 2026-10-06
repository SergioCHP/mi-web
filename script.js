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
          title: "Certificaciones Cisco",
          desc: "Credenciales oficiales obtenidas a través de Cisco Networking Academy:"
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
          desc: "Página web temática desarrollada con WordPress. Un proyecto del año pasado centrado en el diseño, personalización y gestión de contenidos.",
          link: "Visitar web",
          aria: "Visitar la web de El Señor de los Anillos"
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
      modalSuccessDesc: "Te llamaré muy pronto.",

      // GitHub Widget
      ghTitle: "Actividad en GitHub",
      ghBadgeLive: "API GitHub · En vivo",
      ghBadgeOffline: "Desconectado",
      ghReposLabel: "Repos",
      ghFollowersLabel: "Seguidores",
      ghSinceLabel: "En GitHub desde",
      ghUpdatedLabel: "Act",
      ghCodeLabel: "Código",
      ghDefaultBio: "Perfil de GitHub activo con {n} repositorios públicos.",
      ghError: "No se pudieron sincronizar los datos de GitHub en este momento."
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
          title: "Certificacions Cisco",
          desc: "Credencials oficials obtingudes mitjançant Cisco Networking Academy:"
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
          desc: "Pàgina web temàtica desenvolupada amb WordPress. Un projecte de l'any passat centrat en el disseny, personalització i gestió de continguts.",
          link: "Visitar web",
          aria: "Visitar la web d'El Senyor dels Anells"
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
      modalSuccessDesc: "Et cridaré ben prompte.",

      // GitHub Widget
      ghTitle: "Activitat en GitHub",
      ghBadgeLive: "API GitHub · En viu",
      ghBadgeOffline: "Desconnectat",
      ghReposLabel: "Repos",
      ghFollowersLabel: "Seguidors",
      ghSinceLabel: "En GitHub des de",
      ghUpdatedLabel: "Act",
      ghCodeLabel: "Codi",
      ghDefaultBio: "Perfil de GitHub actiu amb {n} repositoris públics.",
      ghError: "No s'han pogut sincronitzar les dades de GitHub en este moment."
    }
  };

  let cachedGitHubData = null;

  function renderGitHubWidget() {
    const bioEl = document.getElementById("ghBio");
    const statsEl = document.getElementById("ghStats");
    const reposEl = document.getElementById("ghRepos");
    const badgeEl = document.getElementById("ghStatusBadge");
    const titleEl = document.querySelector(".github-header h3");

    if (!bioEl || !reposEl || !cachedGitHubData) return;

    const t = translations[currentLang] || translations.es;

    if (titleEl) titleEl.textContent = t.ghTitle;

    if (cachedGitHubData.error) {
      if (badgeEl) {
        badgeEl.textContent = t.ghBadgeOffline;
        badgeEl.style.color = "#ef4444";
      }
      bioEl.textContent = t.ghError;
      if (statsEl) statsEl.replaceChildren();
      reposEl.replaceChildren();
      return;
    }

    const { user, repos } = cachedGitHubData;

    if (badgeEl) {
      badgeEl.textContent = t.ghBadgeLive;
      badgeEl.style.color = "";
    }

    bioEl.textContent = user.bio ||
      (t.ghDefaultBio
        ? t.ghDefaultBio.replace("{n}", user.public_repos)
        : `Perfil con ${user.public_repos} repositorios.`);

    if (statsEl) {
      const stats = [
        [`📦 ${t.ghReposLabel}: `, user.public_repos],
        [`👥 ${t.ghFollowersLabel}: `, user.followers],
        [`📅 ${t.ghSinceLabel}: `, new Date(user.created_at).getFullYear()]
      ];

      statsEl.replaceChildren(...stats.map(([label, value]) => {
        const item = document.createElement("div");
        item.className = "gh-stat-item";
        item.append(document.createTextNode(label));

        const strong = document.createElement("strong");
        strong.textContent = String(value);
        item.append(strong);
        return item;
      }));
    }

    const locale = currentLang === "va" ? "ca-ES" : "es-ES";
    const developmentText = currentLang === "va"
      ? "Projecte en desenvolupament"
      : "Proyecto en desarrollo";

    reposEl.replaceChildren(...repos.map((repo) => {
      const card = document.createElement("a");
      card.href = `https://github.com/SergioCHP/${encodeURIComponent(repo.name)}`;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.className = "gh-repo-card";

      const details = document.createElement("div");
      const name = document.createElement("div");
      name.className = "gh-repo-name";
      name.append(document.createTextNode("📂 "));
      name.append(document.createTextNode(repo.name));

      const description = document.createElement("p");
      description.className = "gh-repo-desc";
      description.textContent = repo.description || developmentText;
      details.append(name, description);

      const footer = document.createElement("div");
      footer.className = "gh-repo-footer";
      const language = document.createElement("span");
      language.textContent = `🔹 ${repo.language || t.ghCodeLabel}`;
      const date = document.createElement("span");
      const pushedAt = new Date(repo.pushed_at);
      const formattedDate = Number.isNaN(pushedAt.getTime())
        ? ""
        : pushedAt.toLocaleDateString(locale, { month: "short", day: "numeric" });
      date.textContent = `${t.ghUpdatedLabel}: ${formattedDate}`;
      footer.append(language, date);

      card.append(details, footer);
      return card;
    }));
  }

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

    // Navegación en juegos.html
    const navHome = document.getElementById("navHome");
    const navReplay = document.getElementById("navReplay");
    if (navHome) navHome.textContent = lang === "va" ? "Inici" : "Inicio";
    if (navReplay) navReplay.textContent = lang === "va" ? "Jugar de nou" : "Jugar de nuevo";

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
      copyP.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> Sergio Chorques · Web personal. <a href="admin.html" style="color: var(--text-muted); margin-left: 8px; opacity: 0.6; transition: opacity 0.2s;" aria-label="Acceso al panel de administración" title="Admin"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></a>`;
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
    // Actualizar textos del widget de GitHub al cambiar de idioma
    if (typeof renderGitHubWidget === "function") {
      renderGitHubWidget();
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

  (async function initGitHub() {
    if (!document.getElementById("ghBio") || !document.getElementById("ghRepos")) return;

    const username = "SergioCHP";
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=3`)
      ]);

      if (!userRes.ok || !reposRes.ok) throw new Error("Error consultando la API");

      const user = await userRes.json();
      const repos = await reposRes.json();
      if (!Array.isArray(repos)) throw new Error("La API devolvió una lista de repositorios no válida");

      cachedGitHubData = { user, repos };
    } catch (error) {
      console.error("No se pudieron cargar los datos de GitHub:", error);
      cachedGitHubData = { error: true };
    }

    renderGitHubWidget();
  })();

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
   MODAL ¿TE LLAMO? + ENVÍO A SUPABASE API
   ========================================================= */
(() => {
  // PEGA AQUÍ TUS DATOS DE SUPABASE:
  const SUPABASE_URL = "https://kusmmtgvrecayytatvbf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1c21tdGd2cmVjYXl5dGF0dmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mjc3NzgsImV4cCI6MjEwNjIwMzc3OH0.y_p7oKUQPueKn8fSqWGqlRafnDaQelFX0cvFmQv3AqI";

  const modal = document.getElementById("callModal");
  const openBtn = document.getElementById("openCall");
  const form = document.getElementById("callForm");
  const submitBtn = document.getElementById("callSubmit");
  const statusEl = document.getElementById("callStatus");
  const successEl = document.getElementById("callSuccess");

  if (!modal || !openBtn || !form) return;

  const isVa = () => document.documentElement.getAttribute("lang") === "va";
  
  const setSubmitState = (disabled, text) => { 
    if (submitBtn) { submitBtn.disabled = disabled; submitBtn.textContent = text; } 
  };
  
  const setStatus = (msg, isError) => { 
    if (statusEl) { 
      statusEl.textContent = msg || ""; 
      statusEl.className = isError ? "modal__status is-error" : "modal__status"; 
    } 
  };
  
  const openModal = () => {
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
  };

  openBtn.addEventListener("click", openModal);
  modal.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", false);

    const formData = new FormData(form);
    
    // Antispam (Honeypot)
    if (formData.get("_gotcha")) {
      setStatus("Spam detectado.", true);
      return;
    }

    setSubmitState(true, isVa() ? "Enviant…" : "Enviando…");

    // Preparamos los datos para la base de datos
    const payload = {
      nombre: formData.get("Nombre"),
      email: formData.get("Email"),
      telefono: formData.get("Teléfono"),
      disponibilidad: formData.get("Disponibilidad"),
      mensaje: formData.get("Mensaje")
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        form.hidden = true;
        successEl.hidden = false;
        setTimeout(() => {
          closeModal();
          form.reset();
          form.hidden = false;
          successEl.hidden = true;
          setSubmitState(false, isVa() ? "Enviar sol·licitud" : "Enviar solicitud");
        }, 2600);
      } else {
        setStatus(isVa() ? "No s'ha pogut enviar." : "No se pudo enviar.", true);
        setSubmitState(false, isVa() ? "Enviar sol·licitud" : "Enviar solicitud");
      }
    } catch {
      setStatus(isVa() ? "Error de connexió." : "Error de conexión.", true);
      setSubmitState(false, isVa() ? "Enviar sol·licitud" : "Enviar solicitud");
    }
  });
})();

/* =========================================================
   MODAL VISOR DE CERTIFICADOS CISCO
   ========================================================= */
(() => {
  const modal = document.getElementById("certModal");
  const modalImg = document.getElementById("certModalImg");
  const modalTitle = document.getElementById("certModalTitle");
  const certBtns = document.querySelectorAll(".cert-btn");

  if (!modal || !modalImg || !modalTitle) return;

  const openCert = (src, title) => {
    modalImg.src = src;
    modalImg.alt = title;
    modalTitle.textContent = title;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeCert = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalImg.src = "";
  };

  certBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-cert-src");
      const title = btn.getAttribute("data-cert-title");
      openCert(src, title);
    });
  });

  modal.querySelectorAll("[data-close-cert]").forEach((el) => {
    el.addEventListener("click", closeCert);
  });

  // Cerrar con la tecla Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeCert();
    }
  });
})();

/* =========================================================
   WIDGET DISCRETO DEL TIEMPO — Open-Meteo
   ========================================================= */
(() => {
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;

  const iconEl = document.getElementById("weatherIcon");
  const textEl = document.getElementById("weatherText");

  // Cambia esto por tu ciudad / coordenadas
  const LOCATION = {
    city: "Enguera",
    lat: 39.2278,
    lon: -0.7550
  };

  const UI_TEXT = {
    es: {
      loading: "Cargando el tiempo…",
      error: "Tiempo no disponible",
      wind: "viento"
    },
    va: {
      loading: "Carregant el temps…",
      error: "Temps no disponible",
      wind: "vent"
    }
  };

  const WEATHER_CODES = {
    0: { es: "Despejado", va: "Desemparat", icon: "☀️" },
    1: { es: "Mayormente despejado", va: "Majoritàriament desemparat", icon: "🌤️" },
    2: { es: "Parcialmente nublado", va: "Parcialment ennuvolat", icon: "⛅" },
    3: { es: "Nublado", va: "Ennuvolat", icon: "☁️" },
    45: { es: "Niebla", va: "Boira", icon: "🌫️" },
    48: { es: "Niebla con escarcha", va: "Boira amb gebada", icon: "🌫️" },
    51: { es: "Llovizna ligera", va: "Pluja fina lleugera", icon: "🌦️" },
    53: { es: "Llovizna", va: "Pluja fina", icon: "🌦️" },
    55: { es: "Llovizna intensa", va: "Pluja fina intensa", icon: "🌧️" },
    56: { es: "Llovizna helada", va: "Pluja fina gelada", icon: "🌧️" },
    57: { es: "Llovizna helada intensa", va: "Pluja fina gelada intensa", icon: "🌧️" },
    61: { es: "Lluvia ligera", va: "Pluja lleugera", icon: "🌦️" },
    63: { es: "Lluvia", va: "Pluja", icon: "🌧️" },
    65: { es: "Lluvia intensa", va: "Pluja intensa", icon: "🌧️" },
    66: { es: "Lluvia helada", va: "Pluja gelada", icon: "🌧️" },
    67: { es: "Lluvia helada intensa", va: "Pluja gelada intensa", icon: "🌧️" },
    71: { es: "Nieve ligera", va: "Neu lleugera", icon: "🌨️" },
    73: { es: "Nieve", va: "Neu", icon: "❄️" },
    75: { es: "Nieve intensa", va: "Neu intensa", icon: "❄️" },
    77: { es: "Granizo", va: "Calamarsa", icon: "🌨️" },
    80: { es: "Chubascos ligeros", va: "Ruixades lleugeres", icon: "🌦️" },
    81: { es: "Chubascos", va: "Ruixades", icon: "🌧️" },
    82: { es: "Chubascos violentos", va: "Ruixades violentes", icon: "🌧️" },
    85: { es: "Chubascos de nieve", va: "Ruixades de neu", icon: "🌨️" },
    86: { es: "Chubascos de nieve intensos", va: "Ruixades de neu intenses", icon: "🌨️" },
    95: { es: "Tormenta", va: "Tempesta", icon: "⛈️" },
    96: { es: "Tormenta con granizo", va: "Tempesta amb calamarsa", icon: "⛈️" },
    99: { es: "Tormenta con granizo fuerte", va: "Tempesta amb calamarsa forta", icon: "⛈️" },
    default: { es: "Variable", va: "Variable", icon: "🌡️" }
  };

  let cached = null;
  let isLoading = false;
  let lastError = false;

  const getLang = () =>
    document.documentElement.getAttribute("lang") === "va" ? "va" : "es";

  function describe(code) {
    return WEATHER_CODES[code] || WEATHER_CODES.default;
  }

  function render() {
    if (!cached) return;

    const lang = getLang();
    const info = describe(cached.code);

    const tempText = Number.isFinite(cached.temp)
      ? `${Math.round(cached.temp)}°`
      : "—";

    const windText = Number.isFinite(cached.wind)
      ? `${Math.round(cached.wind)} km/h`
      : "—";

    if (iconEl) iconEl.textContent = info.icon;

    if (textEl) {
      textEl.textContent = `${LOCATION.city}: ${tempText} ${info[lang]}`;
    }

    widget.setAttribute(
      "title",
      `${LOCATION.city}: ${tempText} ${info[lang]} · ${UI_TEXT[lang].wind} ${windText} · Open-Meteo`
    );

    widget.classList.remove("is-error");
    lastError = false;
  }

  function showError() {
    const lang = getLang();

    if (iconEl) iconEl.textContent = "⚠️";

    if (textEl) {
      textEl.textContent = UI_TEXT[lang].error;
    }

    widget.setAttribute("title", UI_TEXT[lang].error);
    widget.classList.add("is-error");
    lastError = true;
  }

  async function loadWeather() {
    if (isLoading) return;

    isLoading = true;
    widget.classList.add("is-loading");
    widget.classList.remove("is-error");

    if (textEl && !cached) {
      textEl.textContent = UI_TEXT[getLang()].loading;
    }

    try {
      const params = new URLSearchParams({
        latitude: LOCATION.lat,
        longitude: LOCATION.lon,
        current: "temperature_2m,weather_code,wind_speed_10m",
        timezone: "auto"
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const current = data.current;

      if (!current) {
        throw new Error("Respuesta sin datos actuales");
      }

      cached = {
        temp: current.temperature_2m,
        code: current.weather_code,
        wind: current.wind_speed_10m,
        time: current.time
      };

      render();
    } catch (error) {
      console.warn("No se pudo cargar el clima:", error);
      cached = null;
      showError();
    } finally {
      isLoading = false;
      widget.classList.remove("is-loading");
    }
  }

  // Texto inicial
  if (textEl) {
    textEl.textContent = UI_TEXT[getLang()].loading;
  }

  // Carga perezosa: solo pide el tiempo cuando el widget se acerca
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadWeather();
            observer.disconnect();
          }
        });
      },
      { rootMargin: "140px 0px" }
    );

    io.observe(widget);
  } else {
    loadWeather();
  }

  // Si cambia el idioma, actualiza textos sin recargar la página
  if ("MutationObserver" in window) {
    const langObserver = new MutationObserver(() => {
      if (cached) {
        render();
      } else if (lastError) {
        showError();
      } else if (textEl) {
        textEl.textContent = UI_TEXT[getLang()].loading;
      }
    });

    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"]
    });
  }

  // Actualización automática cada 15 minutos
  setInterval(() => {
    if (cached) {
      loadWeather();
    }
  }, 15 * 60 * 1000);
})();

/* ===== Buscador de videojuegos (RAWG) ===== */
const RAWG_KEY = "b6b00ccbcb714d73a1474bb2fff67d6a"; // Tu API key de RAWG

const buscadorForm = document.getElementById("buscadorForm");
const buscadorInput = document.getElementById("buscadorInput");
const buscadorEstado = document.getElementById("buscadorEstado");
const buscadorGrid = document.getElementById("buscadorGrid");
const buscadorFicha = document.getElementById("buscadorFicha");
const searchChips = document.querySelectorAll(".search-chip");

const gamesCache = new Map();
let currentResults = [];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function estado(msg, err = false) {
  if (!buscadorEstado) return;
  buscadorEstado.textContent = msg;
  buscadorEstado.classList.toggle("is-error", err);
}

function renderFicha(j) {
  if (!buscadorFicha) return;

  const img = j.background_image
    ? `<img class="buscador__img" src="${esc(j.background_image)}" alt="${esc(j.name)}" loading="lazy" />`
    : `<div class="buscador__img buscador__img--vacio">Sin imagen</div>`;

  const plataformas = (j.platforms || []).map((p) => esc(p.platform.name)).slice(0, 8).join(" · ") || "—";
  const generos = (j.genres || []).map((g) => esc(g.name)).slice(0, 6).join(" · ") || "—";
  const fecha = j.released ? esc(j.released) : "—";
  const nota = typeof j.rating === "number" ? j.rating.toFixed(1) : "—";
  const meta = typeof j.metacritic === "number" ? j.metacritic : null;
  const desc = (j.short_description || j.description_raw || "")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const tiendas = (j.stores || [])
    .map((s) => `<a class="buscador__tienda" href="${esc(s.store.url)}" target="_blank" rel="noopener">${esc(s.store.name)}</a>`)
    .join("");

  buscadorFicha.innerHTML = `
    ${img}
    <div class="buscador__contenido">
      <h4 class="buscador__nombre">${esc(j.name)}</h4>
      <div class="buscador__meta">
        <span class="buscador__dato"><strong>${fecha}</strong><span>lanzamiento</span></span>
        <span class="buscador__dato"><strong>${nota}</strong><span>nota RAWG</span></span>
        ${meta != null ? `<span class="buscador__dato"><strong>${meta}</strong><span>Metacritic</span></span>` : ""}
      </div>
      <p class="buscador__linea"><span class="buscador__etiqueta">Plataformas</span>${plataformas}</p>
      <p class="buscador__linea"><span class="buscador__etiqueta">Géneros</span>${generos}</p>
      ${desc ? `<p class="buscador__desc">${esc(desc)}</p>` : ""}
      ${tiendas ? `<div class="buscador__tiendas">${tiendas}</div>` : ""}
    </div>`;
  buscadorFicha.hidden = false;
  buscadorFicha.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderGrid(games) {
  if (!buscadorGrid) return;
  buscadorGrid.innerHTML = "";

  games.forEach((game) => {
    const card = document.createElement("article");
    card.className = "game-mini-card";
    const imgUrl = game.background_image || "";
    const year = game.released ? game.released.split("-")[0] : "";

    card.innerHTML = `
      ${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(game.name)}" loading="lazy" />` : '<div style="height:90px;background:var(--surface)"></div>'}
      <div class="game-mini-info">
        <div class="game-mini-title">${esc(game.name)}</div>
        <span class="game-mini-year">${year}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".game-mini-card").forEach(c => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      renderFicha(game);
    });

    buscadorGrid.appendChild(card);
  });

  buscadorGrid.hidden = false;
  if (games.length > 0) {
    buscadorGrid.children[0].classList.add("is-selected");
    renderFicha(games[0]);
  }
}

async function buscarJuego(nombre) {
  if (!RAWG_KEY || RAWG_KEY.includes("PEGA_AQUI")) {
    estado("Añade tu API key de RAWG en script.js (const RAWG_KEY).", true);
    return;
  }
  const q = (nombre || "").trim();
  if (q.length < 2) { estado("Escribe al menos 2 letras.", true); return; }

  const cacheKey = q.toLowerCase();
  if (gamesCache.has(cacheKey)) {
    currentResults = gamesCache.get(cacheKey);
    renderGrid(currentResults);
    estado("");
    return;
  }

  estado("Buscando títulos…");
  if (buscadorGrid) buscadorGrid.hidden = true;
  if (buscadorFicha) buscadorFicha.hidden = true;

  const btn = document.querySelector(".buscador__btn");
  btn?.classList.add("is-busy");

  try {
    const url = `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(q)}&page_size=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      estado(`Sin resultados para “${q}”.`, true);
      return;
    }

    currentResults = data.results;
    gamesCache.set(cacheKey, currentResults);
    renderGrid(currentResults);
    estado("");
  } catch (e) {
    estado("Error consultando RAWG. Revisa tu conexión o la API key.", true);
  } finally {
    btn?.classList.remove("is-busy");
  }
}

/* ===== Spotlight del buscador (coherente con .spotlight-card) ===== */
function attachSpotlight(el) {
  if (!el || el.dataset.spotlight) return;
  el.dataset.spotlight = "1";
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--card-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--card-y", `${e.clientY - r.top}px`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--card-x", "-200px");
    el.style.setProperty("--card-y", "-200px");
  });
}
attachSpotlight(document.querySelector(".buscador"));

// Eventos del formulario
buscadorForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  buscarJuego(buscadorInput.value);
});

let buscadorTimer = null;
buscadorInput?.addEventListener("input", () => {
  clearTimeout(buscadorTimer);
  const q = buscadorInput.value.trim();

  // Si se borra la búsqueda o tiene menos de 2 caracteres, limpiamos y ocultamos todo
  if (q.length < 2) {
    if (buscadorGrid) {
      buscadorGrid.innerHTML = "";
      buscadorGrid.hidden = true;
    }
    if (buscadorFicha) {
      buscadorFicha.innerHTML = "";
      buscadorFicha.hidden = true;
    }
    estado("");
    return;
  }

  // Si tiene 2 o más letras, lanzamos la búsqueda tras la pausa
  buscadorTimer = setTimeout(() => {
    buscarJuego(q);
  }, 500);
});

// Manejo del evento de limpiar al pulsar la "x" que algunos navegadores ponen en los input search
buscadorInput?.addEventListener("search", () => {
  if (!buscadorInput.value.trim()) {
    clearTimeout(buscadorTimer);
    if (buscadorGrid) {
      buscadorGrid.innerHTML = "";
      buscadorGrid.hidden = true;
    }
    if (buscadorFicha) {
      buscadorFicha.innerHTML = "";
      buscadorFicha.hidden = true;
    }
    estado("");
  }
});

// Eventos de los chips sugeridos
searchChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const query = chip.getAttribute("data-query");
    if (buscadorInput) buscadorInput.value = query;
    buscarJuego(query);
  });
});