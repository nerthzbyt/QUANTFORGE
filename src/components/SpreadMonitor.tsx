import React from "react";
import { fmtBps } from "../lib/utils";
import type { LiquidityResponse } from "../api/controlPlane";

interface SpreadMonitorProps {
  data?: LiquidityResponse;
}

export function SpreadMonitor({ data }: SpreadMonitorProps) {
  const candidates = data?.candidates || [];

  if (!candidates || candidates.length === 0) {
    return (
      <div className="panel">
        <div className="section-header px-3">
          <span className="section-title">SPREAD MONITOR</span>
          <span className="badge-stale rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            NO DATA
          </span>
        </div>
        <div className="p-4 text-center font-mono text-[10px] text-fog-500">
          No spread data available
        </div>
      </div>
    );
  }

  const sorted = [...candidates].sort((a, b) => a.spreadBps - b.spreadBps);
  const bestSpread = sorted[0]?.spreadBps ?? 0;
  const worstSpread = sorted[sorted.length - 1]?.spreadBps ?? 0;
  const avgSpread = sorted.reduce((sum, v) => sum + v.spreadBps, 0) / sorted.length;

  return (
    <div className="panel">
      <div className="section-header px-3">
        <span className="section-title">SPREAD MONITOR</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-line-800 px-3 pb-3">
        <Stat label="TIGHTEST" value={fmtBps(bestSpread)} tone="mint" />
        <Stat label="AVERAGE" value={fmtBps(avgSpread)} tone="neutral" />
        <Stat label="WIDEST" value={fmtBps(worstSpread)} tone="risk" />
      </div>

      {/* Venue list */}
      <div className="max-h-48 overflow-y-auto p-2">
        {sorted.map((venue, idx) => {
          const isBest = venue.spreadBps === bestSpread;
          const isWide = venue.spreadBps > avgSpread * 1.5;
          
          return (
            <div
              key={venue.venue}
              className={`mb-1 flex items-center justify-between rounded px-2 py-1.5 ${
                isBest ? "bg-mint-500/10" : isWide ? "bg-risk-500/5" : "bg-ink-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isBest && <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />}
                <span className={`font-mono text-[10px] ${isBest ? "text-mint-300" : "text-fog-400"}`}>
                  {venueShortName(venue.venue)}
                </span>
              </div>
              <span className={`num-display font-mono text-[11px] ${
                isBest ? "text-mint-400" : isWide ? "text-risk-400" : "text-fog-300"
              }`}>
                {fmtBps(venue.spreadBps)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "mint" | "risk" | "neutral" }) {
  const colorClass = tone === "mint" ? "text-mint-400" : tone === "risk" ? "text-risk-400" : "text-fog-300";
  
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-fog-600">{label}</div>
      <div className={`num-display font-mono text-[13px] font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}

function venueShortName(venue: string): string {
  const map: Record<string, string> = {
    bybit_linear: "Bybit Lin",
    binance_usdm: "Binance UM",
    binance_spot: "Binance Sp",
    okx_spot: "OKX Spot",
    bybit_spot: "Bybit Spot",
  };
  return map[venue] || venue;
}
