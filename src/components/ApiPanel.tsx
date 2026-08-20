import { useEffect, useRef, useState } from "react";
import {
  ApiError, fetchItemIcon, fetchPublicPrice, fetchRealms, fetchTsmStats,
  plannedProvider, QUALITY_COLOR, REGIONS, searchItems, store,
  type ApiLogEntry, type PricePayload, type Realm, type Region, type WowItem,
} from "../lib/tsmApi";
import { Badge, SectionTitle } from "./ui";

export interface LiveMeta {
  itemId: number;
  itemName: string;
  icon?: string;
  quality: string;
  region: Region;
  provider: string;
  at: string;
}

interface Props {
  onApply: (payload: PricePayload, meta: LiveMeta) => void;
}

function GemIcon({ color = "#f6b83d", size = 26 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h10l4 6-9 12L3 9l4-6Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 9h18M9.5 3 8 9l4 12M14.5 3 16 9l-4 12" stroke={color} strokeWidth="1" opacity="0.55" />
    </svg>
  );
}

const now = () => new Date().toLocaleTimeString("es-ES", { hour12: false });

export default function ApiPanel({ onApply }: Props) {
  const [tsmKey, setTsmKey] = useState(store.get("tsmKey"));
  const [bnetId, setBnetId] = useState(store.get("bnetId"));
  const [bnetSecret, setBnetSecret] = useState(store.get("bnetSecret"));
  const [proxyUrl, setProxyUrl] = useState(store.get("proxy"));
  const [region, setRegion] = useState<Region>((store.get("region") as Region) || "eu");
  const [credsOpen, setCredsOpen] = useState(!store.get("tsmKey"));

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<WowItem[]>([]);
  const [picked, setPicked] = useState<WowItem | null>(null);

  const [realms, setRealms] = useState<Realm[]>([]);
  const [realmId, setRealmId] = useState("");
  const [loadingRealms, setLoadingRealms] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hint, setHint] = useState<{ level: "ok" | "warn" | "err"; msg: string } | null>(null);
  const [log, setLog] = useState<ApiLogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const saveCreds = () => {
    store.set("tsmKey", tsmKey.trim());
    store.set("bnetId", bnetId.trim());
    store.set("bnetSecret", bnetSecret.trim());
    store.set("proxy", proxyUrl.trim());
    store.set("region", region);
    push("ok", "credenciales guardadas en este navegador (localStorage)");
    setHint({ level: "ok", msg: "Credenciales guardadas localmente. Nada sale de tu equipo salvo a las APIs oficiales." });
  };

  const push = (level: ApiLogEntry["level"], msg: string) =>
    setLog((l) => [...l.slice(-5), { t: now(), level, msg }]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const usingRest = tsmKey.trim().length > 0;
  const provider = usingRest ? "TSM REST v1 · clave" : "TSM Public Data · CSV";

  /* reinos para la ruta CSV (sin clave) */
  useEffect(() => {
    if (usingRest) return;
    let alive = true;
    setLoadingRealms(true);
    fetchRealms(region)
      .then((rs) => {
        if (!alive) return;
        setRealms(rs);
        setRealmId((cur) => (rs.some((r) => r.realmId === cur) ? cur : rs[0]?.realmId ?? ""));
        push("ok", `${rs.length} reinos indexados en ${region.toUpperCase()} (Public Data)`);
      })
      .catch((e: ApiError) => alive && push("err", `reinos: ${e.message}`))
      .finally(() => alive && setLoadingRealms(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, usingRest]);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHint(null);
    push("ok", `búsqueda "${query.trim()}" vía Battle.net (${region.toUpperCase()})`);
    try {
      const rs = await searchItems(region, query.trim());
      setResults(rs);
      setPicked(rs[0] ?? null);
      push(rs.length ? "ok" : "warn", rs.length ? `${rs.length} objetos encontrados` : "sin resultados para esa consulta");
    } catch (e) {
      const err = e as ApiError;
      push("err", `búsqueda: ${err.message}`);
      setHint({ level: "err", msg: `${err.message} ${err.hint ?? ""}` });
    } finally {
      setSearching(false);
    }
  };

  const pickItem = async (it: WowItem) => {
    setPicked(it);
    if (!it.icon) {
      const icon = await fetchItemIcon(region, it.id);
      if (icon) setPicked({ ...it, icon });
    }
  };

  const syncPrices = async () => {
    if (!picked) return;
    setSyncing(true);
    setHint(null);
    push("ok", `sincronizando #${picked.id} "${picked.name}" · ${provider}`);
    try {
      const payload = usingRest
        ? await fetchTsmStats(region, picked.id)
        : await fetchPublicPrice(realmId, picked.id);
      const fields = Object.values(payload).filter((v) => v !== undefined).length;
      push("ok", `${fields} campos de mercado recibidos y aplicados al motor`);
      setLastSync(now());
      setHint({ level: "ok", msg: `${fields} campos en vivo aplicados. Los campos no cubiertos por la API (matprice, crafting, destroy…) conservan su valor editable.` });
      onApply(payload, {
        itemId: picked.id,
        itemName: picked.name,
        icon: picked.icon,
        quality: picked.quality,
        region,
        provider,
        at: new Date().toISOString(),
      });
    } catch (e) {
      const err = e as ApiError;
      push("err", `${err.code}: ${err.message}`);
      setHint({ level: "err", msg: `${err.message} ${err.hint ?? ""}` });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="panel p-4 anim-fade-up">
      <SectionTitle
        code="01"
        title="Conexión API en vivo"
        right={
          <span className="flex items-center gap-1.5">
            <Badge tone={usingRest ? "gold" : "arc"}>{provider}</Badge>
          </span>
        }
      />

      {/* credenciales */}
      <button
        onClick={() => setCredsOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between rounded border border-line-700 bg-ink-800/50 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fog-400 transition-colors hover:text-fog-200"
      >
        <span>credenciales y red</span>
        <span className={`transition-transform duration-200 ${credsOpen ? "rotate-90" : ""}`}>▸</span>
      </button>
      {credsOpen && (
        <div className="mb-3 space-y-1.5 rounded border border-line-800 bg-ink-950/60 p-2.5 anim-fade-up">
          <label className="block">
            <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-fog-500">TSM API key · opcional (activa REST v1)</span>
            <input type="password" value={tsmKey} onChange={(e) => setTsmKey(e.target.value)} placeholder="sin clave → se usa Public Data (CSV)" className="num-input" autoComplete="off" />
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <label className="block">
              <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-fog-500">Battle.net Client ID</span>
              <input type="text" value={bnetId} onChange={(e) => setBnetId(e.target.value)} placeholder="búsqueda de objetos" className="num-input" autoComplete="off" />
            </label>
            <label className="block">
              <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-fog-500">Client Secret</span>
              <input type="password" value={bnetSecret} onChange={(e) => setBnetSecret(e.target.value)} placeholder="develop.battle.net" className="num-input" autoComplete="off" />
            </label>
          </div>
          <label className="block">
            <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-fog-500">Proxy CORS · opcional (si el navegador bloquea)</span>
            <input type="text" value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)} placeholder="https://tu-worker.example.workers.dev" className="num-input" autoComplete="off" />
          </label>
          <div className="flex items-center gap-1.5">
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="num-input flex-1">
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <button onClick={saveCreds} className="shrink-0 rounded border border-gold-500/50 bg-gold-500/12 px-3 py-[7px] font-display text-[11px] font-semibold text-gold-300 transition-all hover:bg-gold-500/20 active:scale-[0.97]">
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* búsqueda de objetos */}
      <div className="mb-2 flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder={bnetId ? "Buscar objeto… (p. ej. Fiery Quintessence)" : "Buscar objeto… (requiere credenciales Battle.net)"}
          className="num-input flex-1"
        />
        <button
          onClick={doSearch}
          disabled={searching}
          className="shrink-0 rounded border border-arc-500/45 bg-arc-500/10 px-3 py-[7px] font-display text-[11px] font-semibold text-arc-300 transition-all hover:bg-arc-500/18 active:scale-[0.97] disabled:opacity-40"
        >
          {searching ? "…" : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-2 max-h-36 space-y-1 overflow-y-auto rounded border border-line-800 bg-ink-950/60 p-1.5">
          {results.map((it) => (
            <button
              key={it.id}
              onClick={() => pickItem(it)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors ${
                picked?.id === it.id ? "bg-gold-500/12 ring-1 ring-gold-500/40" : "hover:bg-ink-750"
              }`}
            >
              {it.icon ? (
                <img src={it.icon} alt="" className="h-5 w-5 rounded-sm bg-ink-700" loading="lazy" />
              ) : (
                <GemIcon color={QUALITY_COLOR[it.quality] ?? "#f6b83d"} size={20} />
              )}
              <span className="min-w-0 flex-1 truncate font-mono text-[10.5px]" style={{ color: QUALITY_COLOR[it.quality] ?? "#eaeff7" }}>
                {it.name}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-fog-600">#{it.id}</span>
            </button>
          ))}
        </div>
      )}

      {/* objeto seleccionado + sincronización */}
      {picked ? (
        <div className="mb-2 rounded border border-line-700 bg-ink-800/50 p-2.5">
          <div className="flex items-center gap-2.5">
            {picked.icon ? (
              <img src={picked.icon} alt="" className="h-10 w-10 rounded border border-line-700 bg-ink-900" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded border border-line-700 bg-ink-900">
                <GemIcon color={QUALITY_COLOR[picked.quality] ?? "#f6b83d"} size={26} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[13px] font-semibold" style={{ color: QUALITY_COLOR[picked.quality] ?? "#eaeff7" }}>
                {picked.name}
              </div>
              <div className="font-mono text-[9.5px] text-fog-500">
                id {picked.id} · {picked.qualityLabel}{picked.level ? ` · ilvl ${picked.level}` : ""} · {region.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            {!usingRest && (
              <select value={realmId} onChange={(e) => setRealmId(e.target.value)} className="num-input flex-1" disabled={loadingRealms}>
                {loadingRealms && <option>Indexando reinos…</option>}
                {realms.slice(0, 60).map((r) => (
                  <option key={r.realmId} value={r.realmId}>{r.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={syncPrices}
              disabled={syncing || (!usingRest && !realmId)}
              className={`shrink-0 rounded px-3 py-[7px] font-display text-[11px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 ${
                syncing
                  ? "border border-gold-500/50 bg-gold-500/20 text-gold-200"
                  : "border border-mint-500/50 bg-mint-500/12 text-mint-300 hover:bg-mint-500/20"
              }`}
            >
              {syncing ? "SINCRONIZANDO…" : "SINCRONIZAR PRECIOS"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-2 rounded border border-dashed border-line-700 bg-ink-900/40 px-2.5 py-3 text-center font-mono text-[9.5px] text-fog-500">
          {bnetId ? "Busca un objeto para sincronizar su mercado real." : "Sin credenciales Battle.net no hay búsqueda por nombre; añade Client ID/Secret (gratis en develop.battle.net)."}
        </div>
      )}

      {hint && (
        <div className={`mb-2 rounded border px-2.5 py-1.5 font-mono text-[9.5px] leading-snug ${
          hint.level === "ok" ? "border-mint-500/35 bg-mint-500/8 text-mint-300"
          : hint.level === "err" ? "border-risk-500/40 bg-risk-500/8 text-risk-300"
          : "border-gold-500/35 bg-gold-500/8 text-gold-300"
        }`}>
          {hint.msg}
        </div>
      )}

      {/* bitácora */}
      <div ref={logRef} className="max-h-24 space-y-0.5 overflow-y-auto rounded border border-line-800 bg-ink-950/80 p-2 font-mono text-[9.5px]">
        {log.length === 0 && <div className="text-fog-600">$ bitácora de conexión — las peticiones aparecerán aquí</div>}
        {log.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-fog-600">{l.t}</span>
            <span className={l.level === "ok" ? "text-mint-400" : l.level === "err" ? "text-risk-400" : "text-gold-400"}>
              {l.level === "ok" ? "✓" : l.level === "err" ? "✗" : "!"}
            </span>
            <span className="text-fog-300">{l.msg}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-fog-600">
        <span>{plannedProvider().label}</span>
        {lastSync && <span className="text-mint-500">última sync {lastSync}</span>}
      </div>
    </section>
  );
}
