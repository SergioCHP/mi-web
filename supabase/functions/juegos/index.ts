/* =========================================================
   Edge Function «juegos» (Supabase · Deno)

   Buscador de videojuegos de juegos.html. Sustituye a RAWG.
     1. Recibe GET ?search=<título> desde la web.
     2. Pide (y guarda en memoria) un token de Twitch.
     3. Consulta la API de IGDB en tres pasos: candidatos (ligero),
        ficha completa de los elegidos (hasta 10) y su duración.
     4. Devuelve los resultados con la MISMA forma que daba RAWG
        ({ results: [{ name, background_image, platforms, ... }] })
        más los extras de la ficha: portada, tráiler, capturas,
        estudio, editora, modos de juego, duración y similares.

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

// La web enseña 5 y un botón «Ver más» con los otros 5.
const MAX_RESULTADOS = 10;
// La búsqueda de IGDB es amplia: se piden muchos candidatos (solo nombre y
// popularidad, es ligero), se ordenan y se queda con los mejores.
const MAX_CANDIDATOS = 50;
// Tipos de juego de IGDB que se muestran: juego principal (0), expansión (2),
// expansión independiente (4), remake (8), remaster (9) y edición ampliada (10).
// Fuera: DLC, packs, mods, episodios y ports (copias del mismo juego en otra consola).
const TIPOS_VALIDOS = "(0,2,4,8,9,10)";
// Relevancia (ver elegirCandidatos)
const PLUS_EXACTO = 3;
const UMBRAL_RELATIVO = 0.02;
const MIN_PARA_FILTRAR = 100;
const MAX_LARGO_BUSQUEDA = 80;
const MAX_CAPTURAS = 4;
const MAX_SIMILARES = 4;
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

/** POST a un endpoint de IGDB. Si el token ha caducado, pide otro una vez. */
async function igdb<T>(endpoint: string, consulta: string, reintento = false): Promise<T> {
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": env("TWITCH_CLIENT_ID"),
      "Authorization": `Bearer ${await obtenerToken()}`,
      "Accept": "application/json",
    },
    body: consulta,
  });

  if (res.status === 401 && !reintento) {
    token = null;
    return igdb<T>(endpoint, consulta, true);
  }
  // IGDB permite 4 peticiones por segundo: si se pasa, espera y reintenta una vez.
  if (res.status === 429 && !reintento) {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    return igdb<T>(endpoint, consulta, true);
  }
  if (!res.ok) throw new Error(`igdb ${endpoint} ${res.status}`);
  return await res.json();
}

/* ---------- Tipos de IGDB (solo lo que se pide) ---------- */
interface JuegoIgdb {
  id: number;
  name: string;
  first_release_date?: number;
  summary?: string;
  url?: string;
  total_rating?: number;
  total_rating_count?: number;
  aggregated_rating?: number;
  cover?: { image_id: string };
  artworks?: { image_id: string }[];
  screenshots?: { image_id: string }[];
  platforms?: { name: string }[];
  genres?: { name: string }[];
  game_modes?: { name: string }[];
  videos?: { name?: string; video_id: string }[];
  involved_companies?: { developer: boolean; publisher: boolean; company?: { name: string } }[];
  similar_games?: { name: string }[];
}

interface CandidatoIgdb {
  id: number;
  name: string;
  first_release_date?: number;
  total_rating_count?: number;
}

interface DuracionIgdb {
  game_id: number;
  hastily?: number;
  normally?: number;
  completely?: number;
}

/** Normaliza un título para compararlo: minúsculas, sin tildes ni signos. */
const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Paso 1: lista ligera de candidatos ordenada por relevancia.
 *  - Puntuación = número de valoraciones en IGDB (popularidad).
 *  - Si el nombre es exactamente lo buscado, la puntuación se triplica:
 *    así «god of war» trae el de 2005 y el de 2018, pero no una versión
 *    desconocida que se llame igual.
 *  - Se descartan los que tienen muy poca puntuación comparados con el
 *    mejor (fangames, demakes): mejor menos resultados que resultados malos.
 *  - Si hay dos con el mismo nombre y año, se queda uno.
 */
