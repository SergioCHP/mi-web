# mi-web · Sergio Chorques

Web personal y portfolio interactivo de **Sergio Chorques**, estudiante de 1º de DAM en el IES Simarro.
Hecha a mano con **HTML, CSS y JavaScript vanilla**, sin frameworks, con **Supabase** como backend.

🔗 **Web publicada:** https://sergiochp.github.io/mi-web/
📄 **Caso de estudio y vídeo demo:** https://sergiochp.github.io/mi-web/caso-estudio.html
🏷️ **Versión actual:** [v1.0.0](https://github.com/SergioCHP/mi-web/releases/tag/v1.0.0) · cambios en [CHANGELOG.md](CHANGELOG.md)

---

## Qué hace

| Página | Qué ofrece |
|---|---|
| `index.html` | Portada con hero rotativo, sobre mí, trayectoria (con visor de certificados Cisco), intereses, proyectos filtrables, actividad de GitHub en directo y contacto |
| `juegos.html` | Carrusel 3D de mis juegos favoritos + buscador de videojuegos (API de **RAWG**) |
| `minijuego.html` | Combate JRPG por turnos (sistema ATB en canvas) que da acceso a la página de juegos |
| `matrix_pills.html` | Elección «pastilla roja / azul» con lluvia digital en canvas que lleva a Cine o Anime |
| `cine.html` | Carrusel 3D de películas + explorador de cine (API de **TMDB**) |
| `anime.html` | Vitrina con tarjeta giratoria y citas + explorador de anime (API GraphQL de **AniList**, con tráiler) |
| `libros.html` | «Grimorio 3D»: libro que se abre y pasa páginas con sonido generado con Web Audio (GSAP + St.PageFlip) |
| `caso-estudio.html` | Caso de estudio: objetivos, proceso, arquitectura, problemas y soluciones, demo en vídeo con subtítulos y aprendizajes |
| `admin.html` | Panel privado con login (Supabase Auth) para leer, marcar y borrar los mensajes de contacto |

**En todas las páginas:**
- Modo claro / oscuro y color de acento rosa / azul, que se recuerdan entre visitas.
- Idiomas castellano y valenciano (`es` / `ca-ES-valencia`).
- Menú móvil accesible.
- Respeto a `prefers-reduced-motion`.

**Extras en la portada:**
- **Farolillo**, una mascota-chatbot con física, partículas y un motor de respuestas propio. Entiende faltas de ortografía y sinónimos.
- Formulario **«¿Te llamo?»** que guarda las solicitudes en Supabase, me avisa por correo y envía una **respuesta automática** al visitante en su idioma (Edge Function `contacto`).
- Widget del tiempo de Enguera (API de **Open-Meteo**).

---

## Tecnologías

- **Frontend:**
  - HTML5 semántico.
  - CSS3 con variables, `color-mix()`, grid y media queries.
  - JavaScript ES6+ con módulos (`farolillo.js`).
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security + Edge Functions en Deno/TypeScript).
- **Correo:** Gmail por SMTP (puerto 465) desde la Edge Function, con la contraseña guardada en los *Secrets* de Supabase.
- **APIs externas:** GitHub REST, RAWG, TMDB, AniList (GraphQL), Open-Meteo.
- **Librerías**, solo en `libros.html` y con versiones fijadas:
  - GSAP 3.12;
  - St.PageFlip 2.0.7.
- **Despliegue:** GitHub Pages.

---

## Estructura

