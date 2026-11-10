# Buscador de videojuegos (IGDB)

El buscador de `juegos.html` funciona como el de anime: al buscar salen 5 resultados (una fila), un botón **«Ver más»** añade hasta 5 más y, al pulsar uno, se abre su ficha con:

- Portada, fecha de lanzamiento, nota de IGDB y nota de la crítica.
- Plataformas, géneros, estudio, editora y modos de juego (un jugador, cooperativo…).
- Duración: horas para acabar la historia y para completarlo al 100 %.
- Descripción (en inglés) y enlace a la página del juego en IGDB.
- **Tráiler** de YouTube. Al principio solo se ve un botón con la imagen del juego: el reproductor (`youtube-nocookie.com`) se carga cuando se pulsa «Ver tráiler».
- **Capturas**: 4 miniaturas que se abren en un visor con flechas; también se pasa con ← y → y se cierra con Esc.
- **«Si te gusta, prueba»**: 4 juegos parecidos; al pulsar uno, se busca.

Funciona así:

1. La web llama a la Edge Function `juegos` de Supabase: `GET /functions/v1/juegos?search=<título>`.
2. La función pide un token a Twitch (y lo reutiliza hasta que caduca).
3. Consulta la API de **IGDB**, la base de datos de juegos de Twitch, en tres pasos:
   - **Candidatos:** hace dos búsquedas a la vez pidiendo solo nombre, año y número de valoraciones (es ligero) y elige los 10 mejores (ver «Cómo se eligen los resultados»).
   - **Ficha:** pide todos los datos solo de esos 10.
4. Pide la duración de esos juegos (`game_time_to_beats`). Si falla, la ficha sale sin duración.
5. Devuelve hasta 10 resultados con el **mismo formato que usaba RAWG** más los extras (`cover`, `trailer`, `screenshots`, `developers`, `publishers`, `modes`, `duration`, `similar`).

### Cómo se eligen los resultados

Se juntan dos búsquedas:

- **Por palabras** (la búsqueda de IGDB): encuentra «god of war», pero solo con palabras completas.
- **Por nombre**: títulos que contienen todas las palabras escritas, aunque la última esté a medias. Así «god of war ascen» encuentra «God of War: Ascension». Cada palabra tiene que ser el principio de una palabra del título, para que «hades» no traiga «Shades».

Las dos traen ports, packs, fangames…, así que la función filtra y ordena:

1. **Tipo de juego:** solo juegos principales, expansiones, remakes, remasters y ediciones ampliadas. Fuera DLC, packs, mods, episodios y ports.
2. **Popularidad:** cada candidato puntúa por su número de valoraciones en IGDB. Si el nombre es **exactamente** lo buscado, la puntuación se triplica. Así «god of war» trae el de 2005 y el de 2018.
3. **Umbral:** se descartan los que tienen menos del 2 % de las valoraciones del más popular (fangames, demakes). Mejor menos resultados que resultados que no tocan. El título exacto nunca se descarta, pero si es poco conocido queda al final.
4. **Duplicados:** si hay dos con el mismo nombre y año, se queda uno.
5. Se queda con los **10 primeros**. La web enseña 5 (una fila) y el botón «Ver más» el resto.

Ejemplos: «god of war» → God of War (2018), God of War (2005), Ragnarök, II y III, y con «Ver más» Chains of Olympus, Ghost of Sparta, Ascension… «elden ring» → Elden Ring, Shadow of the Erdtree y Nightreign (3, sin fangames, sin botón).

Las constantes `PLUS_EXACTO`, `UMBRAL_RELATIVO` y `TIPOS_VALIDOS` del principio de `index.ts` permiten ajustarlo.

Si IGDB responde «demasiadas peticiones» (máximo 4 por segundo), la función espera un momento y lo reintenta una vez.

Todo el código está en `supabase/functions/juegos/index.ts`.

