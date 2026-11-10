/* =========================================================
   Edge Function «juegos» (Supabase · Deno)

   Buscador de videojuegos de juegos.html. Sustituye a RAWG.
     1. Recibe GET ?search=<título> desde la web.
     2. Pide (y guarda en memoria) un token de Twitch.
     3. Consulta la API de IGDB.
     4. Devuelve los resultados con la MISMA forma que daba RAWG
        ({ results: [{ name, background_image, platforms, ... }] }),
        así el frontend (renderGrid / renderFicha) no cambia.

   SEGURIDAD
   - Las claves NO están en el código: se leen de los «Secrets» de
     Supabase (Edge Functions → Secrets). Nunca las subas a GitHub.
       TWITCH_CLIENT_ID      Client ID de la app de dev.twitch.tv
       TWITCH_CLIENT_SECRET  Client Secret de esa app
       ALLOWED_ORIGINS       (opcional) orígenes permitidos separados por comas
   - Solo responde a peticiones del navegador desde mis orígenes.
   ========================================================= */

const ORIGENES_POR_DEFECTO = [
  "https://sergiochp.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const env = (k: string) => Deno.env.get(k) ?? "";
const ORIGENES = env("ALLOWED_ORIGINS")
  ? env("ALLOWED_ORIGINS").split(",").map((s) => s.trim())
  : ORIGENES_POR_DEFECTO;

const MAX_RESULTADOS = 6;
const MAX_LARGO_BUSQUEDA = 80;
const IMG = (id: string, tam: string) =>
  `https://images.igdb.com/igdb/image/upload/${tam}/${id}.jpg`;

/* ---------- Token de Twitch (se reutiliza hasta que caduca) ---------- */
let token: { valor: string; caduca: number } | null = null;

async function obtenerToken(): Promise<string> {
  if (token && Date.now() < token.caduca) return token.valor;

  const params = new URLSearchParams({
    client_id: env("TWITCH_CLIENT_ID"),
    client_secret: env("TWITCH_CLIENT_SECRET"),
    grant_type: "client_credentials",
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: "POST" });
  if (!res.ok) throw new Error(`twitch ${res.status}`);

  const datos = await res.json();
  // Se renueva 5 minutos antes de caducar.
  token = { valor: datos.access_token, caduca: Date.now() + (datos.expires_in - 300) * 1000 };
  return token.valor;
}

/* ---------- Consulta a IGDB ---------- */
interface JuegoIgdb {
  name: string;
  first_release_date?: number;
  summary?: string;
  url?: string;
  total_rating?: number;
  aggregated_rating?: number;
  cover?: { image_id: string };
  artworks?: { image_id: string }[];
  screenshots?: { image_id: string }[];
  platforms?: { name: string }[];
  genres?: { name: string }[];
}

async function buscarEnIgdb(texto: string, reintento = false): Promise<JuegoIgdb[]> {
  const consulta = [
    `search "${texto}";`,
    "fields name, first_release_date, summary, url, total_rating, aggregated_rating,",
    "  cover.image_id, artworks.image_id, screenshots.image_id, platforms.name, genres.name;",
    "where version_parent = null;",
    `limit ${MAX_RESULTADOS};`,
  ].join(" ");

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": env("TWITCH_CLIENT_ID"),
      "Authorization": `Bearer ${await obtenerToken()}`,
      "Accept": "application/json",
    },
    body: consulta,
  });

  // Token caducado o revocado: se pide uno nuevo una sola vez.
  if (res.status === 401 && !reintento) {
    token = null;
    return buscarEnIgdb(texto, true);
  }
  if (!res.ok) throw new Error(`igdb ${res.status}`);
  return await res.json();
}

/* ---------- IGDB → formato RAWG (lo que espera script.js) ---------- */
function aFormatoRawg(j: JuegoIgdb) {
  // Imagen apaisada si hay (arte o captura); si no, la portada.
  const apaisada = j.artworks?.[0]?.image_id ?? j.screenshots?.[0]?.image_id;
  const imagen = apaisada
    ? IMG(apaisada, "t_screenshot_big")
    : j.cover ? IMG(j.cover.image_id, "t_cover_big") : null;

  return {
    name: j.name,
    background_image: imagen,
    released: j.first_release_date
      ? new Date(j.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    // Nota de 0 a 10 (IGDB la da de 0 a 100).
    rating: typeof j.total_rating === "number" ? j.total_rating / 10 : null,
    // Nota media de la crítica (0-100).
    metacritic: typeof j.aggregated_rating === "number" ? Math.round(j.aggregated_rating) : null,
    platforms: (j.platforms ?? []).map((p) => ({ platform: { name: p.name } })),
    genres: (j.genres ?? []).map((g) => ({ name: g.name })),
    description_raw: j.summary ?? "",
    stores: j.url ? [{ store: { name: "Ver en IGDB", url: j.url } }] : [],
  };
}

/* ---------- Servidor ---------- */
function cabecerasCors(origen: string | null) {
  const ok = origen !== null && ORIGENES.includes(origen);
  return {
    "Access-Control-Allow-Origin": ok ? origen! : ORIGENES[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origen = req.headers.get("origin");
  const cors = cabecerasCors(origen);
  const json = (status: number, cuerpo: unknown, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", ...extra },
    });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json(405, { error: "metodo" });
  if (origen === null || !ORIGENES.includes(origen)) return json(403, { error: "origen" });

  if (!env("TWITCH_CLIENT_ID") || !env("TWITCH_CLIENT_SECRET")) {
    console.error("Faltan los secrets TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET");
    return json(500, { error: "config" });
  }

  // Limpia la búsqueda: sin comillas ni barras (rompen la consulta de IGDB).
  const texto = (new URL(req.url).searchParams.get("search") ?? "")
    .replace(/["\\;]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LARGO_BUSQUEDA);
  if (texto.length < 2) return json(400, { error: "busqueda" });

  try {
    const juegos = await buscarEnIgdb(texto);
    return json(200, { results: juegos.map(aFormatoRawg) }, {
      // El navegador guarda la respuesta 1 hora.
      "Cache-Control": "public, max-age=3600",
    });
  } catch (e) {
    console.error("Error consultando IGDB:", e);
    return json(502, { error: "igdb" });
  }
});
