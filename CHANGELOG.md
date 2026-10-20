# Changelog

Todos los cambios importantes de **mi-web** se anotan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/):

- **MAYOR:** cambios grandes que rompen lo anterior.
- **MENOR:** funciones nuevas.
- **PARCHE:** correcciones.

Las versiones anteriores a la 1.0.0 se han reconstruido a partir del historial de commits.

## [Sin publicar]

_Nada todavía._

## [1.1.0] — 2026-10-20

Mejoras a partir de la revisión con la rúbrica. Hechas en la rama `mejoras-rubrica` y fusionadas con un Pull Request.

### Añadido
- `docs/PROMPTS.md`: las órdenes clave a la IA, con qué salió de cada una, qué decidí yo y en qué commit quedó.
- **Logo SC propio en SVG** (`images/logo.svg`): favicon de todas las páginas y logo del menú. Al pasar el ratón o llegar con el teclado, el eco parpadea como un neón.
- Sección **«Decisiones de diseño»** en el README: paleta, tipografía, logo, relieve, microinteracciones, ambientación por página y móvil.
- **Minicaso del minijuego** en el caso de estudio (`caso-estudio.html#minijuego`):
  - problema → solución → resultado;
  - cifras de la simulación en Node: 300 combates por estrategia, 86 % y 100 % de victorias, 0 bloqueos y el mismo resultado a 30, 60, 144 y 240 Hz.
- Tarjeta «Minijuego JRPG» en Proyectos, con enlaces para jugar y al minicaso.
- **Imagen para compartir** (`images/og-portada.jpg`, 1200 × 630) y etiquetas Open Graph en las 8 páginas públicas, también en `matrix_pills.html` y `minijuego.html`.
- Versiones de imagen por tamaño de pantalla: `hero-N-2240.webp`, `juegoN-360.webp`, `cineN-360.webp` y `animeN-320.webp`.

### Cambiado
- Proyectos en rejilla de 2 × 2 en ordenador.
- **Hero:** en móvil, recortes 9:16 más ligeros; en ordenador, `srcset` que solo baja la foto de 3168 px en pantallas grandes.
- Imágenes recomprimidas:
  - miniaturas de anime a 104 px;
  - portadas del grimorio a 420 px;
  - póster del vídeo a 768 px.
- Sprites y retratos del minijuego en WebP.
- El CSS del panel `admin.html` pasa a `css/admin.css`: ninguna página tiene ya bloques `<style>`.
- Cifra de commits del caso de estudio: de «+40» a «+50».

### Eliminado
- Imágenes sin uso:
  - `images/perfil.webp` y `images/cine42.webp`;
  - `assets/Monstruo.png`;
  - tres hojas PNG del combate, ya en WebP.

### Rendimiento
- Carga diferida (`loading="lazy"`) en las láminas del grimorio y en las cartas del carrusel que no están delante.
- Lighthouse en local, rendimiento en móvil:
  - videojuegos y cine: de 79 a 85;
  - portada: de 75 a 80.
- Sin avisos de imágenes en el grimorio ni en el minijuego. Los avisos que quedan en los carruseles 3D están explicados en el README.

## [1.0.0] — 2026-10-17

Primera versión estable: la web completa, segura, accesible, documentada y optimizada.

### Añadido
- **Caso de estudio** (`caso-estudio.html`, en castellano y valenciano): reto, proceso, arquitectura, problemas y soluciones, y aprendizajes.
- **Vídeo demo** de 1:46 con subtítulos en castellano y valenciano, imagen de portada y transcripción.
- **Correo de contacto:** la Edge Function de Supabase `contacto` guarda el mensaje, me avisa por correo y envía una respuesta automática al visitante en su idioma.
  - Gmail por SMTP (puerto 465). La contraseña está en los *Secrets* de Supabase, no en el código.
  - Validación en el servidor, *honeypot*, límite de envíos (3 por email y 20 por hora) y CORS restringido.
  - 15 pruebas automáticas con Deno (`supabase/functions/contacto/index.test.ts`).
  - Plan B: si la función no responde, el formulario guarda el mensaje directamente.
- **Accesibilidad:**
  - Un `h1` por página.
  - Enlace «Saltar al contenido» en todas las páginas.
  - Carrusel 3D, tarjeta de anime y resultados de búsqueda manejables con teclado.
  - Ventanas modales con foco atrapado, Esc para cerrar y vuelta del foco al botón que las abrió (`js/a11y.js`).
