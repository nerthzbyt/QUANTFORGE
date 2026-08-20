/* ============================================================
   QuantForge·TSM — Conectores API en vivo
   · TradeSkillMaster (REST v1 con clave + Public Data CSV sin clave)
   · Battle.net Game Data API (búsqueda de objetos + metadatos)
   Sin hardcoding: todo dato de mercado puede venir de la API.
   ============================================================ */

export type Region = "us" | "eu" | "kr" | "tw" | "br" | "au" | "cn";

export const REGIONS: { id: Region; label: string; locale: string }[] = [
  { id: "us", label: "US — América", locale: "en_US" },
  { id: "eu", label: "EU — Europa", locale: "es_ES" },
  { id: "kr", label: "KR — Corea", locale: "ko_KR" },
  { id: "tw", label: "TW — Taiwán", locale: "zh_TW" },
  { id: "br", label: "BR — Brasil", locale: "pt_BR" },
  { id: "au", label: "AU — Oceanía", locale: "en_US" },
  { id: "cn", label: "CN — China", locale: "zh_CN" },
];

export interface WowItem {
  id: number;
  name: string;
  quality: string;
  qualityLabel: string;
  icon?: string;
  level?: number;
}

export interface PricePayload {
  dbmarket?: number;
  dbminbuyout?: number;
  dbrecent?: number;
  dbhistorical?: number;
  dbregionmarketavg?: number;
  dbregionhistorical?: number;
  dbregionsaleavg?: number;
  dbregionsalerate?: number;
  dbregionsoldperday?: number;
  vendorsell?: number;
  vendorbuy?: number;
  avgbuy?: number;
}

export interface ApiLogEntry {
  t: string;
  level: "ok" | "warn" | "err";
  msg: string;
}

export class ApiError extends Error {
  code: string;
  hint?: string;
  constructor(code: string, msg: string, hint?: string) {
    super(msg);
    this.code = code;
    this.hint = hint;
  }
}

/* ---------------- almacenamiento local de credenciales ---------------- */

const LS = {
  tsmKey: "qf_tsm_key",
  bnetId: "qf_bnet_id",
  bnetSecret: "qf_bnet_secret",
  proxy: "qf_proxy",
  region: "qf_region",
};

export const store = {
  get(k: keyof typeof LS): string {
    try { return localStorage.getItem(LS[k]) ?? ""; } catch { return ""; }
  },
  set(k: keyof typeof LS, v: string) {
    try { localStorage.setItem(LS[k], v); } catch { /* almacenamiento no disponible */ }
  },
};

/** Prefijo opcional para saltar CORS con un proxy propio (p. ej. un Worker). */
const proxy = () => store.get("proxy").replace(/\/+$/, "");
const url = (u: string) => (proxy() ? `${proxy()}/${u.replace(/^https?:\/\//, "")}` : u);

async function getJson<T>(u: string, headers?: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url(u), { headers });
  } catch {
    throw new ApiError(
      "CORS",
      "El navegador bloqueó la petición (CORS) o no hay conexión.",
      "Configura un proxy propio en el panel de conexión (véase Documentación §3.4).",
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError("AUTH", `Credenciales rechazadas (HTTP ${res.status}).`, "Revisa la clave API en el panel de conexión.");
  }
  if (res.status === 404) {
    throw new ApiError("NOT_FOUND", "Recurso no encontrado (HTTP 404).", "Comprueba el id de objeto y la región seleccionada.");
  }
  if (res.status === 429) {
    throw new ApiError("RATE", "Límite de peticiones alcanzado (HTTP 429).", "Espera unos segundos y reintenta.");
  }
  if (!res.ok) throw new ApiError("HTTP", `Error del servidor (HTTP ${res.status}).`);
  return res.json() as Promise<T>;
}

async function getText(u: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url(u));
  } catch {
    throw new ApiError("CORS", "El navegador bloqueó la petición (CORS) o no hay conexión.", "Configura un proxy propio (Documentación §3.4).");
  }
  if (!res.ok) throw new ApiError("HTTP", `Error del servidor (HTTP ${res.status}).`);
  return res.text();
}

/* ============================================================
   Battle.net — Game Data API (OAuth2 client credentials)
   ============================================================ */

const tokenCache: Partial<Record<Region, { token: string; exp: number }>> = {};

