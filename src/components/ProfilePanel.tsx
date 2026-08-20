import { useMemo, useState } from "react";
import { dynamicBaseline, type Features, type Regime, type TrainResult } from "../lib/ai";
import { buildPack, buildProfile, STRATEGIES } from "../lib/profiles";
import { validateFormula, validateProfile } from "../lib/validate";
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
  const [selected, setSelected] = useState("evo_balanced");
  const [view, setView] = useState<"perfil" | "fuentes" | "multi">("perfil");
  const { copied, copy } = useCopy();

  const generatedAt = useMemo(() => new Date().toISOString(), [env, train]);
  const dyn = useMemo(() => dynamicBaseline(feats, regime, train.gen), [feats, regime, train.gen]);

  const ctx = useMemo(
    () => ({ env, src, feats, regime, train, dyn, item, generatedAt }),
    [env, src, feats, regime, train, dyn, item, generatedAt],
  );

  const profile = useMemo(
    () => buildProfile(selected, ctx) as Record<string, any>,
    [selected, ctx],
  );
  const pack = useMemo(() => buildPack(ctx), [ctx]);
  const report = useMemo(() => validateProfile(profile), [profile]);

  const def = STRATEGIES.find((s) => s.id === selected)!;
  const sources = profile.meta.custom_sources as Record<string, string>;
  const multi = (profile.meta.multi_formula ?? null) as Record<string, string[]> | null;
  const customNames = useMemo(() => new Set(Object.keys(sources)), [sources]);
  const sectionKeys = ["auctioning", "shopping", "sniping", "crafting", "vendor"].reduce(
    (acc, s) => acc + Object.keys((profile as any)[s] ?? {}).length,
    0,
  );
  const profileJson = useMemo(() => JSON.stringify(profile, null, 2), [profile]);
  const packJson = useMemo(() => JSON.stringify(pack, null, 2), [pack]);
  const kb = (profileJson.length / 1024).toFixed(1);
  const isRec = train.recommended.id === selected;
  const lineageNames = (profile.meta.lineage ?? []) as string[];

  const download = () => {
    const blob = new Blob([packJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantforge_tsm_pack_g${train.gen}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel p-4 anim-fade-up" style={{ animationDelay: "90ms" }}>
      <SectionTitle
        code="07"
        title="Perfiles TSM evolutivos"
        right={isRec ? <Badge tone="mint">óptimo según ML</Badge> : <Badge tone="neutral">{def.kind === "ia" ? "IA" : "baseline"}</Badge>}
      />

      {/* nombre evolutivo + validación */}
      <div className="mb-3 rounded-md border border-line-700 bg-ink-900/70 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-fog-600">nombre de perfil · generación {train.gen}</div>
            <div className="truncate font-display text-[15px] font-bold text-gold-300">{profile.name}</div>
          </div>
          <Badge tone={report.ok ? "mint" : "risk"}>
            {report.ok ? `${report.formulas} fórmulas · 0 errores` : `${report.errors.length} errores`}
          </Badge>
        </div>
        {lineageNames.length > 1 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[8.5px] uppercase tracking-wider text-fog-600">genealogía</span>
            {lineageNames.map((n, i) => (
              <span
                key={n}
                className={`rounded border px-1.5 py-[1px] font-mono text-[9px] ${
                  i === 0 ? "border-gold-500/50 bg-gold-500/10 text-gold-300" : "border-line-700 text-fog-500"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        )}
        {!report.ok && (
          <div className="mt-2 max-h-24 space-y-1 overflow-y-auto rounded border border-risk-500/40 bg-risk-500/8 p-2">
            {report.errors.slice(0, 6).map((e, i) => (
              <div key={i} className="font-mono text-[9.5px] text-risk-300">
                <span className="text-risk-400">✕</span> {e.source}: {e.msg}
              </div>
            ))}
          </div>
        )}
      </div>

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
          ? "Incluye baseline + filtros v2 + fuentes calibradas + variantes multi-fórmula, todas validadas contra el vocabulario TSM."
          : "Estructura heredada del baseline, idéntica a tu pack original."}
      </p>

      {/* métricas */}
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {[
          { v: String(report.formulas), l: "fórmulas TSM" },
          { v: String(Object.keys(sources).length), l: "fuentes custom" },
          { v: String(sectionKeys), l: "parámetros" },
          { v: `${kb} KB`, l: "tamaño json" },
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
          {(
            [
              { id: "perfil", l: "perfil" },
              { id: "fuentes", l: "fuentes" },
              { id: "multi", l: "multi-fórmula" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              disabled={v.id === "multi" && !multi}
              className={`rounded px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors disabled:opacity-30 ${
                view === v.id ? "bg-ink-700 text-gold-300" : "text-fog-500 hover:text-fog-300"
              }`}
            >
              {v.l}
            </button>
          ))}
        </div>
        <span className="truncate font-mono text-[9px] text-fog-600">{profile.name}</span>
      </div>

      {/* contenido de vista */}
      {view === "multi" && multi ? (
        <div className="mb-3 max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-line-800 bg-ink-950/90 p-3">
          {Object.entries(multi).map(([point, names]) => (
            <div key={point}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-500">{point}</span>
                <span className="h-px flex-1 bg-line-800" />
              </div>
              {names.map((nm) => {
                const expr = sources[nm] ?? "";
                const issues = validateFormula(expr, customNames);
                return (
                  <div key={nm} className="mb-1.5 rounded border border-line-700/70 bg-ink-800/40 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[10.5px] text-fog-200">{nm}</span>
                      <span className={`font-mono text-[9px] ${issues.length ? "text-risk-400" : "text-mint-400"}`}>
                        {issues.length ? "✕ inválida" : "✓ válida"}
                      </span>
                    </div>
                    <div className="mt-0.5 break-all font-mono text-[9px] leading-snug text-fog-500">{expr}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 max-h-[420px] overflow-auto rounded-md border border-line-800 bg-ink-950/90 p-3">
          <JsonView text={view === "perfil" ? profileJson : JSON.stringify(sources, null, 2)} />
        </div>
      )}

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
        pack g{train.gen} · {STRATEGIES.length} perfiles · baseline dinámico {dyn.version} · {generatedAt.slice(0, 19).replace("T", " ")} UTC
      </p>
    </section>
  );
}