> **Por qué IGDB y no RAWG:** en noviembre de 2026 RAWG dejó de responder (tardaba unos 19 s y contestaba sin cabeceras CORS). IGDB es gratis para uso no comercial y tiene los mismos datos.
> **Por qué una Edge Function:** IGDB se autentica con OAuth de Twitch y no admite peticiones desde el navegador (CORS). Además, así el Client Secret no queda a la vista en el código de la web.

---

## Lo que necesitas

- Una cuenta de **Twitch** con la **verificación en dos pasos** activada (Twitch la exige para registrar apps).
- Acceso al panel de Supabase de tu proyecto.

---

## Paso 1 · Crear la app en Twitch

1. Activa la verificación en dos pasos en <https://www.twitch.tv/settings/security>. Al activarla, Twitch cierra las demás sesiones: vuelve a entrar en la consola.
2. Entra en <https://dev.twitch.tv/console/apps/create> y rellena:
   - **Name:** un nombre único, por ejemplo `mi-web-juegos-sergiochp`.
   - **OAuth Redirect URLs:** `http://localhost` y pulsa **Add** una sola vez (una fila vacía da error).
   - **Category:** `Website Integration`.
   - **Client Type:** `Confidential`.
3. Pulsa **Create** y después **Manage**.
4. Copia el **Client ID**. Pulsa **New Secret** y copia el **Client Secret** (solo se ve una vez).

> ⚠️ El Client Secret no se pega en el código, ni en el chat, ni en GitHub. Solo en los *Secrets* de Supabase.

---

## Paso 2 · Guardar las claves en Supabase

En <https://supabase.com/dashboard/project/_/functions/secrets>, elige tu proyecto y añade:

| Nombre | Valor |
|---|---|
| `TWITCH_CLIENT_ID` | El Client ID de Twitch |
| `TWITCH_CLIENT_SECRET` | El Client Secret de Twitch |
| `ALLOWED_ORIGINS` | *(Opcional)* Orígenes permitidos separados por comas. Por defecto: `https://sergiochp.github.io`, `http://localhost:5500` y `http://127.0.0.1:5500` |

---

## Paso 3 · Desplegar la función

1. En el panel de Supabase, menú izquierdo → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre: `juegos`.
3. Pega el contenido de `supabase/functions/juegos/index.ts` y pulsa **Deploy**.

Con la CLI de Supabase también vale: `supabase functions deploy juegos`.

---

## Paso 4 · Probarlo

Abre `juegos.html` con Live Server (puerto 5500) o en la web publicada y busca, por ejemplo, «zelda». Deben salir 5 resultados y el botón «Ver más»; al pulsar uno se abre su ficha.

Si algo falla, en Supabase → **Edge Functions** → `juegos` → **Logs**:

| Lo que ves | Qué significa |
|---|---|
| `500 {"error":"config"}` | Faltan los secrets `TWITCH_CLIENT_ID` o `TWITCH_CLIENT_SECRET`. |
| `403 {"error":"origen"}` | La petición viene de una web que no está en `ALLOWED_ORIGINS`. |
| `502 {"error":"igdb"}` + `twitch 400/403` en los logs | El Client ID o el Client Secret están mal, o el secret se regeneró en Twitch. |
| `502 {"error":"igdb"}` + `igdb 429` | Demasiadas peticiones seguidas (IGDB permite 4 por segundo). |
| La web dice «El buscador de juegos no responde ahora mismo» | La función o IGDB tardaron más de 8 s. |

---

## Diferencias con RAWG

- **Descripciones en inglés:** IGDB no las tiene en español.
- **Nota de 0 a 10** (IGDB da de 0 a 100 y la función la divide entre 10). La nota de la **crítica** (0–100) solo sale cuando IGDB la tiene.
- **Imagen:** las tarjetas de resultados usan una captura del juego (o un arte si no hay capturas); la ficha usa la portada vertical.
- **Tiendas:** IGDB no da enlaces de tienda; la ficha enlaza a la página del juego en IGDB.
- **Modos de juego:** IGDB los da en inglés; `js/script.js` traduce los habituales (un jugador, multijugador, cooperativo…).
- **Duración:** no todos los juegos la tienen; si falta, no se muestra.
