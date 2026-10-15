(function () {
  const L = {
    es: { home: 'Inicio', libros: 'Libros', cine: 'Cine', anime: 'Anime', juegos: 'Videojuegos', replay: 'Jugar de nuevo', skip: 'Saltar al contenido principal' },
    va: { home: 'Inici',  libros: 'Llibres', cine: 'Cinema', anime: 'Anime', juegos: 'Videojocs',  replay: 'Jugar de nou', skip: 'Anar al contingut principal' }
  };
  const root = document.documentElement;

  function lang() {
    let l = null;
    try { l = localStorage.getItem('sergio-lang'); } catch (e) {}
    if (l !== 'es' && l !== 'va') {
      const a = (root.getAttribute('lang') || 'es').toLowerCase();
      l = (a === 'va' || a.startsWith('ca')) ? 'va' : 'es';
    }
    return l;
  }

  function apply() {
    const t = L[lang()];
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const v = t[a.dataset.nav];
      if (v && a.textContent !== v) a.textContent = v;
    });
  }

  // Todas las páginas cambian el atributo lang al pulsar VA/ES
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['lang'] });
  apply();
})();