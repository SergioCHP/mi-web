# Farolillo · la mascota-chatbot de mi-web

Farolillo es un espíritu-farolillo de papel que vive en la esquina inferior izquierda de la web. Flota, mira al cursor, se puede arrastrar y lanzar, reacciona a lo que haces en la página y abre un chat que responde preguntas sobre mí, mis gustos y la propia web.

Todo funciona **en el navegador, sin IA ni servidor**: las respuestas salen de un buscador propio que lee `data/respuestas.json`.

| | |
|---|---|
| **Archivos** | `js/farolillo.js` (módulo ES, 2 592 líneas) · `css/farolillo.css` (1 486 líneas) · `data/respuestas.json` (10 103 líneas) |
| **Páginas** | `index`, `juegos`, `cine`, `anime`, `libros`, `caso-estudio` y `privacidad` |
| **Idiomas** | Castellano y valenciano, y cambia en directo al cambiar el idioma de la web |
| **Contenido** | 256 intenciones, 2 660 frases reconocidas y 567 respuestas por idioma |
| **Extras** | Quiz de 37 preguntas, «¿Quién lo dijo?» de 24, 3 minijuegos, pilla-pilla, 19 trucos animados y un modo secreto de 8 bits |
| **Dependencias** | Ninguna: JavaScript, CSS y SVG propios |

---

## Índice

