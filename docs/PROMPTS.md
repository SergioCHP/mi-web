# Órdenes clave a la IA

Esta web la he hecho con ayuda de la IA (IA Simarro, Gemini y Claude). Aquí guardo las órdenes más importantes que le di, qué salió de cada una, qué decidí yo y en qué commit quedó.

**Cómo trabajo con la IA:**
1. Le pido una cosa concreta.
2. Reviso lo que propone.
3. Lo pruebo en el navegador y en el móvil.
4. Si algo no me convence, le pido cambios.
5. Hago el commit con un mensaje que explica el cambio.

Las decisiones de qué hacer, cómo debe verse y qué textos me representan son mías.

Las órdenes marcadas como **textual** están copiadas de la conversación. Las marcadas como **resumen** son de conversaciones que no conservo completas: resumen lo que pedí.

---

## 11–12 oct · Grimorio 3D de libros

**Orden (resumen):** reescribir `libros.html` como un «grimorio 3D» interactivo, un libro que pasa páginas. Con JavaScript vanilla, GSAP y St.PageFlip, Cinzel para los títulos, Playfair Display para el texto y un fondo de partículas de polvo. Después le pedí mejorar la animación del libro.

**Qué decidí yo:** la idea del grimorio, las librerías y las tipografías.

**Resultado:** commits `ab7a9db` y `2888348`.

## 11 oct · Navegación entre páginas temáticas

**Orden (resumen):**
- Que el menú de libros, cine, anime y juegos enlace entre las cuatro páginas, sin Matrix.
- Que «Jugar de nuevo» siga solo en juegos.
- Que todo se traduzca al valenciano.
- Que la tarjeta «Lectura» de la portada lleve a `libros.html`.

**Qué decidí yo:** qué páginas van en el menú y cuáles no.

## 12 oct · Farolillo, la mascota-chatbot

**Orden (resumen):** una mascota animada en una esquina de la web que haga de chatbot, se mueva y reaccione al hacer clic.

**Qué decidí yo:**
- Que fuera un espíritu-farolillo que flota y cambia de brillo según el tema claro u oscuro.
- Que estuviera a la izquierda, porque a la derecha tapaba el botón de volver arriba.
- Que usara solo respuestas propias en un JSON, **sin IA**: así no hay coste ni una clave que esconder.
- Los temas (yo y mis estudios, mis favoritos, proyectos y tecnología, charla) y un tono bromista y friki.

**Resultado:** commit `9dbe918`. El buscador difuso y las respuestas están en `js/farolillo.js` y `data/respuestas.json`.

## 12 oct · Plan para la rúbrica

**Orden (resumen):** revisar la web con la rúbrica del profesor y hacer un plan para sacar un 10.

**Resultado:** un plan de 9 puntos que fui haciendo uno a uno:
1. Seguridad y placeholders.
2. Idioma y consola.
3. README.
4. Carpetas.
5. Accesibilidad.
6. Contenido.
7. Correo de contacto.
8. Rendimiento.
9. Versión 1.0.

Commits del `e7ec1d5` al `61f999d`.

## 15 oct · Minijuego a nivel de producción

**Orden (resumen):** tenía un prototipo de combate JRPG por turnos con barra ATB en Canvas. Le pedí llevarlo a nivel de producción en lo visual, la arquitectura y las mecánicas, inspirándose en Final Fantasy VII.

**Resultado:** commit `40e6f6b`. Los 29 módulos ES por capas están en `js/jrpg/` y la simulación en Node en `tools/simulate.mjs`.

## 15 oct · Textos de «Me gusta»

**Orden (textual):**
> Quiero que en la sección Me gusta, en cada una de las tarjetas, cambies la descripción por otra más natural y personal. En videojuegos juego en todas las consolas, Nintendo, Xbox, pero la que más me gusta es la PS5; me gustan los juegos tipo los que hay en la página videojuegos.html. En cine y anime igual, escribe algo natural, mis gustos los tienes en la sección correspondiente. Y en lectura también: leo cuando me queda tiempo; quita literatura técnica y cómic independiente porque no me gusta.

**Corrección (textual):**
> En la de videojuegos no pongas tantos ejemplos, ya los verán dentro; me gustan las buenas historias y también los gráficos bonitos. En anime tampoco pongas tantos ejemplos. En lectura también leo cómic de superhéroes, Marvel o DC.

**Qué decidí yo:** el contenido real de mis gustos y quitar lo que no me representa.

**Resultado:** commit `bda0c5c`.

## 15 oct · Postal animada de «Desconexión»

**Orden (textual):**
> En images he metido una imagen, desconexion.webp. Me gustaría que saliera como animación igual que el mando en videojuegos, pero desde la esquina inferior derecha. No sé si que aparezca cuando pasas el ratón o que se quede fija y haga algo.

**Orden (textual):**
> Cambia el texto de Desconexión también por algo más natural: este verano lo he pasado en una casa de campo en Enguera y en un viaje en familia a El Puerto de Santa María (Cádiz) para recargar energía.

**Qué decidí yo:** la foto, dónde aparece y el texto sobre mi verano.

**Resultado:** commits `85d97cd` y `5454e25`.

## 16 oct · Correo de contacto y respuesta automática

**Orden (textual):**
> Punto 7 (correo de contacto y respuesta automática).

La IA propuso varias opciones. Pregunté «¿no hay otra forma?» y elegí la **opción B**: una Edge Function de Supabase que envía con Gmail por SMTP.

**Qué decidí yo:**
- Usar Gmail en lugar de un servicio de pago.
- Guardar la contraseña de aplicación en los *Secrets* de Supabase, nunca en el código ni en el chat.
- Desplegarla yo desde el editor de Supabase.

**Problema que apareció:** Supabase bloquea los puertos 25 y 587, así que se usa el 465.

**Resultado:** commit `55a94b2`. Guía en `docs/CONTACTO_CORREO.md` y 15 pruebas en `supabase/functions/contacto/index.test.ts`.

## 16 oct · Formulario descolocado

**Orden (textual):**
> Antes de continuar te subo una foto para que veas cómo se ve «¿Te llamo?»: no están centrados los huecos de escribir.

**Qué hice yo:** encontrar el fallo probando la web y enviar la captura.

**Resultado:** commit `a0d8b59`. Está documentado en la issue #1.

## 17 oct · Hero en móvil

**Orden (textual):**
> En móvil realmente hero-3 y hero-8 no se ven bien, porque donde aparezco yo está muy a la izquierda y casi no salgo en pantalla. ¿Se puede hacer que en móvil no cargue esas dos imágenes? Así mejoraría la puntuación.

**Qué decidí yo:** qué fotos no funcionan en pantalla estrecha. Lo vi revisando PageSpeed y el móvil.

**Resultado:** commit `a0896d3`. Rendimiento en móvil de 86 a 90.

## 17 oct · Versiones y Release

**Órdenes (textual):**
> Y si luego sigo cambiando cosas?

> Explícame lo de GitHub, el tag y todo eso, no lo acabo de entender.

**Resultado:** commit `61f999d`, etiqueta `v1.0.0`, Release en GitHub y `CHANGELOG.md`.

## 17–20 oct · Revisión final con la rúbrica

**Órdenes (textual):**
> Te lo subo con buena resolución para que lo compruebes bien.

> Vamos con el paso 1.

**Resultado:** una revisión punto por punto y un plan para subir Proceso, Diseño y Medios. Estoy trabajando en la rama `mejoras-rubrica`, que se fusionará con un Pull Request y dará la versión 1.1.0.
