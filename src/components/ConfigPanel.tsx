import React from "react";
import type { ConfigResponse } from "../api/controlPlane";

interface ConfigPanelProps {
  config?: ConfigResponse;
}

export function ConfigPanel({ config }: ConfigPanelProps) {
  if (!config) {
    return (
      <div className="panel">
        <div className="section-header px-3">
          <span className="section-title">ACTIVE CONFIG</span>
          <span className="badge-stale rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            UNAVAILABLE
          </span>
        </div>
        <div className="p-4 text-center font-mono text-[10px] text-fog-500">
          Configuration data not available
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="section-header px-3">
        <span className="section-title">
          ACTIVE CONFIG · <span className="text-gold-400">VERSION {config.version}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3">
        {/* Strategy */}
        <div className="card-minimal">
          <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-mint-400">
            STRATEGY
          </div>
          <ConfigRow label="Name" value={config.strategy.name} />
          <ConfigRow label="Model URI" value={config.strategy.model_uri} mono />
          <ConfigRow label="Aggressiveness" value={config.strategy.aggressiveness.toFixed(2)} />
          <ConfigRow label="Min Spread" value={`${config.strategy.min_spread_bps} bps`} />
          <ConfigRow label="Max Position" value={config.strategy.max_position} />
          <ConfigRow label="Order Qty" value={config.strategy.order_qty} />
          <ConfigRow label="Inv Skew" value={config.strategy.inventory_skew.toFixed(2)} />
        </div>

        {/* Risk */}
        <div className="card-minimal">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-risk-400">
              RISK
            </span>
            {config.risk.kill_switch ? (
              <span className="rounded bg-risk-500/20 px-1.5 py-[2px] font-mono text-[8px] uppercase tracking-[0.1em] text-risk-300">
                KILL SWITCH ACTIVE
              </span>
            ) : (
              <span className="rounded bg-mint-500/20 px-1.5 py-[2px] font-mono text-[8px] uppercase tracking-[0.1em] text-mint-300">
                NORMAL
              </span>
            )}
          </div>
          <ConfigRow label="Max Notional" value={formatNotional(config.risk.max_notional)} />
          <ConfigRow label="Max Order Qty" value={config.risk.max_order_qty} />
          <ConfigRow 
            label="Whitelist" 
            value={config.risk.symbol_whitelist.join(", ")} 
            mono 
          />
          <ConfigRow 
            label="Price Bands" 
            value={`${config.risk.price_bands.lower_bps} / ${config.risk.price_bands.upper_bps} bps`} 
          />
        </div>

        {/* Rollout */}
        <div className="card-minimal">
          <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-400">
            ROLLOUT
          </div>
          <ConfigRow label="Created By" value={config.rollout.created_by} mono />
          <ConfigRow label="Approved By" value={config.rollout.approved_by} mono />
          <ConfigRow 
            label="Canary %" 
            value={`${config.rollout.canary_pct}%`} 
            tone={config.rollout.canary_pct > 0 ? "gold" : "neutral"}
          />
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ 
  label, 
  value, 
  mono = false,
  tone = "neutral"
}: { 
  label: string; 
  value: string | number; 
  mono?: boolean;
  tone?: "neutral" | "gold" | "mint" | "risk";
}) {
  const toneClass = tone === "gold" ? "text-gold-300" : tone === "mint" ? "text-mint-300" : tone === "risk" ? "text-risk-300" : "text-fog-300";
  
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-fog-600">{label}</span>
      <span className={`num-display font-mono text-[10.5px] ${mono ? "" : toneClass}`}>{value}</span>
    </div>
  );
}

function formatNotional(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toString();
}
