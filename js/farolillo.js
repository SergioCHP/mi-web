/**
 * Farolillo · espíritu-farolillo interactivo para mi-web.
 *
 * Uso:
 *   import { initFarolillo } from './farolillo.js';
 *   initFarolillo();
 *
 * Opciones:
 *   posicion     'izquierda' (por defecto) | 'derecha'.
 *   contenedor   Elemento donde se inserta (por defecto document.body).
 *   textos       { es: {...}, va: {...} } para sobrescribir textos.
 *   respuestas   URL del archivo de respuestas (por defecto 'data/respuestas.json').
 *   responder    async (texto, { idioma }) => string | { texto, enlace, efecto, sugerencias }
 *                Solo si quieres sustituir el buscador por otro sistema (backend, IA…).
 *   detectar     () => 'claro' | 'oscuro'. Por defecto lee data-theme.
 *   comentarios  true: comenta las secciones (#sobre-mi, #proyectos…) al hacer scroll.
 *   pagina       por defecto el nombre del archivo (juegos, libros…). Cambia saludo, pista y sugerencias,
 *                y da contexto al buscador («recomiéndame uno» en juegos.html recomienda un juego).
 *   tiempoSueno  ms de inactividad hasta que se duerme (por defecto 30000).
 *
 * Colores: usa las variables de tu web (--accent, --accent-alt, --surface,
 * --text, --font-display…), así que cambia solo con el tema y el acento.
 * Idioma: lee el atributo lang de <html> (es / va) y cambia en directo.
 *
 * API devuelta: { abrir, cerrar, ocultar, mostrar, decir(texto), celebrar(), truco(nombre), destruir }
 * Código Konami (↑↑↓↓←→←→BA en la caja de texto): alterna el modo 8 bits; se guarda en localStorage (farolillo-retro).
 * Trucos (efecto de una respuesta): sable, sable-rojo, varita, anillo, kamehameha, final-flash, bola, corte,
 * rasengan, aura, kaioken, matrix, gafas, caja, baston, onda, estirar, amor, kamikaze · «truco» = uno al azar.
 * Esconder: botón del ojo en la cabecera del chat (o escribir «escóndete»). Queda una pestañita
 * en el borde para volver; la preferencia se guarda en localStorage (farolillo-oculto).
 */

const TEXTOS = {
  es: {
    nombre: 'Farolillo',
    estado: 'Espíritu · en línea',
    abrir: 'Abrir chat con Farolillo',
    cerrar: 'Cerrar chat',
    placeholder: 'Pregúntame algo…',
    enviar: 'Enviar',
    sugerencias: 'Sugerencias',
    pista: '¿Hablamos?',
    pistaInicial: 'Psst… soy Farolillo. Tócame o arrástrame ✨',
    saludo: '¡Hola! Soy Farolillo, el espíritu que ilumina esta web. Pregúntame lo que quieras o toca una opción 👇',
    error: 'Se me ha apagado la llama un momento. Prueba otra vez.',
    noEntiendo: 'Aún estoy aprendiendo. Prueba con libros, cine, anime, juegos o proyectos.',
    chips: ['¿Quién es Sergio?', 'Juegos', 'Pelis', 'Anime', 'Libros', 'Sorpréndeme', 'Un chiste'],
    mareo: '¡Para, que me mareo! 😵‍💫',
    despertar: '¡Ay! Estaba soñando con píxeles…',
    noche: 'Se ha hecho de noche. Ahora brillo más 🔥',
    dia: 'Buenos días. Modo ahorro de llama ☀️',
    acentoRosa: 'Rosa neón. Me sienta genial 💗',
    acentoAzul: 'Azul eléctrico. Qué estilo ⚡',
    pillaBurlas: ['¡Por aquí!', '¡Casi! 😝', 'Nananana', '¡Más rápido!', 'Soy un farol, no un caracol', '¿Eso es todo?', '¡Uy, por poco!'],
    pillaAtrapado: ['¡Me pillaste! 🎉 Eres más rápido que el Flash.', '¡Atrapado! Vale, vale, me rindo 🏳️', '¡Noooo! Me has pillado. Exijo la revancha.'],
    pillaEscapa: ['¡15 segundos y no me has pillado! 😎', '¡Se acabó el tiempo! El farol más rápido del oeste.', '¡Gané! Escribe «juega conmigo» para la revancha.'],
    pillaReducido: 'Con «reducir movimiento» activado no puedo correr… ¡pero cuenta como que me has pillado! 🏳️',
    retroOn: '▶ CÓDIGO ACEPTADO\n¡Modo 8 bits activado! 👾 Ahora soy un sprite de consola retro. Vuelve a meter el código para recuperar mis 16 millones de colores.',
    retroOff: '▶ CÓDIGO ACEPTADO\nModo 8 bits desactivado. ¡Vuelvo a la alta definición! ✨',
    ocultar: 'Esconder a Farolillo',
    mostrar: 'Mostrar a Farolillo',
    vuelta: '¡He vuelto! 🏮',
    arrastre: ['¡Eh, suéltame!', '¡Wiiiii!', 'Que me despeinas la llama…', '¡Cuidado, que soy de papel!'],
    aterrizaje: ['Todo me da vueltas… 😵‍💫', '¡Otra vez! … No, mejor no.', 'Mis costillas de papel… 🤕', '¿Eso era un vuelo o un examen sorpresa?'],
    secciones: {
      'sobre-mi': 'Aquí Sergio cuenta quién es y por qué programa.',
      'lo-que-he-hecho': 'De SMR a DAM, con certificaciones Cisco incluidas.',
      'me-gusta': 'Juegos, cine, anime y libros. Pregúntame por cualquiera.',
      proyectos: 'Sus proyectos. Usa los filtros o pregúntame.',
      contacto: '¿Quieres hablar con Sergio? Tienes su contacto aquí.',
      buscador: '¿Buscas un juego? Escríbelo aquí y te saco la ficha completa.',
      buscadorCine: 'Busca cualquier peli aquí, aunque no esté en su top.',
      buscadorAnime: '¿Otro anime? Búscalo aquí y te traigo su ficha.',
      minijuego: 'Aquí cuenta cómo hizo el minijuego. Pregúntame lo que quieras.',
    },
    /* Lo que cambia según la página (saludo, pista al llegar y sugerencias) */
    paginas: {
      juegos: {
        saludo: '¡Has superado el reto! Bienvenido a la sala de juegos 🎮 Pregúntame por cualquiera de su top o por su colección.',
        pistaInicial: '¡Lo conseguiste! Pregúntame por sus juegos 🎮',
        chips: ['Recomiéndame un juego', '¿A qué juega ahora?', 'Su colección', 'Primera consola', 'Quiz de Sergio'],
      },
      libros: {
        saludo: '¡Bienvenido al grimorio! 📖 Pasa las páginas o pregúntame por sus libros.',
        pistaInicial: 'Psst… pregúntame por cualquier libro 📖',
        chips: ['Recomiéndame un libro', '¿Cómo funciona el grimorio?', 'Cómics', '¿Qué no le gusta leer?'],
      },
      cine: {
        saludo: '¡Bienvenido a la sala de cine! 🎬 Palomitas aparte, pregúntame por sus pelis.',
        pistaInicial: 'Psst… ¿te recomiendo una peli? 🎬',
        chips: ['Recomiéndame una peli', 'Matrix', 'Series', '¿Por qué un farolillo?'],
      },
      anime: {
        saludo: '¡Bienvenido al rincón anime! ⛩️ Pregúntame por sus series o pide una recomendación.',
        pistaInicial: 'Psst… ¿te recomiendo un anime? ⛩️',
        chips: ['Recomiéndame un anime', 'Dragon Ball', 'One Piece', 'Kamehameha'],
      },
      'caso-estudio': {
        saludo: 'Estás en el caso de estudio del minijuego. Si algo no te queda claro, pregúntame 🛠️',
        pistaInicial: '¿Dudas sobre el minijuego? Pregúntame 🛠️',
        chips: ['¿Cómo funciona el minijuego?', 'Jugar', '¿Qué es la POO?', 'Proyectos'],
      },
      privacidad: {
        saludo: 'Estás en la política de privacidad. Te lo resumo: yo no guardo nada de lo que me escribes 🔒',
        pistaInicial: '¿Dudas con tus datos? Te lo explico fácil 🔒',
        chips: ['¿Qué haces con mis datos?', 'Cookies', 'Contacto'],
      },
    },
  },
  va: {
    nombre: 'Farolillo',
    estado: 'Esperit · en línia',
    abrir: 'Obrir xat amb Farolillo',
    cerrar: 'Tancar xat',
    placeholder: 'Pregunta’m alguna cosa…',
    enviar: 'Enviar',
    sugerencias: 'Suggeriments',
    pista: 'Parlem?',
    pistaInicial: 'Psst… sóc Farolillo. Toca’m o arrossega’m ✨',
    saludo: 'Hola! Sóc Farolillo, l’esperit que il·lumina esta web. Pregunta’m el que vulgues o toca una opció 👇',
    error: 'Se m’ha apagat la flama un moment. Torna-ho a provar.',
    noEntiendo: 'Encara estic aprenent. Prova amb llibres, cinema, anime, jocs o projectes.',
    chips: ['Qui és Sergio?', 'Jocs', 'Pel·lis', 'Anime', 'Llibres', 'Sorprén-me', 'Un acudit'],
    mareo: 'Para, que em maree! 😵‍💫',
    despertar: 'Ai! Estava somiant amb píxels…',
    noche: 'S’ha fet de nit. Ara brille més 🔥',
    dia: 'Bon dia. Mode estalvi de flama ☀️',
    acentoRosa: 'Rosa neó. Em queda genial 💗',
    acentoAzul: 'Blau elèctric. Quin estil ⚡',
    pillaBurlas: ['Per ací!', 'Quasi! 😝', 'Nananana', 'Més ràpid!', 'Soc un fanal, no un caragol', 'Això és tot?', 'Ui, per poc!'],
    pillaAtrapado: ['M’has pillat! 🎉 Eres més ràpid que el Flash.', 'Atrapat! Vale, vale, em rendisc 🏳️', 'Noooo! M’has pillat. Exigisc la revenja.'],
    pillaEscapa: ['15 segons i no m’has pillat! 😎', 'S’ha acabat el temps! El fanal més ràpid de l’oest.', 'He guanyat! Escriu «juga amb mi» per a la revenja.'],
    pillaReducido: 'Amb «reduir moviment» activat no puc córrer… però compta com que m’has pillat! 🏳️',
    retroOn: '▶ CODI ACCEPTAT\nMode 8 bits activat! 👾 Ara soc un sprite de consola retro. Torna a posar el codi per a recuperar els meus 16 milions de colors.',
    retroOff: '▶ CODI ACCEPTAT\nMode 8 bits desactivat. Torne a l’alta definició! ✨',
    ocultar: 'Amagar Farolillo',
    mostrar: 'Mostrar Farolillo',
    vuelta: 'He tornat! 🏮',
    arrastre: ['Eh, solta’m!', 'Iuuuuu!', 'Que em despentines la flama…', 'Compte, que soc de paper!'],
    aterrizaje: ['Tot em dona voltes… 😵‍💫', 'Una altra vegada! … No, millor no.', 'Les meues costelles de paper… 🤕', 'Allò era un vol o un examen sorpresa?'],
    secciones: {
      'sobre-mi': 'Ací Sergio conta qui és i per què programa.',
      'lo-que-he-hecho': 'De SMR a DAM, amb certificacions Cisco incloses.',
      'me-gusta': 'Jocs, cinema, anime i llibres. Pregunta’m per qualsevol.',
      proyectos: 'Els seus projectes. Usa els filtres o pregunta’m.',
      contacto: 'Vols parlar amb Sergio? Tens el seu contacte ací.',
      buscador: 'Busques un joc? Escriu-lo ací i et trac la fitxa completa.',
      buscadorCine: 'Busca qualsevol pel·li ací, encara que no estiga al seu top.',
      buscadorAnime: 'Un altre anime? Busca’l ací i et porte la fitxa.',
      minijuego: 'Ací conta com va fer el minijoc. Pregunta’m el que vulgues.',
    },
    paginas: {
      juegos: {
        saludo: 'Has superat el repte! Benvingut a la sala de jocs 🎮 Pregunta’m per qualsevol del seu top o per la seua col·lecció.',
        pistaInicial: 'Ho has aconseguit! Pregunta’m pels seus jocs 🎮',
        chips: ['Recomana’m un joc', 'A què juga ara?', 'La seua col·lecció', 'Primera consola', 'Quiz de Sergio'],
      },
      libros: {
        saludo: 'Benvingut al grimori! 📖 Passa les pàgines o pregunta’m pels seus llibres.',
        pistaInicial: 'Psst… pregunta’m per qualsevol llibre 📖',
        chips: ['Recomana’m un llibre', 'Com funciona el grimori?', 'Còmics', 'Què no li agrada llegir?'],
      },
      cine: {
        saludo: 'Benvingut a la sala de cinema! 🎬 Crispetes a banda, pregunta’m per les seues pel·lis.',
        pistaInicial: 'Psst… et recomane una pel·li? 🎬',
        chips: ['Recomana’m una pel·li', 'Matrix', 'Sèries', 'Per què un fanalet?'],
      },
      anime: {
        saludo: 'Benvingut al racó anime! ⛩️ Pregunta’m per les seues sèries o demana una recomanació.',
        pistaInicial: 'Psst… et recomane un anime? ⛩️',
        chips: ['Recomana’m un anime', 'Dragon Ball', 'One Piece', 'Kamehameha'],
      },
      'caso-estudio': {
        saludo: 'Estàs en el cas d’estudi del minijoc. Si alguna cosa no et queda clara, pregunta’m 🛠️',
        pistaInicial: 'Dubtes sobre el minijoc? Pregunta’m 🛠️',
        chips: ['Com funciona el minijoc?', 'Jugar', 'Què és la POO?', 'Projectes'],
      },
      privacidad: {
        saludo: 'Estàs en la política de privacitat. T’ho resumisc: jo no guarde res del que m’escrius 🔒',
        pistaInicial: 'Dubtes amb les teues dades? T’ho explique fàcil 🔒',
        chips: ['Què fas amb les meues dades?', 'Cookies', 'Contacte'],
      },
    },
  },
};

/* Respaldo mínimo por si no se puede cargar respuestas.json (mismo formato que el archivo). */
const RESPALDO = {
  porDefecto: {
    es: ['Ahora mismo no encuentro mi libro de respuestas. Prueba con libros, cine, anime o juegos.'],
    va: ['Ara mateix no trobe el meu llibre de respostes. Prova amb llibres, cinema, anime o jocs.'],
  },
  intenciones: [
    { id: 'saludo', frases: ['hola', 'buenas', 'bon dia'], es: ['¡Hola! Pregúntame por libros, cine, anime o juegos.'], va: ['Hola! Pregunta’m per llibres, cinema, anime o jocs.'] },
    { id: 'libros', frases: ['libro', 'libros', 'llibre', 'llibres', 'leer'], es: ['Los libros viven en el grimorio:'], va: ['Els llibres viuen en el grimori:'], enlace: { href: 'libros.html', es: 'Abrir el grimorio', va: 'Obrir el grimori' } },
    { id: 'cine', frases: ['cine', 'peli', 'pelis', 'pelicula', 'cinema'], es: ['Su sala de cine:'], va: ['La seua sala de cinema:'], enlace: { href: 'cine.html', es: 'Ir a Cine', va: 'Anar a Cinema' } },
    { id: 'anime', frases: ['anime', 'manga'], es: ['Su rincón anime:'], va: ['El seu racó anime:'], enlace: { href: 'anime.html', es: 'Ir a Anime', va: 'Anar a Anime' } },
    { id: 'juegos', frases: ['juego', 'juegos', 'joc', 'jocs'], es: ['Primero tendrás que superar el reto:'], va: ['Primer hauràs de superar el repte:'], enlace: { href: 'juegos.html', es: 'Ir a Juegos', va: 'Anar a Jocs' } },
    { id: 'fuegos', frases: ['fuegos', 'focs'], es: ['¡Fuegos artificiales! 🎆'], va: ['Focs artificials! 🎆'], efecto: 'fuegos' },
  ],
};

