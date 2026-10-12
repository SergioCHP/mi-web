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
 *   respuestas   URL del archivo de respuestas (por defecto 'respuestas.json').
 *   responder    async (texto, { idioma }) => string | { texto, enlace, efecto, sugerencias }
 *                Solo si quieres sustituir el buscador por otro sistema (backend, IA…).
 *   detectar     () => 'claro' | 'oscuro'. Por defecto lee data-theme.
 *   comentarios  true: comenta las secciones (#sobre-mi, #proyectos…) al hacer scroll.
 *   tiempoSueno  ms de inactividad hasta que se duerme (por defecto 30000).
 *
 * Colores: usa las variables de tu web (--accent, --accent-alt, --surface,
 * --text, --font-display…), así que cambia solo con el tema y el acento.
 * Idioma: lee el atributo lang de <html> (es / va) y cambia en directo.
 *
 * API devuelta: { abrir, cerrar, decir(texto), celebrar(), destruir }
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
    arrastre: ['¡Eh, suéltame!', '¡Wiiiii!', 'Que me despeinas la llama…', '¡Cuidado, que soy de papel!'],
    secciones: {
      'sobre-mi': 'Aquí Sergio cuenta quién es y por qué programa.',
      'lo-que-he-hecho': 'De SMR a DAM, con certificaciones Cisco incluidas.',
      'me-gusta': 'Juegos, cine, anime y libros. Pregúntame por cualquiera.',
      proyectos: 'Sus proyectos. Usa los filtros o pregúntame.',
      contacto: '¿Quieres hablar con Sergio? Tienes su contacto aquí.',
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
    arrastre: ['Eh, solta’m!', 'Iuuuuu!', 'Que em despentines la flama…', 'Compte, que soc de paper!'],
    secciones: {
      'sobre-mi': 'Ací Sergio conta qui és i per què programa.',
      'lo-que-he-hecho': 'De SMR a DAM, amb certificacions Cisco incloses.',
      'me-gusta': 'Jocs, cinema, anime i llibres. Pregunta’m per qualsevol.',
      proyectos: 'Els seus projectes. Usa els filtres o pregunta’m.',
      contacto: 'Vols parlar amb Sergio? Tens el seu contacte ací.',
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

export const normalizarTexto = (texto) =>
  String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

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
  for (const clave of frase.palabras) {
    let mejor = 0;
    let indice = -1;
    palabras.forEach((palabra, i) => {
      if (usados.has(i)) return;
      const p = parecido(clave, palabra);
      if (p > mejor) { mejor = p; indice = i; }
    });
    if (mejor < UMBRAL) {
      if (perdonables-- > 0) continue;
      return null;
    }
    suma += mejor;
    usados.add(indice);
  }
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

  const memoria = { ultima: null, tema: null, dichas: new Set(), variantes: new Map() };

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
    if (intencion.enlace?.href) {
      r.enlace = { href: intencion.enlace.href, texto: intencion.enlace[idioma] || intencion.enlace.es || intencion.enlace.href };
    }
    const sugerencias = lista(intencion.sugerencias, idioma);
    if (sugerencias.length) r.sugerencias = sugerencias;
    return r;
  };

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
    const { item, hay } = itemNuevo(intencion.tema);
    const elegido = item || (hay ? elegirAlAzar(itemsDeTema(intencion.tema)) : null);
    return elegido ? construir(elegido, idioma, variante(intencion, idioma)) : construir(intencion, idioma);
  };

  const accionSorpresa = (intencion, idioma) => {
    const candidatas = intenciones.filter((i) => (i.item || i.repetible) && i.id !== memoria.ultima?.id);
    return construir(elegirAlAzar(candidatas), idioma, variante(intencion, idioma));
  };

  return {
    responder(texto, idioma = 'es') {
      const limpio = normalizarTexto(texto);
      const palabras = limpio.split(' ').filter(Boolean);
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
      return construir(mejor, idioma);
    },
  };
}