```
mi-web/
├── index.html              Portada
├── caso-estudio.html       Caso de estudio del proyecto (con vídeo demo)
├── juegos.html · cine.html · anime.html · libros.html
├── minijuego.html · matrix_pills.html · admin.html
├── css/                    style.css (base y variables), theme-light.css, pages.css,
│                           mobile.css y una hoja por página
├── js/                     script.js (portada), componentes compartidos
│   │                       (theme, nav-i18n, particles, carousel3d, a11y, mobile),
│   │                       farolillo.js (módulo ES del chatbot) y caso.js
│   └── jrpg/               Minijuego en módulos ES: core, data, battle, render, ui
├── data/respuestas.json    «Cerebro» de Farolillo (intenciones y respuestas ES/VA)
├── images/                 Imágenes en WebP (hero-1…8 y sus recortes -movil, portadas, thumbs/)
│                           y logo.svg (logo SC propio)
├── assets/                 Sprites del minijuego, vídeo demo (MP4 + VTT) y fuentes (fonts/)
├── tools/                  Scripts de apoyo del minijuego (simulación en Node, sprites)
├── docs/                   Guías (correo de contacto, sprites del minijuego) y PROMPTS.md
│                           (órdenes clave a la IA)
├── CHANGELOG.md            Historial de versiones
└── supabase/
    ├── rls.sql             Políticas de seguridad de la base de datos
    └── functions/contacto/ Edge Function del formulario (index.ts) y sus pruebas (index.test.ts)
```

**Componentes reutilizables:** el tema, las partículas y el carrusel 3D se escribieron una sola vez y se cargan en cada página que los necesita (antes estaban copiados en varias). Las páginas no tienen bloques `<style>` ni atributos `style=""`: todo el CSS está en `css/`.

---

## Cómo levantar el proyecto en local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/SergioCHP/mi-web.git
   cd mi-web
   ```
2. Ábrelo con un **servidor local**. No basta con abrir el HTML con doble clic: `js/farolillo.js` es un módulo ES y `data/respuestas.json` se carga con `fetch`, y el navegador bloquea ambos con `file://`. Elige una opción:
   - **VS Code:** instala la extensión *Live Server*, clic derecho en `index.html` → *Open with Live Server*.
   - **Python:** `python -m http.server 5500` y entra en `http://localhost:5500`.
3. Todo funciona sin configurar nada más. La web usa el proyecto de Supabase ya creado y claves públicas de solo lectura.

### Usar tu propio Supabase (opcional)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, crea la tabla:
   ```sql
   create table public.mensajes (
     id bigint generated always as identity primary key,
     nombre text not null,
     email text not null,
     telefono text,
     disponibilidad text,
     mensaje text,
     leido boolean default false,
     fecha timestamptz default now()
   );
   ```
