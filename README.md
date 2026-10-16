# mi-web · Sergio Chorques

Web personal y portfolio interactivo de **Sergio Chorques**, estudiante de 1º de DAM en el IES Simarro.
Hecha a mano con **HTML, CSS y JavaScript vanilla**, sin frameworks, con **Supabase** como backend.

🔗 **Web publicada:** https://sergiochp.github.io/mi-web/
📄 **Caso de estudio y vídeo demo:** https://sergiochp.github.io/mi-web/caso-estudio.html

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
├── images/                 Imágenes en WebP
├── assets/                 Sprites del minijuego y vídeo demo (MP4 + subtítulos VTT)
├── tools/                  Scripts de apoyo del minijuego (simulación en Node, sprites)
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
- **Imágenes:** todas en WebP y con `loading="lazy"` fuera de la primera pantalla.
- **Animaciones:** se pausan con la pestaña oculta y respetan `prefers-reduced-motion`.
- **GitHub:** la respuesta se guarda en caché una hora, porque su API sin token permite solo 60 peticiones por hora.
- **Buscadores:** los resultados se cachean por búsqueda y el campo espera 500 ms antes de buscar (*debounce*).

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
- Tipografías: Chakra Petch, Inter, Poppins, Cinzel y Playfair Display (Google Fonts).

---

**Autor:** Sergio Chorques · [GitHub](https://github.com/SergioCHP) · serchoper@alu.edu.gva.es