/* Ojo tachado: esconder a Farolillo */
const ICONO_OCULTAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12s3.5-6 9-6c1.6 0 3 .5 4.2 1.2M21 12s-3.5 6-9 6c-1.6 0-3-.5-4.2-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><line x1="4" y1="4" x2="20" y2="20"/></svg>';
/* Farolillo en miniatura para la pestaña de «volver» */
const ICONO_MINI = '<svg viewBox="0 0 24 32" aria-hidden="true"><path class="farol-mini__llama" d="M12 1c-2 2.5-3 4-1.6 6.2C9 7 8.6 5.6 8.8 4.4 7 6.6 7.6 9 9.4 10h5.2c2-1.4 2-4.6-2.6-9z"/><rect class="farol-mini__tapa" x="7" y="9.5" width="10" height="2.6" rx="1.2"/><ellipse class="farol-mini__papel" cx="12" cy="20" rx="9" ry="8.6"/><rect class="farol-mini__tapa" x="7.6" y="27.6" width="8.8" height="2.4" rx="1.1"/></svg>';
const ICONO_CERRAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const ICONO_ENVIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';

const SVG = `
<svg class="farol-svg" viewBox="0 0 140 200" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="farol-g-halo">
      <stop offset="0" class="farol-stop-a" stop-opacity=".55"/>
      <stop offset=".55" class="farol-stop-a" stop-opacity=".14"/>
      <stop offset="1" class="farol-stop-a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="farol-g-papel" cx=".5" cy=".55" r=".62">
      <stop offset="0" class="farol-stop-centro"/>
      <stop offset=".55" class="farol-stop-medio"/>
      <stop offset="1" class="farol-stop-borde"/>
    </radialGradient>
    <radialGradient id="farol-g-luz">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="farol-g-llama" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".35" class="farol-stop-a"/>
      <stop offset="1" class="farol-stop-b"/>
    </linearGradient>
    <linearGradient id="farol-g-cola" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="farol-stop-b" stop-opacity=".85"/>
      <stop offset="1" class="farol-stop-b" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <circle class="farol-halo" cx="70" cy="96" r="80" fill="url(#farol-g-halo)"/>
  <circle class="farol-hud" cx="70" cy="96" r="66" fill="none" stroke-width="1.2" stroke-dasharray="3 8"/>
  <circle class="farol-hud farol-hud--2" cx="70" cy="96" r="73" fill="none" stroke-width="1.8" stroke-dasharray="46 180" stroke-linecap="round"/>
  <path class="farol-cola" fill="url(#farol-g-cola)"
        d="M56 150 C48 166 62 174 68 182 C74 190 70 196 62 200 C84 197 92 182 84 169 C79 161 86 156 84 150 Z"/>

  <g class="farol-cuerpo">
    <g class="farol-llama-g">
      <path class="farol-llama" fill="url(#farol-g-llama)"
            d="M70 40 C58 36 54 24 60 13 C62 19 65 20 66 20 C65 10 69 4 74 0 C79 9 85 17 81 28 C84 32 80 39 70 40 Z"/>
      <path class="farol-llama-nucleo" fill="#fff"
            d="M70 37 C64 34 63 28 66 22 C67 25 69 26 70 26 C70 22 72 18 74 16 C76 21 77 30 73 34 C72 36 71 37 70 37 Z"/>
    </g>
    <rect class="farol-tapa" x="48" y="36" width="44" height="10" rx="4"/>
    <ellipse class="farol-papel" cx="70" cy="96" rx="52" ry="54" fill="url(#farol-g-papel)"/>
    <ellipse class="farol-luz" cx="70" cy="100" rx="40" ry="40" fill="url(#farol-g-luz)"/>
    <ellipse class="farol-brillo" cx="46" cy="66" rx="13" ry="7" fill="#fff" transform="rotate(-28 46 66)"/>
    <g class="farol-costillas" fill="none" stroke-width="1.3" stroke-linecap="round">
      <path d="M31 60 Q70 68 109 60"/>
      <path d="M20 76 Q70 85 120 76"/>
      <path d="M20 118 Q70 127 120 118"/>
      <path d="M31 134 Q70 141 109 134"/>
      <path d="M50 44 Q29 96 50 148"/>
      <path d="M90 44 Q111 96 90 148"/>
    </g>
    <rect class="farol-tapa" x="50" y="146" width="40" height="9" rx="4"/>

    <g class="farol-cara">
      <ellipse class="farol-mejilla" cx="38" cy="106" rx="7.5" ry="4.2"/>
      <ellipse class="farol-mejilla" cx="102" cy="106" rx="7.5" ry="4.2"/>
      <g class="farol-ojos"><g class="farol-ojos-escala">
        <g class="farol-ojo">
          <ellipse class="farol-tinta" cx="53" cy="90" rx="6.8" ry="8.6"/>
          <circle cx="55.6" cy="86.4" r="2.5" fill="#fff"/>
          <circle cx="51" cy="93.6" r="1.1" fill="#fff" opacity=".7"/>
        </g>
        <g class="farol-ojo">
          <ellipse class="farol-tinta" cx="87" cy="90" rx="6.8" ry="8.6"/>
          <circle cx="89.6" cy="86.4" r="2.5" fill="#fff"/>
          <circle cx="85" cy="93.6" r="1.1" fill="#fff" opacity=".7"/>
        </g>
      </g></g>
      <g class="farol-cara-amor">
        <path d="M53 98 C42 90 45 80 53 85 C61 80 64 90 53 98 Z"/>
        <path d="M87 98 C76 90 79 80 87 85 C95 80 98 90 87 98 Z"/>
      </g>
      <g class="farol-cara-feliz farol-trazo"><path d="M45 93 Q53 83 61 93"/><path d="M79 93 Q87 83 95 93"/></g>
      <g class="farol-cara-dormido farol-trazo"><path d="M45 90 Q53 96 61 90"/><path d="M79 90 Q87 96 95 90"/></g>
      <g class="farol-cara-mareado farol-trazo">
        <path class="farol-espiral" d="M53 90 a1.6 1.6 0 1 1 1.6 1.6 a3.2 3.2 0 1 1 -3.2 -3.2 a4.8 4.8 0 1 1 4.8 4.8 a6.4 6.4 0 1 1 -6.4 -6.4"/>
        <path class="farol-espiral" d="M87 90 a1.6 1.6 0 1 1 1.6 1.6 a3.2 3.2 0 1 1 -3.2 -3.2 a4.8 4.8 0 1 1 4.8 4.8 a6.4 6.4 0 1 1 -6.4 -6.4"/>
      </g>
      <path class="farol-boca farol-trazo" d="M62 107 Q70 115 78 107"/>
      <ellipse class="farol-boca-abierta farol-tinta" cx="70" cy="110" rx="5.2" ry="4.6"/>
      <circle class="farol-boca-o farol-tinta" cx="70" cy="111" r="3.4"/>
    </g>
  </g>
</svg>`;

/* Farolillo en pixel art de 8 bits (modo secreto del código Konami). Generado desde un mapa de 14×20 píxeles. */
const SVG_RETRO = '<svg class="farol-svg-retro" viewBox="0 0 14 20" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="retro-llama retro-llama--a"><rect class="rp-F" x="6" y="0" width="1" height="1"/><rect class="rp-F" x="5" y="1" width="1" height="1"/><rect class="rp-O" x="6" y="1" width="2" height="1"/><rect class="rp-O" x="5" y="2" width="1" height="1"/><rect class="rp-F" x="6" y="2" width="2" height="1"/><rect class="rp-O" x="8" y="2" width="1" height="1"/><rect class="rp-O" x="6" y="3" width="2" height="1"/></g><g class="retro-llama retro-llama--b"><rect class="rp-F" x="7" y="0" width="1" height="1"/><rect class="rp-O" x="6" y="1" width="2" height="1"/><rect class="rp-F" x="8" y="1" width="1" height="1"/><rect class="rp-O" x="5" y="2" width="1" height="1"/><rect class="rp-F" x="6" y="2" width="2" height="1"/><rect class="rp-O" x="8" y="2" width="1" height="1"/><rect class="rp-O" x="6" y="3" width="2" height="1"/></g><g class="retro-cuerpo"><rect class="rp-M" x="4" y="4" width="6" height="1"/><rect class="rp-K" x="3" y="5" width="1" height="1"/><rect class="rp-A" x="4" y="5" width="6" height="1"/><rect class="rp-K" x="10" y="5" width="1" height="1"/><rect class="rp-K" x="2" y="6" width="1" height="1"/><rect class="rp-A" x="3" y="6" width="1" height="1"/><rect class="rp-L" x="4" y="6" width="6" height="1"/><rect class="rp-A" x="10" y="6" width="1" height="1"/><rect class="rp-K" x="11" y="6" width="1" height="1"/><rect class="rp-K" x="1" y="7" width="1" height="1"/><rect class="rp-A" x="2" y="7" width="1" height="1"/><rect class="rp-L" x="3" y="7" width="2" height="1"/><rect class="rp-W" x="5" y="7" width="2" height="1"/><rect class="rp-L" x="7" y="7" width="4" height="1"/><rect class="rp-A" x="11" y="7" width="1" height="1"/><rect class="rp-K" x="12" y="7" width="1" height="1"/><rect class="rp-K" x="1" y="8" width="1" height="1"/><rect class="rp-A" x="2" y="8" width="1" height="1"/><rect class="rp-S" x="3" y="8" width="8" height="1"/><rect class="rp-A" x="11" y="8" width="1" height="1"/><rect class="rp-K" x="12" y="8" width="1" height="1"/><rect class="rp-K" x="0" y="9" width="1" height="1"/><rect class="rp-A" x="1" y="9" width="1" height="1"/><rect class="rp-L" x="2" y="9" width="2" height="1"/><rect class="rp-C" x="4" y="9" width="6" height="1"/><rect class="rp-L" x="10" y="9" width="2" height="1"/><rect class="rp-A" x="12" y="9" width="1" height="1"/><rect class="rp-K" x="13" y="9" width="1" height="1"/><rect class="rp-K" x="0" y="10" width="1" height="1"/><rect class="rp-A" x="1" y="10" width="1" height="1"/><rect class="rp-L" x="2" y="10" width="1" height="1"/><rect class="rp-C" x="3" y="10" width="8" height="1"/><rect class="rp-L" x="11" y="10" width="1" height="1"/><rect class="rp-A" x="12" y="10" width="1" height="1"/><rect class="rp-K" x="13" y="10" width="1" height="1"/><rect class="rp-K" x="0" y="11" width="1" height="1"/><rect class="rp-A" x="1" y="11" width="1" height="1"/><rect class="rp-L" x="2" y="11" width="1" height="1"/><rect class="rp-C" x="3" y="11" width="8" height="1"/><rect class="rp-L" x="11" y="11" width="1" height="1"/><rect class="rp-A" x="12" y="11" width="1" height="1"/><rect class="rp-K" x="13" y="11" width="1" height="1"/><rect class="rp-K" x="0" y="12" width="1" height="1"/><rect class="rp-A" x="1" y="12" width="1" height="1"/><rect class="rp-L" x="2" y="12" width="1" height="1"/><rect class="rp-C" x="3" y="12" width="8" height="1"/><rect class="rp-L" x="11" y="12" width="1" height="1"/><rect class="rp-A" x="12" y="12" width="1" height="1"/><rect class="rp-K" x="13" y="12" width="1" height="1"/><rect class="rp-K" x="0" y="13" width="1" height="1"/><rect class="rp-A" x="1" y="13" width="1" height="1"/><rect class="rp-L" x="2" y="13" width="2" height="1"/><rect class="rp-C" x="4" y="13" width="6" height="1"/><rect class="rp-L" x="10" y="13" width="2" height="1"/><rect class="rp-A" x="12" y="13" width="1" height="1"/><rect class="rp-K" x="13" y="13" width="1" height="1"/><rect class="rp-K" x="1" y="14" width="1" height="1"/><rect class="rp-A" x="2" y="14" width="1" height="1"/><rect class="rp-S" x="3" y="14" width="8" height="1"/><rect class="rp-A" x="11" y="14" width="1" height="1"/><rect class="rp-K" x="12" y="14" width="1" height="1"/><rect class="rp-K" x="2" y="15" width="1" height="1"/><rect class="rp-A" x="3" y="15" width="1" height="1"/><rect class="rp-L" x="4" y="15" width="6" height="1"/><rect class="rp-A" x="10" y="15" width="1" height="1"/><rect class="rp-K" x="11" y="15" width="1" height="1"/><rect class="rp-K" x="3" y="16" width="1" height="1"/><rect class="rp-A" x="4" y="16" width="6" height="1"/><rect class="rp-K" x="10" y="16" width="1" height="1"/><rect class="rp-M" x="4" y="17" width="6" height="1"/><rect class="rp-B" x="6" y="18" width="2" height="1"/><rect class="rp-B" x="6" y="19" width="1" height="1"/></g><rect class="rp-P" x="3" y="12" width="1" height="1"/><rect class="rp-P" x="10" y="12" width="1" height="1"/><g class="retro-cara retro-cara--normal"><rect class="rp-K" x="3" y="10" width="1" height="1"/><rect class="rp-K" x="4" y="10" width="1" height="1"/><rect class="rp-K" x="3" y="11" width="1" height="1"/><rect class="rp-K" x="4" y="11" width="1" height="1"/><rect class="rp-K" x="9" y="10" width="1" height="1"/><rect class="rp-K" x="10" y="10" width="1" height="1"/><rect class="rp-K" x="9" y="11" width="1" height="1"/><rect class="rp-K" x="10" y="11" width="1" height="1"/><rect class="rp-K" x="5" y="12" width="1" height="1"/><rect class="rp-K" x="8" y="12" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g><g class="retro-cara retro-cara--feliz"><rect class="rp-K" x="3" y="11" width="1" height="1"/><rect class="rp-K" x="4" y="10" width="1" height="1"/><rect class="rp-K" x="5" y="11" width="1" height="1"/><rect class="rp-K" x="8" y="11" width="1" height="1"/><rect class="rp-K" x="9" y="10" width="1" height="1"/><rect class="rp-K" x="10" y="11" width="1" height="1"/><rect class="rp-K" x="5" y="12" width="1" height="1"/><rect class="rp-K" x="8" y="12" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g><g class="retro-cara retro-cara--dormido"><rect class="rp-K" x="3" y="11" width="1" height="1"/><rect class="rp-K" x="4" y="11" width="1" height="1"/><rect class="rp-K" x="5" y="11" width="1" height="1"/><rect class="rp-K" x="8" y="11" width="1" height="1"/><rect class="rp-K" x="9" y="11" width="1" height="1"/><rect class="rp-K" x="10" y="11" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g><g class="retro-cara retro-cara--mareado"><rect class="rp-K" x="3" y="10" width="1" height="1"/><rect class="rp-K" x="5" y="10" width="1" height="1"/><rect class="rp-K" x="4" y="11" width="1" height="1"/><rect class="rp-K" x="3" y="12" width="1" height="1"/><rect class="rp-K" x="5" y="12" width="1" height="1"/><rect class="rp-K" x="8" y="10" width="1" height="1"/><rect class="rp-K" x="10" y="10" width="1" height="1"/><rect class="rp-K" x="9" y="11" width="1" height="1"/><rect class="rp-K" x="8" y="12" width="1" height="1"/><rect class="rp-K" x="10" y="12" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g><g class="retro-cara retro-cara--sorpresa"><rect class="rp-K" x="3" y="9" width="1" height="1"/><rect class="rp-K" x="4" y="9" width="1" height="1"/><rect class="rp-K" x="3" y="10" width="1" height="1"/><rect class="rp-K" x="4" y="10" width="1" height="1"/><rect class="rp-K" x="3" y="11" width="1" height="1"/><rect class="rp-K" x="4" y="11" width="1" height="1"/><rect class="rp-K" x="9" y="9" width="1" height="1"/><rect class="rp-K" x="10" y="9" width="1" height="1"/><rect class="rp-K" x="9" y="10" width="1" height="1"/><rect class="rp-K" x="10" y="10" width="1" height="1"/><rect class="rp-K" x="9" y="11" width="1" height="1"/><rect class="rp-K" x="10" y="11" width="1" height="1"/><rect class="rp-K" x="6" y="12" width="1" height="1"/><rect class="rp-K" x="7" y="12" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g><g class="retro-cara retro-cara--amor"><rect class="rp-R" x="3" y="10" width="1" height="1"/><rect class="rp-R" x="5" y="10" width="1" height="1"/><rect class="rp-R" x="3" y="11" width="1" height="1"/><rect class="rp-R" x="4" y="11" width="1" height="1"/><rect class="rp-R" x="5" y="11" width="1" height="1"/><rect class="rp-R" x="4" y="12" width="1" height="1"/><rect class="rp-R" x="8" y="10" width="1" height="1"/><rect class="rp-R" x="10" y="10" width="1" height="1"/><rect class="rp-R" x="8" y="11" width="1" height="1"/><rect class="rp-R" x="9" y="11" width="1" height="1"/><rect class="rp-R" x="10" y="11" width="1" height="1"/><rect class="rp-R" x="9" y="12" width="1" height="1"/><rect class="rp-K" x="6" y="13" width="1" height="1"/><rect class="rp-K" x="7" y="13" width="1" height="1"/></g></svg>';