3. Ejecuta `supabase/rls.sql`, cambiando antes `TU_EMAIL_ADMIN` por tu correo.
4. En **Authentication → Users**, crea tu usuario administrador y desactiva el registro público.
5. Sustituye `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `js/script.js` y en `admin.html`.
6. (Opcional) Despliega la Edge Function de correo siguiendo [`docs/CONTACTO_CORREO.md`](docs/CONTACTO_CORREO.md). Sin ella, el formulario sigue guardando los mensajes, pero no envía correos.

### Pruebas automáticas

La Edge Function tiene 15 pruebas (validación, CORS, antispam, límite de envíos y fallos de correo) que no envían correos reales. Con [Deno](https://deno.com) instalado:

```bash
# Linux / macOS
CONTACTO_TEST=1 deno test --allow-env --allow-read --allow-net --allow-sys supabase/functions/contacto
# Windows (PowerShell)
$env:CONTACTO_TEST=1; deno test --allow-env --allow-read --allow-net --allow-sys supabase/functions/contacto
```

---

## Decisiones técnicas

### 1. JavaScript vanilla, sin frameworks
Es un portfolio de primero de DAM: quería entender cómo funcionan el DOM, los eventos y las animaciones antes de apoyarme en React o similares.
- El resultado son páginas ligeras, sin paso de compilación, que se publican tal cual en GitHub Pages.
- Solo uso librerías donde reinventarlas no aportaba aprendizaje: la física de pasar páginas del grimorio (St.PageFlip) y su coreografía (GSAP).

### 2. Supabase con Row Level Security para el contacto
Una web estática no puede guardar secretos, así que la clave `anon` de Supabase es **pública a propósito**. La seguridad está en la base de datos, con RLS:
- **Visitantes anónimos:** solo pueden **insertar** mensajes, con límites de longitud.
- **Usuario administrador:** solo él, identificado por su email en el JWT, puede **leer, editar y borrar**.

Además:
- El panel `admin.html` **escapa todo** lo que muestra, para evitar XSS: los mensajes los escriben desconocidos.
- El formulario lleva un campo *honeypot* antispam.

**Correo de aviso y respuesta automática.** El formulario llama a la Edge Function `contacto`, que valida los datos, limita los envíos (3 por email y 20 en total por hora), guarda el mensaje y envía dos correos: un aviso para mí (al pulsar «Responder» contesto al visitante) y una confirmación para el visitante.
- La contraseña de Gmail vive en los *Secrets* de Supabase, nunca en el código ni en GitHub.
- La respuesta automática **no copia el mensaje** del visitante: así nadie puede usar el formulario para mandar texto a otra persona.
- Si la función no está disponible, el formulario guarda el mensaje directamente en la tabla (plan B), sin correo.

### 3. Farolillo: un chatbot sin IA ni servidor
En lugar de conectar un modelo de lenguaje (coste, latencia y una clave que no se puede esconder en el frontend), Farolillo usa un **motor de búsqueda difusa** propio:
- Normaliza el texto: quita tildes, mayúsculas y signos.
- Tolera faltas con la **distancia de Levenshtein** y detecta letras intercambiadas.
- Puntúa las «intenciones» de `respuestas.json` y recuerda el último tema («otro», «recomiéndame uno»).

Todo el contenido está en `data/respuestas.json`, editable sin tocar código. La función `responder` se puede sustituir por un backend en el futuro, porque `initFarolillo()` la acepta como opción.

### 4. Temas e idiomas sin parpadeo
- Un pequeño script en el `<head>` aplica el tema y el acento guardados **antes de pintar** la página: evita el destello oscuro → claro.
- Los colores son variables CSS (`--accent`, `--surface`…), así que cambiar de tema es cambiar un atributo `data-theme` en `<html>`.
- El idioma se guarda en `localStorage` y las páginas reaccionan al cambio del atributo `lang` con `MutationObserver`.

### 5. Rendimiento y límites de las APIs
- **Imágenes:** todas en WebP, con `loading="lazy"` fuera de la primera pantalla y redimensionadas al tamaño al que se ven:
  - portadas del carrusel a 480 px de ancho;
  - miniaturas de 160 px para el selector de anime (`images/thumbs/`);
  - decoraciones de esquina a 360 px.

  En total, de unos 9,4 MB a 2 MB. La imagen principal de la portada lleva `fetchpriority="high"` y tamaño declarado.
- **Tipografías alojadas en la web** (`css/fonts.css` + `assets/fonts/`): antes llegaban de Google Fonts con un `@import` que bloqueaba el pintado (HTML → CSS → CSS de Google → fuentes) y enviaba la IP del visitante a Google. Las de la primera pantalla se piden con `preload` para que el texto no salte al cargar.
- **Sin saltos de diseño (CLS):**
  - el menú móvil se oculta con CSS antes de pintar, sin esperar a JavaScript;
  - los textos que dependían del ancho de la fuente tienen un diseño fijo.
- **Trabajo diferido:** Farolillo se crea cuando el navegador queda libre. Las partículas y el giro del carrusel empiezan tras la carga y en móvil hay menos partículas.
- **Animaciones:** se pausan con la pestaña oculta y respetan `prefers-reduced-motion`.
- **GitHub:** la respuesta se guarda en caché una hora, porque su API sin token permite solo 60 peticiones por hora.
- **Buscadores:** los resultados se cachean por búsqueda y el campo espera 500 ms antes de buscar (*debounce*).

---

## Decisiones de diseño

La idea de partida: que la web se parezca a mí. Me gustan los videojuegos, el cine, el anime y los libros, así que la marca es **oscura, con neón y con un punto de videojuego**. Cada página temática tiene su propia ambientación, pero sin perder esa base.

### 1. Paleta: fondo oscuro y dos neones
- **Fondo casi negro** (`#07080b`) y superficies un poco más claras (`#0e1017`, `#141720`): el neón destaca sin cansar la vista.
- **Dos acentos:** rosa `#ff2e97` y azul `#38bdf8`. El visitante elige cuál manda con un botón, y el otro queda como secundario (`--accent` y `--accent-alt`).
- **Modo oscuro por defecto**, porque es donde el neón tiene sentido.
- **Modo claro cálido:** fondo crema (`#ece6dc`), no blanco puro, para que no deslumbre y combine con el tono «papel» de la sección de libros.
- **Contraste:** el neón no se lee sobre crema (rosa 2,8:1, azul 1,7:1). En modo claro uso versiones «tinta» del mismo tono, rosa `#c2185b` y azul `#0b6aa2`, que superan 4,5:1 (WCAG AA).
- Todo son **variables CSS**: cambiar de tema o de acento es cambiar un atributo en `<html>`.