async function elegirCandidatos(texto: string): Promise<number[]> {
  const CAMPOS = "fields name, first_release_date, total_rating_count;";
  const filtro = (conTipo: boolean) =>
    `version_parent = null${conTipo ? ` & game_type = ${TIPOS_VALIDOS}` : ""}`;

  // a) Búsqueda de IGDB: por palabras completas («god of war»).
  const porPalabras = (conTipo: boolean) => [
    `search "${texto}";`, CAMPOS, `where ${filtro(conTipo)};`, `limit ${MAX_CANDIDATOS};`,
  ].join(" ");
  // b) Títulos que contienen todas las palabras escritas, aunque la última esté
  //    a medias («god of war ascen» → «God of War: Ascension»), de más a menos popular.
  //    Se busca palabra por palabra porque el título puede llevar «:» u otros signos.
  const palabras = normalizar(texto).split(" ").filter(Boolean).slice(0, 6);
  const contiene = palabras.map((p) => `name ~ *"${p}"*`).join(" & ");
  const porNombre = (conTipo: boolean) => [
    CAMPOS, `where ${contiene} & ${filtro(conTipo)};`,
    "sort total_rating_count desc;", `limit ${MAX_CANDIDATOS};`,
  ].join(" ");

  // Si IGDB cambia el campo game_type, se repite sin ese filtro en vez de fallar.
  const pedir = async (consulta: (conTipo: boolean) => string) => {
    try {
      return await igdb<CandidatoIgdb[]>("games", consulta(true));
    } catch (e) {
      console.error("Reintento sin game_type:", e);
      return await igdb<CandidatoIgdb[]>("games", consulta(false));
    }
  };

  // En (b) cada palabra escrita tiene que ser el principio de una palabra del
  // título: «hades» no debe traer «Shades».
  const encaja = (nombre: string) => {
    const delTitulo = normalizar(nombre).split(" ");
    return palabras.every((p) => delTitulo.some((t) => t.startsWith(p)));
  };

  const [a, b] = await Promise.all([
    pedir(porPalabras),
    palabras.length ? pedir(porNombre) : Promise.resolve([] as CandidatoIgdb[]),
  ]);
  const porId = new Map<number, CandidatoIgdb>();
  for (const c of a) porId.set(c.id, c);
  for (const c of b) if (encaja(c.name)) porId.set(c.id, c);
  const candidatos = [...porId.values()];

  const buscado = palabras.join(" ");
  const puntos = (c: CandidatoIgdb) =>
    (c.total_rating_count ?? 0) * (normalizar(c.name) === buscado ? PLUS_EXACTO : 1);
  const anio = (c: CandidatoIgdb) =>
    c.first_release_date ? new Date(c.first_release_date * 1000).getUTCFullYear() : 0;

  const valoraciones = (c: CandidatoIgdb) => c.total_rating_count ?? 0;
  const ordenados = candidatos
    .map((c, i) => ({ c, i, p: puntos(c), exacto: normalizar(c.name) === buscado }))
    .sort((a, b) => b.p - a.p || a.i - b.i);

  // Umbral: un % de las valoraciones del más popular (sin el plus del título exacto).
  // Si ninguno es conocido (juegos de nicho), no se filtra.
  const mejor = Math.max(0, ...candidatos.map(valoraciones));
  const umbral = mejor >= MIN_PARA_FILTRAR ? mejor * UMBRAL_RELATIVO : 0;

  const vistos = new Set<string>();
  return ordenados
    // El título exacto nunca se descarta (por si es un juego poco conocido),
    // pero como tiene pocos puntos queda al final y solo entra si hay hueco.
    .filter(({ c, exacto }) => valoraciones(c) >= umbral || exacto)
    .filter(({ c }) => {
      const clave = `${normalizar(c.name)}|${anio(c)}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .slice(0, MAX_RESULTADOS)
    .map(({ c }) => c.id);
}

/** Paso 2: ficha completa solo de los elegidos, en el mismo orden. */
async function buscarJuegos(texto: string): Promise<JuegoIgdb[]> {
  const ids = await elegirCandidatos(texto);
  if (ids.length === 0) return [];

  const juegos = await igdb<JuegoIgdb[]>("games", [
    "fields name, first_release_date, summary, url, total_rating, aggregated_rating,",
    "  cover.image_id, artworks.image_id, screenshots.image_id, platforms.name, genres.name,",
    "  game_modes.name, videos.name, videos.video_id, similar_games.name,",
    "  involved_companies.developer, involved_companies.publisher, involved_companies.company.name;",
    `where id = (${ids.join(",")});`,
    `limit ${ids.length};`,
  ].join(" "));

  const porId = new Map(juegos.map((j) => [j.id, j]));
  return ids.map((id) => porId.get(id)).filter((j): j is JuegoIgdb => Boolean(j));
}

/** Duración de los juegos (en una sola petición). Si falla, la ficha sale sin ella. */
async function buscarDuraciones(ids: number[]): Promise<Map<number, DuracionIgdb>> {
  if (ids.length === 0) return new Map();
  try {
    const filas = await igdb<DuracionIgdb[]>("game_time_to_beats", [
      "fields game_id, hastily, normally, completely;",
      `where game_id = (${ids.join(",")});`,
      `limit ${ids.length};`,
    ].join(" "));
    return new Map(filas.map((f) => [f.game_id, f]));
  } catch (e) {
    console.error("Sin duración:", e);
    return new Map();
  }
}

/* ---------- Ayudantes de formato ---------- */
const horas = (segundos?: number) =>
  typeof segundos === "number" && segundos > 0 ? Math.max(1, Math.round(segundos / 3600)) : null;

const unicos = (lista: string[]) => [...new Set(lista.filter(Boolean))];

/** Elige el tráiler: primero uno que se llame «trailer», si no, el primer vídeo. */
function elegirTrailer(videos: JuegoIgdb["videos"] = []) {
  const v = videos.find((x) => /trailer|tr[aá]iler/i.test(x.name ?? "")) ?? videos[0];
  // Los ids de YouTube solo llevan letras, números, «-» y «_».
  return v && /^[\w-]{6,20}$/.test(v.video_id) ? { id: v.video_id, nombre: v.name ?? "" } : null;
}

/* ---------- IGDB → formato RAWG + extras (lo que espera script.js) ---------- */
function aFormatoRawg(j: JuegoIgdb, duracion?: DuracionIgdb) {
  // Imagen apaisada: mejor una captura (los artes a veces son logos sobre blanco);
  // si no hay, un arte, y si tampoco, la portada.
  const apaisada = j.screenshots?.[0]?.image_id ?? j.artworks?.[0]?.image_id;
  const imagen = apaisada
    ? IMG(apaisada, "t_screenshot_big")
    : j.cover ? IMG(j.cover.image_id, "t_cover_big") : null;

  const companias = j.involved_companies ?? [];
  const nombres = (filtro: (c: typeof companias[number]) => boolean) =>
    unicos(companias.filter(filtro).map((c) => c.company?.name ?? ""));

  const historia = horas(duracion?.normally ?? duracion?.hastily);
  const completo = horas(duracion?.completely);

  return {
    /* --- Campos con formato RAWG --- */
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

    /* --- Extras de la ficha --- */
    cover: j.cover ? IMG(j.cover.image_id, "t_cover_big") : null,
    trailer: elegirTrailer(j.videos),
    screenshots: (j.screenshots ?? []).slice(0, MAX_CAPTURAS).map((s) => ({
      mini: IMG(s.image_id, "t_screenshot_med"),
      grande: IMG(s.image_id, "t_1080p"),
    })),
    developers: nombres((c) => c.developer),
    publishers: nombres((c) => c.publisher),
    modes: unicos((j.game_modes ?? []).map((m) => m.name)),
    duration: historia || completo ? { historia, completo } : null,
    similar: unicos((j.similar_games ?? []).map((s) => s.name)).slice(0, MAX_SIMILARES),
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
    const juegos = await buscarJuegos(texto);
    const duraciones = await buscarDuraciones(juegos.map((j) => j.id));
    return json(200, { results: juegos.map((j) => aFormatoRawg(j, duraciones.get(j.id))) }, {
      // El navegador guarda la respuesta 1 hora.
      "Cache-Control": "public, max-age=3600",
    });
  } catch (e) {
    console.error("Error consultando IGDB:", e);
    return json(502, { error: "igdb" });
  }
});