/* ---------- Código Konami ---------- */
/* ↑↑↓↓←→←→BA escrito con flechas, con palabras (es / va / en) o tecleado con las flechas en la caja */
const SECUENCIA_KONAMI = 'uuddlrlrba';
const PALABRAS_KONAMI = {
  arriba: 'u', abajo: 'd', izquierda: 'l', derecha: 'r', dalt: 'u', baix: 'd', esquerra: 'l', dreta: 'r',
  up: 'u', down: 'd', left: 'l', right: 'r', b: 'b', a: 'a',
};
export function esCodigoKonami(texto) {
  const flechas = String(texto).replace(/[\s,·\-]+/g, '')
    .replace(/[↑⬆]/g, 'u').replace(/[↓⬇]/g, 'd').replace(/[←⬅]/g, 'l').replace(/[→➡]/g, 'r')
    .replace(/\uFE0F/g, '').toLowerCase();
  if (flechas === SECUENCIA_KONAMI) return true;
  // ^^vv<><>ba
  if (/^\^\^vv<><>ba$/.test(flechas)) return true;
  const palabras = String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]+/g, ' ').split(' ').filter(Boolean);
  return palabras.map((p) => PALABRAS_KONAMI[p] || '?').join('') === SECUENCIA_KONAMI;
}

/* ---------- Utilidades ---------- */

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
const azar = (min, max) => min + Math.random() * (max - min);
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
const normalizar = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** 'va' si <html lang> es valenciano/catalán; si no, 'es'. */
export function idiomaActual() {
  const lang = (document.documentElement.lang || 'es').toLowerCase();
  return lang.startsWith('va') || lang.startsWith('ca') ? 'va' : 'es';
}

/* ==========================================================================
   Motor de respuestas: búsqueda difusa sobre respuestas.json
   - Ignora tildes, mayúsculas y signos.
   - Tolera faltas (distancia de edición) y plurales (prefijos).
   - Las frases de varias palabras pesan más que las sueltas.
   - Recuerda el último tema para «otro» / «recomiéndame uno».
   ========================================================================== */

/* Abreviaturas típicas de chat → palabra completa (k ase → que hace) */
const ABREVIATURAS = {
  q: 'que', k: 'que', ke: 'que', qe: 'que', xq: 'porque', pq: 'porque', porq: 'porque',
  komo: 'como', ase: 'haces', aser: 'hacer', kien: 'quien', qien: 'quien', tb: 'tambien', tmb: 'tambien', x: 'por',
  d: 'de', dnd: 'donde', pa: 'para', toy: 'estoy', tas: 'estas', ta: 'esta', grax: 'gracias', thx: 'gracias',
};

export const normalizarTexto = (texto) =>
  String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((palabra) => ABREVIATURAS[palabra] || palabra)
    .join(' ');

/* Distancia de Levenshtein con corte temprano (no calcula más de lo necesario) */
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      fila.push(v);
      if (v < minimo) minimo = v;
    }
    if (minimo > max) return max + 1;
    previa = fila;
  }
  return previa[b.length];
}

/* Cuánto se parece una palabra escrita (q) a una palabra clave (f): 0 = nada, 3 = idéntica */
/* ¿Son iguales salvo dos letras contiguas intercambiadas? (gear / gera) */
function transpuestas(a, b) {
  if (a.length !== b.length || a.length < 4) return false;
  const distintas = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) distintas.push(i);
  return distintas.length === 2 && distintas[1] === distintas[0] + 1 &&
    a[distintas[0]] === b[distintas[1]] && a[distintas[1]] === b[distintas[0]];
}

function parecido(f, q) {
  if (q === f) return 3;
  if (f.length >= 4 && q.startsWith(f)) return 2.6;           // juego → juegos
  if (q.length >= 4 && f.startsWith(q)) return 2.2;           // jueg → juego
  if (q.length >= 3 && f.length === q.length + 1 && f.startsWith(q)) return 2;   // bal → ball
  if (transpuestas(f, q)) return 1.9;                         // gera → gear
  const max = f.length >= 8 ? 2 : f.length >= 5 ? 1 : 0;      // faltas permitidas según longitud
  if (!max) return 0;
  const d = distancia(f, q, max);
  return d <= max ? 2 - 0.1 * d : 0;
}

const UMBRAL = 1.8;

function puntuarFrase(frase, palabras, textoLimpio) {
  const usados = new Set();
  const total = frase.palabras.length;
  // En frases de 3+ palabras se perdona una que no se reconozca (red ded redemption)
  let perdonables = total >= 3 ? 1 : 0;
  let suma = 0;
  let letrasPerdonadas = 0;
  for (const clave of frase.palabras) {
    let mejor = 0;
    let indice = -1;
    palabras.forEach((palabra, i) => {
      if (usados.has(i)) return;
      const p = parecido(clave, palabra);
      if (p > mejor) { mejor = p; indice = i; }
    });
    if (mejor < UMBRAL) {
      if (perdonables-- > 0) { letrasPerdonadas += clave.length; continue; }
      return null;
    }
    suma += mejor;
    usados.add(indice);
  }
  // Solo se perdona una palabra «pequeña»: si falta la clave (dime la HORA, qué es HTML) no cuenta
  if (letrasPerdonadas > 0.3 * frase.texto.replace(/ /g, '').length) return null;
  const extra = usados.size - 1;
  const falta = total - usados.size;
  const seguida = extra > 0 && ` ${textoLimpio} `.includes(` ${frase.texto} `) ? 0.4 : 0;
  return { puntos: suma / total + 0.6 * extra + seguida - 0.5 * falta, usados };
}

function puntuarIntencion(intencion, palabras, textoLimpio) {
  let mejor = 0;
  let cubiertasMejor = 0;
  const cubiertas = new Set();
  for (const frase of intencion._frases) {
    const r = puntuarFrase(frase, palabras, textoLimpio);
    if (!r) continue;
    r.usados.forEach((i) => cubiertas.add(i));
    if (r.puntos > mejor) {
      mejor = r.puntos;
      cubiertasMejor = r.usados.size;
    }
  }
  if (!mejor) return 0;
  // Bonus si otras frases de la misma intención cubren más palabras de la pregunta
  return (mejor + 0.3 * (cubiertas.size - cubiertasMejor)) * (intencion.peso ?? 1);
}

