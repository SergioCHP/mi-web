/* =========================================================
   a11y.js — Utilidades de accesibilidad compartidas
   Se cargan antes que los scripts de cada página.
   - a11y.hacerAccesible(el, etiqueta): un elemento clicable que no es
     <button> (tarjetas de resultados) pasa a ser usable con teclado.
   - a11y.modal(modalEl, cerrar): el foco entra en el diálogo, Tab no se
     escapa de él, Esc lo cierra y al cerrar el foco vuelve al botón
     que lo abrió.
   ========================================================= */
(function () {
  "use strict";

  const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([type='hidden']):not([tabindex='-1'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function hacerAccesible(el, etiqueta) {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    if (etiqueta) el.setAttribute("aria-label", etiqueta);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  }

  function modal(modalEl, cerrar) {
    let anterior = null;

    // Solo cuenta lo que se ve (ignora formularios ocultos, honeypot, etc.)
    const enfocables = () =>
      [...modalEl.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest("[hidden]") && el.getClientRects().length);

    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      if (!lista.length) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      // Si el foco quedó fuera del diálogo, se devuelve dentro
      if (!modalEl.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
      } else if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    return {
      abierto(destino) {
        anterior = document.activeElement;
        // En document (no en el diálogo): Esc funciona aunque el foco no haya entrado
        document.addEventListener("keydown", onKeydown);
        // El diálogo aparece con una transición CSS: se enfoca en el siguiente
        // fotograma y se reintenta por si aún no era visible
        const enfocar = () => {
          const el = destino || enfocables()[0];
          if (el && !modalEl.contains(document.activeElement)) el.focus();
        };
        requestAnimationFrame(enfocar);
        setTimeout(enfocar, 120);
      },
      cerrado() {
        document.removeEventListener("keydown", onKeydown);
        if (anterior && typeof anterior.focus === "function") anterior.focus();
        anterior = null;
      }
    };
  }

  window.a11y = { hacerAccesible, modal };
})();
