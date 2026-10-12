/* =========================================================
   theme.js — Tema claro/oscuro y color de acento
   Componente compartido por TODAS las páginas con navbar.
   - Lee la preferencia guardada (localStorage) o la del sistema.
   - Botones #themeToggle y #accentToggle (si existen).
   - Mantiene aria-pressed, aria-label y title en el idioma
     activo, y el <meta name="theme-color"> del navegador.
   El script inline del <head> aplica el tema ANTES de pintar
   (evita el parpadeo); este archivo solo gestiona los botones.
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.getElementById("themeToggle");
  const accentButton = document.getElementById("accentToggle");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const LABELS = {
    es: {
      toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro",
      toBlue: "Cambiar a acento azul", toPink: "Cambiar a acento rosa"
    },
    va: {
      toLight: "Canviar a mode clar", toDark: "Canviar a mode fosc",
      toBlue: "Canviar a accent blau", toPink: "Canviar a accent rosa"
    }
  };

  const lang = () => ((root.getAttribute("lang") || "es").toLowerCase().startsWith("ca") ? "va" : "es");

  /* ---------- Estado inicial ---------- */
  let theme = store.get("sergio-theme");
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  let accent = store.get("sergio-accent") === "blue" ? "blue" : "pink";

  root.setAttribute("data-theme", theme);
  root.setAttribute("data-accent", accent);

  /* ---------- Interfaz accesible ---------- */
  function updateUI() {
    const t = LABELS[lang()];
    const isLight = theme === "light";
    const isBlue = accent === "blue";

    if (themeButton) {
      const label = isLight ? t.toDark : t.toLight;
      themeButton.setAttribute("aria-label", label);
      themeButton.title = label;
      // "Pulsado" = modo claro activado (el oscuro es el de por defecto)
      themeButton.setAttribute("aria-pressed", String(isLight));
    }

    if (accentButton) {
      const label = isBlue ? t.toPink : t.toBlue;
      accentButton.setAttribute("aria-label", label);
      accentButton.title = label;
      accentButton.setAttribute("aria-pressed", String(isBlue));
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", isLight ? "#e8e1d5" : "#07070a");
    }
  }

  /* ---------- Eventos ---------- */
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", theme);
      store.set("sergio-theme", theme);
      updateUI();
    });
  }

  if (accentButton) {
    accentButton.addEventListener("click", () => {
      accent = accent === "pink" ? "blue" : "pink";
      root.setAttribute("data-accent", accent);
      store.set("sergio-accent", accent);
      updateUI();
    });
  }

  // Al cambiar de idioma (todas las páginas cambian <html lang>) se traducen las etiquetas
  new MutationObserver(updateUI).observe(root, { attributes: true, attributeFilter: ["lang"] });

  updateUI();
})();