1. [Qué puede hacer el visitante](#1-qué-puede-hacer-el-visitante)
2. [El chat](#2-el-chat)
3. [Cómo entiende lo que escribes](#3-cómo-entiende-lo-que-escribes)
4. [Quiz y «¿Quién lo dijo?»](#4-quiz-y-quién-lo-dijo)
5. [Minijuegos del chat](#5-minijuegos-del-chat)
6. [Pilla-pilla](#6-pilla-pilla)
7. [Trucos animados](#7-trucos-animados)
8. [Código Konami y modo 8 bits](#8-código-konami-y-modo-8-bits)
9. [Cómo está hecho por dentro](#9-cómo-está-hecho-por-dentro)
10. [Accesibilidad y rendimiento](#10-accesibilidad-y-rendimiento)
11. [Privacidad y seguridad](#11-privacidad-y-seguridad)
12. [Cómo añadir o cambiar respuestas](#12-cómo-añadir-o-cambiar-respuestas)
13. [Opciones y API de `initFarolillo()`](#13-opciones-y-api-de-initfarolillo)
14. [Historial](#14-historial)

---

## 1. Qué puede hacer el visitante

### Con el ratón o el dedo

| Acción | Qué pasa |
|---|---|
| **Clic** | Da un saltito, suelta chispas y abre o cierra el chat. |
| **5 clics en menos de 2 s** | Se marea: da una voltereta y pone ojos de espiral («¡Para, que me mareo!»). |
| **Pasar el ratón por encima** | Brilla más y dice «¿Hablamos?». |
| **Mover el ratón por la página** | Le siguen los ojos y se inclina un poco hacia el cursor. |
| **Arrastrarlo** | Se estira como una goma (cuanto más tiras, más cuesta) y protesta. Al soltarlo vuelve a su sitio con un muelle. |
| **Lanzarlo** (soltarlo rápido, a más de 1 300 px/s) | Sale volando con gravedad, rebota en los bordes de la ventana con chispas y, cuando se para, vuelve flotando a su esquina mareado. |

### Lo que hace solo

| Situación | Reacción |
|---|---|
| Llegas a una página | A los 4,5 s saluda con un bocadillo propio de esa página (una vez por página y sesión). |
| Haces scroll | Se balancea con la inercia del scroll. |
| Llegas a una sección | Comenta la sección: «Aquí Sergio cuenta quién es y por qué programa». Cada sección una sola vez y con 6 s de pausa entre comentarios. |
| Llegas al final de la página | Lo celebra («¡Has llegado al final! 🏁»). Solo en páginas largas. |
| 30 s sin actividad | Se duerme: ojos cerrados y «z» flotando. Al mover el ratón o pulsar una tecla, se despierta sobresaltado. |
| Cambias a modo claro u oscuro | Se enciende o se apaga («Se ha hecho de noche. Ahora brillo más 🔥»). |
| Cambias el color de acento | Cambia de color con él y opina («Rosa neón. Me sienta genial 💗»). |
| Cambias de idioma | Todos sus textos pasan a castellano o valenciano al momento. |
| Copias texto de la web | «¡Eh, que eso lo escribió Sergio! 😄» (como mucho una vez cada 9 s). |
| Rellenas el formulario «¿Te llamo?» | Te anima al empezar y lanza fuegos artificiales al enviarlo. Mientras escribes se pone por encima de la ventana del formulario (en escritorio). |
| Agitas el móvil | Se marea («¡Terremoto! … Ah no, eras tú agitando el móvil»). Solo en móviles que dan el sensor sin pedir permiso: Android sí, iPhone no. |

### Esconderlo

El botón del ojo tachado de la cabecera del chat, o escribir «escóndete», lo deja como una pestañita en el borde. Escondido no se anima, no comenta y no gasta recursos. La preferencia se recuerda en todas las páginas y visitas, hasta que se toca la pestañita.

---

## 2. El chat

Al abrirlo saluda según la página («¡Bienvenido al grimorio! 📖…») y muestra **sugerencias**: botones con preguntas típicas. Las sugerencias cambian después de cada respuesta para proponer la siguiente pregunta lógica.

**De qué sabe hablar:**
- **Sobre mí:** quién soy, qué estudio, SMR, certificados de Cisco, contacto, la propia web.
- **Mis gustos:** juegos, pelis, anime, libros, series, cómics, música…
- **Mis proyectos** y cómo se hizo cada parte de la web (minijuego, grimorio, Farolillo…).
- **Utilidades:** la hora, el día de hoy y el año.
- **Para pasar el rato:** chistes, curiosidades, adivinanzas, consejos, cara o cruz, dado, bola mágica, frases míticas, piropos.

**Recomendaciones.** «Recomiéndame un juego» elige uno de mis 8 favoritos (hay 8 juegos, 8 pelis, 8 animes, 8 libros y 3 proyectos). «Otro» da el siguiente sin repetir. Cuando se acaban, lo dice.

**Contexto por página.** En `juegos.html`, «recomiéndame algo» o «otro» van de juegos; en `cine.html`, de pelis; etc. «¿Qué hay aquí?» describe la página en la que estás.

**Enlaces.** Si la respuesta habla de otra página, añade un enlace («Ir a Juegos»). Si ya estás en esa página, no lo pone.

**Si no entiende la pregunta,** lo dice y propone temas: nunca se queda callado.

---

## 3. Cómo entiende lo que escribes

En vez de un modelo de IA, Farolillo usa un **buscador difuso** propio (`crearCerebro()` en `farolillo.js`). Cada «intención» de `respuestas.json` tiene una lista de frases de ejemplo; el buscador puntúa cuánto se parece lo que escribes a cada una y responde con la mejor.

### Paso 1 · Normalizar el texto

`normalizarTexto()` deja el texto limpio para comparar:
1. Pasa a minúsculas y quita tildes y signos: «¿Qué JUEGO?» → `que juego`.
2. Traduce abreviaturas de chat: `k ase` → `que haces`, `xq` → `porque`, `tb` → `tambien`, `grax` → `gracias`.

### Paso 2 · Comparar palabra a palabra

`parecido()` puntúa de 0 a 3 cada palabra escrita frente a cada palabra clave:

| Caso | Ejemplo | Puntos |
|---|---|---|
| Idéntica | `juego` = `juego` | 3 |
| Plural o palabra más larga | `juegos` empieza por `juego` | 2,6 |
| Palabra cortada | `jueg` → `juego` | 2,2 |
| Le falta una letra al final | `bal` → `ball` | 2 |
| Dos letras intercambiadas | `jeugo` → `juego` | 1,9 |
| Faltas de ortografía | distancia de **Levenshtein** ≤ 1 (palabras de 5–7 letras) o ≤ 2 (8 o más) | 2 − 0,1 × faltas |

En las palabras de menos de 5 letras no se perdonan faltas, solo plurales y letras intercambiadas: así «pez» no se confunde con «paz». La distancia de Levenshtein tiene **corte temprano**: deja de calcular en cuanto se pasa del máximo de faltas permitido.

### Paso 3 · Puntuar frases e intenciones

- Una frase solo cuenta si **todas** sus palabras se reconocen con al menos 1,8 puntos. En frases de 3 o más palabras se perdona una, siempre que sea corta (como mucho el 30 % de las letras).
- Las frases de **varias palabras pesan más** que las sueltas (+0,6 por cada palabra extra), y más aún si aparecen seguidas en el texto.
- Si otras frases de la misma intención cubren más palabras de la pregunta, suma un pequeño bonus.
- Cada intención puede tener un **peso** (de 0,7 a 1,4) para desempatar: «otro» pesa 0,9 para no ganar a una pregunta concreta.
- Gana la intención con más puntos. Si ninguna llega a **1,8**, responde con un «no te entiendo» amable.

### Paso 4 · Memoria de la conversación

- **Último tema:** si hablabas de anime, «otro» o «recomiéndame uno» siguen con anime.
- **Favoritos ya dichos:** no repite una recomendación hasta agotar las del tema.
- **Variantes:** si una intención tiene varias respuestas, va rotando sin repetir hasta agotarlas.
- **Plantillas:** `{saludo}`, `{hora}`, `{dia}` y `{anio}` se rellenan al responder («¡Buenas tardes!»).

### Acciones especiales

Algunas intenciones no responden un texto fijo, sino que hacen algo:

| `accion` | Qué hace | Ejemplo |
|---|---|---|
| `aleatorio` | Recomienda un favorito del tema (o del tema de la página) | «Recomiéndame una peli» |
| `mas` | Da otro del último tema | «Otro» |
| `sorpresa` | Responde algo al azar: un favorito, un chiste, una curiosidad… | «Sorpréndeme» |
| `pagina` | Describe la página actual | «¿Qué hay aquí?» |
| `quiz` | Empieza un quiz | «Quiz de Sergio», «¿Quién lo dijo?» |
| `juego` | Empieza un minijuego | «Piedra, papel o tijera», «Ahorcado» |

Y dos `orden`: `ocultar` («escóndete») y `pilla` («juega conmigo»).

---

## 4. Quiz y «¿Quién lo dijo?»

- **Quiz de Sergio:** 5 preguntas al azar de un banco de 37 sobre mí («¿Qué estudia Sergio?», «¿Cuál es su consola favorita?»).
- **¿Quién lo dijo?:** 5 frases míticas al azar de 24, y hay que adivinar de qué película, serie o juego son.

**Cómo se juega:**
- Las opciones salen como botones y se barajan en cada partida.
- También se puede contestar escribiendo: el número (`1`), la letra (`b`) o el texto, aunque tenga faltas.
- Tras cada respuesta dice si has acertado y explica la buena.
- Al final da una nota con tres niveles: perfecto (con fuegos artificiales), aprobado o suspenso.
- «Salir» lo deja a medias y solo cuenta las preguntas contestadas.

Mientras hay un quiz en marcha, todo lo que se escribe se toma como respuesta.

---

## 5. Minijuegos del chat

Igual que el quiz: mientras hay uno en marcha, lo que escribes va al juego, y «salir» lo termina.

| Juego | Cómo funciona |
|---|---|
| **Piedra, papel o tijera** | Gana quien llegue antes a 3. Se juega con botones, escribiendo la jugada (también en valenciano o con su número) o con emojis ✊ ✋ ✌️. Lleva el marcador. |
| **Adivina el número** | Número secreto del 1 al 100. Dice si es mayor o menor, si «quemas» o estás «frío», y el rango que queda. El botón sugerido es siempre el punto medio del rango (búsqueda binaria). Con 5 intentos o menos: «Nivel: maestro de la búsqueda binaria». |
| **Ahorcado friki** | 32 títulos de juegos, pelis, animes, libros y series. 6 vidas en forma de farolillos 🏮 que se apagan 💨. Se puede pedir una pista (la categoría) o escribir el título entero. |

---

## 6. Pilla-pilla

Con «juega conmigo», Farolillo sale disparado y durante **15 segundos** huye del cursor por toda la pantalla, con una cuenta atrás encima y burlas («¡Casi! 😝»). Si le haces clic, lo has pillado: fuegos artificiales. Si se acaba el tiempo, gana él.

**Cómo huye:**
- Cuanto más cerca está el cursor (menos de 230 px), más fuerte se aparta.
- Si lo arrinconas, se escabulle hacia un lado.
- Pasea al azar para no quedarse quieto, y las paredes lo empujan hacia dentro.
- Velocidad máxima de 950 px/s: rápido, pero se le puede pillar.
- En pantallas táctiles no hay cursor, así que da acelerones cada medio segundo.
- Deja libre la barra de navegación.

Con «reducir movimiento» activado no corre: dice que cuenta como que lo has pillado.

---

## 7. Trucos animados

Ciertas frases de películas, series, anime y videojuegos hacen que Farolillo haga un truco. Todos son CSS, SVG y partículas propios, y se mueven pegados a él.

| Truco | Qué hace | Algunas frases que lo activan |
|---|---|---|
| `sable` | Espada láser de color al azar: se enciende y da dos mandobles | «sable láser», «star wars», «shinzou wo sasageyo» |
| `sable-rojo` | Igual, en rojo | «yo soy tu padre» |
| `varita` | Floritura con chispas plateadas y destello de luz | «lumos», «haz magia», «eres un mago, Harry» |
| `anillo` | Se pone un anillo dorado y se vuelve invisible un momento | «mi tesoro», «ponte el anillo» |
| `kamehameha` | Carga una bola de energía y suelta un rayo que cruza la pantalla | «kamehameha» |
| `final-flash` | Igual, en amarillo | «final flash» |
| `bola` | Bola de fuego que sale disparada | «hadouken», «bola de fuego» |
| `corte` | Corte en media luna que cruza la pantalla | «bankai», «wake up, samurai» |
| `rasengan` | Esfera de energía girando en la mano | «rasengan», «esfera de energía» |
| `aura` | Aura dorada, chispas que suben y temblor | «super saiyan», «it's over 9000» |
| `kaioken` | Igual, en rojo | «kaioken» |
| `matrix` | Lluvia de código verde por toda la pantalla y él se tiñe de verde | «no hay cuchara», «lluvia de código» |
| `gafas` | Gafas de sol pixeladas que bajan hasta los ojos | «hasta la vista», «deal with it» |
| `caja` | Se esconde en una caja de cartón y sale una exclamación | «snake», «modo sigilo» |
| `baston` | Golpe de bastón en el suelo con onda expansiva | «no puedes pasar» |
| `onda` | Patada con onda expansiva | «esto es Esparta», «plus ultra» |
| `estirar` | Se estira como si fuera de goma | «gomu gomu», «estírate» |
| `amor` | Ojos de corazón y corazones que suben | piropos («qué mono») |
| `kamikaze` | Se hincha, explota y vuelve como fantasma | «kamikaze», «autodestrucción» |

«Haz un truco» elige uno al azar. Los minijuegos también los usan: si pierdes al ahorcado, Farolillo hace el kamikaze.

Además de los trucos, las respuestas pueden pedir efectos simples: `fuegos` (fuegos artificiales), `salto`, `giro` y `feliz`.

---

## 8. Código Konami y modo 8 bits

El código Konami (**↑ ↑ ↓ ↓ ← → ← → B A**) convierte a Farolillo en un **sprite de 8 bits**: un dibujo en pixel art de 14 × 20 píxeles, con sus propias caras, llama parpadeante y chispas cuadradas. Repetir el código lo devuelve a la normalidad. La preferencia se guarda entre visitas.

Se puede meter de tres formas:
- **Tecleándolo** con las flechas y las letras B y A en cualquier parte de la página, menos dentro de otro formulario. Si el chat está cerrado, se abre solo.
- **Escribiéndolo en el chat** con flechas (`↑↑↓↓←→←→BA`) o con `^^vv<><>ba`.
- **Escribiéndolo con palabras:** «arriba arriba abajo abajo izquierda derecha izquierda derecha b a», también en valenciano («dalt», «baix», «esquerra», «dreta») o en inglés.

---

## 9. Cómo está hecho por dentro

### Arquitectura

```
initFarolillo()                       ← crea todo y devuelve la API
 ├── Marcado: botón con el SVG, panel del chat, bocadillo y pestañita
 ├── Física y bucle de animación      requestAnimationFrame
 ├── Partículas                       un <canvas> a pantalla completa
 ├── Chat                             burbujas, sugerencias y efecto de escribir
 ├── Reacciones a la web              scroll, secciones, tema, idioma, copiar, formularios, sensor
 └── responder(texto)                 por defecto, el «cerebro»:
      crearCerebro(respuestas.json)   buscador difuso + memoria + quiz + juegos
```

El cerebro (`crearCerebro`) no toca el DOM: recibe texto y devuelve `{ texto, enlace, efecto, sugerencias, orden }`. Por eso se puede cambiar por otro sistema (un backend o una IA) sin tocar la parte visual.

### Dibujo

- **Farolillo es un SVG** con degradados para el papel, la llama, el halo y la luz interior. Las partes (ojos, boca, mejillas, costillas del papel) son grupos que el CSS enseña u oculta.
- **Caras:** `normal`, `feliz`, `sorpresa`, `dormido`, `mareado` y `enamorado`, en el atributo `data-cara`.
- **Estados:** `reposo`, `escuchando` (mientras escribes), `pensando` (mira hacia arriba, con tres puntitos) y `hablando` (mueve la boca), en `data-estado`.
- **Colores heredados:** el CSS usa las variables de la web (`--accent`, `--accent-alt`, `--surface`…) y deriva el resto con `color-mix()`. Si cambia el tema o el acento, Farolillo cambia solo. En modo claro es menos neón y más farol de papel.

### Física

Cada fotograma (`requestAnimationFrame`) actualiza posición, velocidad y ángulo:
- **Muelle:** lo devuelve a su sitio cuando lo sueltas (rigidez 170, amortiguación 11).
- **Péndulo:** se inclina hacia el cursor o hacia donde lo arrastras, y se balancea con el scroll.
- **Goma:** al arrastrar, el desplazamiento crece cada vez menos (`max × (1 − e^(−0,65·d/max))`), hasta 110 px.
- **Vuelo:** gravedad de 1 500 px/s², rebote que conserva el 72 % de la velocidad, rozamiento con el suelo y chispas al chocar fuerte. Cuando lleva 0,25 s casi quieto en el suelo, o 3,5 s volando, vuelve flotando a casa.
- El paso de tiempo se limita a 33 ms: si el navegador va a tirones, la física no se dispara.

### Partículas

Un único `<canvas>` a pantalla completa, sin capturar clics, dibuja hasta **260 partículas** a la vez: ascuas que suben de la llama, chispas con gravedad, «z» del sueño, corazones y caracteres de Matrix.
- La llama suelta más ascuas cuando lo arrastras, piensa o pasas el ratón, y ninguna cuando duerme.
- En modo oscuro las chispas suman luz (`lighter`); en claro se pintan sin halo para no ensuciar.
- El lienzo se ajusta a la densidad de píxeles de la pantalla (como mucho ×2).

### Escuchar a la web

- **`MutationObserver`** sobre `<html>` y `<body>`: detecta cambios de tema (`data-theme`), acento (`data-accent`) e idioma (`lang`).
- **`IntersectionObserver`:** detecta qué sección está en el centro de la pantalla para comentarla.
- **Eventos del documento:** `copy`, `focusin` / `focusout` y `submit` de los formularios, `devicemotion` del móvil y `visibilitychange`.

### Carga

- Cada página crea a Farolillo cuando el navegador queda libre (`requestIdleCallback`), después de cargar: no retrasa lo importante.
- `respuestas.json` se descarga a los 1,5 s, antes de que nadie pregunte, y una sola vez aunque haya varias llamadas.
- Si el archivo no se puede cargar, usa un **respaldo** de 6 intenciones básicas incluido en el código.
- Antes de responder «piensa» entre 0,4 y 0,8 s, y escribe la respuesta letra a letra en 1,6 s como mucho, aunque sea larga.

---

## 10. Accesibilidad y rendimiento

**Accesibilidad**
- El botón tiene `aria-label` («Abrir chat con Farolillo») y `aria-expanded`. El panel es un `role="dialog"` con nombre.
- Los mensajes nuevos se anuncian a los lectores de pantalla (`aria-live="polite"`).
- Esc cierra el chat y devuelve el foco al botón.
- Las sugerencias son botones reales: se usan con Tab e Intro.
- Todas las partes decorativas (SVG, lienzo, trucos) llevan `aria-hidden`.
- **Con «reducir movimiento»:** no hay lienzo de partículas, animaciones, física, trucos ni pilla-pilla, y las respuestas aparecen de golpe. El chat funciona igual.

**Rendimiento**
- El bucle de animación se para con la pestaña oculta y cuando Farolillo está escondido.
- Los ojos se recalculan solo cuando se mueve el ratón, en el siguiente fotograma.
- El lienzo solo se repinta mientras hay partículas.
- La caja de texto se enfoca sola solo en ordenador, para no abrir el teclado del móvil.

---

## 11. Privacidad y seguridad

- **No guarda las conversaciones ni las envía a ningún sitio:** el buscador funciona en el navegador. Lo único que se descarga es `respuestas.json`, de la propia web.
- **Lo que recuerda el navegador:**
  - `localStorage` `farolillo-oculto`: si lo has escondido.
  - `localStorage` `farolillo-retro`: si está en modo 8 bits.
  - `sessionStorage` `farolillo-pista-<página>`: si ya ha saludado en esa página en esta visita.

  Si el navegador bloquea el almacenamiento, funciona igual pero no lo recuerda.
- **Sin HTML inyectado:** lo que escribes y las respuestas se pintan con `textContent`, nunca como HTML.
- **Enlaces seguros:** `enlaceSeguro()` solo deja pasar enlaces `http`, `https` o de la propia web, y bloquea `javascript:` y `data:`. Así sigue siendo seguro si algún día las respuestas vienen de un backend o una IA.
- La caja de texto admite como mucho 300 caracteres.

---

## 12. Cómo añadir o cambiar respuestas

Todo el contenido está en `data/respuestas.json`: **no hace falta tocar el código**. Tras editarlo, recarga la página (con un servidor local, porque se carga con `fetch`).

### Una intención

```json
{
  "id": "hadouken",
  "frases": ["hadouken", "shoryuken", "street fighter"],
  "es": ["¡HADOUKEN! 🔥 Lo siento, me ha salido una bola de fuego de verdad."],
  "va": ["HADOUKEN! 🔥 Ho sent, m’ha eixit una bola de foc de veres."],
  "efecto": "bola",
  "peso": 1.3
}
```

| Campo | Obligatorio | Para qué sirve |
|---|---|---|
| `id` | Sí | Nombre único. |
| `frases` | Sí | Lo que puede escribir el visitante. Da igual tildes, mayúsculas y signos. Mejor varias frases cortas y alguna de varias palabras. |
| `es` / `va` | Sí | Respuestas. Si hay varias, rota sin repetir. Admiten `{saludo}`, `{hora}`, `{dia}` y `{anio}`. |
| `enlace` | No | `{ "href": "libros.html", "es": "Abrir el grimorio", "va": "Obrir el grimori" }` |
| `sugerencias` | No | Botones que salen después: `{ "es": [...], "va": [...] }` |
| `efecto` | No | `fuegos`, `salto`, `giro`, `feliz`, el nombre de un truco, `truco` (uno al azar) o una lista para elegir al azar. |
| `peso` | No | Prioridad para desempatar (1 por defecto). |
| `tema` + `item: true` | No | Lo convierte en favorito de un tema (`juegos`, `cine`, `anime`, `libros`, `proyectos`) para las recomendaciones y «otro». |
| `repetible: true` | No | Permite pedir «otro» del mismo tipo (otro chiste, otra curiosidad). |
| `accion` | No | `aleatorio`, `mas`, `sorpresa`, `pagina`, `quiz` o `juego` (ver el [apartado 3](#acciones-especiales)). |
| `orden` | No | `ocultar` o `pilla`. |

### Otras secciones del archivo

| Sección | Qué contiene |
|---|---|
| `porDefecto` | Respuestas cuando no entiende nada. |
| `agotado` / `sinContexto` | Cuando ya no quedan favoritos del tema, o cuando se pide «otro» sin tema. |
| `temas` | Nombre de cada tema en los dos idiomas («pelis» / «pel·lis»). |
| `sugerenciasInicio` | Botones por defecto. |
| `paginas` | Por cada página: qué contar en «¿Qué hay aquí?», sus sugerencias y su tema por defecto. |
| `quiz` y `quienLoDijo` | Preguntas (`correcta` es la posición de la opción buena, desde 0), cuántas se piden y los textos del quiz. |
| `juegos` | Textos de los minijuegos, palabras del ahorcado con su categoría y número de vidas. |

### Consejos

- Prueba la frase nueva y también alguna parecida con faltas: si responde otra intención, añade frases de varias palabras o sube un poco el `peso`.
- Escribe siempre la versión en valenciano: si falta, usa la castellana.
- Los saludos, pistas y sugerencias de cada página que no dependen del chat están en `TEXTOS.paginas`, dentro de `farolillo.js`.

---

## 13. Opciones y API de `initFarolillo()`

```js
import { initFarolillo } from './js/farolillo.js';
const farolillo = initFarolillo({ posicion: 'izquierda' });
```

| Opción | Por defecto | Para qué sirve |
|---|---|---|
| `posicion` | `'izquierda'` | `'izquierda'` o `'derecha'`. |
| `contenedor` | `document.body` | Dónde se inserta. |
| `textos` | — | `{ es: {...}, va: {...} }` para cambiar textos de la interfaz. |
| `respuestas` | `'data/respuestas.json'` | Ruta del archivo de respuestas. |
| `responder` | buscador propio | `async (texto, { idioma, pagina }) => respuesta`, para usar otro sistema (backend, IA…). |
| `detectar` | lee `data-theme` | Función que devuelve `'claro'` u `'oscuro'`. |
| `comentarios` | `true` | Comentar las secciones al llegar a ellas. |
| `pagina` | nombre del archivo | Página para el saludo y el contexto. También se puede forzar con `data-farol-pagina` en `<body>`. |
| `tiempoSueno` | `30000` | Milisegundos sin actividad hasta que se duerme. |

**Devuelve:** `abrir()`, `cerrar()`, `ocultar()`, `mostrar()`, `decir(texto)`, `celebrar()` (fuegos artificiales), `pillaPilla()`, `truco(nombre)` y `destruir()` (quita todo, incluidos los eventos y temporizadores).

---

## 14. Historial

| Fecha | Commit | Cambio |
|---|---|---|
| 12 oct | `9dbe918` | Primera versión: mascota con física, partículas y buscador difuso con 116 intenciones. |
| 21 oct | `d87f9d8` | Más respuestas, quiz, contexto por página, modo escondido y primeros trucos. Farolillo pasa a estar en 7 páginas. |
| 21 oct | `517fd2f` | Trucos animados. |
| 21 oct | `c0f8393` | Sugerencias que cambian con cada respuesta y respuestas largas legibles desde el principio. |
| 21 oct | `f6483cb` | Se puede lanzar y rebota por la pantalla; más trucos. |
| 21 oct | `c6298b2` | Minijuegos en el chat: piedra, papel o tijera, adivina el número, ahorcado y «¿Quién lo dijo?». |
| 21 oct | `a2378e7` | Código Konami y modo 8 bits. |
| 21 oct | `f45f8f4` | Pilla-pilla. |
| 21 oct | `1254448` | Reacciona al final de la página, a copiar texto, al formulario y a agitar el móvil. |
