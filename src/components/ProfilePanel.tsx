import { useMemo, useState } from "react";
import type { Features, Regime, TrainResult } from "../lib/ai";
import { buildPack, buildProfile, STRATEGIES } from "../lib/profiles";
import { Badge, JsonView, SectionTitle, useCopy } from "./ui";

interface Props {
  env: Record<string, number>;
  src: Record<string, number>;
  feats: Features;
  regime: Regime;
  train: TrainResult;
  item: string;
}

export default function ProfilePanel({ env, src, feats, regime, train, item }: Props) {
  const [selected, setSelected] = useState("adaptive_quant");
  const [view, setView] = useState<"perfil" | "fuentes">("perfil");
  const { copied, copy } = useCopy();

  const generatedAt = useMemo(() => new Date().toISOString(), [env, train]);

  const ctx = useMemo(
    () => ({ env, src, feats, regime, train, item, generatedAt }),
    [env, src, feats, regime, train, item, generatedAt],
  );

  const profile = useMemo(
    () => buildProfile(selected, ctx) as Record<string, any>,
    [selected, ctx],
  );
  const pack = useMemo(() => buildPack(ctx), [ctx]);

  const def = STRATEGIES.find((s) => s.id === selected)!;
  const sources = profile.meta.custom_sources as Record<string, string>;
  const sectionKeys = ["auctioning", "shopping", "sniping", "crafting", "vendor"].reduce(
    (acc, s) => acc + Object.keys((profile as any)[s] ?? {}).length,
    0,
  );
  const profileJson = useMemo(() => JSON.stringify(profile, null, 2), [profile]);
  const packJson = useMemo(() => JSON.stringify(pack, null, 2), [pack]);
  const kb = (profileJson.length / 1024).toFixed(1);
  const isRec = train.recommended.id === selected;

  const download = () => {
    const blob = new Blob([packJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantforge_tsm_pack.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel p-4 anim-fade-up" style={{ animationDelay: "90ms" }}>
      <SectionTitle
        code="07"
        title="Perfiles TSM completos"
        right={isRec ? <Badge tone="mint">óptimo según ML</Badge> : <Badge tone="neutral">{def.kind === "ia" ? "IA" : "baseline"}</Badge>}
      />

      {/* selector de estrategia */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STRATEGIES.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`rounded border px-2.5 py-1.5 font-display text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.97] ${
                active
                  ? "border-gold-500/60 bg-gold-500/14 text-gold-300 shadow-[0_0_0_3px_rgba(246,184,61,0.07)]"
                  : "border-line-700 bg-ink-800/50 text-fog-400 hover:border-fog-600 hover:text-fog-200"
              }`}
            >
              {s.label}
              {s.kind === "ia" && <span className={`ml-1 text-[8.5px] ${active ? "text-gold-500" : "text-fog-600"}`}>IA</span>}
            </button>
          );
        })}
      </div>

      <p className="mb-3 font-mono text-[10px] leading-snug text-fog-500">
        <span className="text-fog-300">{def.label}</span> — {def.desc}.{" "}
        {def.kind === "ia"
          ? "Incluye 26 fuentes baseline + 14 filtros exactos v2 + 10 fuentes calibradas por el optimizador."
          : "Estructura heredada del baseline, idéntica a tu pack original."}
      </p>

      {/* métricas del perfil */}
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {[
          { v: String(Object.keys(sources).length), l: "fuentes custom" },
          { v: String(sectionKeys), l: "parámetros" },
          { v: `${kb} KB`, l: "tamaño json" },
          { v: "5", l: "secciones" },
        ].map((c) => (
          <div key={c.l} className="rounded border border-line-700 bg-ink-800/50 px-1.5 py-1.5 text-center">
            <div className="font-mono text-[14px] font-bold text-gold-300">{c.v}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">{c.l}</div>
          </div>
        ))}
      </div>

      {/* toggle de vista */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex rounded border border-line-700 bg-ink-900/70 p-0.5">
          {(["perfil", "fuentes"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                view === v ? "bg-ink-700 text-gold-300" : "text-fog-500 hover:text-fog-300"
              }`}
            >
              {v === "perfil" ? "perfil completo" : "solo fuentes"}
            </button>
          ))}
        </div>
        <span className="font-mono text-[9px] text-fog-600">{profile.name}</span>
      </div>

      {/* visor JSON */}
      <div className="mb-3 max-h-[420px] overflow-auto rounded-md border border-line-800 bg-ink-950/90 p-3">
        <JsonView text={view === "perfil" ? profileJson : JSON.stringify(sources, null, 2)} />
      </div>

      {/* acciones */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => copy("perfil", profileJson)}
          className="rounded-md border border-gold-500/50 bg-gold-500/12 px-2 py-2 font-display text-[11px] font-semibold text-gold-300 transition-all hover:bg-gold-500/20 hover:shadow-[0_0_18px_rgba(246,184,61,0.15)] active:scale-[0.97]"
        >
          {copied === "perfil" ? "✓ COPIADO" : "COPIAR PERFIL"}
        </button>
        <button
          onClick={() => copy("fuentes", JSON.stringify(sources, null, 2))}
          className="rounded-md border border-arc-500/45 bg-arc-500/10 px-2 py-2 font-display text-[11px] font-semibold text-arc-300 transition-all hover:bg-arc-500/18 active:scale-[0.97]"
        >
          {copied === "fuentes" ? "✓ COPIADO" : "COPIAR FUENTES"}
        </button>
        <button
          onClick={download}
          className="rounded-md border border-mint-500/45 bg-mint-500/10 px-2 py-2 font-display text-[11px] font-semibold text-mint-300 transition-all hover:bg-mint-500/18 active:scale-[0.97]"
        >
          DESCARGAR PACK
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[9px] text-fog-600">
        el pack incluye los 5 perfiles + snapshot de mercado + bloque meta.ai · {generatedAt.slice(0, 19).replace("T", " ")} UTC
      </p>
    </section>
  );
}
