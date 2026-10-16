/* =========================================================
   Edge Function «contacto» (Supabase · Deno)

   Recibe el formulario «¿Te llamo?» de la web y:
     1. Valida los datos (longitudes, email, honeypot antispam).
     2. Limita los envíos (máx. 3 por email y 20 en total por hora).
     3. Guarda el mensaje en la tabla `mensajes` con la service role.
     4. Me avisa por correo (con «Responder» apuntando al visitante).
     5. Envía una respuesta automática al visitante en su idioma.

   SEGURIDAD
   - Las claves NO están en el código: se leen de los «Secrets» de
     Supabase (Edge Functions → Secrets). Nunca las subas a GitHub.
       GMAIL_USER          cuenta de Gmail que envía (tucuenta@gmail.com)
       GMAIL_APP_PASSWORD  contraseña de aplicación de 16 letras
       CONTACT_TO          (opcional) dónde quiero recibir los avisos
       ALLOWED_ORIGINS     (opcional) orígenes permitidos separados por comas
   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
   - Gmail por SMTP en el puerto 465: Supabase bloquea el 25 y el 587.
   - La respuesta automática NO copia el mensaje del visitante: así
     nadie puede usar el formulario para mandar texto a un tercero.
   ========================================================= */
import nodemailer from "npm:nodemailer@9.1.1";

/* ---------- Tipos ---------- */
export type Idioma = "es" | "va";

export interface Contacto {
  nombre: string;
  email: string;
  telefono: string;
  disponibilidad: string;
  mensaje: string;
  idioma: Idioma;
}

