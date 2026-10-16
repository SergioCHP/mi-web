/* =========================================================
   Pruebas de la Edge Function «contacto»
   Ejecutar (con Deno instalado), desde la carpeta mi-web:
     CONTACTO_TEST=1 deno test --allow-env --allow-read --allow-net supabase/functions/contacto
   En Windows (PowerShell):
     $env:CONTACTO_TEST=1; deno test --allow-env --allow-read --allow-net supabase/functions/contacto
   No envían correos ni tocan la base de datos: usan dobles de prueba.
   ========================================================= */
import nodeAssert from "node:assert/strict";

// Ayudantes de aserción (node:assert viene con Deno, no hay que descargar nada)
const assert: (cond: unknown, msg?: string) => asserts cond = nodeAssert.ok;
const assertEquals = (real: unknown, esperado: unknown) => nodeAssert.deepStrictEqual(real, esperado);
const assertStringIncludes = (texto: string, trozo: string) =>
  nodeAssert.ok(texto.includes(trozo), `«${trozo}» no aparece en el texto`);
import { claveServidor, correoAviso, correoRespuesta, crearManejador, escaparHtml, LIMITES, validar, type Correo, type Contacto, type Deps } from "./index.ts";

const ORIGEN = "https://sergiochp.github.io";

const valido = {
  nombre: "Ana López",
  email: "Ana@Example.com",
  telefono: "+34 600 000 000",
  disponibilidad: "Tardes (16–20h)",
  mensaje: "Hola,\nquería hablar de un proyecto.",
  idioma: "es",
};

/** Dependencias falsas que apuntan lo que pasa. */
function dobles(opciones: { recientes?: number; total?: number; falloCorreo?: boolean } = {}) {
  const guardados: Contacto[] = [];
  const enviados: Correo[] = [];
  const deps: Deps = {
    avisarA: "yo@gmail.com",
    origenes: [ORIGEN],
    ahora: () => new Date("2026-10-16T10:00:00Z"),
    contarRecientes: (email) => Promise.resolve(email ? opciones.recientes ?? 0 : opciones.total ?? 0),
    guardar: (c) => { guardados.push(c); return Promise.resolve(); },
    enviar: (c) => opciones.falloCorreo ? Promise.reject(new Error("SMTP caído")) : (enviados.push(c), Promise.resolve()),
  };
  return { deps, guardados, enviados };
}

const peticion = (cuerpo: unknown, origen: string | null = ORIGEN, metodo = "POST") =>
  new Request("http://localhost/contacto", {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(origen ? { Origin: origen } : {}) },
    body: metodo === "POST" ? (typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });

/* ---------- Validación ---------- */
Deno.test("validar: datos correctos se limpian y el email pasa a minúsculas", () => {
  const r = validar({ ...valido, nombre: "  Ana López  " });
  assert(r.ok && !r.spam);
  assertEquals(r.datos.nombre, "Ana López");
  assertEquals(r.datos.email, "ana@example.com");
  assertEquals(r.datos.idioma, "es");
});

Deno.test("validar: detecta campos incorrectos", () => {
  const r = validar({ nombre: "", email: "no-es-un-email", telefono: "abc", disponibilidad: "", mensaje: "x".repeat(LIMITES.mensaje + 1) });
  assert(!r.ok);
  assertEquals(r.campos.sort(), ["disponibilidad", "email", "mensaje", "nombre", "telefono"]);
});

Deno.test("validar: el honeypot marca el envío como spam", () => {
  const r = validar({ ...valido, _gotcha: "soy un bot" });
  assert(r.ok && r.spam);
});

Deno.test("validar: quita saltos de línea del nombre (inyección de cabeceras)", () => {
  const r = validar({ ...valido, nombre: "Ana\r\nBcc: victima@x.com" });
  assert(r.ok);
  assert(!/[\r\n]/.test(r.datos.nombre));
});

/* ---------- Plantillas ---------- */
Deno.test("plantillas: escapan HTML y la respuesta no copia el mensaje", () => {
  const r = validar({ ...valido, nombre: "<script>x</script>", mensaje: "texto secreto de spam", idioma: "va" });
  assert(r.ok);
  const resp = correoRespuesta(r.datos, "yo@gmail.com");
  assert(!resp.html.includes("<script>"));
  assertStringIncludes(resp.html, escaparHtml("<script>x</script>"));
  assert(!resp.text.includes("texto secreto de spam"));
  assertStringIncludes(resp.subject, "sol·licitud"); // en valenciano
  assertEquals(resp.replyTo, "yo@gmail.com");

  const aviso = correoAviso(r.datos, "yo@gmail.com");
  assertEquals(aviso.replyTo, r.datos.email);
  assertStringIncludes(aviso.text, "texto secreto de spam");
});

/* ---------- Manejador ---------- */
Deno.test("POST válido: guarda, me avisa y responde al visitante", async () => {
  const { deps, guardados, enviados } = dobles();
  const res = await crearManejador(deps)(peticion(valido));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true, correo: true });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), ORIGEN);
  assertEquals(guardados.length, 1);
  assertEquals(enviados.map((c) => c.to).sort(), ["ana@example.com", "yo@gmail.com"]);
});

Deno.test("OPTIONS (preflight CORS) responde 204", async () => {
  const res = await crearManejador(dobles().deps)(peticion(null, ORIGEN, "OPTIONS"));
  assertEquals(res.status, 204);
  assertStringIncludes(res.headers.get("Access-Control-Allow-Methods") ?? "", "POST");
});

Deno.test("origen no permitido: 403 y no guarda nada", async () => {
  const { deps, guardados } = dobles();
  const res = await crearManejador(deps)(peticion(valido, "https://web-maliciosa.com"));
  assertEquals(res.status, 403);
  assertEquals(guardados.length, 0);
});

Deno.test("JSON roto: 400", async () => {
  const res = await crearManejador(dobles().deps)(peticion("{no es json"));
  assertEquals(res.status, 400);
});

Deno.test("datos inválidos: 400 con la lista de campos", async () => {
  const res = await crearManejador(dobles().deps)(peticion({ ...valido, email: "mal" }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).campos, ["email"]);
});

Deno.test("spam: responde 200 pero no guarda ni envía", async () => {
  const { deps, guardados, enviados } = dobles();
  const res = await crearManejador(deps)(peticion({ ...valido, _gotcha: "x" }));
  assertEquals(res.status, 200);
  assertEquals(guardados.length + enviados.length, 0);
});

Deno.test("límite: 3 envíos del mismo email en una hora → 429", async () => {
  const { deps, guardados } = dobles({ recientes: LIMITES.porEmailHora });
  const res = await crearManejador(deps)(peticion(valido));
  assertEquals(res.status, 429);
  assertEquals(guardados.length, 0);
});

Deno.test("límite global: 20 envíos en una hora → 429", async () => {
  const res = await crearManejador(dobles({ total: LIMITES.totalHora }).deps)(peticion(valido));
  assertEquals(res.status, 429);
});

Deno.test("si el correo falla, el mensaje queda guardado y se avisa con correo:false", async () => {
  const { deps, guardados } = dobles({ falloCorreo: true });
  const res = await crearManejador(deps)(peticion(valido));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true, correo: false });
  assertEquals(guardados.length, 1);
});

Deno.test("clave de servidor: usa la service role o, si no hay, la secret key nueva", () => {
  assertEquals(claveServidor("eyJ-service", ""), "eyJ-service");
  assertEquals(claveServidor("", '{"default":"sb_secret_abc"}'), "sb_secret_abc");
  assertEquals(claveServidor("", "no-json"), "");
});
