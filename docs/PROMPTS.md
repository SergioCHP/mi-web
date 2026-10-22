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

**Resultado:** una revisión punto por punto con la rúbrica y un plan de 9 pasos para subir Proceso, Diseño, Medios y Contenido.

## 20 oct · Mejoras de la rúbrica (versión 1.1.0)

Todo se hizo en la rama `mejoras-rubrica`, con un commit por paso, y se fusionó en `main` con un Pull Request.

**Órdenes (textual), una por paso:**
> Vamos al paso 3.

> Seguimos con el paso 4.

> Paso 5.

> ¿Tengo que eliminar alguna imagen que no se use?

> Paso 6.

> Paso 7.

> Paso 8.

**Qué salió de cada paso:**
- **Paso 2:** este archivo.
- **Paso 3:** el logo SC en SVG, como favicon y en el menú.
- **Paso 4:** la sección «Decisiones de diseño» del README.
- **Paso 5:** imágenes con `srcset`, carga diferida y sprites en WebP. Además, borré 6 imágenes que no se usaban.
- **Paso 6:** etiquetas OG e imagen para compartir en todas las páginas.
- **Paso 7:** el minicaso del minijuego, con cifras de `tools/simulate.mjs`.
- **Paso 8:** el CHANGELOG, el Pull Request y la versión 1.1.0.

**Qué decidí yo:**
- Trabajar en una rama y fusionar con Pull Request, en vez de subir directo a `main`.
- Documentar como issue un fallo real que ya había arreglado (el formulario descolocado).
- Revisar cada paso en Live Server antes de hacer el commit.
- Qué imágenes borrar después de comprobar que no se usaban.

## 20 oct · Política de privacidad (versión 1.2.0)

**Órdenes (textual):**
> Que me aconsejas para mejorar mi-web, que se puede añadir o cambiar para mejorar.

La IA revisó el código y propuso una lista de mejoras por prioridad. Elegí empezar por la primera y se la copié de vuelta:

> Aviso de privacidad en «¿Te llamo?». El formulario pide nombre, email y teléfono, y no hay ninguna cláusula informativa ni página de privacidad. […]

> Ejecuta `supabase/retencion.sql` en el SQL Editor de Supabase antes de publicar. […]

> Use Supabase for this.

> Ahora hay que documentar esto y hacer el commit y push, como quedará después de la versión 1.1.0.

Al documentarlo, la IA vio que al README le faltaba la sección «Decisiones de diseño» que dice el CHANGELOG de la 1.1.0. Me preguntó si quería recuperarla y respondí:

> Sí.

**Qué salió:**
- `privacidad.html` en castellano y valenciano, con un resumen arriba y 9 apartados.
- Un resumen de protección de datos encima del botón «Enviar solicitud», con enlace a la política.
- El enlace «Privacidad» en el pie de todas las páginas.
- `supabase/retencion.sql`: borrado automático de las solicitudes con más de 6 meses. La IA lo activó en Supabase con el conector, después de comprobar que no borraba nada (la solicitud más antigua era del 28 de septiembre).
- `js/page-i18n.js`: la lógica de idioma del caso de estudio pasa a un archivo compartido, para no copiarla en la página nueva.
- El README recuperado desde el historial de git: el último commit de la 1.1.0 (`5f83c4d`) lo había sustituido por una copia antigua sin «Decisiones de diseño», sin la línea de versión y con cifras viejas.

**Qué decidí yo:**
- Empezar por la privacidad, de toda la lista de mejoras.
- Que la tarea de borrado se activara directamente en mi proyecto de Supabase.
- Publicarlo como versión 1.2.0 con el mismo flujo que la 1.1.0: rama, Pull Request y etiqueta.

**Resultado:** rama `privacidad-rgpd`, Pull Request y etiqueta `v1.2.0`.

## 20 oct · Hero y «Sobre mí»

**Órdenes (textual):**
> Reescribe «Sobre mí» y el hero con algo más natural, que ocupe lo mismo más o menos. Si necesitas saber algo, pregúntame.

> No me convence, déjalo todo como estaba en la release 1.2.0 y quita los cambios a partir de ahí.

La IA propuso cuatro enfoques (directo, cercano, honesto y «como código»). Probé uno en la web, no me convenció y lo deshice. Al final escribí yo los textos y se los pasé:

> Cambia esto en mi-web: hero: Estudio 1º de DAM en el IES Simarro. Aprendo programando: cada proyecto es una excusa para probar algo nuevo y hacer que se vea y funcione bien. […] No hagas ningún commit ni nada hasta que te lo diga.