export interface Correo {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

/** Lo que la función necesita del exterior (se sustituye en las pruebas). */
export interface Deps {
  contarRecientes(email: string | null, desdeISO: string): Promise<number>;
  guardar(c: Contacto): Promise<void>;
  enviar(correo: Correo): Promise<void>;
  avisarA: string;
  origenes: string[];
  ahora?: () => Date;
}

/* ---------- Constantes ---------- */
export const LIMITES = {
  nombre: 100,
  email: 254,
  telefono: 30,
  disponibilidad: 60,
  mensaje: 2000,
  porEmailHora: 3,
  totalHora: 20,
};

const ORIGENES_POR_DEFECTO = [
  "https://sergiochp.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

/* ---------- Utilidades ---------- */
/** Quita saltos de línea y caracteres de control (evita inyectar cabeceras). */
const limpiarLinea = (v: unknown): string =>
  String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

/** El mensaje puede tener saltos de línea, pero no otros caracteres de control. */
const limpiarTexto = (v: unknown): string =>
  String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ").trim();

/** Escapa texto para meterlo en HTML (evita XSS en el correo). */
export const escaparHtml = (v: string): string =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO_RE = /^[0-9+()\-.\s]{6,30}$/;

/* ---------- Validación ---------- */
export type Resultado =
  | { ok: true; datos: Contacto; spam: boolean }
  | { ok: false; campos: string[] };

export function validar(cuerpo: Record<string, unknown>): Resultado {
  // Honeypot: un humano no ve ese campo; si viene relleno es un bot
  if (limpiarLinea(cuerpo._gotcha)) {
    return { ok: true, spam: true, datos: {} as Contacto };
  }

  const datos: Contacto = {
    nombre: limpiarLinea(cuerpo.nombre),
    email: limpiarLinea(cuerpo.email).toLowerCase(),
    telefono: limpiarLinea(cuerpo.telefono),
    disponibilidad: limpiarLinea(cuerpo.disponibilidad),
    mensaje: limpiarTexto(cuerpo.mensaje),
    idioma: cuerpo.idioma === "va" ? "va" : "es",
  };

  const campos: string[] = [];
  if (!datos.nombre || datos.nombre.length > LIMITES.nombre) campos.push("nombre");
  if (!EMAIL_RE.test(datos.email) || datos.email.length > LIMITES.email) campos.push("email");
  if (!TELEFONO_RE.test(datos.telefono)) campos.push("telefono");
  if (!datos.disponibilidad || datos.disponibilidad.length > LIMITES.disponibilidad) campos.push("disponibilidad");
  if (datos.mensaje.length > LIMITES.mensaje) campos.push("mensaje");

  return campos.length ? { ok: false, campos } : { ok: true, datos, spam: false };
}

/* ---------- Plantillas de correo ---------- */
const TEXTOS = {
  es: {
    asunto: "He recibido tu solicitud · Sergio Chorques",
    saludo: (n: string) => `Hola, ${n}:`,
    cuerpo: [
      "Gracias por escribirme desde mi web. Ya tengo tus datos y te llamaré en la franja que has elegido.",
      "Si quieres añadir algo, responde a este correo y me llegará directamente.",
    ],
    firma: "Un saludo,\nSergio Chorques\nEstudiante de 1º DAM · IES Simarro",
    pie: "Has recibido este correo porque alguien rellenó el formulario de https://sergiochp.github.io/mi-web/ con esta dirección. Si no has sido tú, puedes ignorarlo.",
  },
  va: {
    asunto: "He rebut la teua sol·licitud · Sergio Chorques",
    saludo: (n: string) => `Hola, ${n}:`,
    cuerpo: [
      "Gràcies per escriure'm des de la meua web. Ja tinc les teues dades i et telefonaré en la franja que has triat.",
      "Si vols afegir alguna cosa, respon a aquest correu i em arribarà directament.",
    ],
    firma: "Una salutació,\nSergio Chorques\nEstudiant de 1r DAM · IES Simarro",
    pie: "Has rebut aquest correu perquè algú va omplir el formulari de https://sergiochp.github.io/mi-web/ amb aquesta adreça. Si no has sigut tu, pots ignorar-lo.",
  },
};

const plantillaHtml = (parrafos: string[], pie: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4eee4;font-family:Segoe UI,Arial,sans-serif;color:#221f1d">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e3dcce">
    ${parrafos.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p}</p>`).join("\n    ")}
  </div>
  <p style="max-width:560px;margin:14px auto 0;font-size:12px;color:#6b635b;line-height:1.5">${pie}</p>
</body></html>`;

/** Respuesta automática para el visitante (sin copiar su mensaje). */
export function correoRespuesta(c: Contacto, responderA: string): Correo {
  const t = TEXTOS[c.idioma];
  const nombre = c.nombre.slice(0, 60);
  const lineas = [t.saludo(nombre), ...t.cuerpo, t.firma];
  return {
    to: c.email,
    replyTo: responderA,
    subject: t.asunto,
    text: `${lineas.join("\n\n")}\n\n--\n${t.pie}`,
    html: plantillaHtml(
      lineas.map((l) => escaparHtml(l).replace(/\n/g, "<br>")),
      escaparHtml(t.pie),
    ),
  };
}

/** Aviso para mí con todos los datos; «Responder» va al visitante. */
export function correoAviso(c: Contacto, para: string): Correo {
  const filas: [string, string][] = [
    ["Nombre", c.nombre],
    ["Email", c.email],
    ["Teléfono", c.telefono],
    ["Disponibilidad", c.disponibilidad],
    ["Idioma", c.idioma === "va" ? "Valenciano" : "Castellano"],
    ["Mensaje", c.mensaje || "(sin mensaje)"],
  ];
  return {
    to: para,
    replyTo: c.email,
    subject: `Nueva solicitud de llamada: ${c.nombre.slice(0, 60)}`,
    text: filas.map(([k, v]) => `${k}: ${v}`).join("\n"),
    html: plantillaHtml(
      [
        "<strong>Nueva solicitud desde la web</strong>",
        ...filas.map(([k, v]) => `<strong>${k}:</strong> ${escaparHtml(v).replace(/\n/g, "<br>")}`),
      ],
      "Pulsa «Responder» para contestar directamente a esta persona.",
    ),
  };
}

/* ---------- CORS ---------- */
export function cabecerasCors(origen: string | null, permitidos: string[]): Record<string, string> {
  const ok = origen !== null && permitidos.includes(origen);
  return {
    "Access-Control-Allow-Origin": ok ? origen! : permitidos[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/* ---------- Manejador (sin dependencias externas: se puede probar) ---------- */
export function crearManejador(deps: Deps) {
  const ahora = deps.ahora ?? (() => new Date());

  return async (req: Request): Promise<Response> => {
    const origen = req.headers.get("origin");
    const cors = cabecerasCors(origen, deps.origenes);
    const json = (estado: number, cuerpo: unknown) =>
      new Response(JSON.stringify(cuerpo), {
        status: estado,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
      });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json(405, { error: "metodo" });
    if (origen !== null && !deps.origenes.includes(origen)) return json(403, { error: "origen" });

    let cuerpo: Record<string, unknown>;
    try {
      const texto = await req.text();
      if (texto.length > 10_000) return json(413, { error: "demasiado_grande" });
      cuerpo = JSON.parse(texto);
      if (typeof cuerpo !== "object" || cuerpo === null || Array.isArray(cuerpo)) throw new Error();
    } catch {
      return json(400, { error: "json" });
    }

    const r = validar(cuerpo);
    if (!r.ok) return json(400, { error: "validacion", campos: r.campos });
    // Al bot se le responde «bien» para que no sepa que se le ha detectado
    if (r.spam) return json(200, { ok: true, correo: false });

    const c = r.datos;
    const haceUnaHora = new Date(ahora().getTime() - 60 * 60 * 1000).toISOString();
    try {
      const [mismoEmail, total] = await Promise.all([
        deps.contarRecientes(c.email, haceUnaHora),
        deps.contarRecientes(null, haceUnaHora),
      ]);
      if (mismoEmail >= LIMITES.porEmailHora || total >= LIMITES.totalHora) {
        return json(429, { error: "limite" });
      }
      await deps.guardar(c);
    } catch (e) {
      console.error("[contacto] base de datos:", (e as Error).message);
      return json(500, { error: "guardar" });
    }

    // El mensaje ya está guardado: si el correo falla, no se pierde nada
    let correo = true;
    const envios = await Promise.allSettled([
      deps.enviar(correoAviso(c, deps.avisarA)),
      deps.enviar(correoRespuesta(c, deps.avisarA)),
    ]);
    for (const e of envios) {
      if (e.status === "rejected") {
        correo = false;
        console.error("[contacto] correo:", (e.reason as Error)?.message);
      }
    }
    return json(200, { ok: true, correo });
  };
}

/* ---------- Clave de servidor ----------
   Proyectos antiguos: SUPABASE_SERVICE_ROLE_KEY (JWT).
   Proyectos nuevos: SUPABASE_SECRET_KEYS = {"default":"sb_secret_…"}. */
export function claveServidor(serviceRole: string, secretKeysJson: string): string {
  if (serviceRole) return serviceRole;
  try {
    const claves = JSON.parse(secretKeysJson || "{}") as Record<string, string>;
    return claves.default ?? Object.values(claves)[0] ?? "";
  } catch {
    return "";
  }
}

/* ---------- Dependencias reales (Supabase + Gmail) ---------- */
function depsReales(): Deps {
  const env = (k: string) => Deno.env.get(k) ?? "";
  const url = env("SUPABASE_URL");
  const clave = claveServidor(env("SUPABASE_SERVICE_ROLE_KEY"), env("SUPABASE_SECRET_KEYS"));
  const gmail = env("GMAIL_USER");
  // Las claves nuevas (sb_secret_…) no son JWT: van solo en «apikey»
  const auth: Record<string, string> = clave.startsWith("sb_")
    ? { apikey: clave }
    : { apikey: clave, Authorization: `Bearer ${clave}` };
  const rest = (ruta: string, init: RequestInit = {}) =>
    fetch(`${url}/rest/v1/${ruta}`, {
      ...init,
      headers: { ...auth, "Content-Type": "application/json", ...init.headers },
    });

  const transporte = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmail, pass: env("GMAIL_APP_PASSWORD") },
  });

  return {
    avisarA: env("CONTACT_TO") || gmail,
    origenes: env("ALLOWED_ORIGINS") ? env("ALLOWED_ORIGINS").split(",").map((s) => s.trim()) : ORIGENES_POR_DEFECTO,

    async contarRecientes(email, desdeISO) {
      const filtro = `fecha=gte.${encodeURIComponent(desdeISO)}` + (email ? `&email=eq.${encodeURIComponent(email)}` : "");
      const res = await rest(`mensajes?select=id&${filtro}`, { headers: { Prefer: "count=exact", Range: "0-0" } });
      if (!res.ok) throw new Error(`contar ${res.status}`);
      return Number((res.headers.get("content-range") ?? "*/0").split("/")[1]) || 0;
    },

    async guardar(c) {
      const res = await rest("mensajes", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          disponibilidad: c.disponibilidad,
          mensaje: c.mensaje || null,
        }),
      });
      if (!res.ok) throw new Error(`guardar ${res.status}: ${await res.text()}`);
    },

    async enviar(correo) {
      await transporte.sendMail({ from: `"Sergio Chorques" <${gmail}>`, ...correo });
    },
  };
}

// En las pruebas (CONTACTO_TEST=1) solo se importan las funciones de arriba
if (!Deno.env.get("CONTACTO_TEST")) {
  Deno.serve(crearManejador(depsReales()));
}