### 2. Tipografía con un papel para cada fuente
| Fuente | Dónde | Por qué |
|---|---|---|
| **Chakra Petch** | Títulos, menú y botones | Sus esquinas cortadas recuerdan a la interfaz de un videojuego. |
| **Inter** | Texto | Muy legible en tamaños pequeños y en pantallas de móvil. |
| **Poppins 900** | Solo mi nombre en la portada | Un único golpe de impacto; usarla en más sitios le quitaría fuerza. |
| **Cinzel + Playfair Display** | Grimorio de libros | Inscripción antigua para los títulos y libro clásico para el texto. |
| **Courier Prime** | Elección de Matrix | Letra de terminal, como la película. |

Todas están alojadas en la propia web: no dependen de Google Fonts y no hacen saltar el texto al cargar.

### 3. Logo SC
El logo es un monograma propio en SVG (`images/logo.svg`):
- Las letras son trazos rectos con **las esquinas cortadas, igual que Chakra Petch**: el logo y los títulos hablan el mismo idioma.
- Debajo lleva un **eco desplazado en el acento secundario**, como un neón doble.
- El mismo dibujo sirve de favicon y de logo del menú. En el menú usa `currentColor`, así que cambia solo con el tema y el acento.

### 4. Relieve en lugar de bordes
- Las tarjetas usan **sombras neumórficas** (`--neu-flat`, `--neu-inset`): se separan del fondo por relieve, sin líneas que recarguen la página.
- Los radios (`--radius` 20 px, `--radius-sm` 10 px) y el ancho máximo (`--maxw` 1100 px) son variables comunes, así que todas las páginas tienen el mismo ritmo.

### 5. Microinteracciones con intención
Cada animación tiene una función, no está solo de adorno:
- **Inclinación y foco de luz** en las tarjetas al mover el ratón: invitan a explorar.
- **Aparición suave** de cada sección al llegar a ella con el scroll.
- **Objetos que asoman** en las tarjetas de «Me gusta» (el mando, el ticket de cine, el libro y la postal de «Desconexión»): enseñan cada afición sin añadir texto.
- **El logo parpadea** como un neón al pasar el ratón o llegar con el teclado.
- **Cursor de mano en neón** sobre lo que se puede pulsar. En pantallas táctiles se quita.
- **Farolillo** cambia de brillo según el tema.

Todas se desactivan con `prefers-reduced-motion` y se pausan si la pestaña está oculta.

