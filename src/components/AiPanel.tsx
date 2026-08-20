import { dynamicBaseline, type Features, type Regime, type TrainResult } from "../lib/ai";
import { Badge, FeatureBar, fmtNum, fmtShort, SectionTitle, Sparkline } from "./ui";

const REGIME_TONE: Record<Regime["color"], string> = {
  mint: "border-mint-500/40 bg-mint-500/8 text-mint-300",
  gold: "border-gold-500/40 bg-gold-500/8 text-gold-300",
  risk: "border-risk-500/45 bg-risk-500/8 text-risk-300",
  arc: "border-arc-500/40 bg-arc-500/8 text-arc-300",
};

interface Props {
  feats: Features;
  regime: Regime;
  train: TrainResult;
  training: boolean;
}

export default function AiPanel({ feats, regime, train, training }: Props) {
  const rec = train.recommended;
  const dyn = dynamicBaseline(feats, regime, train.gen);
  const maxMean = Math.max(...train.strategies.map((s) => s.mc.mean), 1);

  return (
    <div className="space-y-4">
      {/* régimen */}
      <section className={`rounded-[10px] border p-4 transition-colors duration-300 ${REGIME_TONE[regime.color]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] opacity-70">
              régimen de mercado detectado
            </div>
            <div className="font-display text-[24px] font-bold leading-tight">{regime.label}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[20px] font-bold leading-none">{(regime.confidence * 100).toFixed(0)}%</div>
            <div className="font-mono text-[9px] uppercase tracking-wider opacity-70">confianza</div>
          </div>
        </div>
        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-ink-950/50">
          <div key={regime.label} className="bar-grow h-full rounded-full bg-current opacity-70" style={{ width: `${regime.confidence * 100}%` }} />
        </div>
        <ul className="mt-2.5 space-y-1">
          {regime.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 font-mono text-[10px] leading-snug opacity-85">
              <span className="mt-[1px] shrink-0">▸</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* baseline dinámico */}
      <section className="panel p-4">
        <SectionTitle
          code="04b"
          title="Baseline dinámico"
          right={
            <span className="flex items-center gap-1.5">
              <Badge tone="gold">{dyn.version}</Badge>
              <Badge tone="arc">gen {dyn.gen}</Badge>
            </span>
          }
        />
        <p className="mb-2 font-mono text-[9.5px] leading-snug text-fog-500">
          El baseline equilibrado ya no es fijo: se <span className="text-fog-300">readapta al régimen</span> y su
          nombre de perfil <span className="text-fog-300">evoluciona</span> en cada generación (g{dyn.gen}).
        </p>
        {dyn.deltas.length === 0 ? (
          <div className="rounded border border-line-700 bg-ink-900/60 px-2.5 py-2 font-mono text-[10px] text-fog-400">
            sin derivas: el régimen actual mantiene los coeficientes estáticos.
          </div>
        ) : (
          <div className="space-y-1">
            {dyn.deltas.map((d) => (
              <div key={d.key} className="flex items-center justify-between rounded border border-line-700/70 bg-ink-800/40 px-2 py-1">
                <span className="font-mono text-[10px] text-fog-300">{d.key}</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-fog-500">{d.from}</span>
                  <span className="text-fog-600">→</span>
                  <span className="text-gold-300">{d.to}</span>
                  <span className={`rounded px-1 text-[9px] font-bold ${d.pct >= 0 ? "bg-mint-500/12 text-mint-400" : "bg-risk-500/12 text-risk-400"}`}>
                    {d.pct >= 0 ? "+" : ""}{d.pct}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* features */}
      <section className="panel p-4">
        <SectionTitle code="04" title="Features del mercado" right={<Badge tone="neutral">10 señales</Badge>} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <FeatureBar label="liquidez" value={feats.liquidity} tone="mint" />
          <FeatureBar label="demanda" value={feats.demand} tone="gold" />
          <FeatureBar label="volatilidad" value={feats.volatility} tone="risk" />
          <FeatureBar label="momento" value={feats.momentum} tone="arc" />
          <FeatureBar label="estabilidad" value={feats.stability} tone="mint" />
          <FeatureBar label="margen crafteo" value={feats.marginPct} tone="gold" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            { l: "inventario", v: `${fmtNum(feats.inventoryDays, 0)}d`, warn: feats.inventoryDays > 21 },
            { l: "div. región", v: `${fmtNum(feats.regionDiv * 100, 0)}%`, warn: feats.regionDiv > 0.6 },
            { l: "dump risk", v: `${fmtNum(feats.dumpRisk * 100, 0)}%`, warn: feats.dumpRisk > 0.5 },
            { l: "premium", v: `${fmtNum(feats.premiumGap * 100, 0)}%`, warn: false },
          ].map((c) => (
            <div key={c.l} className={`rounded border px-1.5 py-1 text-center ${c.warn ? "border-risk-500/40 bg-risk-500/8" : "border-line-700 bg-ink-800/50"}`}>
              <div className={`font-mono text-[12px] font-bold ${c.warn ? "text-risk-300" : "text-fog-200"}`}>{c.v}</div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">{c.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* optimización */}
      <section className="panel p-4">
        <SectionTitle
          code="05"
          title="Optimización de coeficientes"
          right={training ? <Badge tone="gold">iterando…</Badge> : <Badge tone="mint">convergido</Badge>}
        />
        {training && (
          <div className="mb-2 h-[3px] overflow-hidden rounded-full bg-ink-700">
            <div className="progress-sweep h-full bg-gradient-to-r from-gold-600 to-gold-300" />
          </div>
        )}
        <Sparkline data={train.history} tone="#f6b83d" />
        <div className="mt-2 grid grid-cols-4 gap-1.5 border-t border-line-800 pt-2.5">
          <div>
            <div className="font-mono text-[13px] font-bold text-fog-100">{train.iterations}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">iteraciones</div>
          </div>
          <div>
            <div className="font-mono text-[13px] font-bold text-mint-300">+{fmtNum(train.convergence, 1)}%</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">convergencia</div>
          </div>
          <div>
            <div className="font-mono text-[13px] font-bold text-fog-100">{train.seed}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">semilla</div>
          </div>
          <div>
            <div className="font-mono text-[13px] font-bold text-gold-300">{fmtNum(rec.objectiveScore, 0)}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-fog-600">score final</div>
          </div>
        </div>
        <div className="mt-2.5 rounded border border-line-700 bg-ink-900/60 px-2.5 py-2">
          <div className="mb-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-fog-500">
            coeficientes calibrados · adaptive quant
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-fog-300">
            {Object.entries(train.adaptive).map(([k, v]) => (
              <span key={k}>
                <span className="text-fog-500">{k.replace("Mult", "×").replace("Pct", "%")}:</span>{" "}
                <span className="text-gold-300">{v}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* comparación de estrategias */}
      <section className="panel p-4">
        <SectionTitle code="06" title="Monte Carlo · 14 días × 480 simulaciones" />
        <div className="space-y-2">
          {train.strategies.map((s) => {
            const isRec = s.id === rec.id;
            return (
              <div
                key={s.id + s.mc.mean}
                className={`rounded-md border px-2.5 py-2 transition-all ${
                  isRec
                    ? "border-gold-500/50 bg-gold-500/8 shadow-[0_0_20px_rgba(246,184,61,0.08)]"
                    : "border-line-700 bg-ink-800/40 hover:border-fog-600"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-[12.5px] font-semibold ${isRec ? "text-gold-300" : "text-fog-200"}`}>
                      {s.label}
                    </span>
                    <Badge tone={s.kind === "ia" ? "gold" : "neutral"}>{s.kind === "ia" ? "IA" : "base"}</Badge>
                    {isRec && <Badge tone="mint">recomendada</Badge>}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[12px] font-bold text-fog-100">{fmtShort(s.mc.mean)}</span>
                    <span className={`font-mono text-[9.5px] ${s.deltaPct >= 0 ? "text-mint-400" : "text-risk-400"}`}>
                      {s.deltaPct >= 0 ? "+" : ""}{fmtNum(s.deltaPct, 1)}%
                    </span>
                  </div>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-ink-950/70">
                  <div
                    className={`bar-grow h-full rounded-full ${isRec ? "bg-gradient-to-r from-gold-600 to-gold-300" : "bg-gradient-to-r from-ink-700 to-fog-600"}`}
                    style={{ width: `${Math.max(3, (s.mc.mean / maxMean) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 font-mono text-[8.5px] tracking-wide text-fog-600">
                  p10 {fmtShort(s.mc.p10)} · p90 {fmtShort(s.mc.p90)} · σ {fmtShort(s.mc.std)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-md border border-mint-500/30 bg-mint-500/6 px-3 py-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-mint-400">veredicto del modelo</div>
          <p className="mt-0.5 font-body text-[12px] leading-snug text-fog-200">
            <strong className="text-mint-300">{rec.label}</strong> maximiza el oro esperado ajustado por riesgo en el
            régimen <em>{regime.label}</em>
            {rec.id !== "balanced" && rec.deltaPct !== 0 && (
              <> — supera a Balanced en un <strong className="text-mint-300">{fmtNum(Math.abs(rec.deltaPct), 1)}%</strong> de media</>
            )}
            . Worst-case (p10): {fmtShort(rec.mc.p10)} en 14 días.
          </p>
        </div>
      </section>
    </div>
  );
}
