import { useEffect, useMemo, useRef, useState } from "react";
import { evaluateAll, FULL_SOURCES, shortName } from "./lib/engine";
import { classifyRegime, extractFeatures, trainModel } from "./lib/ai";
import { PRESETS } from "./lib/profiles";
import type { PricePayload } from "./lib/tsmApi";
import { Badge, fmtFull, fmtShort } from "./components/ui";
import InputsPanel from "./components/InputsPanel";
import EnginePanel from "./components/EnginePanel";
import AiPanel from "./components/AiPanel";
import ProfilePanel from "./components/ProfilePanel";
import ApiPanel, { type LiveMeta } from "./components/ApiPanel";
import DocsView from "./views/DocsView";
import GithubView from "./views/GithubView";

type View = "consola" | "docs" | "github";

function Sigil() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="8" y="8" width="24" height="24" rx="3" transform="rotate(45 20 20)" stroke="#f6b83d" strokeWidth="1.6" />
      <rect x="13" y="17" width="3" height="9" rx="1" fill="#27c795" />
      <rect x="18.5" y="12" width="3" height="14" rx="1" fill="#f6b83d" />
      <rect x="24" y="15" width="3" height="11" rx="1" fill="#6fb3ff" />
      <circle cx="20" cy="20" r="1.4" fill="#eaeff7" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState<View>("consola");
  const [origin, setOrigin] = useState<"demo" | "live">("demo");
  const [liveMeta, setLiveMeta] = useState<LiveMeta | null>(null);
  const [presetId, setPresetId] = useState("potion");
  const [env, setEnv] = useState<Record<string, number>>({ ...PRESETS[0].data });
  const [itemName, setItemName] = useState("Poción de flujo temporal");
  const [seed, setSeed] = useState(20260728);
  const [iterations, setIterations] = useState(240);
  const [aversion, setAversion] = useState(0.35);
  const [trainNonce, setTrainNonce] = useState(0);
  const [gen, setGen] = useState(1);
  const [training, setTraining] = useState(false);
  const [tab, setTab] = useState<"ia" | "perfil">("ia");

  const srcValues = useMemo(() => evaluateAll(env, FULL_SOURCES), [env]);
  const feats = useMemo(() => extractFeatures(env, srcValues), [env, srcValues]);
  const regime = useMemo(() => classifyRegime(feats), [feats]);
  const train = useMemo(
    () => trainModel(env, srcValues, feats, { seed, iterations, aversion, gen }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [env, seed, iterations, aversion, trainNonce, gen],
  );

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setTraining(true);
    const t = window.setTimeout(() => setTraining(false), 820);
    return () => window.clearTimeout(t);
  }, [env, seed, iterations, aversion, trainNonce]);

  const setField = (k: string, v: number) => {
    setEnv((prev) => ({ ...prev, [k]: v }));
    setPresetId("custom");
    setOrigin("demo");
  };

  const applyPreset = (id: string) => {
    const pr = PRESETS.find((x) => x.id === id);
    if (!pr) return;
    setEnv({ ...pr.data });
    setPresetId(id);
    setItemName(pr.label);
    setOrigin("demo");
    setLiveMeta(null);
  };

  const onApplyLive = (payload: PricePayload, meta: LiveMeta) => {
    setEnv((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(payload)) {
        if (typeof v === "number") next[k] = v;
      }
      return next;
    });
    setPresetId("custom");
    setOrigin("live");
    setItemName(meta.itemName);
    setLiveMeta(meta);
  };

  const fair = srcValues["tsm_exchange_pack_fair_smooth"] ?? 0;
  const sane = srcValues["tsm_exchange_pack_sane_price"] ?? 0;
  const gate = srcValues["tsm_exchange_pack_quality_gate"] ?? 0;
  const rec = train.recommended;

  const tickerItems = useMemo(
    () => Object.keys(FULL_SOURCES).map((k) => ({ k: shortName(k), v: srcValues[k] ?? 0 })),
    [srcValues],
  );

  return (
    <div className="relative min-h-screen">
      <div className="orb pointer-events-none fixed -left-32 -top-32 -z-0 h-96 w-96 rounded-full bg-mint-500/6 blur-3xl" />
      <div className="orb pointer-events-none fixed -right-40 top-44 -z-0 h-[30rem] w-[30rem] rounded-full bg-gold-500/5 blur-3xl" style={{ animationDelay: "-8s" }} />

      {/* ---------- cabecera ---------- */}
      <header className="sticky top-0 z-40 border-b border-line-800 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1660px] items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Sigil />
            <div>
              <div className="font-display text-[17px] font-bold leading-none tracking-tight">
                QUANTFORGE<span className="text-gold-500">·</span>TSM
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-fog-500">
                motor matemático + IA · perfiles TradeSkillMaster
              </div>
            </div>
          </div>

          <nav className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-line-800 bg-ink-900/70 p-1">
            {(
              [
                { id: "consola", label: "Consola" },
                { id: "docs", label: "Documentación" },
                { id: "github", label: "GitHub" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => { setView(v.id); window.scrollTo({ top: 0 }); }}
                className={`rounded px-2.5 py-1 font-display text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.96] ${
                  view === v.id
                    ? "bg-gold-500/14 text-gold-300 shadow-[0_0_0_1px_rgba(246,184,61,0.35)]"
                    : "text-fog-500 hover:text-fog-200"
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-line-800 bg-ink-900/70 px-3 py-1.5 lg:flex">
            <span className="font-mono text-[10px] text-mint-400">$</span>
            <span className="truncate font-mono text-[10px] text-fog-400">
              quantforge --item <span className="text-gold-300">"{itemName || "—"}"</span> --engine tsm-expr/3
              --ml quantforge-ml@2.4 --origen <span className="text-mint-300">{origin}</span> --generar{" "}
              <span className="text-gold-300">6-perfiles</span>
            </span>
            <span className="caret font-mono text-[10px] text-gold-400">▊</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {origin === "live" && liveMeta ? (
              <span
                className="hidden items-center gap-1.5 rounded border border-mint-500/40 bg-mint-500/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-mint-300 md:flex"
                title={`${liveMeta.itemName} · #${liveMeta.itemId} · ${liveMeta.provider}`}
              >
                <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-mint-400" />
                API · {liveMeta.region.toUpperCase()} · #{liveMeta.itemId}
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 rounded border border-line-700 bg-ink-800/70 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-fog-500 md:flex">
                <span className="h-[6px] w-[6px] rounded-full bg-fog-600" />
                modo demo
              </span>
            )}
            <Badge tone={regime.color}>{regime.label}</Badge>
            <span className="flex items-center gap-1.5 rounded border border-mint-500/35 bg-mint-500/8 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.14em] text-mint-300">
              <span className="pulse-dot h-[7px] w-[7px] rounded-full bg-mint-400" />
              núcleo activo
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1660px] px-4 pb-10 pt-4">
        {view === "docs" && <DocsView />}
        {view === "github" && <GithubView />}

        {view === "consola" && (
        <>
        {/* ---------- KPIs ---------- */}
        <div className="panel mb-4 grid grid-cols-2 divide-x divide-line-800 overflow-hidden lg:grid-cols-4 anim-fade-up">
          <div className="px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">ancla fair_smooth</div>
            <div className="mt-1 font-display text-[22px] font-bold leading-none text-gold-300">{fmtFull(fair)}</div>
            <div className="mt-1 font-mono text-[9px] text-fog-600">media multi-fuente suavizada</div>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">precio sano</div>
            <div className="mt-1 font-display text-[22px] font-bold leading-none text-fog-100">{fmtFull(sane)}</div>
            <div className="mt-1 font-mono text-[9px] text-fog-600">acotado por piso duro y techo ×2.5</div>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">quality gate v2</div>
            <div className={`mt-1 font-display text-[22px] font-bold leading-none ${gate >= 1 ? "text-mint-400" : "text-risk-400"}`}>
              {gate >= 1 ? "PASA" : "BLOQUEA"}
            </div>
            <div className="mt-1 font-mono text-[9px] text-fog-600">
              {gate >= 1 ? "filtros exactos en verde · precios fiables" : "revisa volatilidad / región / inventario"}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">E[oro 14d] · recomendada</div>
            <div className="mt-1 font-display text-[22px] font-bold leading-none text-gold-400">{fmtShort(rec.mc.mean)}</div>
            <div className="mt-1 font-mono text-[9px] text-fog-600">{rec.label} · monte-carlo p10 {fmtShort(rec.mc.p10)}</div>
          </div>
        </div>

        {/* ---------- espacio de trabajo ---------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-3">
            <ApiPanel onApply={onApplyLive} />
            <InputsPanel
              env={env}
              setField={setField}
              presetId={presetId}
              applyPreset={applyPreset}
              origin={origin}
              itemName={itemName}
              setItemName={setItemName}
              seed={seed}
              setSeed={setSeed}
              iterations={iterations}
              setIterations={setIterations}
              aversion={aversion}
              setAversion={setAversion}
              onRetrain={() => {
                setTrainNonce((n) => n + 1);
                setGen((g) => g + 1);
              }}
              training={training}
            />
          </div>

          <div className="xl:col-span-4">
            <EnginePanel values={srcValues} />
          </div>

          <div className="xl:col-span-5">
            <div className="mb-3 flex rounded-md border border-line-700 bg-ink-900/70 p-1 anim-fade-up" style={{ animationDelay: "60ms" }}>
              {(
                [
                  { id: "ia", code: "04", label: "Núcleo IA" },
                  { id: "perfil", code: "05", label: "Perfiles & Export" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded px-3 py-2 text-left transition-all duration-150 ${
                    tab === t.id
                      ? "bg-ink-700/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                      : "hover:bg-ink-800/60"
                  }`}
                >
                  <span className={`font-mono text-[9px] tracking-[0.18em] ${tab === t.id ? "text-gold-500" : "text-fog-600"}`}>
                    {t.code}
                  </span>
                  <span className={`block font-display text-[13px] font-semibold ${tab === t.id ? "text-fog-100" : "text-fog-500"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            {tab === "ia" ? (
              <AiPanel feats={feats} regime={regime} train={train} training={training} />
            ) : (
              <ProfilePanel env={env} src={srcValues} feats={feats} regime={regime} train={train} item={itemName} />
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* ---------- ticker de fuentes ---------- */}
      <footer className="relative z-10 overflow-hidden border-t border-line-800 bg-ink-950/90 py-2">
        <div className="marquee flex w-max">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {tickerItems.map((t) => (
                <span key={`${dup}-${t.k}`} className="mx-3 flex items-center gap-1.5 font-mono text-[9.5px] text-fog-500">
                  <span className="text-fog-600">◆</span>
                  {t.k}
                  <span className="text-gold-500/80">{fmtShort(t.v)}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
