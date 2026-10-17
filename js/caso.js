/* =========================================================
   caso.js — Idioma de la página «Caso de estudio»
   - El castellano es el HTML original: se guarda al cargar.
   - El valenciano está en VA, con la misma clave que data-i18n.
   - Usa la misma preferencia que el resto de la web
     (localStorage "sergio-lang") y cambia <html lang>, de modo
     que theme.js y nav-i18n.js se traducen solos.
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const langToggle = document.getElementById("langToggle");

  const VA = {
    docTitle: "Cas d'estudi: La meua web personal | Sergio Chorques",
    btnLabel: "ES",
    btnTitle: "Cambiar a castellano",

    kicker: "Cas d'estudi",
    title: "La meua web personal",
    lead: "Com vaig construir un portfolio interactiu amb HTML, CSS i JavaScript, sense frameworks: què volia aconseguir, com el vaig organitzar, quins problemes vaig trobar i què he aprés.",
    metaRoleT: "Rol",
    metaRole: "Disseny i desenvolupament (projecte individual)",
    metaDateT: "Dates",
    metaDate: "Setembre – octubre de 2026",
    metaStackT: "Tecnologies",
    metaDeployT: "Desplegament",
    ctaSite: "Veure la web",
    ctaCode: "Veure el codi a GitHub",
    statsAria: "El projecte en xifres",
    stPages: "pàgines",
    stCommits: "commits",
    stLines: "línies de codi",
    stApis: "API externes",
    stLangs: "idiomes",
    stAxe: "errors d'accessibilitat (axe)",

    retoTitle: "El repte",
    retoSub: "Què necessitava i què em vaig exigir abans d'escriure codi.",
    retoText:
      "<p>Necessitava un portfolio per a presentar-me com a estudiant de DAM. No volia un CV en HTML: volia una web que mostrara <strong>qui soc</strong> (videojocs, cinema, anime i llibres) i que, alhora, <strong>demostrara el que sé programar</strong>.</p>" +
      "<p>El repte era fer-ho sense frameworks, per a entendre de veritat el DOM, els esdeveniments, el CSS i les peticions a API abans de recolzar-me en ferramentes que ho amaguen.</p>",
    reqTitle: "Requisits que em vaig posar",
    reqList:
      "<li>Sense frameworks ni pas de compilació</li>" +
      "<li>Responsive des de 360 px</li>" +
      "<li>Tema clar i fosc, i dos colors d'accent</li>" +
      "<li>Castellà i valencià</li>" +
      "<li>Accessible amb teclat i lector de pantalla</li>" +
      "<li>Dades en directe d'API reals</li>" +
      "<li>Formulari de contacte amb backend segur</li>",

    procTitle: "Procés",
    procSub: "Quatre fases, reconstruïdes a partir de l'historial de commits.",
    ph1When: "22 – 29 set.",
    ph1Title: "Base",
    ph1Text: "Portada, formulari «Et cride?», versió en valencià, selector de color i panell d'administració amb Supabase. Primer prototip del minijoc.",
    ph2When: "1 – 6 oct.",
    ph2Title: "Contingut dinàmic",
    ph2Text: "Pàgina de videojocs amb carrusel 3D, certificats de Cisco, activitat de GitHub en directe i cercador de RAWG amb <em>debounce</em> i memòria cau.",
    ph3When: "8 – 12 oct.",
    ph3Title: "Pàgines temàtiques",
    ph3Text: "Elecció de Matrix, cinema (TMDB), anime (AniList, amb tràiler), el grimori 3D de llibres i Farolillo, la mascota-xatbot.",
    ph4When: "12 – 15 oct.",
    ph4Title: "Qualitat",
    ph4Text: "Polítiques de seguretat RLS, escapament de dades contra XSS, codi d'idioma vàlid, reorganització en carpetes, minijoc modular i accessibilitat amb teclat.",

    arqTitle: "Arquitectura",
    arqSub: "Web estàtica: cada pàgina carrega només el que necessita i comparteix els components comuns.",
    arqPages: "Pàgines",
    arqCase: "cas d'estudi",
    arqShared: "Components compartits",
    arqExt: "Serveis externs",
    arqNote: "El minijoc està separat en 29 mòduls ES per capes (lògica, dades, render i interfície): la lògica del combat no toca el DOM, així que es pot simular en Node sense navegador.",

    chTitle: "Problemes i solucions",
    chSub: "Els problemes que més m'han fet aprendre.",
    c1Title: "Guardar missatges sense exposar les dades",
    c1Problem: "<strong>Problema:</strong> en una web estàtica la clau de Supabase és pública. Qualsevol podria llegir o esborrar els missatges del formulari.",
    c1Solution: "<strong>Solució:</strong> la seguretat està en la base de dades, amb <abbr title=\"Row Level Security\">RLS</abbr>. Els visitants només poden inserir; només el meu compte pot llegir, editar i esborrar. El panell escapa tot el que mostra per a evitar XSS.",
    c2Title: "Llampec en carregar amb el tema clar",
    c2Problem: "<strong>Problema:</strong> la pàgina es pintava fosca i després canviava a clara: un llampec molest en cada visita.",
    c2Solution: "<strong>Solució:</strong> un script mínim en el <code>&lt;head&gt;</code> aplica el tema guardat abans de pintar. Tots els colors són variables CSS, així que canviar de tema és canviar un atribut.",
    c3Title: "Un carrusel 3D que funcione amb teclat",
    c3Problem: "<strong>Problema:</strong> les targetes només responien al ratolí. Amb teclat o lector de pantalla no es podien usar.",
    c3Solution: "<strong>Solució:</strong> focus amb Tab, gir amb Intro o Espai, fletxes per a canviar de targeta, <code>aria-pressed</code> per a l'estat i pausa del gir automàtic mentre hi ha focus. Resultat: 0 errors en axe.",
    c4Title: "Codi repetit en quatre pàgines",
    c4Problem: "<strong>Problema:</strong> les partícules, el tema i molts estils estaven copiats en cada pàgina. Un arreglament s'havia de fer quatre vegades.",
    c4Solution: "<strong>Solució:</strong> vaig reorganitzar el projecte en <code>css/</code>, <code>js/</code> i <code>data/</code> i vaig traure els components comuns a fitxers compartits.",
    c5Title: "Un xatbot sense IA ni servidor",
    c5Problem: "<strong>Problema:</strong> un model d'IA costa diners, afig latència i necessita una clau que no es pot amagar en el navegador.",
    c5Solution: "<strong>Solució:</strong> un cercador difús propi amb distància de Levenshtein, que entén faltes d'ortografia, i 116 intencions en un JSON editable sense tocar codi.",
    c6Title: "Els límits de les API",
    c6Problem: "<strong>Problema:</strong> l'API de GitHub sense token només permet 60 peticions per hora, i els cercadors llançaven una petició per cada lletra.",
    c6Solution: "<strong>Solució:</strong> memòria cau d'una hora en <code>localStorage</code> per a GitHub i, en els cercadors, espera de 500 ms abans de cercar i memòria cau per cerca.",

    demoTitle: "Demo en vídeo",
    demoSub: "Un recorregut de menys de dos minuts per la web, amb subtítols en castellà i valencià.",
    demoFallback: "Descarregar el vídeo",
    demoTranscriptT: "Veure el que apareix en el vídeo",
    demoTranscript:
      "<li>Portada amb l'hero rotatiu i la presentació.</li>" +
      "<li>Canvi a tema clar, color blau i valencià.</li>" +
      "<li>Projectes filtrables i visor de certificats.</li>" +
      "<li>Farolillo, la mascota-xatbot, responent preguntes.</li>" +
      "<li>Carrusel 3D de videojocs manejat amb el teclat.</li>" +
      "<li>Elecció de Matrix i pàgina d'anime amb la targeta giratòria.</li>" +
      "<li>El grimori 3D de llibres passant pàgines.</li>" +
      "<li>Combat del minijoc JRPG.</li>" +
      "<li>Versió mòbil de la portada i d'aquest cas d'estudi.</li>",

    resTitle: "Resultat i aprenentatges",
    resSub: "El que funciona, el que he aprés i el que faria diferent.",
    resOkT: "Resultat",
    resOk:
      "<li>Web publicada a GitHub Pages</li>" +
      "<li>9 pàgines en castellà i valencià</li>" +
      "<li>Funciona en mòbil, tauleta i escriptori</li>" +
      "<li>0 errors d'axe (WCAG 2.1 AA) en les pàgines públiques</li>" +
      "<li>Lighthouse: 100 en accessibilitat i SEO en totes les pàgines</li>" +
      "<li>Formulari de contacte protegit amb RLS</li>" +
      "<li>Avís per correu i resposta automàtica amb una Edge Function, amb 15 proves automàtiques</li>",
    resLearnT: "Què he aprés",
    resLearn:
      "<li>La seguretat està en el servidor, no en amagar claus.</li>" +
      "<li>L'accessibilitat costa menys si es pensa des del principi.</li>" +
      "<li>Commits xicotets amb missatges clars m'han estalviat temps en buscar errors.</li>" +
      "<li>Una bona estructura de carpetes fa que el projecte cresca sense trencar-se.</li>",
    resNextT: "Què faria diferent i pròxims passos",
    resNext:
      "<li>Organitzar les carpetes des del primer dia, no al final.</li>" +
      "<li>Portar les claus de RAWG i TMDB a una Edge Function de Supabase.</li>" +
      "<li>Usar un domini propi per a enviar els correus.</li>" +
      "<li>Ampliar les proves automàtiques a la resta de la web.</li>",
    backProjects: "← Tornar a projectes",

    contactTitle: "Contacte",
    contactDesc: "Interessat a parlar sobre desenvolupament de programari, projectes o col·laborar? Escriu-me.",
    contactAddress: "Obert a consultes acadèmiques, projectes compartits i connexions professionals.",
    contactSend: "Enviar correu",
    copyWeb: "Web personal."
  };

  /* ---------- El castellano es el HTML original ---------- */
  const textNodes = Array.from(document.querySelectorAll("[data-i18n]"));
  const ariaNodes = Array.from(document.querySelectorAll("[data-i18n-aria]"));
  const ES = {
    docTitle: document.title,
    btnLabel: "VA",
    btnTitle: "Canviar a valencià"
  };
  textNodes.forEach((el) => { ES[el.dataset.i18n] = el.innerHTML; });
  ariaNodes.forEach((el) => { ES[el.dataset.i18nAria] = el.getAttribute("aria-label"); });

  let current = "es";
  try {
    const saved = localStorage.getItem("sergio-lang");
    if (saved === "es" || saved === "va") current = saved;
  } catch (e) {}

  function apply(lang) {
    const t = lang === "va" ? VA : ES;
    root.setAttribute("lang", lang === "va" ? "ca-ES-valencia" : "es");
    document.title = t.docTitle;

    textNodes.forEach((el) => {
      const v = t[el.dataset.i18n];
      if (v !== undefined) el.innerHTML = v;
    });
    ariaNodes.forEach((el) => {
      const v = t[el.dataset.i18nAria];
      if (v !== undefined) el.setAttribute("aria-label", v);
    });

    if (langToggle) {
      const span = langToggle.querySelector("span");
      if (span) span.textContent = t.btnLabel;
      langToggle.title = t.btnTitle;
      langToggle.setAttribute("aria-label", t.btnTitle);
    }
  }

  if (langToggle) {
    langToggle.addEventListener("click", () => {
      current = current === "es" ? "va" : "es";
      try { localStorage.setItem("sergio-lang", current); } catch (e) {}
      apply(current);
    });
  }

  /* Aparición suave de las secciones (misma clase .reveal que la portada) */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  apply(current);
})();