**Qué decidí yo:**
- Los textos finales del hero y de «Sobre mí», con mis palabras.
- Borrar del historial los dos commits de la prueba que no me gustó.
- Hacer yo el commit desde VS Code, directo en `main`.

**Resultado:** commit `f47085a`.

## 20 oct · Minijuego: animaciones nuevas y Soldado de Élite

**Órdenes (textual):**
> Según la guía de sprites que has creado, dame los prompts para crear todas las mejoras que dices ahí.

> ¿Cómo se juega con tres héroes o con el monstruo pequeño de antes?

> Elimina las imágenes de assets que ya no gastamos.

> Vale, pues haz el add, el commit y el push, en el mismo main.

**Qué salió:**
- Generé con IA las animaciones nuevas del héroe (daño, magia, Límite y victoria), el Soldado de Élite y el Reactor Mako en 3 capas, con los prompts de `docs/GUIA_SPRITES.md`.
- Al integrarlas, la IA encontró y corrigió fallos: la postura de magia se quedaba enganchada, la cámara se quedaba con zoom y el nombre del Soldado se cortaba en el móvil.
- La simulación seguía usando a los enemigos antiguos. Con el Soldado real, quien solo atacaba ganaba el 36 %; se ajustó al 85 % y se corrigieron las cifras del caso de estudio.
- Se borraron los 9 JPG originales que el juego ya no usaba (unos 19 MB).

**Qué decidí yo:**
- Generar las imágenes yo mismo siguiendo la guía.
- Borrar las imágenes que sobraban.
- Subirlo directo a `main`.

**Resultado:** commit `2ad3bfd`.

## 21 oct · Farolillo: más respuestas, juegos y trucos

**Órdenes (textual):**
> Me gustaría que Farolillo, el chatbot de la web, tuviera más preguntas y respuestas, para que sea difícil encontrarle fallos. Si necesitas respuestas sobre mí, dímelo y te las digo.

> El código Konami creo que no funciona.

> Pequeñas reacciones: al llegar al final de la página, al copiar texto («¡eh, que eso lo escribió Sergio!»), al rellenar el formulario de contacto o si agitas el móvil.

**Órdenes (resumen):** después le fui pidiendo más cosas, una por commit: trucos animados, poder lanzarlo para que rebote, minijuegos en el chat, el código Konami con un modo 8 bits y el pilla-pilla.

**Qué salió:**
- De 116 a 256 intenciones, con un quiz sobre mí, contexto según la página y la opción de esconderlo.
- 19 trucos animados, tres minijuegos en el chat, «¿Quién lo dijo?», el pilla-pilla y el modo 8 bits.
- El código Konami fallaba de verdad en tres casos: si se metía mientras Farolillo saludaba, si el cursor no estaba en la caja y con algunas formas de escribirlo. Se arreglaron los tres.
- Las reacciones al final de la página, a copiar texto, al formulario y a agitar el móvil. En iPhone no reacciona al agitar, porque Safari pediría un permiso.

**Qué decidí yo:**
- Las respuestas sobre mí y el tono bromista y friki.
- Qué trucos, juegos y reacciones quería.
- Probarlo yo y avisar cuando algo no funcionaba, como el código Konami.

**Resultado:** commits del `d87f9d8` al `1254448`.

## 21–22 oct · Documentación y versión 1.3.0

**Órdenes (textual):**
> He hecho bastantes cambios y deberíamos documentarlos donde toque en la web. También quiero un archivo nuevo que aparezca todo sobre Farolillo, todo lo que hace, cómo lo hace, todo bien explicado. Los commits también han subido y habría que cambiarlo en el caso de estudio. Repásalo.


**Qué salió:**
- `docs/FAROLILLO.md`, la guía completa de Farolillo.
- El caso de estudio actualizado: +75 commits, +25 000 líneas, 256 intenciones y una quinta fase, «Pulido».
- Una revisión de las 10 páginas en castellano y valenciano, en ordenador y en móvil: sin errores en la consola ni de accesibilidad (axe).
- La página de Matrix traducida al valenciano y el idioma del minijuego corregido para los lectores de pantalla.

**Qué decidí yo:**
- Publicarlo como versión 1.3.0.
- Hacer yo los commits, la etiqueta y la release.

**Resultado:** commits `149ad89` y `9998aff`, etiqueta y release `v1.3.0`.