### 6. Misma marca, distinta ambientación
Las páginas comparten menú, logo, tema, acentos y pie de página. Dentro, cada una tiene su escenario:
- **Videojuegos y cine:** carruseles 3D, como elegir un juego o una película en una estantería.
- **Anime:** una vitrina giratoria con tráiler.
- **Libros:** un grimorio dorado que pasa páginas, con partículas de polvo.
- **Matrix:** lluvia digital verde y la elección de pastilla.
- **Minijuego:** combate por turnos inspirado en los JRPG clásicos.

### 7. Pensada también para el móvil
- **Menú desplegable propio** y zonas táctiles de 44 px como mínimo.
- **Recortes verticales del hero** (`hero-N-movil.webp`) para que siempre se me vea en pantalla. Las dos fotos en las que salgo muy a un lado no se usan en móvil.
- **Animaciones de ratón desactivadas en pantallas táctiles**, porque ahí no aportan.

---

## Calidad medida (Lighthouse)

**En la web publicada** ([PageSpeed Insights](https://pagespeed.web.dev), portada, 17-10-2026):

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil | 90 | 100 | 100 | 100 |
| Ordenador | 100 | 100 | 100 | 100 |

**Todas las páginas**, medidas con Lighthouse 12 en local (perfil móvil simulado, rendimiento móvil / escritorio), antes y después de las mejoras de rendimiento:

| Página | Rendimiento antes | Rendimiento después | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|---|
| Portada | 63 / 98 | 92 / 99 | 100 | 96* | 100 |
| Caso de estudio | 76 / 99 | 97 / 100 | 100 | 100 | 100 |
| Videojuegos | 54 / 95 | 86 / 99 | 100 | 100 | 100 (antes 91) |
| Cine | 57 / 92 | 84 / 99 | 100 | 100 | 100 (antes 91) |
| Anime | 68 / 82 | 94 / 100 | 100 | 100 | 100 (antes 91) |
| Libros | 71 / 98 | 92 / 99 | 100 | 100 | 100 (antes 90) |
| Matrix | 100 / 100 | 100 / 100 | 100 | 100 | 100 |
| Minijuego | 90 / 99 | 91 / 100 | 100 | 100 | 100 |

\* En local las APIs externas (GitHub, tiempo) no responden y eso deja errores en la consola; en la web publicada no ocurre.

---

## Accesibilidad

- Enlace «Saltar al contenido», `aria-label` y `aria-expanded` en los controles, y foco visible.
- Contraste del tema claro revisado con ratios WCAG (documentados en `theme-light.css`).
- Zonas táctiles de al menos 44 px en móvil.
- El grimorio se maneja con teclado (← → y Esc).

---

## Seguridad: notas

- Las claves de RAWG y TMDB están en el cliente porque la web es estática. Son claves gratuitas, solo de lectura y con límite de uso.
- Mejora prevista: llevarlas a una *Edge Function* de Supabase que haga de proxy, como ya hace el formulario de contacto con la contraseña del correo.
- La contraseña del correo es una **contraseña de aplicación** de Gmail: se puede revocar en cualquier momento sin cambiar la contraseña de la cuenta.

---

## Créditos

- Datos: [RAWG](https://rawg.io), [TMDB](https://www.themoviedb.org) (este producto usa la API de TMDB, pero TMDB no lo respalda ni certifica), [AniList](https://anilist.co), [Open-Meteo](https://open-meteo.com), [GitHub API](https://docs.github.com/rest).
- Librerías: [GSAP](https://gsap.com), [St.PageFlip](https://github.com/Nodlik/StPageFlip), [Supabase JS](https://supabase.com/docs/reference/javascript).
- Tipografías: Chakra Petch, Inter, Poppins, Cinzel, Playfair Display y Courier Prime (SIL Open Font License), alojadas en la web a partir de [Fontsource](https://fontsource.org).

---

**Autor:** Sergio Chorques · [GitHub](https://github.com/SergioCHP) · serchoper@alu.edu.gva.es
