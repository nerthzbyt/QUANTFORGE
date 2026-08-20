import { FULL_SOURCES, GUARD_KEYS, SOURCE_GROUPS, shortName } from "../lib/engine";
import { Badge, fmtFull, fmtNum, fmtShort, SectionTitle } from "./ui";

function GuardBadge({ k, v }: { k: string; v: number }) {
  const ok = v >= 1;
  if (k.endsWith("premium_guard")) return ok ? <Badge tone="gold">prima</Badge> : <Badge tone="neutral">—</Badge>;
  if (k.endsWith("dump_guard")) return ok ? <Badge tone="risk">dump</Badge> : <Badge tone="neutral">ok</Badge>;
  if (k.endsWith("quality_gate")) return ok ? <Badge tone="mint">pasa</Badge> : <Badge tone="risk">bloquea</Badge>;
  return ok ? <Badge tone="mint">pass</Badge> : <Badge tone="risk">fail</Badge>;
}

export default function EnginePanel({ values }: { values: Record<string, number> }) {
  const fair = values["tsm_exchange_pack_fair_smooth"] || 0;
  const gate = values["tsm_exchange_pack_quality_gate"] ?? 0;
  const passGuards = [...GUARD_KEYS].filter(
    (k) => !k.endsWith("premium_guard") && !k.endsWith("dump_guard"),
  );
  const activeGuards = passGuards.filter((k) => (values[k] ?? 0) >= 1).length;

  return (
    <section className="panel p-4 anim-fade-up" style={{ animationDelay: "45ms" }}>
      <SectionTitle
        code="03"
        title="Motor matemático"
        right={<Badge tone="arc">{Object.keys(values).length} fuentes en vivo</Badge>}
      />

      <div
        className={`mb-4 flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
          gate >= 1 ? "border-mint-500/35 bg-mint-500/8" : "border-risk-500/40 bg-risk-500/8"
        }`}
      >
        <div>
          <div className="font-display text-[13px] font-semibold text-fog-100">
            Quality Gate v2
          </div>
          <div className="font-mono text-[9.5px] tracking-wide text-fog-500">
            volatilidad ∧ región ∧ inventario — {activeGuards}/{passGuards.length} guardas en verde
          </div>
        </div>
        <GuardBadge k="quality_gate" v={gate} />
      </div>

      <div className="max-h-[calc(100vh-280px)] space-y-4 overflow-y-auto pr-1">
        {SOURCE_GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-px flex-1 bg-line-800" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">
                {g.label}
              </span>
              <span className="h-px flex-1 bg-line-800" />
            </div>
            {g.keys.map((k) => {
              const v = values[k] ?? 0;
              const isRatio = g.ratio?.includes(k);
              const isMomentum = k.endsWith("_momentum");
              const isDays = k.endsWith("_inventory_days");
              const isGuard = !!g.guard && GUARD_KEYS.has(k) && !isRatio && !isDays;
              const isIndex = !!g.index;
              const showDelta =
                !g.guard && !g.index && fair > 0 && v > 0 &&
                !k.endsWith("fair_smooth") && !k.endsWith("anchor") && !k.endsWith("_fair");
              const delta = showDelta ? (v / fair - 1) * 100 : 0;

              return (
                <div
                  key={k}
                  className="group cursor-default rounded px-1.5 py-[3px] transition-colors hover:bg-ink-750/80"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-mono text-[10.5px] text-fog-300 group-hover:text-fog-100">
                        {shortName(k)}
                      </span>
                      {isGuard && <GuardBadge k={k} v={v} />}
                      {isMomentum && (
                        v > 0 ? <Badge tone="mint">alcista</Badge> : v < 0 ? <Badge tone="risk">bajista</Badge> : <Badge tone="neutral">neutro</Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1.5">
                      {showDelta && (
                        <span className={`font-mono text-[9px] ${delta >= 0 ? "text-mint-500" : "text-risk-400"}`}>
                          {delta >= 0 ? "+" : ""}{fmtNum(delta, 0)}%
                        </span>
                      )}
                      <span className="font-mono text-[11px] font-medium text-gold-300">
                        {isRatio
                          ? `${fmtNum(v * 100, 1)}%`
                          : isMomentum || isGuard
                            ? v.toFixed(0)
                            : isDays
                              ? `${fmtNum(v, 0)}d`
                              : isIndex
                                ? `${fmtNum(v, 0)}pts`
                                : fmtShort(v)}
                      </span>
                    </div>
                  </div>
                  {!isGuard && showDelta && (
                    <div className="hidden font-mono text-[9px] text-fog-600 group-hover:block">
                      {fmtFull(v)}
                    </div>
                  )}
                  <div className="hidden truncate font-mono text-[9px] text-fog-600 group-hover:block" title={FULL_SOURCES[k]}>
                    = {FULL_SOURCES[k]}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
