/* =========================================================
   page-i18n.js — Idioma de las páginas de texto
   Componente compartido por caso-estudio.html y privacidad.html.
   - El castellano es el HTML original: se guarda al cargar.
   - Cada página pasa su valenciano con las mismas claves que
     sus atributos data-i18n (contenido) y data-i18n-aria
     (aria-label). docTitle traduce el <title>.
   - Usa la preferencia común (localStorage "sergio-lang") y
     cambia <html lang>, así theme.js y nav-i18n.js se traducen
     solos.
   Uso:  window.pageI18n({ docTitle: "…", clave: "…" });
   ========================================================= */
(function () {
  "use strict";

  const BOTON = {
    es: { label: "VA", title: "Canviar a valencià" },
    va: { label: "ES", title: "Cambiar a castellano" }
  };

  window.pageI18n = function (VA) {
    const root = document.documentElement;
    const langToggle = document.getElementById("langToggle");
    const textNodes = Array.from(document.querySelectorAll("[data-i18n]"));
    const ariaNodes = Array.from(document.querySelectorAll("[data-i18n-aria]"));

    /* ---------- El castellano es el HTML original ---------- */
    const ES = { docTitle: document.title };
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
      if (t.docTitle) document.title = t.docTitle;

      textNodes.forEach((el) => {
        const v = t[el.dataset.i18n];
        if (v !== undefined) el.innerHTML = v;
      });
      ariaNodes.forEach((el) => {
        const v = t[el.dataset.i18nAria];
        if (v !== undefined) el.setAttribute("aria-label", v);
      });

      if (langToggle) {
        const b = BOTON[lang];
        const span = langToggle.querySelector("span");
        if (span) span.textContent = b.label;
        langToggle.title = b.title;
        langToggle.setAttribute("aria-label", b.title);
      }
    }

    if (langToggle) {
      langToggle.addEventListener("click", () => {
        current = current === "es" ? "va" : "es";
        try { localStorage.setItem("sergio-lang", current); } catch (e) {}
        apply(current);
      });
    }

    apply(current);
  };
})();