/* Carga respuestas.json una sola vez (y usa el respaldo si falla) */
const cerebros = new Map();
export function cargarCerebro(url = 'respuestas.json') {
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
    respuestas = 'respuestas.json',
    responder = null,
    detectar = detectarTema,
    comentarios = true,
    tiempoSueno = 30000,
  } = opciones;

  const izquierda = posicion !== 'derecha';
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const punteroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const html = document.documentElement;
  const tx = () => {
    const idioma = idiomaActual();
    return { ...TEXTOS[idioma], ...(textos[idioma] || {}) };
  };

  /* Por defecto responde con el buscador de respuestas.json; "piensa" un momento para que se note */
  const responderConArchivo = async (texto, { idioma }) => {
    const [cerebro] = await Promise.all([cargarCerebro(respuestas), esperar(azar(380, 760))]);
    return cerebro.responder(texto, idioma);
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
      <span class="farol-fisica"><span class="farol-flotar">${SVG}</span></span>
    </button>`;
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

  let abierto = false;
  let ocupado = false;
  let saludado = false;
  let hover = false;
  let destruido = false;
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
    chips.scrollLeft = 0;
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
    if (abierto || destruido) return;
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

  const estallido = (cantidad = 30, origen = centro()) => {
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
        color: tirada < 0.45 ? colores.a : tirada < 0.85 ? colores.b : '#ffffff',
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
      if (p.tipo === 'chispa') {
        p.vy += 240 * dt;
        p.vx *= 1 - 1.6 * dt;
        p.vy *= 1 - 0.6 * dt;
      } else {
        p.vx += Math.sin(p.vida * 4 + p.fase) * 30 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      ctx.fillStyle = p.color;
      if (p.tipo === 'z') {
        ctx.globalAlpha = k * 0.9;
        ctx.font = `700 ${p.tam}px ${FUENTE_Z}`;
        ctx.fillText('z', p.x, p.y);
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

  /* ---------- Bucle principal (física + chispas) ---------- */
  let raf = 0;
  let ultimo = 0;
  let acumulado = 0;
  let ultimaZ = 0;

  const tasaAscuas = () => {
    const { cara, estado } = raiz.dataset;
    if (cara === 'dormido' || cara === 'mareado') return 0;
    if (arrastre?.activo) return 34;
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

    // Muelle que devuelve el farolillo a su sitio
    if (!arrastre?.activo) {
      fis.vx += (-170 * fis.x - 11 * fis.vx) * dt;
      fis.vy += (-170 * fis.y - 11 * fis.vy) * dt;
      fis.x += fis.vx * dt;
      fis.y += fis.vy * dt;
    }
    // Péndulo: se inclina hacia el cursor o hacia donde lo arrastras
    const objetivo = arrastre?.activo ? limitar(fis.x * 0.3, -28, 28) : fis.inclinacion;
    fis.vAng += (-55 * (fis.ang - objetivo) - 6.5 * fis.vAng) * dt;
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
    if (!abierto && !arrastre && raiz.dataset.cara === 'normal' &&
        performance.now() - ultimaActividad > tiempoSueno) {
      dormir();
    }
    dibujar(dt);
  };

  const arrancar = () => {
    if (reducido || raf || destruido) return;
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
  const bajar = () => {
    mensajes.scrollTop = mensajes.scrollHeight;
  };

  const crearBurbuja = (autor) => {
    const burbuja = document.createElement('p');
    burbuja.className = `farol-msg farol-msg--${autor}`;
    mensajes.append(burbuja);
    return burbuja;
  };

  /* Efectos que puede pedir una respuesta: fuegos | salto | giro | feliz */
  const aplicarEfecto = (efecto) => {
    if (!efecto) return;
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
    const { texto = '', enlace, efecto, sugerencias } = typeof respuesta === 'string' ? { texto: respuesta } : respuesta;
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
        bajar();
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
    pedirOjos();
    bajar();
  };

  const enviar = async (texto) => {
    if (ocupado) return;
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
      respuesta = await obtenerRespuesta(texto, { idioma: idiomaActual() });
    } catch (error) {
      console.error('[Farolillo]', error);
      respuesta = tx().error;
    }
    puntos.remove();
    await escribir(respuesta);
    ocupado = false;
  };

  /* ---------- Abrir / cerrar ---------- */
  const abrir = () => {
    if (abierto) return;
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
        ocupado = false;
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

  const marear = () => {
    cerrar(false);
    ponerCara('mareado', 2600);
    reaccionar('farol--mareo');
    fis.vAng += 520;
    estallido(44);
    mostrarPista(tx().mareo, 2600);
  };

  const alHacerClick = () => {
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
    if (reducido || e.button !== 0) return;
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
    fis.vx = limitar(soltado.velX * 0.35, -900, 900);
    fis.vy = limitar(soltado.velY * 0.35, -900, 900);
    fis.vAng += limitar(soltado.velX * 0.12, -500, 500);
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

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.farol-chip');
    if (chip && !ocupado) enviar(chip.textContent);
  });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = entrada.value.trim();
    if (!texto || ocupado) return;
    entrada.value = '';
    enviar(texto);
  });

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
  try { pistaVista = sessionStorage.getItem('farolillo-pista') === '1'; } catch { /* sin storage */ }
  if (!pistaVista) {
    temporizador(() => {
      if (abierto || raiz.dataset.cara !== 'normal') return;
      fis.vy -= 200;
      mostrarPista(tx().pistaInicial, 5000);
      try { sessionStorage.setItem('farolillo-pista', '1'); } catch { /* sin storage */ }
    }, 4500);
  }

  /* ---------- API pública ---------- */
  return {
    abrir,
    cerrar,
    decir(texto) {
      abrir();
      return escribir(texto);
    },
    celebrar: fuegos,
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
      raiz.remove();
    },
  };
}