export async function battleNetToken(region: Region): Promise<string> {
  const cached = tokenCache[region];
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const id = store.get("bnetId");
  const secret = store.get("bnetSecret");
  if (!id || !secret) {
    throw new ApiError("NO_BNET", "Faltan credenciales de Battle.net.", "Introduce Client ID y Client Secret del portal de desarrolladores de Blizzard.");
  }
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret });
  let res: Response;
  try {
    res = await fetch(url(`https://${region}.battle.net/oauth/token`), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new ApiError("CORS", "No se pudo obtener el token de Battle.net (CORS/red).", "Configura un proxy propio (Documentación §3.4).");
  }
  if (!res.ok) throw new ApiError("AUTH", `Battle.net rechazó las credenciales (HTTP ${res.status}).`, "Verifica Client ID / Client Secret en develop.battle.net.");
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache[region] = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function searchItems(region: Region, query: string): Promise<WowItem[]> {
  const { locale } = REGIONS.find((r) => r.id === region)!;
  const token = await battleNetToken(region);
  const q = encodeURIComponent(query);
  const data = await getJson<{ results?: { data: Record<string, unknown> }[] }>(
    `https://${region}.api.blizzard.com/data/wow/search/item?name=${q}&namespace=static-${locale}&locale=${locale}&_pageSize=12`,
    { Authorization: `Bearer ${token}` },
  );
  const out: WowItem[] = [];
  for (const r of data.results ?? []) {
    const d = r.data as Record<string, any>;
    const id = Number(d.id);
    if (!id) continue;
    const qType = String(d.quality?.type ?? "");
    out.push({
      id,
      name: String(d.name ?? `Objeto #${id}`),
      quality: qType,
      qualityLabel: QUALITY_LABEL[qType] ?? qType ?? "—",
      level: typeof d.level === "number" ? d.level : undefined,
    });
  }
  return out;
}

export async function fetchItemIcon(region: Region, itemId: number): Promise<string | undefined> {
  try {
    const { locale } = REGIONS.find((r) => r.id === region)!;
    const token = await battleNetToken(region);
    const data = await getJson<{ assets?: { key: string; value: string }[] }>(
      `https://${region}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${locale}&locale=${locale}`,
      { Authorization: `Bearer ${token}` },
    );
    return data.assets?.find((a) => a.key === "icon")?.value;
  } catch {
    return undefined;
  }
}

export const QUALITY_COLOR: Record<string, string> = {
  QUALITY_POOR: "#9d9d9d",
  QUALITY_COMMON: "#ffffff",
  QUALITY_UNCOMMON: "#1eff00",
  QUALITY_RARE: "#0070dd",
  QUALITY_EPIC: "#a335ee",
  QUALITY_LEGENDARY: "#ff8000",
  QUALITY_ARTIFACT: "#e6cc80",
  QUALITY_HEIRLOOM: "#00ccff",
  QUALITY_WOW_TOKEN: "#00ccff",
};

const QUALITY_LABEL: Record<string, string> = {
  QUALITY_POOR: "Pobre",
  QUALITY_COMMON: "Común",
  QUALITY_UNCOMMON: "Poco común",
  QUALITY_RARE: "Raro",
  QUALITY_EPIC: "Épico",
  QUALITY_LEGENDARY: "Legendario",
  QUALITY_ARTIFACT: "Artefacto",
  QUALITY_HEIRLOOM: "Legado",
};

/* ============================================================
   TSM — API REST v1 (requiere clave)
   ============================================================ */

export async function fetchTsmStats(region: Region, itemId: number): Promise<PricePayload> {
  const key = store.get("tsmKey");
  if (!key) throw new ApiError("NO_KEY", "Falta la clave de la API de TSM.", "Obtén tu clave en tradeskillmaster.com → cuenta → API key, o usa el modo Public Data (sin clave).");
  const data = await getJson<{ data?: { attributes?: Record<string, number> } }>(
    `https://api.tradeskillmaster.com/api/v1/item/${itemId}/stats?region=${region}&key=${encodeURIComponent(key)}`,
  );
  const a = data.data?.attributes;
  if (!a) throw new ApiError("PARSE", "La respuesta de TSM no contiene estadísticas.", "El id de objeto quizá no tiene datos en esta región.");
  return mapStats(a);
}

function mapStats(a: Record<string, number>): PricePayload {
  return {
    dbmarket: num(a.marketValue),
    dbminbuyout: num(a.minBuyout),
    dbrecent: num(a.recentlySold),
    dbhistorical: num(a.historical),
    dbregionmarketavg: num(a.regionMarketValue),
    dbregionhistorical: num(a.regionHistorical),
    dbregionsaleavg: num(a.regionSaleAvg),
    dbregionsalerate: num(a.regionSaleRate),
    dbregionsoldperday: num(a.regionSoldPerDay ?? a.regionAvgDailySold ?? a.avgDailySold),
    vendorsell: num(a.vendorSell),
    vendorbuy: num(a.vendorBuy),
    avgbuy: num(a.saleAvg ?? a.avgPrice),
  };
}

const num = (x: number | undefined | null): number | undefined =>
  typeof x === "number" && Number.isFinite(x) ? x : undefined;

/* ============================================================
   TSM — Public Data (CSV, sin clave)
   ============================================================ */

export interface Realm {
  realmId: string;
  name: string;
  region: Region;
}

export async function fetchRealms(region: Region): Promise<Realm[]> {
  const data = await getJson<{ realms?: { id: string; name: string; region: string }[] } | { realms?: unknown }>(
    "https://public-data.tradeskillmaster.com/realms",
  );
  const list = (data as any).realms;
  if (!Array.isArray(list)) throw new ApiError("PARSE", "El índice de reinos de TSM Public Data no tiene el formato esperado.");
  return list
    .filter((r: any) => String(r.region).toLowerCase() === region)
    .map((r: any) => ({ realmId: String(r.id), name: String(r.name), region }));
}

/* alias de cabeceras CSV → variable del motor */
const CSV_ALIASES: Record<string, keyof PricePayload> = {
  marketvalue: "dbmarket",
  dbmarket: "dbmarket",
  minbuyout: "dbminbuyout",
  dbminbuyout: "dbminbuyout",
  historical: "dbhistorical",
  dbhistorical: "dbhistorical",
  recentsold: "dbrecent",
  dbrecent: "dbrecent",
  regionmarketvalue: "dbregionmarketavg",
  regionmarketavg: "dbregionmarketavg",
  dbregionmarketavg: "dbregionmarketavg",
  regionhistorical: "dbregionhistorical",
  dbregionhistorical: "dbregionhistorical",
  regionsaleavg: "dbregionsaleavg",
  dbregionsaleavg: "dbregionsaleavg",
  regionsalerate: "dbregionsalerate",
  dbregionsalerate: "dbregionsalerate",
  regionsoldperday: "dbregionsoldperday",
  regionavgdailysold: "dbregionsoldperday",
  dbregionsoldperday: "dbregionsoldperday",
  vendorsell: "vendorsell",
  vendorbuy: "vendorbuy",
  saleavg: "avgbuy",
  avgprice: "avgbuy",
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function fetchPublicPrice(realmId: string, itemId: number): Promise<PricePayload> {
  const csv = await getText(`https://public-data.tradeskillmaster.com/realms/${realmId}`);
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new ApiError("PARSE", "El archivo CSV del reino está vacío.");
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxId = header.findIndex((h) => h === "itemid" || h === "itemstring");
  if (idxId < 0) throw new ApiError("PARSE", "El CSV no contiene la columna itemId.");
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const rawId = (cols[idxId] ?? "").replace(/^i:/, "");
    if (rawId === String(itemId)) {
      const payload: PricePayload = {};
      header.forEach((h, i) => {
        const target = CSV_ALIASES[h];
        if (target) {
          const v = parseFloat(cols[i]);
          if (Number.isFinite(v)) payload[target] = v;
        }
      });
      if (payload.dbmarket === undefined && payload.dbminbuyout === undefined) {
        throw new ApiError("PARSE", "La fila del objeto no incluye columnas de precio reconocidas.", `Columnas vistas: ${header.slice(0, 10).join(", ")}…`);
      }
      return payload;
    }
  }
  throw new ApiError("NOT_FOUND", `El objeto #${itemId} no aparece en el CSV del reino seleccionado.`, "Prueba otro reino conectado o la API REST con clave.");
}

/* ---------------- resumen de qué proveedor se usará ---------------- */

export function plannedProvider(): { label: string; needsKey: boolean } {
  return store.get("tsmKey")
    ? { label: "TSM REST v1 (con clave)", needsKey: false }
    : { label: "TSM Public Data (CSV, sin clave)", needsKey: false };
}