- Postal animada en la tarjeta «Desconexión».
- Enlace a LinkedIn.
- Recortes verticales del hero para móvil (`images/hero-N-movil.webp`).
- Miniaturas del selector de anime (`images/thumbs/`).
- Fuentes alojadas en la propia web (`css/fonts.css` y `assets/fonts/`).
- Descripción y etiquetas Open Graph en las páginas de juegos, cine, anime y libros.
- README con instalación, Supabase, decisiones técnicas, pruebas y resultados de Lighthouse.
- Guía paso a paso del correo de contacto (`docs/CONTACTO_CORREO.md`).
- Este CHANGELOG.

### Cambiado
- Proyecto reorganizado en carpetas `css/`, `js/` y `data/`, con componentes compartidos (`theme.js`, `nav-i18n.js`, `particles.js`, `carousel3d.js`, `a11y.js`, `mobile.js`) y sin estilos en línea.
- Minijuego JRPG reescrito en 29 módulos ES por capas: lógica, datos, render e interfaz.
- Textos más naturales y personales en «Me gusta», «Desconexión» y las respuestas de Farolillo.
- Imágenes del hero renombradas de `new hero N.webp` a `hero-1…8.webp` (sin espacios).
- En móvil, el hero no muestra las fotos 3 y 8 (no se me ve bien en pantalla estrecha).
- Farolillo, las partículas y el giro del carrusel arrancan cuando la página ya ha cargado.

### Corregido
- Campos del formulario «¿Te llamo?» desalineados (faltaba `box-sizing: border-box`).
- Esc no cerraba el visor de certificados si se había abierto con el ratón.
- Fondo difuminado del póster de anime en móvil (404 por una ruta relativa dentro de `var()`).
- Saltos de diseño al cargar (CLS): menú de las páginas secundarias, texto de la portada y cabecera de la tarjeta de anime.
- Contraste insuficiente en el filtro activo de proyectos, en los controles del minijuego y en su botón «Jugar».
- Código de idioma inválido: ahora `ca-ES-valencia`.
- Textos:
  - «Construïsc» en valenciano;
  - «las hermanas Wachowski»;
  - eliminado «como desarrollador de IA».
- Placeholders olvidados (`og:url` y enlaces de proyectos) y errores en la consola.

### Seguridad
- Políticas RLS en la tabla `mensajes`: los visitantes solo insertan; solo el administrador lee, edita y borra (`supabase/rls.sql`).
- Datos de TMDB y AniList escapados antes de insertarlos en la página (XSS).
- El panel `admin.html` escapa todo lo que muestra.

### Rendimiento
- Imágenes de 9,4 MB a unos 2 MB, al tamaño al que se ven.
- Sin bloqueo por Google Fonts. Las fuentes de la primera pantalla se piden con `preload`.
- PageSpeed Insights en la web publicada (17-10-2026): rendimiento **90** en móvil y **100** en ordenador; **100** en accesibilidad, buenas prácticas y SEO.

## [0.3.0] — 2026-10-12

### Añadido
- Elección «pastilla roja / azul» con lluvia digital (`matrix_pills.html`).
- Página de cine con carrusel 3D y explorador con la API de TMDB (con tráiler).
- Página de anime con vitrina giratoria, citas y explorador con la API GraphQL de AniList.
- «Grimorio 3D» de libros con GSAP y St.PageFlip.
- Farolillo, la mascota-chatbot, con buscador difuso propio y respuestas en JSON.
- Carrusel dinámico en el hero.

### Corregido
- Tema claro y tarjetas que no cargaban.
- Errores de diseño responsive.

## [0.2.0] — 2026-10-06

### Añadido
- Página de videojuegos con carrusel 3D.
- Certificados de Cisco con visor (sustituyen a la sección «Colección»).
- Actividad de GitHub en directo.
- Buscador de videojuegos con la API de RAWG, con *debounce* y caché.
- Animaciones en «Me gusta» y minijuego adaptado a móvil.

## [0.1.0] — 2026-09-29

### Añadido
- Portada, sobre mí, trayectoria, proyectos y contacto.
- Formulario «¿Te llamo?» con Supabase y panel privado `admin.html` con inicio de sesión.
- Versión en valenciano.
- Selector de color de acento y modo claro/oscuro.
- Primer prototipo del minijuego JRPG.

[Sin publicar]: https://github.com/SergioCHP/mi-web/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/SergioCHP/mi-web/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/SergioCHP/mi-web/releases/tag/v1.0.0
