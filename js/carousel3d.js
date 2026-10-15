/* =========================================================
   carousel3d.js — Carrusel 3D con tarjetas que se voltean
   Componente compartido por juegos.html y cine.html
   (antes el mismo código estaba copiado en las dos páginas).
   Marcado esperado: .scene > #carousel > .carousel-card
   (cada una con .card-inner > .card-front + .card-back)
   y los botones #btnPrev / #btnNext.
   ========================================================= */
(function () {
  "use strict";

  const carousel = document.getElementById('carousel');
  if (!carousel) return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cards = document.querySelectorAll('.carousel-card');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  const numCards = cards.length;
  const theta = 360 / numCards; 
  let radius = 0;

  let currentAngle = 0;
  let targetAngle = 0;
  let isHovered = false;
  // Con "reducir movimiento" el carrusel no gira solo
  const autoSpeed = REDUCED ? 0 : 0.12;

  function calculateRadius() {
    const isMobile = window.innerWidth <= 768;
    const cardWidth = isMobile ? 240 : 300;
    const offset = isMobile ? 40 : 150; 
    return Math.round((cardWidth / 2) / Math.tan(Math.PI / numCards)) + offset;
  }

  function updateCarouselPositions() {
    radius = calculateRadius();
    cards.forEach((card, i) => {
      const angle = theta * i;
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
    carousel.style.transform = `translateZ(${-radius}px) rotateY(${currentAngle}deg)`;
  }

  function renderCarousel() {
    if (!isHovered) {
      targetAngle -= autoSpeed; 
    }
  
    currentAngle += (targetAngle - currentAngle) * 0.08;
    carousel.style.transform = `translateZ(${-radius}px) rotateY(${currentAngle}deg)`;
  
    let normalizedTarget = ((currentAngle % 360) + 360) % 360;
    let activeIndex = Math.round((360 - normalizedTarget) / theta) % numCards;
    if(activeIndex === numCards) activeIndex = 0;
  
    cards.forEach((card, i) => {
      if(i === activeIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
        if (Math.abs(targetAngle - currentAngle) < 1 && card.classList.contains('flipped')) {
          card.classList.remove('flipped');
          card.setAttribute('aria-pressed', 'false');
        }
      }
    });

    requestAnimationFrame(renderCarousel);
  }

  btnNext.addEventListener('click', () => {
  targetAngle = Math.round(targetAngle / theta) * theta - theta;
  });

  btnPrev.addEventListener('click', () => {
  targetAngle = Math.round(targetAngle / theta) * theta + theta;
  });

  /* Gira el anillo hasta dejar la tarjeta i de frente */
  function bringToFront(i) {
    const currentSnap = Math.round(targetAngle / theta) * theta;
    const activeI = Math.round((360 - (((currentSnap % 360) + 360) % 360)) / theta) % numCards;
    let dist = i - activeI;
    if (dist > numCards / 2) dist -= numCards;
    if (dist < -numCards / 2) dist += numCards;
    targetAngle = currentSnap - (dist * theta);
  }

  function activate(card, i) {
    if (card.classList.contains('active')) {
      card.classList.toggle('flipped');
    } else {
      bringToFront(i);
    }
    syncPressed();
  }

  /* aria-pressed = la tarjeta muestra su reverso */
  function syncPressed() {
    cards.forEach((c) => c.setAttribute('aria-pressed', String(c.classList.contains('flipped'))));
  }

  /* ---------- Accesibilidad: cada tarjeta es un botón usable con teclado ---------- */
  const isVa = () => (document.documentElement.getAttribute('lang') || '').startsWith('ca');
  function labelCards() {
    const hint = isVa() ? 'prem Intro per a girar-la' : 'pulsa Intro para girarla';
    cards.forEach((card) => {
      const title = card.querySelector('.card-back :is(h2, h3)');
      card.setAttribute('aria-label', (title ? title.textContent.trim() : '') + ': ' + hint);
    });
  }

  cards.forEach((card, i) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    card.addEventListener('click', () => activate(card, i));

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate(card, i);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Flechas: pasar a la tarjeta siguiente / anterior y llevar el foco
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + numCards) % numCards;
        bringToFront(next);
        cards[next].focus({ preventScroll: true });
      }
    });

    // Al llegar con Tab, la tarjeta gira hasta quedar de frente
    card.addEventListener('focus', () => {
      if (!card.classList.contains('active')) bringToFront(i);
    });
  });

  // Con el foco dentro del carrusel deja de girar solo (igual que con el ratón encima)
  carousel.addEventListener('focusin', () => { isHovered = true; });
  carousel.addEventListener('focusout', (e) => {
    if (!carousel.contains(e.relatedTarget)) isHovered = false;
  });

  new MutationObserver(labelCards).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  labelCards();
  syncPressed();

  // Eventos para PAUSAR solo cuando estás realmente encima de las tarjetas
  carousel.addEventListener('mouseenter', () => isHovered = true);
  carousel.addEventListener('mouseleave', () => isHovered = false);

  // Controles táctiles (solo en las tarjetas)
  carousel.addEventListener('touchstart', () => isHovered = true, {passive: true});
  carousel.addEventListener('touchend', () => {
      setTimeout(() => isHovered = false, 1500);
  }, {passive: true});

  // Control de deslizamiento táctil para móviles (Swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    isHovered = true;
    touchStartX = e.changedTouches[0].screenX;
  }, {passive: true});

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchStartX - touchEndX;

    // Si desliza horizontalmente más de 40px
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Desliza a la izquierda -> siguiente
        targetAngle = Math.round(targetAngle / theta) * theta - theta;
      } else {
        // Desliza a la derecha -> anterior
        targetAngle = Math.round(targetAngle / theta) * theta + theta;
      }
    }

    setTimeout(() => isHovered = false, 2000);
  }, {passive: true});

  window.addEventListener('resize', updateCarouselPositions);
  updateCarouselPositions();
  requestAnimationFrame(renderCarousel);
})();
