# Buscador de videojuegos (IGDB)

El buscador de `juegos.html` busca títulos y enseña portada, plataformas, géneros, fecha, nota y descripción.

Funciona así:

1. La web llama a la Edge Function `juegos` de Supabase: `GET /functions/v1/juegos?search=<título>`.
2. La función pide un token a Twitch (y lo reutiliza hasta que caduca).
3. Consulta la API de **IGDB**, la base de datos de juegos de Twitch.
4. Devuelve hasta 6 resultados con el **mismo formato que usaba RAWG**, así `renderGrid` y `renderFicha` de `js/script.js` no cambian.

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

Abre `juegos.html` con Live Server (puerto 5500) o en la web publicada y busca, por ejemplo, «zelda». Deben salir hasta 6 juegos con imagen y ficha.

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
- **Imagen:** se usa un arte o una captura apaisada; si el juego no tiene, la portada.
- **Tiendas:** IGDB no da enlaces de tienda; la ficha enlaza a la página del juego en IGDB.
