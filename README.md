# mi-web · Sergio Chorques

Web personal y portfolio interactivo de **Sergio Chorques**, estudiante de 1º de DAM en el IES Simarro.
Hecha a mano con **HTML, CSS y JavaScript vanilla**, sin frameworks, con **Supabase** como backend.

🔗 **Web publicada:** https://sergiochp.github.io/mi-web/

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
| `admin.html` | Panel privado con login (Supabase Auth) para leer, marcar y borrar los mensajes de contacto |

**En todas las páginas:**
- Modo claro / oscuro y color de acento rosa / azul, que se recuerdan entre visitas.
- Idiomas castellano y valenciano (`es` / `ca-ES-valencia`).
- Menú móvil accesible.
- Respeto a `prefers-reduced-motion`.

**Extras en la portada:**
- **Farolillo**, una mascota-chatbot con física, partículas y un motor de respuestas propio. Entiende faltas de ortografía y sinónimos.
- Formulario **«¿Te llamo?»** que guarda las solicitudes en Supabase.
- Widget del tiempo de Enguera (API de **Open-Meteo**).

---

## Tecnologías

- **Frontend:**
  - HTML5 semántico.
  - CSS3 con variables, `color-mix()`, grid y media queries.
  - JavaScript ES6+ con módulos (`farolillo.js`).
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security).
- **APIs externas:** GitHub REST, RAWG, TMDB, AniList (GraphQL), Open-Meteo.
- **Librerías**, solo en `libros.html` y con versiones fijadas:
  - GSAP 3.12;
  - St.PageFlip 2.0.7.
- **Despliegue:** GitHub Pages.

---

## Estructura

```
mi-web/
├── index.html            Portada
├── juegos.html · cine.html · anime.html · libros.html
├── minijuego.html · matrix_pills.html · admin.html
├── style.css             Estilos base y tema oscuro (variables de diseño)
├── theme-light.css       Tema claro (contrastes revisados según WCAG)
├── mobile.css            Capa de ajustes para móvil (360–860 px)
├── farolillo.css         Estilos de la mascota-chatbot
├── script.js             Tema, idioma, GitHub, formulario, tiempo, buscador RAWG
├── mobile.js             Menú hamburguesa y mejoras táctiles compartidas
├── nav-i18n.js           Traducción del menú en las páginas secundarias
├── farolillo.js          Módulo ES de la mascota-chatbot
├── respuestas.json       «Cerebro» de Farolillo (intenciones y respuestas ES/VA)
├── images/               Imágenes en WebP
├── assets/               Sprites y fondo del minijuego
└── supabase/rls.sql      Políticas de seguridad de la base de datos
```

---

## Cómo levantar el proyecto en local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/SergioCHP/mi-web.git
   cd mi-web
   ```
2. Ábrelo con un **servidor local**. No basta con abrir el HTML con doble clic: `farolillo.js` es un módulo ES y `respuestas.json` se carga con `fetch`, y el navegador bloquea ambos con `file://`. Elige una opción:
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
5. Sustituye `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `script.js` y en `admin.html`.

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

### 3. Farolillo: un chatbot sin IA ni servidor
En lugar de conectar un modelo de lenguaje (coste, latencia y una clave que no se puede esconder en el frontend), Farolillo usa un **motor de búsqueda difusa** propio:
- Normaliza el texto: quita tildes, mayúsculas y signos.
- Tolera faltas con la **distancia de Levenshtein** y detecta letras intercambiadas.
- Puntúa las «intenciones» de `respuestas.json` y recuerda el último tema («otro», «recomiéndame uno»).

Todo el contenido está en un JSON editable sin tocar código. La función `responder` se puede sustituir por un backend en el futuro, porque `initFarolillo()` la acepta como opción.

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
- Mejora prevista: llevarlas a una *Edge Function* de Supabase que haga de proxy.

---

## Créditos

- Datos: [RAWG](https://rawg.io), [TMDB](https://www.themoviedb.org) (este producto usa la API de TMDB, pero TMDB no lo respalda ni certifica), [AniList](https://anilist.co), [Open-Meteo](https://open-meteo.com), [GitHub API](https://docs.github.com/rest).
- Librerías: [GSAP](https://gsap.com), [St.PageFlip](https://github.com/Nodlik/StPageFlip), [Supabase JS](https://supabase.com/docs/reference/javascript).
- Tipografías: Chakra Petch, Inter, Poppins, Cinzel y Playfair Display (Google Fonts).

---

**Autor:** Sergio Chorques · [GitHub](https://github.com/SergioCHP) · serchoper@alu.edu.gva.es
