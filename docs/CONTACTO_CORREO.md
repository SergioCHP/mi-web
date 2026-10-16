# Correo de contacto y respuesta automática

Cuando alguien envía el formulario **«¿Te llamo?»**:

1. El mensaje se guarda en la tabla `mensajes` (como hasta ahora).
2. Te llega un **aviso por correo** con todos los datos. Al pulsar «Responder», contestas directamente a esa persona.
3. La persona recibe una **respuesta automática** en castellano o valenciano, según el idioma de la web.

Todo lo hace la Edge Function `supabase/functions/contacto/index.ts`.

> **Por qué Gmail y no Resend:** Resend solo deja enviar a cualquier dirección si tienes un **dominio propio** verificado. Con `github.io` no se puede, así que la respuesta automática no llegaría a los visitantes. Gmail sí envía a cualquiera y es gratis.
> Supabase bloquea los puertos SMTP 25 y 587, por eso la función usa el **465**.

---

## Lo que necesitas

- Una cuenta de **Gmail** (puede ser nueva, por ejemplo `sergiochorques.web@gmail.com`).
- Acceso al panel de Supabase de tu proyecto.

---

## Paso 1 · Crear la contraseña de aplicación de Gmail

La función **no** usa tu contraseña de Gmail, sino una contraseña de aplicación que puedes borrar cuando quieras.

1. Entra en <https://myaccount.google.com/security> con la cuenta de Gmail que enviará los correos.
2. Activa la **Verificación en dos pasos** si no la tienes (es obligatorio para el paso siguiente).
3. Entra en <https://myaccount.google.com/apppasswords>.
4. En «Nombre de la aplicación» escribe `mi-web` y pulsa **Crear**.
5. Copia las **16 letras** que aparecen (puedes quitar los espacios). Solo se muestran una vez.

⚠️ Esa contraseña **no se pega nunca** en el código ni en GitHub. Solo va en Supabase (paso 2).

---

## Paso 2 · Guardar los secretos en Supabase

1. Abre <https://supabase.com/dashboard/project/_/functions/secrets> y elige tu proyecto.
2. Añade estos secretos (nombre → valor) y pulsa **Save**:

| Nombre | Valor |
|---|---|
| `GMAIL_USER` | La cuenta de Gmail del paso 1 |
| `GMAIL_APP_PASSWORD` | Las 16 letras del paso 1 |
| `CONTACT_TO` | *(Opcional)* El correo donde quieres recibir los avisos. Si no lo pones, llegan a `GMAIL_USER` |

No hace falta añadir `SUPABASE_URL` ni la clave de servicio: Supabase las pone solo.

---

## Paso 3 · Desplegar la función desde el navegador

1. En el panel de Supabase, menú izquierdo → **Edge Functions**.
2. Pulsa **Deploy a new function** → **Via Editor**.
3. Ponle de nombre exactamente **`contacto`** (en minúsculas, sin tilde).
4. Borra el código de ejemplo y pega **todo** el contenido de `supabase/functions/contacto/index.ts`.
5. Pulsa **Deploy function** y espera al mensaje de éxito.

> Deja activada la verificación de JWT (viene así por defecto). La web llama a la función con la clave `anon`, que es un JWT válido.

Si algún día cambias el código: abre la función, pega la nueva versión y pulsa **Deploy updates**.

---

## Paso 4 · Probarlo

1. Abre la web publicada (o Live Server en `http://127.0.0.1:5500`).
2. Envía el formulario «¿Te llamo?» con **otro correo tuyo** como visitante.
3. Debe pasar esto:
   - En la web: «¡Solicitud enviada!» y debajo «Te he enviado un correo de confirmación».
   - En `CONTACT_TO` (o `GMAIL_USER`): el aviso «Nueva solicitud de llamada: …».
   - En el correo del visitante: la respuesta automática. La primera vez puede ir a **Spam**: márcalo como «No es spam».
   - En `admin.html`: el mensaje aparece como siempre.

### Si algo falla

En Supabase → **Edge Functions** → `contacto` → **Logs**:

| Lo que ves | Qué significa |
|---|---|
| `Invalid login` o `Username and Password not accepted` | `GMAIL_USER` o `GMAIL_APP_PASSWORD` están mal. Repite el paso 1. |
| `guardar 401` o `contar 401` | Falta la clave de servicio. Revisa que el proyecto tenga claves (Settings → API Keys). |
| La web dice «Solicitud enviada» **sin** la línea del correo | El mensaje se guardó, pero el correo falló: mira los logs. |
| Error 403 `origen` | Estás probando desde otra dirección. Añade el secreto `ALLOWED_ORIGINS` con tus orígenes separados por comas, por ejemplo `https://sergiochp.github.io,http://127.0.0.1:5500`. |

---

## Cómo está protegida

- **Validación en el servidor:** longitudes, formato del email y del teléfono. Los saltos de línea se quitan del nombre para que nadie pueda inyectar cabeceras de correo.
- **Antispam:** el campo oculto *honeypot*. Si un bot lo rellena, la función responde «OK» pero no guarda ni envía nada.
- **Límite de envíos:** 3 por email y 20 en total por hora (responde 429).
- **CORS:** solo acepta peticiones desde la web publicada y desde Live Server.
- **La respuesta automática no copia el mensaje del visitante**, así que el formulario no sirve para mandar texto a terceros.
- **Escape de HTML** en los dos correos.
- Si el correo falla, **el mensaje ya está guardado** y no se pierde.
- **Plan B en la web:** si la función no está desplegada o no responde, `js/script.js` guarda el mensaje directamente en la tabla, como antes.

## Pruebas automáticas

`supabase/functions/contacto/index.test.ts` tiene 15 pruebas que no envían correos ni tocan la base de datos (usan dobles de prueba). Con [Deno](https://deno.com) instalado, desde la carpeta `mi-web`:

```powershell
# Windows (PowerShell)
$env:CONTACTO_TEST=1; deno test --allow-env --allow-read --allow-net --allow-sys supabase/functions/contacto
```