const PLANTILLAS = {
  hora: (idioma) => new Date().toLocaleTimeString(idioma === 'va' ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' }),
  dia: (idioma) => new Date().toLocaleDateString(idioma === 'va' ? 'ca-ES' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
  anio: () => String(new Date().getFullYear()),
  saludo: (idioma) => {
    const h = new Date().getHours();
    if (idioma === 'va') return h < 6 || h >= 21 ? 'Bona nit' : h < 13 ? 'Bon dia' : 'Bona vesprada';
    return h < 6 || h >= 21 ? 'Buenas noches' : h < 13 ? 'Buenos días' : 'Buenas tardes';
  },
};

/**
 * Crea el "cerebro" a partir de los datos de respuestas.json.
 * Devuelve { responder(texto, idioma) } → { texto, enlace?, efecto?, sugerencias? }
 */
export function crearCerebro(datos) {
  const intenciones = (datos.intenciones || []).map((intencion) => ({
    ...intencion,
    _frases: (intencion.frases || [])
      .map((frase) => {
        const texto = normalizarTexto(frase);
        return { texto, palabras: texto.split(' ').filter(Boolean) };
      })
      .filter((frase) => frase.palabras.length),
  }));

  const memoria = { ultima: null, tema: null, pagina: null, juego: null, dichas: new Set(), variantes: new Map() };

  const lista = (obj, idioma) => (obj?.[idioma]?.length ? obj[idioma] : obj?.es) || [];

  /* Elige una variante al azar sin repetir hasta agotarlas */
  const variante = (intencion, idioma) => {
    const opciones = lista(intencion, idioma);
    if (!opciones.length) return '';
    let usadas = memoria.variantes.get(intencion.id);
    if (!usadas || usadas.size >= opciones.length) {
      usadas = new Set(usadas?.size >= opciones.length && opciones.length > 1 ? [usadas.ultima] : []);
      memoria.variantes.set(intencion.id, usadas);
    }
    const libres = opciones.map((_, i) => i).filter((i) => !usadas.has(i));
    const i = libres[Math.floor(Math.random() * libres.length)];
    usadas.add(i);
    usadas.ultima = i;
    return opciones[i];
  };

  const rellenar = (texto, idioma, extra = {}) =>
    texto.replace(/\{(\w+)\}/g, (marca, clave) =>
      clave in extra ? extra[clave] : PLANTILLAS[clave] ? PLANTILLAS[clave](idioma) : marca);

  const construir = (intencion, idioma, prefijo = '') => {
    memoria.ultima = intencion;
    if (intencion.tema) memoria.tema = intencion.tema;
    memoria.dichas.add(intencion.id);
    const cuerpo = rellenar(variante(intencion, idioma), idioma);
    const r = { texto: prefijo ? `${prefijo} ${cuerpo}` : cuerpo, efecto: intencion.efecto };
    if (intencion.enlace?.href && !esLaMismaPagina(intencion.enlace.href)) {
      r.enlace = { href: intencion.enlace.href, texto: intencion.enlace[idioma] || intencion.enlace.es || intencion.enlace.href };
    }
    const sugerencias = lista(intencion.sugerencias, idioma);
    if (sugerencias.length) r.sugerencias = sugerencias;
    if (intencion.orden) r.orden = intencion.orden; // p. ej. «ocultar» (escóndete)
    return r;
  };

  /* No enlaza a la página en la que ya está el visitante (sí a sus anclas: index.html#contacto) */
  function esLaMismaPagina(href) {
    if (!memoria.pagina || href.includes('#') || /^https?:/i.test(href)) return false;
    return (href.replace(/\.html?$/i, '') || 'index') === memoria.pagina;
  }

  const elegirAlAzar = (opciones) => opciones[Math.floor(Math.random() * opciones.length)];
  const itemsDeTema = (tema) => intenciones.filter((i) => i.item && i.tema === tema);
  const nombreTema = (tema, idioma) => datos.temas?.[tema]?.[idioma] || datos.temas?.[tema]?.es || tema;

  /* Un favorito del tema que todavía no haya salido */
  const itemNuevo = (tema) => {
    const todos = itemsDeTema(tema);
    const nuevos = todos.filter((i) => !memoria.dichas.has(i.id));
    return { item: nuevos.length ? elegirAlAzar(nuevos) : null, hay: todos.length > 0 };
  };

  const textoFijo = (clave, idioma, extra) => ({
    texto: rellenar(elegirAlAzar(lista(datos[clave], idioma)) || '…', idioma, extra),
    sugerencias: lista(datos.sugerenciasInicio, idioma),
  });

  const accionMas = (intencion, idioma) => {
    const ultima = memoria.ultima;
    if (ultima?.repetible) return construir(ultima, idioma);
    if (memoria.tema) {
      const { item } = itemNuevo(memoria.tema);
      if (item) return construir(item, idioma, variante(intencion, idioma));
      return textoFijo('agotado', idioma, { tema: nombreTema(memoria.tema, idioma) });
    }
    return textoFijo('sinContexto', idioma);
  };

  const accionAleatorio = (intencion, idioma) => {
    // Sin tema propio («recomiéndame algo») usa el de la conversación o la página; si no hay, uno al azar
    const tema = intencion.tema || memoria.tema || elegirAlAzar(['juegos', 'cine', 'anime', 'libros']);
    const { item, hay } = itemNuevo(tema);
    const elegido = item || (hay ? elegirAlAzar(itemsDeTema(tema)) : null);
    return elegido ? construir(elegido, idioma, variante(intencion, idioma)) : construir(intencion, idioma);
  };

  /* «¿Qué hay aquí?»: describe la página actual (datos.paginas) */
  const accionPagina = (intencion, idioma) => {
    const pagina = datos.paginas?.[memoria.pagina];
    if (!pagina) return construir(intencion, idioma);
    memoria.ultima = intencion;
    const r = { texto: rellenar(elegirAlAzar(lista(pagina, idioma)), idioma) };
    const sugerencias = lista(pagina.sugerencias, idioma);
    if (sugerencias.length) r.sugerencias = sugerencias;
    return r;
  };

  const accionSorpresa = (intencion, idioma) => {
    const candidatas = intenciones.filter((i) => (i.item || i.repetible) && i.id !== memoria.ultima?.id);
    return construir(elegirAlAzar(candidatas), idioma, variante(intencion, idioma));
  };


  /* ---------- Quiz «¿Cuánto sabes de Sergio?» ----------
     Mientras hay un quiz en marcha, lo que escribe el usuario se compara con las opciones
     de la pregunta actual (con tolerancia a faltas, o por número/letra: 1, 2, 3 / a, b, c). */
  let quiz = datos.quiz; // banco activo: datos.quiz o el de la intención (p. ej. «¿Quién lo dijo?»)
  const textosQ = (clave, idioma) => lista(quiz?.textos?.[clave] || datos.quiz?.textos?.[clave], idioma);
  const textoQuiz = (clave, idioma, extra = {}) =>
    rellenar(elegirAlAzar(textosQ(clave, idioma)) || '', idioma, extra);
  const barajar = (arr) => {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };
  const datosPregunta = (p, idioma) => p[idioma] || p.es;
  const opcionesVisibles = (idioma) => {
    const q = memoria.quiz;
    const p = datosPregunta(q.preguntas[q.i], idioma);
    return q.orden[q.i].map((j) => p.opciones[j]);
  };
  const salirQuiz = (idioma) => textosQ('botonSalir', idioma)[0] || 'Salir';
  const enunciado = (idioma) => {
    const q = memoria.quiz;
    const p = datosPregunta(q.preguntas[q.i], idioma);
    return textoQuiz('pregunta', idioma, { n: q.i + 1, total: q.preguntas.length, pregunta: p.pregunta });
  };
  const respuestaQuiz = (texto, idioma, efecto) => ({
    texto,
    efecto,
    sugerencias: [...opcionesVisibles(idioma), salirQuiz(idioma)],
  });

  const empezarQuiz = (intencion, idioma) => {
    quiz = datos[intencion.banco] || datos.quiz;
    const banco = quiz?.preguntas || [];
    if (!banco.length) return construir(intencion, idioma);
    const preguntas = barajar(banco).slice(0, Math.min(quiz.numero || 5, banco.length));
    memoria.quiz = {
      preguntas,
      orden: preguntas.map((p) => barajar(datosPregunta(p, 'es').opciones.map((_, j) => j))),
      i: 0,
      aciertos: 0,
    };
    memoria.ultima = intencion;
    return respuestaQuiz(`${variante(intencion, idioma)}\n\n${enunciado(idioma)}`, idioma);
  };

  const terminarQuiz = (idioma, prefijo = '', abandono = false) => {
    const { aciertos, preguntas, i } = memoria.quiz;
    const total = abandono ? i : preguntas.length; // si sale antes, solo cuentan las respondidas
    memoria.quiz = null;
    if (!total) return { texto: prefijo, sugerencias: textosQ('botonesFinal', idioma) };
    const nivel = aciertos === total ? 'perfecto' : aciertos >= Math.ceil(total / 2) ? 'alto' : 'bajo';
    const cierre = textoQuiz(nivel, idioma, { aciertos, total });
    return {
      texto: prefijo ? `${prefijo}\n\n${cierre}` : cierre,
      efecto: nivel === 'perfecto' ? 'fuegos' : nivel === 'alto' ? 'feliz' : 'salto',
      sugerencias: textosQ('botonesFinal', idioma),
    };
  };

  /* ¿Qué opción ha elegido? Devuelve su posición en pantalla o -1 */
  const opcionElegida = (palabras, limpio, idioma) => {
    const visibles = opcionesVisibles(idioma);
    const letras = ['a', 'b', 'c', 'd', 'e'];
    if (palabras.length === 1) {
      const n = Number(palabras[0]);
      if (n >= 1 && n <= visibles.length) return n - 1;
      const l = letras.indexOf(palabras[0]);
      if (l >= 0 && l < visibles.length) return l;
    }
    let mejor = -1;
    let maximo = 0;
    visibles.forEach((opcion, i) => {
      const texto = normalizarTexto(opcion);
      const frase = { texto, palabras: texto.split(' ').filter(Boolean) };
      const r = frase.palabras.length && puntuarFrase(frase, palabras, limpio);
      if (r && r.puntos > maximo) { maximo = r.puntos; mejor = i; }
    });
    return maximo >= UMBRAL ? mejor : -1;
  };

  const responderQuiz = (palabras, limpio, idioma) => {
    const q = memoria.quiz;
    const salir = textosQ('palabrasSalir', idioma).concat(textosQ('palabrasSalir', 'es'));
    if (salir.some((s) => normalizarTexto(s) === limpio)) return terminarQuiz(idioma, textoQuiz('abandono', idioma), true);

    const elegida = opcionElegida(palabras, limpio, idioma);
    if (elegida < 0) return respuestaQuiz(`${textoQuiz('recordatorio', idioma)}\n\n${enunciado(idioma)}`, idioma);

    const p = datosPregunta(q.preguntas[q.i], idioma);
    const acierto = q.orden[q.i][elegida] === p.correcta;
    if (acierto) q.aciertos++;
    const veredicto = acierto
      ? textoQuiz('acierto', idioma)
      : textoQuiz('fallo', idioma, { correcta: p.opciones[p.correcta] });
    const feedback = p.explicacion ? `${veredicto} ${p.explicacion}` : veredicto;

    q.i++;
    if (q.i >= q.preguntas.length) return terminarQuiz(idioma, feedback);
    return respuestaQuiz(`${feedback}\n\n${enunciado(idioma)}`, idioma, acierto ? 'feliz' : undefined);
  };


  /* ---------- Minijuegos del chat: piedra-papel-tijera, adivina el número y ahorcado ----------
     Como el quiz: mientras hay uno en marcha, lo que se escribe va al juego («salir» para dejarlo).
     Textos y palabras en datos.juegos (respuestas.json). */
  const JUE = datos.juegos || {};
  const textoJuego = (juego, clave, idioma, extra = {}) =>
    rellenar(elegirAlAzar(lista(JUE[juego]?.textos?.[clave] || JUE.textos?.[clave], idioma)) || '', idioma, extra);
  const listaJuego = (juego, clave, idioma) => lista(JUE[juego]?.textos?.[clave] || JUE.textos?.[clave], idioma);
  /* Texto «en bruto» para los juegos: sin abreviaturas (una «d» o una «k» del ahorcado son letras) */
  const limpiarJuego = (texto) => String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const esSalir = (limpio, idioma) => lista(datos.quiz?.textos?.palabrasSalir, idioma)
    .concat(lista(datos.quiz?.textos?.palabrasSalir, 'es')).some((s) => normalizarTexto(s) === limpio);
  const botonSalir = (idioma) => lista(datos.quiz?.textos?.botonSalir, idioma)[0] || 'Salir';
  const finJuego = (juego, texto, idioma, efecto) => {
    memoria.juego = null;
    return { texto, efecto, sugerencias: listaJuego(juego, 'botonesFinal', idioma) };
  };

  /* --- Piedra, papel o tijera (gana quien llegue antes a 3) --- */
  const PPT = ['piedra', 'papel', 'tijera'];
  const GANA_A = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };
  const leerJugada = (texto) => {
    if (/✊|👊/.test(texto)) return 'piedra';
    if (/✋|🖐/.test(texto)) return 'papel';
    if (/✌/.test(texto)) return 'tijera';
    const t = limpiarJuego(texto);
    if (/\b(piedra|pedra|roca)\b/.test(t) || t === '1') return 'piedra';
    if (/\b(papel|paper)\b/.test(t) || t === '2') return 'papel';
    if (/\b(tijeras?|tisores?|tisora)\b/.test(t) || t === '3') return 'tijera';
    return null;
  };
  const nombreJugada = (j, idioma) => lista(JUE.ppt?.nombres, idioma)[PPT.indexOf(j)] || j;
  const botonesPPT = (idioma) => [...PPT.map((j) => nombreJugada(j, idioma)), botonSalir(idioma)];
  const rondaPPT = (tuya, idioma, prefijo = '') => {
    const j = memoria.juego;
    const mia = elegirAlAzar(PPT);
    let resultado;
    if (tuya === mia) { resultado = 'empate'; j.empates++; }
    else if (GANA_A[tuya] === mia) { resultado = 'ganas'; j.tu++; }
    else { resultado = 'pierdes'; j.yo++; }
    const linea = textoJuego('ppt', 'ronda', idioma, {
      tuya: nombreJugada(tuya, idioma), mia: nombreJugada(mia, idioma),
      resultado: textoJuego('ppt', resultado, idioma), tu: j.tu, yo: j.yo,
    });
    const texto = prefijo ? `${prefijo}\n\n${linea}` : linea;
    const meta = JUE.ppt?.meta || 3;
    if (j.tu >= meta) return finJuego('ppt', `${texto}\n\n${textoJuego('ppt', 'victoria', idioma, { tu: j.tu, yo: j.yo })}`, idioma, 'fuegos');
    if (j.yo >= meta) return finJuego('ppt', `${texto}\n\n${textoJuego('ppt', 'derrota', idioma, { tu: j.tu, yo: j.yo })}`, idioma, 'aura');
    return { texto, efecto: resultado === 'ganas' ? 'salto' : resultado === 'pierdes' ? 'feliz' : undefined, sugerencias: botonesPPT(idioma) };
  };
  const empezarPPT = (texto, idioma) => {
    memoria.juego = { tipo: 'ppt', tu: 0, yo: 0, empates: 0 };
    const intro = textoJuego('ppt', 'intro', idioma, { meta: JUE.ppt?.meta || 3 });
    const jugada = leerJugada(texto);
    return jugada ? rondaPPT(jugada, idioma, intro) : { texto: intro, sugerencias: botonesPPT(idioma) };
  };

  /* --- Adivina el número del 1 al 100 --- */
  const empezarNumero = (idioma) => {
    memoria.juego = { tipo: 'numero', secreto: 1 + Math.floor(Math.random() * 100), intentos: 0, min: 1, max: 100 };
    return { texto: textoJuego('numero', 'intro', idioma), sugerencias: ['50', botonSalir(idioma)] };
  };
  const jugarNumero = (texto, idioma) => {
    const j = memoria.juego;
    const m = String(texto).match(/-?\d+/);
    if (!m) return { texto: textoJuego('numero', 'recordatorio', idioma, { min: j.min, max: j.max }), sugerencias: [botonSalir(idioma)] };
    const n = Number(m[0]);
    if (n < 1 || n > 100) return { texto: textoJuego('numero', 'fuera', idioma), sugerencias: [botonSalir(idioma)] };
    j.intentos++;
    if (n === j.secreto) {
      const nivel = j.intentos <= 5 ? 'pro' : j.intentos <= 8 ? 'bien' : 'justo';
      return finJuego('numero', `${textoJuego('numero', 'acierto', idioma, { n, intentos: j.intentos })} ${textoJuego('numero', nivel, idioma)}`, idioma, 'fuegos');
    }
    if (n < j.secreto) j.min = Math.max(j.min, n + 1); else j.max = Math.min(j.max, n - 1);
    const d = Math.abs(n - j.secreto);
    const calor = d <= 3 ? 'quema' : d <= 10 ? 'caliente' : d <= 25 ? 'templado' : 'frio';
    const texto2 = `${textoJuego('numero', n < j.secreto ? 'mas' : 'menos', idioma, { n })} ${textoJuego('numero', calor, idioma)}\n${textoJuego('numero', 'rango', idioma, { min: j.min, max: j.max, intentos: j.intentos })}`;
    const medio = Math.floor((j.min + j.max) / 2);
    return { texto: texto2, efecto: calor === 'quema' ? 'salto' : undefined, sugerencias: [String(medio), botonSalir(idioma)] };
  };

  /* --- Ahorcado friki --- */
  const letraBase = (c) => c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esLetra = (c) => /[a-zñ]/i.test(letraBase(c));
  const tablero = () => {
    const j = memoria.juego;
    // Entre palabras, espacios «eme» (U+2003): el chat junta los espacios normales seguidos
    return [...j.palabra].map((c) => (c === ' ' ? '\u2003\u2003' : !esLetra(c) || j.letras.has(letraBase(c)) ? c : '_')).join(' ');
  };
  const vidas = () => {
    const j = memoria.juego;
    return '🏮'.repeat(j.max - j.fallos) + '💨'.repeat(j.fallos);
  };
  const resuelto = () => [...memoria.juego.palabra].every((c) => !esLetra(c) || memoria.juego.letras.has(letraBase(c)));
  const estadoAhorcado = (idioma, prefijo) => ({
    texto: `${prefijo ? `${prefijo}\n\n` : ''}${tablero()}\n\n${textoJuego('ahorcado', 'vidas', idioma, { vidas: vidas() })}`,
    sugerencias: [...listaJuego('ahorcado', 'botonPista', idioma), botonSalir(idioma)],
  });
  const empezarAhorcado = (idioma) => {
    const palabras = JUE.ahorcado?.palabras || [];
    if (!palabras.length) return null;
    const elegida = elegirAlAzar(palabras);
    memoria.juego = {
      tipo: 'ahorcado', palabra: (elegida[idioma] || elegida.es).toUpperCase(), categoria: elegida.categoria,
      letras: new Set(), fallos: 0, max: JUE.ahorcado?.vidas || 6, pista: false,
    };
    return estadoAhorcado(idioma, textoJuego('ahorcado', 'intro', idioma));
  };
  const jugarAhorcado = (texto, idioma) => {
    const j = memoria.juego;
    const t = limpiarJuego(texto);
    const pista = listaJuego('ahorcado', 'palabrasPista', idioma).concat(listaJuego('ahorcado', 'palabrasPista', 'es'));
    if (pista.some((p) => normalizarTexto(p) === normalizarTexto(texto))) {
      const cat = lista(JUE.ahorcado?.categorias?.[j.categoria], idioma)[0] || j.categoria;
      return estadoAhorcado(idioma, textoJuego('ahorcado', 'pista', idioma, { categoria: cat }));
    }
    if (!t) return estadoAhorcado(idioma, textoJuego('ahorcado', 'recordatorio', idioma));
    const solucion = letraBase(j.palabra).replace(/[^a-zñ0-9]/g, '');
    let prefijo;
    if (t.replace(/ /g, '').length > 1) {
      // Intenta resolver la palabra entera
      if (t.replace(/[^a-zñ0-9]/g, '') === solucion) {
        [...j.palabra].forEach((c) => esLetra(c) && j.letras.add(letraBase(c)));
      } else {
        j.fallos++;
        prefijo = textoJuego('ahorcado', 'noEs', idioma);
      }
    } else if (/[a-zñ]/.test(t)) {
      if (j.letras.has(t)) return estadoAhorcado(idioma, textoJuego('ahorcado', 'repetida', idioma, { letra: t.toUpperCase() }));
      j.letras.add(t);
      const esta = [...j.palabra].some((c) => letraBase(c) === t);
      if (!esta) j.fallos++;
      prefijo = textoJuego('ahorcado', esta ? 'bien' : 'mal', idioma, { letra: t.toUpperCase() });
    } else {
      return estadoAhorcado(idioma, textoJuego('ahorcado', 'recordatorio', idioma));
    }
    if (resuelto()) {
      return finJuego('ahorcado', `${tablero()}\n\n${textoJuego('ahorcado', 'victoria', idioma, { palabra: j.palabra, fallos: j.fallos })}`, idioma, 'fuegos');
    }
    if (j.fallos >= j.max) {
      return finJuego('ahorcado', `${vidas()}\n\n${textoJuego('ahorcado', 'derrota', idioma, { palabra: j.palabra })}`, idioma, 'kamikaze');
    }
    return estadoAhorcado(idioma, prefijo);
  };

  const empezarJuego = (intencion, texto, idioma) => {
    memoria.ultima = intencion;
    if (intencion.juego === 'ppt') return empezarPPT(texto, idioma);
    if (intencion.juego === 'numero') return empezarNumero(idioma);
    if (intencion.juego === 'ahorcado') return empezarAhorcado(idioma) || construir(intencion, idioma);
    return construir(intencion, idioma);
  };
  const responderJuego = (texto, limpio, idioma) => {
    const j = memoria.juego;
    if (esSalir(limpio, idioma)) {
      const extra = j.tipo === 'ahorcado' ? { palabra: j.palabra } : j.tipo === 'numero' ? { n: j.secreto } : { tu: j.tu, yo: j.yo };
      return finJuego(j.tipo, textoJuego(j.tipo, 'abandono', idioma, extra), idioma);
    }
    if (j.tipo === 'ppt') {
      const jugada = leerJugada(texto);
      return jugada ? rondaPPT(jugada, idioma) : { texto: textoJuego('ppt', 'recordatorio', idioma), sugerencias: botonesPPT(idioma) };
    }
    if (j.tipo === 'numero') return jugarNumero(texto, idioma);
    return jugarAhorcado(texto, idioma);
  };

  return {
    responder(texto, idioma = 'es', contexto = {}) {
      // La página da contexto: en juegos.html, «otro» o «recomiéndame algo» van de juegos
      if (contexto.pagina !== undefined && contexto.pagina !== memoria.pagina) {
        memoria.pagina = contexto.pagina;
        const temaPagina = datos.paginas?.[contexto.pagina]?.tema;
        if (temaPagina) memoria.tema = temaPagina;
      }
      const limpio = normalizarTexto(texto);
      const palabras = limpio.split(' ').filter(Boolean);
      if (memoria.quiz && palabras.length) return responderQuiz(palabras, limpio, idioma);
      if (memoria.juego && String(texto).trim()) return responderJuego(texto, limpio, idioma);
      let mejor = null;
      let maximo = 0;
      if (palabras.length) {
        for (const intencion of intenciones) {
          const puntos = puntuarIntencion(intencion, palabras, limpio);
          if (puntos > maximo) { maximo = puntos; mejor = intencion; }
        }
      }
      if (!mejor || maximo < UMBRAL) {
        memoria.ultima = null;
        return textoFijo('porDefecto', idioma);
      }
      if (mejor.accion === 'mas') return accionMas(mejor, idioma);
      if (mejor.accion === 'aleatorio') return accionAleatorio(mejor, idioma);
      if (mejor.accion === 'sorpresa') return accionSorpresa(mejor, idioma);
      if (mejor.accion === 'quiz') return empezarQuiz(mejor, idioma);
      if (mejor.accion === 'juego') return empezarJuego(mejor, texto, idioma);
      if (mejor.accion === 'pagina') return accionPagina(mejor, idioma);
      return construir(mejor, idioma);
    },
  };
}

/* Carga respuestas.json una sola vez (y usa el respaldo si falla) */
const cerebros = new Map();
export function cargarCerebro(url = 'data/respuestas.json') {
  if (!cerebros.has(url)) {
    cerebros.set(url, fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch((error) => {
        console.warn('[Farolillo] No se pudo cargar', url, '— uso el respaldo.', error);
        return RESPALDO;
      })
      .then(crearCerebro));
  }
  return cerebros.get(url);
}

/** Página actual: data-farol-pagina en <body> o el nombre del archivo (juegos.html → 'juegos'). */
export function detectarPagina() {
  const forzada = document.body?.dataset.farolPagina;
  if (forzada) return forzada;
  const archivo = location.pathname.split('/').pop().replace(/\.html?$/i, '');
  return archivo || 'index';
}

/** Lee el tema de la web: data-theme, clases habituales o, si no hay, el del sistema. */
export function detectarTema() {
  const { documentElement: html, body } = document;
  const atributo = html.dataset.theme || body.dataset.theme;
  if (atributo) return atributo === 'dark' ? 'oscuro' : 'claro';

  const clases = [...html.classList, ...body.classList].join(' ');
  if (/\b(dark|dark-mode|oscuro|tema-oscuro)\b/.test(clases)) return 'oscuro';
  if (/\b(light|light-mode|claro|tema-claro)\b/.test(clases)) return 'claro';

  return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

/**
 * Solo permite enlaces http(s) o del mismo protocolo que la página (bloquea javascript:, data:…).
 * Protege si un día las respuestas vienen de un backend o una IA.
 */
function enlaceSeguro(href) {
  try {
    const url = new URL(href, location.href);
    return ['http:', 'https:', location.protocol].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/* ========================================================================== */

export function initFarolillo(opciones = {}) {
  const {
    posicion = 'izquierda',
    contenedor = document.body,
    textos = {},
    respuestas = 'data/respuestas.json',
    responder = null,
    detectar = detectarTema,
    comentarios = true,
    tiempoSueno = 30000,
    pagina = detectarPagina(),
  } = opciones;

  const izquierda = posicion !== 'derecha';
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const punteroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const html = document.documentElement;
  const tx = () => {
    const idioma = idiomaActual();
    return { ...TEXTOS[idioma], ...(TEXTOS[idioma].paginas?.[pagina] || {}), ...(textos[idioma] || {}) };
  };

  /* Por defecto responde con el buscador de respuestas.json; "piensa" un momento para que se note */
  const responderConArchivo = async (texto, { idioma, pagina: donde }) => {
    const [cerebro] = await Promise.all([cargarCerebro(respuestas), esperar(azar(380, 760))]);
    return cerebro.responder(texto, idioma, { pagina: donde });
  };
  const obtenerRespuesta = responder || responderConArchivo;

  /* ---------- Marcado ---------- */
  const raiz = document.createElement('div');
  raiz.className = `farolillo farolillo--${izquierda ? 'izquierda' : 'derecha'}`;
  raiz.dataset.estado = 'reposo';
  raiz.dataset.cara = 'normal';
  raiz.innerHTML = `
    <div class="farol-panel" id="farol-panel" role="dialog" aria-labelledby="farol-panel-nombre">
      <div class="farol-panel__cabecera">
        <span class="farol-panel__avatar" aria-hidden="true"></span>
        <div class="farol-panel__titulos">
          <p class="farol-panel__estado"></p>
          <p class="farol-panel__nombre" id="farol-panel-nombre"></p>
        </div>
        <button type="button" class="farol-panel__ocultar">${ICONO_OCULTAR}</button>
        <button type="button" class="farol-panel__cerrar">${ICONO_CERRAR}</button>
      </div>
      <div class="farol-panel__mensajes" aria-live="polite"></div>
      <div class="farol-chips" role="group"></div>
      <form class="farol-panel__form">
        <input class="farol-panel__entrada" type="text" name="mensaje" autocomplete="off" maxlength="300">
        <button type="submit" class="farol-panel__enviar">${ICONO_ENVIAR}</button>
      </form>
    </div>
    <p class="farol-pista" aria-live="polite"></p>
    <button type="button" class="farol-boton" aria-expanded="false" aria-controls="farol-panel">
      <span class="farol-fisica"><span class="farol-flotar">${SVG}${SVG_RETRO}</span></span>
    </button>
    <button type="button" class="farol-mini">${ICONO_MINI}</button>`;
  contenedor.append(raiz);

  const $ = (selector) => raiz.querySelector(selector);
  const boton = $('.farol-boton');
  const fisicaEl = $('.farol-fisica');
  const ojos = $('.farol-ojos');
  const pista = $('.farol-pista');
  const mensajes = $('.farol-panel__mensajes');
  const chips = $('.farol-chips');
  const formulario = $('.farol-panel__form');
  const entrada = $('.farol-panel__entrada');
  const botonEnviar = $('.farol-panel__enviar');
  const botonCerrar = $('.farol-panel__cerrar');
  const botonOcultar = $('.farol-panel__ocultar');
  const botonMini = $('.farol-mini');

  let abierto = false;
  let ocupado = false;
  let saludado = false;
  let hover = false;
  let destruido = false;
  /* Escondido: preferencia de cada visitante, se recuerda entre páginas y visitas */
  const CLAVE_OCULTO = 'farolillo-oculto';
  const CLAVE_RETRO = 'farolillo-retro';
  let retro = false;
  try { retro = localStorage.getItem(CLAVE_RETRO) === '1'; } catch { /* sin storage */ }
  if (retro) raiz.classList.add('farol--retro');
  let oculto = false;
  try { oculto = localStorage.getItem(CLAVE_OCULTO) === '1'; } catch { /* sin storage */ }
  let ultimaActividad = performance.now();

  const timers = new Set();
  const temporizador = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!destruido) fn();
    }, ms);
    timers.add(id);
    return id;
  };

  /* Reinicia una animación CSS de reacción aunque ya estuviera puesta */
  const reaccionar = (clase) => {
    raiz.classList.remove(clase);
    void raiz.offsetWidth;
    raiz.classList.add(clase);
  };
  raiz.addEventListener('animationend', ({ animationName }) => {
    if (animationName === 'farol-salto') raiz.classList.remove('farol--salto');
    if (animationName === 'farol-encender') raiz.classList.remove('farol--cambio');
    if (animationName === 'farol-voltereta') raiz.classList.remove('farol--mareo');
  });

  /* ---------- Caras: normal | feliz | sorpresa | dormido | mareado ---------- */
  let timerCara = 0;
  const ponerCara = (cara, ms = 0) => {
    clearTimeout(timerCara);
    raiz.dataset.cara = cara;
    if (ms) {
      timerCara = temporizador(() => {
        if (raiz.dataset.cara === cara) raiz.dataset.cara = 'normal';
      }, ms);
    }
  };

  /* ---------- Textos (ES / VA en directo) ---------- */
  const pintarTextos = () => {
    const t = tx();
    $('.farol-panel__estado').textContent = t.estado;
    $('.farol-panel__nombre').textContent = t.nombre;
    botonCerrar.setAttribute('aria-label', t.cerrar);
    botonCerrar.title = t.cerrar;
    botonOcultar.setAttribute('aria-label', t.ocultar);
    botonOcultar.title = t.ocultar;
    botonMini.setAttribute('aria-label', t.mostrar);
    botonMini.title = t.mostrar;
    entrada.placeholder = t.placeholder;
    entrada.setAttribute('aria-label', t.placeholder);
    botonEnviar.setAttribute('aria-label', t.enviar);
    botonEnviar.title = t.enviar;
    boton.setAttribute('aria-label', abierto ? t.cerrar : t.abrir);
    chips.setAttribute('aria-label', t.sugerencias);
    pintarChips(t.chips);
  };

  /* Sugerencias rápidas: cambian según la última respuesta */
  const pintarChips = (lista) => {
    chips.replaceChildren(
      ...lista.map((texto) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'farol-chip';
        chip.textContent = texto;
        return chip;
      }),
    );
    chips.scrollTop = 0;
  };

  /* ---------- Pista (bocadillo junto al farolillo) ---------- */
  let timerPista = 0;
  let pistaHover = false;
  const ocultarPista = () => {
    clearTimeout(timerPista);
    pista.classList.remove('farol-pista--visible');
    pistaHover = false;
  };
  const mostrarPista = (texto, ms = 4000, { hablar = true } = {}) => {
    if (abierto || destruido || oculto) return;
    clearTimeout(timerPista);
    pista.textContent = texto;
    pista.classList.add('farol-pista--visible');
    pistaHover = false;
    if (hablar && raiz.dataset.estado === 'reposo') {
      raiz.dataset.estado = 'hablando';
      temporizador(() => {
        if (raiz.dataset.estado === 'hablando' && !ocupado) raiz.dataset.estado = 'reposo';
      }, Math.min(1800, texto.length * 40));
    }
    timerPista = temporizador(ocultarPista, ms);
  };

  /* ---------- Colores para el lienzo de chispas ---------- */
  let colores = { a: '#ff2e97', b: '#38bdf8', muted: '#838a96' };
  const leerColores = () => {
    const estilos = getComputedStyle(raiz);
    const leer = (nombre, defecto) => estilos.getPropertyValue(nombre).trim() || defecto;
    colores = {
      a: leer('--farol-a', colores.a),
      b: leer('--farol-b', colores.b),
      muted: leer('--farol-muted', colores.muted),
    };
  };

  /* ---------- Física (balanceo, inclinación, arrastre) ---------- */
  const fis = { ang: 0, vAng: 0, x: 0, y: 0, vx: 0, vy: 0, inclinacion: 0 };
  let arrastre = null;
  let rectBoton = boton.getBoundingClientRect();
  const medir = () => {
    rectBoton = boton.getBoundingClientRect();
  };

  /* Posición en pantalla de la punta de la llama (gira con el farolillo) */
  const puntoLlama = () => {
    const r = rectBoton;
    const ox = r.left + r.width * 0.5;
    const oy = r.top + r.height * 0.6;
    const dx = 0;
    const dy = r.height * (16 / 200) - r.height * 0.6;
    const rad = (fis.ang * Math.PI) / 180;
    return {
      x: ox + dx * Math.cos(rad) - dy * Math.sin(rad) + fis.x,
      y: oy + dx * Math.sin(rad) + dy * Math.cos(rad) + fis.y,
    };
  };
  const centro = () => ({
    x: rectBoton.left + rectBoton.width / 2 + fis.x,
    y: rectBoton.top + rectBoton.height * 0.48 + fis.y,
  });

  /* ---------- Partículas en un <canvas> a pantalla completa ---------- */
  const particulas = [];
  const MAX_PARTICULAS = 260;
  let lienzo = null;
  let ctx = null;
  let quedabanParticulas = false;

  if (!reducido) {
    lienzo = document.createElement('canvas');
    lienzo.className = 'farol-lienzo';
    lienzo.setAttribute('aria-hidden', 'true');
    contenedor.append(lienzo);
    ctx = lienzo.getContext('2d');
  }

  const ajustarLienzo = () => {
    medir();
    if (!lienzo) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = Math.round(innerWidth * dpr);
    lienzo.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const agregar = (p) => {
    if (ctx && particulas.length < MAX_PARTICULAS) particulas.push(p);
  };

  const ascua = () => {
    const { x, y } = puntoLlama();
    agregar({
      tipo: 'ascua',
      x: x + azar(-4, 4),
      y: y + azar(-2, 2),
      vx: azar(-14, 14) - fis.vx * 0.05,
      vy: azar(-62, -28),
      vida: 0,
      max: azar(1.1, 2.3),
      tam: azar(1.1, 2.6),
      color: Math.random() < 0.65 ? colores.a : colores.b,
      fase: azar(0, 6.28),
    });
  };

  const estallido = (cantidad = 30, origen = centro(), paleta = null) => {
    for (let i = 0; i < cantidad; i++) {
      const angulo = azar(0, Math.PI * 2);
      const velocidad = azar(70, 270);
      const tirada = Math.random();
      agregar({
        tipo: 'chispa',
        x: origen.x,
        y: origen.y,
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad - 60,
        vida: 0,
        max: azar(0.6, 1.25),
        tam: azar(1.2, 2.8),
        color: paleta ? paleta[Math.floor(tirada * paleta.length)] : tirada < 0.45 ? colores.a : tirada < 0.85 ? colores.b : '#ffffff',
      });
    }
  };

  const zeta = () => {
    const { x, y } = puntoLlama();
    agregar({
      tipo: 'z',
      x: x + 12,
      y: y + 18,
      vx: azar(8, 16),
      vy: azar(-24, -14),
      vida: 0,
      max: 2.6,
      tam: azar(13, 19),
      color: colores.b,
      fase: azar(0, 6.28),
    });
  };

  const fuegos = () => {
    for (let i = 0; i < 4; i++) {
      temporizador(() => {
        estallido(60, { x: azar(innerWidth * 0.15, innerWidth * 0.85), y: azar(innerHeight * 0.12, innerHeight * 0.5) });
      }, i * 380);
    }
  };

  const FUENTE_Z = '"Chakra Petch", system-ui, sans-serif';
  const dibujar = (dt) => {
    if (!ctx || (!particulas.length && !quedabanParticulas)) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    quedabanParticulas = particulas.length > 0;
    const oscuro = raiz.dataset.tema === 'oscuro';
    // En oscuro las chispas suman luz; en claro se pintan sin halo para no ensuciar
    ctx.globalCompositeOperation = oscuro ? 'lighter' : 'source-over';
    const halo = oscuro ? 0.28 : 0.1;

    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.vida += dt;
      if (p.vida >= p.max) {
        particulas.splice(i, 1);
        continue;
      }
      const k = 1 - p.vida / p.max;
      if (p.tipo === 'codigo') {
        // cae recta, sin balanceo
      } else if (p.tipo === 'chispa') {
        p.vy += 240 * dt;
        p.vx *= 1 - 1.6 * dt;
        p.vy *= 1 - 0.6 * dt;
      } else {
        p.vx += Math.sin(p.vida * 4 + p.fase) * 30 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      ctx.fillStyle = p.color;
      if (p.tipo === 'codigo') {
        ctx.globalAlpha = Math.min(1, k * 1.4);
        ctx.font = `700 ${p.tam}px ${FUENTE_Z}`;
        ctx.fillText(p.letra, p.x, p.y);
        continue;
      }
      if (p.tipo === 'corazon') {
        const t = p.tam * (0.6 + 0.4 * k);
        ctx.globalAlpha = Math.min(1, k * 1.3);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + t * 0.9);
        ctx.bezierCurveTo(p.x - t * 1.4, p.y - t * 0.1, p.x - t * 0.8, p.y - t * 1.3, p.x, p.y - t * 0.5);
        ctx.bezierCurveTo(p.x + t * 0.8, p.y - t * 1.3, p.x + t * 1.4, p.y - t * 0.1, p.x, p.y + t * 0.9);
        ctx.fill();
        continue;
      }
      if (p.tipo === 'z') {
        ctx.globalAlpha = k * 0.9;
        ctx.font = `700 ${p.tam}px ${FUENTE_Z}`;
        ctx.fillText('z', p.x, p.y);
        continue;
      }
      if (retro) {
        // Modo 8 bits: chispas cuadradas y sin halo
        const lado = Math.max(2, Math.round((p.tam * k + 1) * 1.6));
        ctx.globalAlpha = Math.min(1, k * 1.3);
        ctx.fillRect(Math.round(p.x - lado / 2), Math.round(p.y - lado / 2), lado, lado);
        continue;
      }
      ctx.globalAlpha = k * halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.min(1, k * 1.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam * k + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- Sueño ---------- */
  const dormir = () => {
    ponerCara('dormido');
    ocultarPista();
  };
  const despertar = () => {
    ponerCara('sorpresa', 900);
    fis.vy -= 260;
    fis.vAng += azar(-140, 140);
    estallido(16);
    temporizador(() => mostrarPista(tx().despertar, 2600), 250);
  };
  const actividad = () => {
    ultimaActividad = performance.now();
    if (raiz.dataset.cara === 'dormido') despertar();
  };

  /* ---------- Lanzamiento: si lo sueltas con fuerza, sale volando y rebota por la pantalla ----------
     Fase «aire»: gravedad y rebotes en los bordes de la ventana.
     Fase «vuelta»: cuando se cansa, vuelve flotando a su esquina y llega mareado. */
  const VELOCIDAD_LANZAR = 1300;   // px/s mínimos al soltar para que salga volando
  const GRAVEDAD = 1500;
  const REBOTE = 0.72;
  let vuelo = null;

  const lanzar = (vx, vy) => {
    medir();
    const v = Math.hypot(vx, vy);
    const k = Math.min(1, 2600 / v); // velocidad máxima
    vuelo = { fase: 'aire', tiempo: 0, quieto: 0 };
    fis.vx = vx * k;
    fis.vy = vy * k;
    fis.vAng += limitar(vx * 0.5, -900, 900) || 400;
    raiz.classList.add('farol--volando');
    ocultarPista();
    ponerCara('sorpresa');
    estallido(26);
  };

  const pasoVuelo = (dt) => {
    vuelo.tiempo += dt;
    if (vuelo.fase === 'aire') {
      fis.vy += GRAVEDAD * dt;
      fis.vx *= 1 - 0.25 * dt;
      fis.x += fis.vx * dt;
      fis.y += fis.vy * dt;
      // Límites de la ventana (rectBoton es la posición de reposo)
      const r = rectBoton;
      const margen = 4;
      const minX = -r.left + margen;
      const maxX = innerWidth - r.right - margen;
      const minY = -r.top + margen;
      const maxY = innerHeight - r.bottom - margen;
      const golpe = (velocidad, punto) => {
        if (Math.abs(velocidad) > 450) {
          estallido(Math.min(30, Math.abs(velocidad) / 40), punto);
          fis.vAng += azar(-1, 1) * Math.abs(velocidad) * 0.4;
        }
      };
      if (fis.x < minX) { fis.x = minX; golpe(fis.vx, { x: 6, y: centro().y }); fis.vx = -fis.vx * REBOTE; }
      if (fis.x > maxX) { fis.x = maxX; golpe(fis.vx, { x: innerWidth - 6, y: centro().y }); fis.vx = -fis.vx * REBOTE; }
      if (fis.y < minY) { fis.y = minY; golpe(fis.vy, { x: centro().x, y: 6 }); fis.vy = -fis.vy * REBOTE; }
      if (fis.y > maxY) {
        fis.y = maxY;
        golpe(fis.vy, { x: centro().x, y: innerHeight - 6 });
        fis.vy = -fis.vy * REBOTE;
        fis.vx *= 0.9; // rozamiento con el «suelo»
      }
      // ¿Se ha cansado? (casi quieto en el suelo un momento) o lleva demasiado tiempo volando
      const enSuelo = fis.y >= maxY - 1 && Math.abs(fis.vy) < 140;
      vuelo.quieto = enSuelo && Math.abs(fis.vx) < 160 ? vuelo.quieto + dt : 0;
      if (vuelo.quieto > 0.25 || vuelo.tiempo > 3.5) {
        vuelo.fase = 'vuelta';
        fis.vx = 0;
        fis.vy = 0;
      }
    } else {
      // Vuelve flotando a casa, con un poco de vaivén
      const f = Math.min(1, dt * 3.2);
      fis.x += -fis.x * f;
      fis.y += -fis.y * f + Math.sin(vuelo.tiempo * 9) * 0.8;
      if (Math.hypot(fis.x, fis.y) < 3) aterrizar();
    }
  };

  const aterrizar = () => {
    const alLlegar = vuelo?.alLlegar;
    vuelo = null;
    fis.x = 0;
    fis.y = 0;
    fis.vx = 0;
    fis.vy = 0;
    raiz.classList.remove('farol--volando');
    if (alLlegar) { alLlegar(); return; }
    ponerCara('mareado', 2600);
    reaccionar('farol--mareo');
    fis.vAng += 360;
    estallido(20);
    temporizador(() => mostrarPista(elegir(tx().aterrizaje), 2600), 200);
  };

  /* ---------- Pilla-pilla: durante 15 s huye del cursor; si le haces clic, lo has pillado ---------- */
  const DURACION_PILLA = 15;
  const RADIO_PILLA = 230;      // a esta distancia del cursor empieza a huir
  const VMAX_PILLA = 950;       // px/s: rápido, pero se le puede pillar
  let pilla = null;

  const bocadillo = (texto, ms = 1300) => {
    const el = pieza('farol-pieza--burla', '', ms);
    el.textContent = texto;
  };
  const empezarPilla = () => {
    if (pilla || vuelo || oculto) return;
    if (reducido) { mostrarPista(tx().pillaReducido, 3500); return; }
    cerrar(false);
    ocultarPista();
    limpiarTruco();
    medir();
    pilla = { inicio: performance.now(), tiempo: 0, rumbo: azar(0, Math.PI * 2), siguienteBurla: 1.5, siguienteSalto: 0.6, segundos: DURACION_PILLA };
    raiz.classList.add('farol--pilla');
    pilla.crono = pieza('farol-pieza--crono', String(DURACION_PILLA), (DURACION_PILLA + 2) * 1000);
    ponerCara('feliz');
    fis.vy -= 300;
    estallido(24);
  };
  const terminarPilla = (atrapado) => {
    if (!pilla) return;
    pilla.crono?.remove();
    pilla = null;
    raiz.classList.remove('farol--pilla');
    if (atrapado) {
      fuegos();
      estallido(50);
      ponerCara('mareado', 1600);
      reaccionar('farol--mareo');
      fis.vAng += 500;
    } else {
      ponerCara('feliz', 2000);
      bocadillo('😎', 1200);
    }
    // Vuelve a casa flotando y entonces lo cuenta
    vuelo = { fase: 'vuelta', tiempo: 0, quieto: 0, alLlegar: () => {
      ponerCara(atrapado ? 'mareado' : 'feliz', 2200);
      estallido(16);
      temporizador(() => mostrarPista(elegir(atrapado ? tx().pillaAtrapado : tx().pillaEscapa), 3200), 150);
    } };
    raiz.classList.add('farol--volando');
  };
  const pasoPilla = (dt) => {
    pilla.tiempo = (performance.now() - pilla.inicio) / 1000; // reloj real, aunque vaya a pocos fps
    const quedan = Math.max(0, Math.ceil(DURACION_PILLA - pilla.tiempo));
    if (quedan !== pilla.segundos) {
      pilla.segundos = quedan;
      if (pilla.crono) pilla.crono.textContent = String(quedan);
    }
    if (pilla.tiempo >= DURACION_PILLA) { terminarPilla(false); return; }

    const r = rectBoton;
    const margen = 10;
    const minX = -r.left + margen;
    const maxX = innerWidth - r.right - margen;
    const minY = -r.top + margen + 95; // deja libre la barra de navegación (y la cuenta atrás no la pisa)
    const maxY = innerHeight - r.bottom - margen;
    const c = centro();
    let ax = 0;
    let ay = 0;

    // Huir del cursor: cuanto más cerca, más fuerte
    let cerca = false;
    if (puntero) {
      const dx = c.x - puntero.x;
      const dy = c.y - puntero.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < RADIO_PILLA) {
        cerca = d < 120;
        const f = (RADIO_PILLA - d) / RADIO_PILLA;
        ax += (dx / d) * 6200 * f;
        ay += (dy / d) * 6200 * f;
        // Arrinconado: se escabulle en perpendicular
        const pegado = fis.x - minX < 50 || maxX - fis.x < 50 || fis.y - minY < 50 || maxY - fis.y < 50;
        if (pegado && cerca) {
          const lado = Math.sign((dx * 0.37 + dy * 0.91) || 1);
          ax += (-dy / d) * 5200 * lado;
          ay += (dx / d) * 5200 * lado;
        }
      }
    }
    // Paseo aleatorio para que nunca se quede quieto
    pilla.rumbo += azar(-2.5, 2.5) * dt;
    ax += Math.cos(pilla.rumbo) * 520;
    ay += Math.sin(pilla.rumbo) * 520;
    // En pantallas táctiles (sin cursor que perseguir) da acelerones de vez en cuando
    pilla.siguienteSalto -= dt;
    if (!punteroFino && pilla.siguienteSalto <= 0) {
      pilla.siguienteSalto = azar(0.5, 0.9);
      const a = azar(0, Math.PI * 2);
      fis.vx += Math.cos(a) * 650;
      fis.vy += Math.sin(a) * 650;
    }
    // Las paredes le empujan hacia dentro
    const zona = 90;
    if (fis.x - minX < zona) ax += (zona - (fis.x - minX)) * 45;
    if (maxX - fis.x < zona) ax -= (zona - (maxX - fis.x)) * 45;
    if (fis.y - minY < zona) ay += (zona - (fis.y - minY)) * 45;
    if (maxY - fis.y < zona) ay -= (zona - (maxY - fis.y)) * 45;

    fis.vx = (fis.vx + ax * dt) * (1 - 2.4 * dt);
    fis.vy = (fis.vy + ay * dt) * (1 - 2.4 * dt);
    const v = Math.hypot(fis.vx, fis.vy);
    if (v > VMAX_PILLA) { fis.vx *= VMAX_PILLA / v; fis.vy *= VMAX_PILLA / v; }
    fis.x += fis.vx * dt;
    fis.y += fis.vy * dt;
    if (fis.x < minX) { fis.x = minX; fis.vx = Math.abs(fis.vx) * 0.5; }
    if (fis.x > maxX) { fis.x = maxX; fis.vx = -Math.abs(fis.vx) * 0.5; }
    if (fis.y < minY) { fis.y = minY; fis.vy = Math.abs(fis.vy) * 0.5; }
    if (fis.y > maxY) { fis.y = maxY; fis.vy = -Math.abs(fis.vy) * 0.5; }

    // Burlas de vez en cuando (más si estás cerca)
    pilla.siguienteBurla -= dt * (cerca ? 2.5 : 1);
    if (pilla.siguienteBurla <= 0) {
      pilla.siguienteBurla = azar(1.8, 3);
      bocadillo(elegir(tx().pillaBurlas));
    }
  };
  const atraparPilla = () => {
    if (!pilla) return false;
    terminarPilla(true);
    return true;
  };

  /* ---------- Bucle principal (física + chispas) ---------- */
  let raf = 0;
  let ultimo = 0;
  let acumulado = 0;
  let ultimaZ = 0;

  const tasaAscuas = () => {
    const { cara, estado } = raiz.dataset;
    if (cara === 'dormido' || cara === 'mareado') return 0;
    if (raiz.classList.contains('farol--explotado') || raiz.classList.contains('farol--fantasma')) return 0;
    if (arrastre?.activo || vuelo || pilla) return 34;
    if (estado === 'pensando') return 12;
    if (hover) return 16;
    if (abierto) return 5;
    return 2.6;
  };

  const fotograma = (t) => {
    raf = requestAnimationFrame(fotograma);
    const dt = Math.min(0.033, (t - (ultimo || t)) / 1000);
    ultimo = t;
    if (!dt) return;

    if (pilla) {
      pasoPilla(dt);
    } else if (vuelo) {
      pasoVuelo(dt);
    } else if (!arrastre?.activo) {
      // Muelle que devuelve el farolillo a su sitio
      fis.vx += (-170 * fis.x - 11 * fis.vx) * dt;
      fis.vy += (-170 * fis.y - 11 * fis.vy) * dt;
      fis.x += fis.vx * dt;
      fis.y += fis.vy * dt;
    }
    if (vuelo?.fase === 'aire') {
      // En el aire gira libremente (solo un poco de rozamiento)
      fis.vAng *= 1 - 0.6 * dt;
    } else {
      // Péndulo: se inclina hacia el cursor o hacia donde lo arrastras
      const objetivo = arrastre?.activo ? limitar(fis.x * 0.3, -28, 28) : pilla ? limitar(fis.vx * 0.03, -25, 25) : fis.inclinacion;
      fis.vAng += (-55 * (fis.ang - objetivo) - 6.5 * fis.vAng) * dt;
    }
    fis.ang += fis.vAng * dt;
    fisicaEl.style.transform =
      `translate3d(${fis.x.toFixed(2)}px, ${fis.y.toFixed(2)}px, 0) rotate(${fis.ang.toFixed(2)}deg)`;

    acumulado += tasaAscuas() * dt;
    while (acumulado >= 1) {
      ascua();
      acumulado -= 1;
    }
    if (raiz.dataset.cara === 'dormido' && t - ultimaZ > 1300) {
      zeta();
      ultimaZ = t;
    }
    if (!abierto && !arrastre && !vuelo && !pilla && raiz.dataset.cara === 'normal' &&
        performance.now() - ultimaActividad > tiempoSueno) {
      dormir();
    }
    dibujar(dt);
  };

  const arrancar = () => {
    if (reducido || raf || destruido || oculto) return;
    ultimo = 0;
    raf = requestAnimationFrame(fotograma);
  };
  const parar = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const alCambiarVisibilidad = () => (document.hidden ? parar() : arrancar());

  /* ---------- Ojos que siguen al cursor ---------- */
  let puntero = null;
  let rafOjos = 0;
  const moverOjos = () => {
    rafOjos = 0;
    let x = 0;
    let y = 0;
    const { estado } = raiz.dataset;
    if (estado === 'pensando') {
      y = -3.2;
    } else if (abierto) {
      x = izquierda ? 2.6 : -2.6;
      y = estado === 'escuchando' ? -1 : -3;
    } else if (puntero) {
      const c = centro();
      const dx = puntero.x - c.x;
      const dy = puntero.y - c.y;
      const distancia = Math.hypot(dx, dy) || 1;
      const fuerza = Math.min(1, distancia / 220) * 3.6;
      x = (dx / distancia) * fuerza;
      y = (dy / distancia) * fuerza * 0.8;
      fis.inclinacion = distancia < 520 ? limitar(dx / 45, -8, 8) : 0;
    }
    if (!puntero || abierto) fis.inclinacion = 0;
    ojos.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  };
  const pedirOjos = () => {
    if (!rafOjos) rafOjos = requestAnimationFrame(moverOjos);
  };
  const alMoverPuntero = (e) => {
    if (oculto) return;
    puntero = { x: e.clientX, y: e.clientY };
    actividad();
    pedirOjos();
  };
  const alSalirPuntero = () => {
    puntero = null;
    pedirOjos();
  };

  /* ---------- Parpadeo aleatorio ---------- */
  const parpadear = () => {
    raiz.classList.add('farol--parpadeo');
    temporizador(() => raiz.classList.remove('farol--parpadeo'), 140);
  };
  const programarParpadeo = () => {
    temporizador(() => {
      if (raiz.dataset.cara === 'normal') {
        parpadear();
        if (Math.random() < 0.25) temporizador(parpadear, 280);
      }
      programarParpadeo();
    }, azar(2400, 5600));
  };

  /* ---------- Scroll: el farolillo se balancea con la inercia ---------- */
  let ultimoScroll = window.scrollY;
  const alHacerScroll = () => {
    const dy = window.scrollY - ultimoScroll;
    ultimoScroll = window.scrollY;
    ultimaActividad = performance.now();
    if (reducido) return;
    fis.vAng += limitar(dy * 0.5, -90, 90);
    fis.vy += limitar(-dy * 1.2, -160, 160);
  };

  /* ---------- Tema, acento e idioma de la web ---------- */
  let acento = html.dataset.accent;
  let idioma = idiomaActual();

  const aplicarTema = (reaccion) => {
    const tema = detectar();
    if (tema === raiz.dataset.tema) return;
    raiz.dataset.tema = tema;
    leerColores();
    if (!reaccion) return;
    reaccionar('farol--cambio');
    estallido(26);
    mostrarPista(tema === 'oscuro' ? tx().noche : tx().dia, 3200);
  };

  const revisarAcento = () => {
    if (html.dataset.accent === acento) return;
    acento = html.dataset.accent;
    leerColores();
    estallido(36);
    fis.vAng += elegir([-1, 1]) * 120;
    ponerCara('feliz', 1200);
    if (acento === 'pink') mostrarPista(tx().acentoRosa, 3000);
    if (acento === 'blue') mostrarPista(tx().acentoAzul, 3000);
  };

  const revisarIdioma = () => {
    const nuevo = idiomaActual();
    if (nuevo === idioma) return;
    idioma = nuevo;
    pintarTextos();
  };

  const observador = new MutationObserver(() => {
    aplicarTema(true);
    revisarAcento();
    revisarIdioma();
  });
  observador.observe(html, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-accent', 'lang'] });
  observador.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  const temaSistema = matchMedia('(prefers-color-scheme: dark)');
  const alCambiarSistema = () => aplicarTema(true);
  temaSistema.addEventListener('change', alCambiarSistema);

  /* ---------- Comentarios al llegar a cada sección ---------- */
  let observadorSecciones = null;
  if (comentarios && 'IntersectionObserver' in window) {
    const dichas = new Set();
    const visibles = new Set();
    let ultimaSeccion = -Infinity;
    let reintento = false;

    /* Comenta la sección visible; si está ocupado (chat abierto, dormido…), lo reintenta luego */
    const comentarSeccion = () => {
      reintento = false;
      const id = [...visibles].find((v) => !dichas.has(v) && tx().secciones?.[v]);
      if (!id) return;
      const libre = !abierto && !arrastre && raiz.dataset.cara === 'normal' &&
        !pista.classList.contains('farol-pista--visible') &&
        performance.now() - ultimaSeccion > 6000;
      if (!libre) {
        reintento = true;
        temporizador(comentarSeccion, 1500);
        return;
      }
      dichas.add(id);
      ultimaSeccion = performance.now();
      fis.vy -= 150;
      mostrarPista(tx().secciones[id], 5200);
    };

    observadorSecciones = new IntersectionObserver((entradas) => {
      for (const { isIntersecting, target } of entradas) {
        if (isIntersecting) visibles.add(target.id);
        else visibles.delete(target.id);
      }
      if (!reintento) comentarSeccion();
    }, { rootMargin: '-35% 0px -45% 0px' });
    Object.keys(tx().secciones || {}).forEach((id) => {
      const seccion = document.getElementById(id);
      if (seccion) observadorSecciones.observe(seccion);
    });
  }

  /* ---------- Chat ---------- */
  /* Baja hasta el final; si se pasa una burbuja, no deja que su principio se salga por arriba
     (así una respuesta larga se lee desde el comienzo) */
  const bajar = (burbuja = null) => {
    let destino = mensajes.scrollHeight - mensajes.clientHeight;
    if (burbuja) {
      const inicio = burbuja.getBoundingClientRect().top - mensajes.getBoundingClientRect().top + mensajes.scrollTop - 10;
      destino = Math.min(destino, inicio);
    }
    mensajes.scrollTop = Math.max(0, destino);
  };

  const crearBurbuja = (autor) => {
    const burbuja = document.createElement('p');
    burbuja.className = `farol-msg farol-msg--${autor}`;
    mensajes.append(burbuja);
    return burbuja;
  };


  /* ==========================================================
     Trucos frikis: objetos que aparecen pegados al farolillo (se mueven con él)
     y rayos que cruzan la pantalla. Todo CSS/SVG propio; ver farolillo.css («Trucos»).
     ========================================================== */
  const capaFx = document.createElement('span');
  capaFx.className = 'farol-fx';
  capaFx.setAttribute('aria-hidden', 'true');
  $('.farol-flotar').append(capaFx);
  let piezasFx = [];

  const limpiarTruco = () => {
    piezasFx.forEach((el) => el.remove());
    piezasFx = [];
    raiz.classList.remove('farol--lumos', 'farol--invisible', 'farol--matrix', 'farol--estirar', 'farol--temblor',
      'farol--hinchar', 'farol--explotado', 'farol--fantasma');
  };
  /* Pieza pegada al farolillo */
  const pieza = (clase, html = '', ms = 3000) => {
    const el = document.createElement('span');
    el.className = `farol-pieza ${clase}`;
    el.innerHTML = html;
    capaFx.append(el);
    piezasFx.push(el);
    temporizador(() => el.remove(), ms);
    return el;
  };
  /* Pieza fija en pantalla (rayos, ondas) colocada en coordenadas de la ventana */
  const piezaFija = (clase, { x, y }, ms = 2000, html = '') => {
    const el = document.createElement('span');
    el.className = `farol-fijo ${clase}`;
    el.setAttribute('aria-hidden', 'true');
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = html;
    contenedor.append(el);
    piezasFx.push(el);
    temporizador(() => el.remove(), ms);
    return el;
  };
  const claseTemporal = (clase, desde, hasta) => {
    temporizador(() => raiz.classList.add(clase), desde);
    temporizador(() => raiz.classList.remove(clase), hasta);
  };
  const centroDe = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const ladoDerecho = () => ({ x: rectBoton.right + fis.x - rectBoton.width * 0.08, y: centro().y });

  const COLORES_SABLE = ['#38bdf8', '#4ade80', '#a855f7', '#f43f5e'];
  const TRUCOS = {
    /* Espada láser: se enciende, da dos mandobles y se apaga */
    sable: (color = elegir(COLORES_SABLE)) => {
      const el = pieza('farol-pieza--sable', '<i class="farol-sable__mango"></i><i class="farol-sable__hoja"></i>', 3000);
      el.style.setProperty('--fx-color', color);
      temporizador(() => estallido(10, ladoDerecho(), [color, '#ffffff']), 1500);
    },
    'sable-rojo': () => TRUCOS.sable('#f43f5e'),

    /* Varita: floritura, chispas plateadas en la punta y destello de luz */
    varita: () => {
      const el = pieza('farol-pieza--varita', '<i class="farol-varita__palo"></i><i class="farol-varita__punta"></i>', 2600);
      const punta = el.querySelector('.farol-varita__punta');
      [500, 750, 1000, 1250].forEach((ms) =>
        temporizador(() => estallido(12, centroDe(punta), ['#ffffff', '#e0e7ff', '#fde68a']), ms));
      claseTemporal('farol--lumos', 1100, 2300);
    },

    /* Anillo: baja, se lo pone y se vuelve invisible un momento */
    anillo: () => {
      pieza('farol-pieza--anillo', `<svg viewBox="0 0 40 20"><defs><linearGradient id="farol-g-oro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7cc"/><stop offset=".45" stop-color="#facc15"/><stop offset="1" stop-color="#a16207"/></linearGradient></defs>
        <ellipse cx="20" cy="10" rx="16" ry="6" fill="none" stroke="url(#farol-g-oro)" stroke-width="4"/></svg>`, 3800);
      temporizador(() => estallido(14, puntoLlama(), ['#fde68a', '#facc15', '#ffffff']), 800);
      claseTemporal('farol--invisible', 950, 3000);
    },

    /* Onda de energía: carga una bola y suelta un rayo que cruza la pantalla */
    kamehameha: (color = '#7dd3fc') => {
      const bola = pieza('farol-pieza--carga', '', 1300);
      bola.style.setProperty('--fx-color', color);
      fis.vAng -= 40;
      temporizador(() => {
        const o = ladoDerecho();
        const rayo = piezaFija('farol-fijo--rayo', { x: o.x, y: o.y }, 1700);
        rayo.style.setProperty('--fx-color', color);
        rayo.style.width = `${Math.max(200, innerWidth - o.x + 40)}px`;
        fis.vx -= 240;
        fis.vAng -= 120;
        estallido(24, o, [color, '#ffffff']);
      }, 1000);
    },
    'final-flash': () => TRUCOS.kamehameha('#fde047'),

    /* Bola de fuego que sale disparada */
    bola: (color = '#60a5fa') => {
      const o = ladoDerecho();
      const bola = piezaFija('farol-fijo--bola', o, 1500);
      bola.style.setProperty('--fx-color', color);
      bola.style.setProperty('--fx-recorrido', `${innerWidth - o.x + 80}px`);
      fis.vx -= 160;
      estallido(14, o, [color, '#ffffff']);
    },

    /* Corte en forma de media luna */
    corte: () => {
      const o = ladoDerecho();
      const corte = piezaFija('farol-fijo--corte', o, 1500,
        '<svg viewBox="0 0 60 120"><path d="M8 4 C60 30 60 90 8 116 C34 88 34 32 8 4 Z"/></svg>');
      corte.style.setProperty('--fx-recorrido', `${innerWidth - o.x + 80}px`);
      fis.vAng += 160;
      estallido(16, o, ['#111111', '#ef4444', '#ffffff']);
    },

    /* Esfera de energía que gira en la mano */
    rasengan: () => {
      pieza('farol-pieza--esfera', '<i></i>', 2400);
      temporizador(() => estallido(30, ladoDerecho(), ['#7dd3fc', '#ffffff', '#38bdf8']), 2000);
    },

    /* Aura dorada con chispas que suben */
    aura: (color = '#facc15') => {
      const el = pieza('farol-pieza--aura', `<svg viewBox="0 0 140 200"><path d="M70 0 C80 30 96 26 98 8 C112 34 120 46 112 70 C130 62 136 80 132 100
        C142 110 140 140 126 150 C136 170 120 196 98 192 C92 204 48 204 42 192 C20 196 4 170 14 150 C0 140 -2 110 8 100
        C4 80 10 62 28 70 C20 46 28 34 42 8 C44 26 60 30 70 0 Z"/></svg>`, 3000);
      el.style.setProperty('--fx-color', color);
      for (let i = 0; i < 14; i++) {
        temporizador(() => {
          const c = centro();
          agregar({ tipo: 'ascua', x: c.x + azar(-40, 40), y: c.y + azar(-10, 50), vx: azar(-10, 10), vy: azar(-160, -90),
            vida: 0, max: azar(0.6, 1.1), tam: azar(1.4, 2.8), color: Math.random() < 0.7 ? color : '#ffffff', fase: azar(0, 6.28) });
        }, i * 160);
      }
      claseTemporal('farol--temblor', 0, 2600);
    },
    kaioken: () => TRUCOS.aura('#ef4444'),

    /* Lluvia de código verde por toda la pantalla */
    matrix: () => {
      const letras = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01ﾊﾐﾋｰ';
      const columnas = Math.min(70, Math.floor(innerWidth / 18));
      for (let i = 0; i < columnas; i++) {
        const x = (i + 0.5) * (innerWidth / columnas);
        const retraso = azar(0, 900);
        for (let j = 0; j < 4; j++) {
          temporizador(() => agregar({ tipo: 'codigo', x, y: -20 - j * 18, vx: 0, vy: azar(280, 420), vida: 0, max: azar(2, 2.8),
            tam: 15, color: j === 0 ? '#d9ffe0' : '#22c55e', letra: letras[Math.floor(Math.random() * letras.length)] }), retraso + j * 70);
        }
      }
      claseTemporal('farol--matrix', 0, 2800);
    },

    /* Gafas de sol pixeladas que bajan hasta los ojos */
    gafas: () => {
      pieza('farol-pieza--gafas', `<svg viewBox="0 0 24 6" shape-rendering="crispEdges"><path fill="#111"
        d="M0 0h24v1H0zM1 1h9v3H9v1H2V4H1zM14 1h9v3h-1v1h-7V4h-1zM10 1h4v1h-4z"/>
        <path fill="#fff" d="M2 1h2v1H2zM4 2h1v1H4zM15 1h2v1h-2zM17 2h1v1h-1z"/></svg>`, 3600);
    },

    /* Caja de cartón: se esconde y aparece la exclamación */
    caja: () => {
      pieza('farol-pieza--caja', `<svg viewBox="0 0 100 90"><path fill="#b7894f" d="M6 18h88v70H6z"/><path fill="#9c7040" d="M6 18h88v10H6z"/>
        <path fill="#d8b07a" d="M6 18 0 4h44l6 14zM94 18l6-14H56l-6 14z"/><path fill="#e9d6b0" d="M44 28h12v60H44z" opacity=".7"/>
        <path d="M18 60h20M18 68h14" stroke="#7a5530" stroke-width="3"/></svg>`, 3400);
      pieza('farol-pieza--exclamacion', '!', 3400);
    },

    /* Bastón que golpea el suelo y suelta una onda */
    baston: () => {
      pieza('farol-pieza--baston', '<i></i>', 2400);
      temporizador(() => {
        const c = centro();
        piezaFija('farol-fijo--onda', { x: c.x, y: rectBoton.bottom + fis.y - 6 }, 1200);
        estallido(20, { x: c.x, y: rectBoton.bottom - 6 }, ['#ffffff', '#e0e7ff', colores.b]);
        claseTemporal('farol--temblor', 0, 500);
      }, 900);
    },

    /* Onda expansiva (patada espartana) */
    onda: () => {
      fis.vx += 260;
      temporizador(() => {
        piezaFija('farol-fijo--onda', ladoDerecho(), 1200);
        estallido(18, ladoDerecho());
      }, 150);
    },

    /* Enamorado: ojos de corazón y corazones que suben */
    amor: () => {
      temporizador(() => ponerCara('enamorado', 3200), 20);
      fis.vy -= 180;
      const paleta = ['#ff3b6b', '#ff7aa2', '#ffb3c8', colores.a];
      for (let i = 0; i < 22; i++) {
        temporizador(() => {
          const c = centro();
          agregar({ tipo: 'corazon', x: c.x + azar(-36, 36), y: c.y + azar(-20, 30), vx: azar(-20, 20), vy: azar(-120, -60),
            vida: 0, max: azar(1.4, 2.4), tam: azar(5, 10), color: elegir(paleta), fase: azar(0, 6.28) });
        }, i * 110);
      }
    },

    /* Kamikaze: se hincha, explota y vuelve como fantasma */
    kamikaze: () => {
      ponerCara('sorpresa', 1200);
      claseTemporal('farol--hinchar', 0, 1150);
      temporizador(() => {
        const c = centro();
        raiz.classList.add('farol--explotado');
        ponerCara('mareado', 1300);
        estallido(70, c, ['#f97316', '#facc15', '#ef4444', '#ffffff']);
        estallido(40, c, ['#52525b', '#a1a1aa', '#71717a']);
        piezaFija('farol-fijo--onda farol-fijo--explosion', c, 1200);
        fis.vy -= 320;
        fis.vAng += azar(-300, 300);
      }, 1150);
      temporizador(() => {
        raiz.classList.remove('farol--explotado');
        raiz.classList.add('farol--fantasma');
        ponerCara('sorpresa', 3400);
      }, 2500);
      temporizador(() => {
        raiz.classList.remove('farol--fantasma');
        ponerCara('feliz', 1200);
        estallido(16);
      }, 5900);
    },

    /* Estirarse como si fuera de goma */
    estirar: () => {
      claseTemporal('farol--estirar', 0, 1300);
      temporizador(() => estallido(12), 1150);
    },
  };
  const NOMBRES_TRUCOS = Object.keys(TRUCOS);

  const hacerTruco = (nombre) => {
    if (reducido || oculto || !TRUCOS[nombre]) return false;
    limpiarTruco();
    medir();
    TRUCOS[nombre]();
    return true;
  };

  /* Efectos que puede pedir una respuesta: fuegos | salto | giro | feliz, un truco (sable, varita…)
     o una lista de ellos (elige uno al azar) */
  const aplicarEfecto = (efectoPedido) => {
    if (!efectoPedido) return;
    let efecto = Array.isArray(efectoPedido) ? elegir(efectoPedido) : efectoPedido;
    if (efecto === 'truco') efecto = elegir(NOMBRES_TRUCOS);
    if (TRUCOS[efecto]) {
      ponerCara('feliz', 1200);
      if (!hacerTruco(efecto)) estallido(12); // con movimiento reducido: solo unas chispas
      return;
    }
    if (efecto === 'fuegos') fuegos();
    if (efecto === 'salto') {
      reaccionar('farol--salto');
      fis.vy -= 220;
      estallido(16);
    }
    if (efecto === 'giro') {
      reaccionar('farol--mareo');
      fis.vAng += 260;
      estallido(24);
    }
    if (efecto === 'feliz') {
      ponerCara('feliz', 1600);
      estallido(12);
    }
  };

  /* Escribe la respuesta letra a letra mientras mueve la boca */
  const escribir = async (respuesta) => {
    const { texto = '', enlace, efecto, sugerencias, orden } = typeof respuesta === 'string' ? { texto: respuesta } : respuesta;
    const burbuja = crearBurbuja('bot');
    const nodo = document.createTextNode('');
    burbuja.append(nodo);
    raiz.dataset.estado = 'hablando';
    pedirOjos();

    if (reducido) {
      nodo.data = texto;
    } else {
      // Máquina de escribir: como mucho ~1,6 s aunque la respuesta sea larga
      const letras = [...texto];
      const paso = Math.max(1, Math.ceil(letras.length / 100));
      for (let i = 0; i < letras.length; i += paso) {
        if (destruido) return;
        nodo.data += letras.slice(i, i + paso).join('');
        bajar(burbuja);
        await esperar(16);
      }
    }

    const href = enlace && enlaceSeguro(enlace.href);
    if (href) {
      const a = document.createElement('a');
      a.className = 'farol-enlace';
      a.href = href;
      a.textContent = enlace.texto;
      burbuja.append(a);
    }
    pintarChips(sugerencias?.length ? sugerencias : tx().chips);
    raiz.dataset.estado = 'reposo';
    ponerCara('feliz', 900);
    aplicarEfecto(efecto);
    if (orden === 'ocultar') temporizador(() => ocultar(), 1800); // «escóndete»: da tiempo a leer la respuesta
    if (orden === 'pilla') temporizador(() => empezarPilla(), 1300); // «juega conmigo»
    pedirOjos();
    bajar(burbuja); // los botones nuevos pueden cambiar el alto disponible
    chips.scrollTop = 0;
  };

  /* ---------- Modo 8 bits (código Konami) ---------- */
  const alternarRetro = () => {
    retro = !retro;
    try { localStorage.setItem(CLAVE_RETRO, retro ? '1' : '0'); } catch { /* sin storage */ }
    raiz.classList.toggle('farol--retro', retro);
    fis.vy -= 260;
    estallido(40);
    return { texto: retro ? tx().retroOn : tx().retroOff, efecto: 'fuegos' };
  };
  /* Teclear ↑↑↓↓←→←→BA con el cursor en la caja de texto */
  let teclasKonami = '';
  const TECLA_KONAMI = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', b: 'b', B: 'b', a: 'a', A: 'a' };
  const alTeclearEntrada = (e) => {
    // Fuera de la caja de Farolillo no cuenta si se está escribiendo en otro formulario de la web
    const enOtroCampo = e.target !== entrada && e.target?.closest?.('input, textarea, select, [contenteditable="true"]');
    if (enOtroCampo || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = TECLA_KONAMI[e.key];
    teclasKonami = t ? (teclasKonami + t).slice(-SECUENCIA_KONAMI.length) : '';
    if (teclasKonami === SECUENCIA_KONAMI) {
      e.preventDefault();
      teclasKonami = '';
      entrada.value = entrada.value.replace(/b$/i, '');
      if (!entrada.value.trim()) entrada.value = '';
      if (e.target !== entrada) abrir();
      enviar('↑↑↓↓←→←→BA');
    }
  };

  /* Si llega algo mientras escribe (p. ej. el código Konami durante el saludo), espera su turno */
  let pendiente = null;
  const enviar = async (texto) => {
    if (ocupado) {
      pendiente = texto;
      return;
    }
    ocupado = true;
    actividad();
    crearBurbuja('usuario').textContent = texto;

    raiz.dataset.estado = 'pensando';
    pedirOjos();
    const puntos = crearBurbuja('bot');
    puntos.classList.add('farol-msg--puntos');
    puntos.setAttribute('aria-hidden', 'true');
    puntos.innerHTML = '<span></span><span></span><span></span>';
    bajar();

    let respuesta;
    try {
      respuesta = esCodigoKonami(texto)
        ? (await esperar(500), alternarRetro())
        : await obtenerRespuesta(texto, { idioma: idiomaActual(), pagina });
    } catch (error) {
      console.error('[Farolillo]', error);
      respuesta = tx().error;
    }
    puntos.remove();
    await escribir(respuesta);
    liberar();
  };
  function liberar() {
    ocupado = false;
    if (pendiente !== null) {
      const siguiente = pendiente;
      pendiente = null;
      temporizador(() => enviar(siguiente), 250);
    }
  }

  /* ---------- Abrir / cerrar ---------- */
  const abrir = () => {
    if (abierto) return;
    if (oculto) mostrar();
    abierto = true;
    raiz.classList.add('farol--abierto');
    boton.setAttribute('aria-expanded', 'true');
    boton.setAttribute('aria-label', tx().cerrar);
    ocultarPista();
    ponerCara('feliz', 800);
    pedirOjos();

    if (!saludado) {
      saludado = true;
      ocupado = true;
      temporizador(async () => {
        await escribir(tx().saludo);
        liberar();
      }, 380);
    }
    if (punteroFino) temporizador(() => entrada.focus({ preventScroll: true }), 320);
  };

  const cerrar = (devolverFoco = true) => {
    if (!abierto) return;
    abierto = false;
    raiz.classList.remove('farol--abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', tx().abrir);
    if (raiz.dataset.estado === 'escuchando') raiz.dataset.estado = 'reposo';
    pedirOjos();
    if (devolverFoco) boton.focus({ preventScroll: true });
  };

  /* ---------- Clic, mareo y arrastre ---------- */
  const clics = [];
  let suprimirClick = false;

  /* ---------- Esconder / volver ----------
     Escondido, Farolillo queda como una pestañita en el borde: sin animaciones,
     sin comentarios y sin chispas. La preferencia se guarda en este navegador. */
  const guardarOculto = (valor) => {
    try { localStorage.setItem(CLAVE_OCULTO, valor ? '1' : '0'); } catch { /* sin storage */ }
  };
  const ocultar = () => {
    if (oculto || destruido) return;
    const teniaFoco = raiz.contains(document.activeElement);
    cerrar(false);
    ocultarPista();
    limpiarTruco();
    if (pilla) { pilla.crono?.remove(); pilla = null; raiz.classList.remove('farol--pilla'); }
    if (vuelo) {
      vuelo = null;
      Object.assign(fis, { x: 0, y: 0, vx: 0, vy: 0 });
      raiz.classList.remove('farol--volando');
    }
    oculto = true;
    guardarOculto(true);
    raiz.classList.add('farolillo--oculto');
    parar();
    particulas.length = 0;
    if (lienzo) { ctx.clearRect(0, 0, lienzo.width, lienzo.height); lienzo.hidden = true; }
    if (teniaFoco) botonMini.focus({ preventScroll: true });
  };
  const mostrar = () => {
    if (!oculto || destruido) return;
    oculto = false;
    guardarOculto(false);
    raiz.classList.remove('farolillo--oculto');
    if (lienzo) lienzo.hidden = false;
    arrancar();
    fis.vy -= 260;
    estallido(18);
    ponerCara('feliz', 1400);
    temporizador(() => mostrarPista(tx().vuelta, 2600), 300);
    boton.focus({ preventScroll: true });
  };

  const marear = () => {
    cerrar(false);
    ponerCara('mareado', 2600);
    reaccionar('farol--mareo');
    fis.vAng += 520;
    estallido(44);
    mostrarPista(tx().mareo, 2600);
  };

  const alHacerClick = () => {
    if (vuelo) return;
    if (suprimirClick) {
      suprimirClick = false;
      return;
    }
    actividad();
    const ahora = performance.now();
    clics.push(ahora);
    while (clics.length && ahora - clics[0] > 1800) clics.shift();
    if (clics.length >= 5 && !reducido) {
      clics.length = 0;
      marear();
      return;
    }
    reaccionar('farol--salto');
    fis.vAng += elegir([-1, 1]) * 140;
    fis.vy -= 120;
    estallido(22);
    if (abierto) cerrar(false);
    else abrir();
  };

  /* Efecto goma: cuanto más tiras, más cuesta */
  const goma = (d, max = 110) => Math.sign(d) * max * (1 - Math.exp((-Math.abs(d) * 0.65) / max));

  const alPulsar = (e) => {
    if (pilla && atraparPilla()) { suprimirClick = true; temporizador(() => { suprimirClick = false; }, 300); return; }
    if (reducido || e.button !== 0 || vuelo) return;
    suprimirClick = false;
    arrastre = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, activo: false,
      ux: e.clientX, uy: e.clientY, ut: performance.now(), velX: 0, velY: 0,
    };
    try { boton.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
  };

  const alArrastrar = (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x0;
    const dy = e.clientY - arrastre.y0;
    if (!arrastre.activo) {
      if (Math.hypot(dx, dy) < 7) return;
      arrastre.activo = true;
      raiz.classList.add('farol--arrastrando');
      ponerCara('sorpresa');
      ocultarPista();
      mostrarPista(elegir(tx().arrastre), 1800);
    }
    const ahora = performance.now();
    const dtm = Math.max(1, ahora - arrastre.ut);
    arrastre.velX = ((e.clientX - arrastre.ux) / dtm) * 1000;
    arrastre.velY = ((e.clientY - arrastre.uy) / dtm) * 1000;
    arrastre.ux = e.clientX;
    arrastre.uy = e.clientY;
    arrastre.ut = ahora;
    fis.x = goma(dx);
    fis.y = goma(dy);
    fis.vx = 0;
    fis.vy = 0;
  };

  const alSoltar = (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const soltado = arrastre;
    arrastre = null;
    if (!soltado.activo) return;
    raiz.classList.remove('farol--arrastrando');
    suprimirClick = true;
    temporizador(() => { suprimirClick = false; }, 80);
    // Si lo soltó tras pararse, la última velocidad medida ya no vale
    const reciente = performance.now() - soltado.ut < 90;
    const velX = reciente ? soltado.velX : 0;
    const velY = reciente ? soltado.velY : 0;
    if (Math.hypot(velX, velY) >= VELOCIDAD_LANZAR) {
      lanzar(velX, velY);
      return;
    }
    // Arrastre normal: vuelve a su sitio con efecto goma (como siempre)
    fis.vx = limitar(velX * 0.35, -900, 900);
    fis.vy = limitar(velY * 0.35, -900, 900);
    fis.vAng += limitar(velX * 0.12, -500, 500);
    ponerCara('feliz', 900);
    estallido(18);
  };

  /* ---------- Hover ---------- */
  const alEntrar = (e) => {
    if (e.pointerType !== 'mouse') return;
    hover = true;
    raiz.classList.add('farol--hover');
    if (!abierto && !pista.classList.contains('farol-pista--visible') && raiz.dataset.cara === 'normal') {
      mostrarPista(tx().pista, 2600, { hablar: false });
      pistaHover = true;
    }
  };
  const alSalir = () => {
    hover = false;
    raiz.classList.remove('farol--hover');
    if (pistaHover) ocultarPista();
  };

  /* ---------- Eventos ---------- */
  boton.addEventListener('click', alHacerClick);
  boton.addEventListener('pointerdown', alPulsar);
  boton.addEventListener('pointermove', alArrastrar);
  boton.addEventListener('pointerup', alSoltar);
  boton.addEventListener('pointercancel', alSoltar);
  boton.addEventListener('pointerenter', alEntrar);
  boton.addEventListener('pointerleave', alSalir);
  botonCerrar.addEventListener('click', () => cerrar());
  botonOcultar.addEventListener('click', ocultar);
  botonMini.addEventListener('click', mostrar);

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.farol-chip');
    if (chip && !ocupado) enviar(chip.textContent);
  });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = entrada.value.trim();
    if (!texto) return;
    entrada.value = '';
    enviar(texto); // si está ocupado, espera su turno
  });

  window.addEventListener('keydown', alTeclearEntrada);
  entrada.addEventListener('input', () => {
    actividad();
    if (ocupado) return;
    raiz.dataset.estado = entrada.value.trim() ? 'escuchando' : 'reposo';
    pedirOjos();
  });

  raiz.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && abierto) cerrar();
  });

  const alPulsarFuera = (e) => {
    if (pilla) puntero = { x: e.clientX, y: e.clientY };
    if (abierto && !raiz.contains(e.target)) cerrar(false);
  };
  const alTeclear = () => actividad();

  window.addEventListener('pointermove', alMoverPuntero, { passive: true });
  window.addEventListener('scroll', alHacerScroll, { passive: true });
  window.addEventListener('resize', ajustarLienzo);
  window.addEventListener('keydown', alTeclear);
  html.addEventListener('pointerleave', alSalirPuntero);
  document.addEventListener('pointerdown', alPulsarFuera);
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  /* ---------- Arranque ---------- */
  pintarTextos();
  aplicarTema(false);
  leerColores();
  ajustarLienzo();
  programarParpadeo();
  arrancar();

  if (!responder) temporizador(() => cargarCerebro(respuestas), 1500);

  let pistaVista = false;
  const clavePista = `farolillo-pista-${pagina}`;
  try { pistaVista = sessionStorage.getItem(clavePista) === '1'; } catch { /* sin storage */ }
  if (oculto) {
    // Viene escondido de otra página: empieza como pestañita, sin pista ni animación
    raiz.classList.add('farolillo--oculto');
    parar();
    if (lienzo) lienzo.hidden = true;
  } else if (!pistaVista) {
    temporizador(() => {
      if (abierto || raiz.dataset.cara !== 'normal') return;
      fis.vy -= 200;
      mostrarPista(tx().pistaInicial, 5000);
      try { sessionStorage.setItem(clavePista, '1'); } catch { /* sin storage */ }
    }, 4500);
  }

  /* ---------- API pública ---------- */
  return {
    abrir,
    ocultar,
    mostrar,
    cerrar,
    decir(texto) {
      abrir();
      return escribir(texto);
    },
    celebrar: fuegos,
    pillaPilla: empezarPilla,
    truco: hacerTruco,
    destruir() {
      destruido = true;
      timers.forEach(clearTimeout);
      parar();
      cancelAnimationFrame(rafOjos);
      observador.disconnect();
      observadorSecciones?.disconnect();
      temaSistema.removeEventListener('change', alCambiarSistema);
      window.removeEventListener('pointermove', alMoverPuntero);
      window.removeEventListener('scroll', alHacerScroll);
      window.removeEventListener('resize', ajustarLienzo);
      window.removeEventListener('keydown', alTeclear);
      html.removeEventListener('pointerleave', alSalirPuntero);
      document.removeEventListener('pointerdown', alPulsarFuera);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      lienzo?.remove();
      limpiarTruco();
      raiz.remove();
    },
  };
}
