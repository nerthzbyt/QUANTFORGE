import React from "react";
import { fmtPrice, fmtBps, fmtShortNumber, fmtTimestamp } from "../lib/utils";
import type { LiquidityResponse } from "../api/controlPlane";

interface LiquidityMatrixProps {
  data?: LiquidityResponse[];
}

export function LiquidityMatrix({ data = [] }: LiquidityMatrixProps) {
  if (!data || data.length === 0) {
    return (
      <div className="panel">
        <div className="section-header">
          <span className="section-title">LIQUIDITY MATRIX</span>
          <span className="badge-stale rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            NO DATA
          </span>
        </div>
        <div className="p-4 text-center font-mono text-[10px] text-fog-500">
          No liquidity data available
        </div>
      </div>
    );
  }

  // Sort by spread (best first)
  const sorted = [...data].sort((a, b) => a.spreadBps - b.spreadBps);
  const bestSpread = sorted[0]?.spreadBps ?? Infinity;

  return (
    <div className="panel overflow-hidden">
      <div className="section-header px-3">
        <span className="section-title">LIQUIDITY MATRIX / VENUES</span>
        <span className="font-mono text-[9px] text-fog-500">{data.length} venues</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Type</th>
              <th className="num">Bid</th>
              <th className="num">Ask</th>
              <th className="num">Mid</th>
              <th className="num">Spread</th>
              <th className="num">Bid Depth</th>
              <th className="num">Ask Depth</th>
              <th className="num">Top Bid</th>
              <th className="num">Top Ask</th>
              <th className="num">Levels</th>
              <th className="num">Score</th>
              <th className="num">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((venue, idx) => {
              const isBest = venue.spreadBps === bestSpread;
              return (
                <tr key={venue.venue} className={isBest ? "bg-mint-500/5" : ""}>
                  <td>
                    <div className="flex items-center gap-2">
                      {isBest && <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />}
                      <span className={isBest ? "text-mint-300" : "text-fog-300"}>
                        {venueDisplayName(venue.venue)}
                      </span>
                    </div>
                  </td>
                  <td className="mono">{venue.kind}</td>
                  <td className="num mono">{fmtPrice(venue.bestBid)}</td>
                  <td className="num mono">{fmtPrice(venue.bestAsk)}</td>
                  <td className="num mono">{fmtPrice(venue.mid)}</td>
                  <td className={`num mono ${isBest ? "text-mint-400" : ""}`}>{fmtBps(venue.spreadBps)}</td>
                  <td className="num mono">{fmtShortNumber(venue.bidDepthNotional)}</td>
                  <td className="num mono">{fmtShortNumber(venue.askDepthNotional)}</td>
                  <td className="num mono">{fmtShortNumber(venue.topBidNotional)}</td>
                  <td className="num mono">{fmtShortNumber(venue.topAskNotional)}</td>
                  <td className="num mono">{venue.levels?.length || "N/A"}</td>
                  <td className="num mono">{venue.score.toFixed(2)}</td>
                  <td className="num mono text-fog-500">{formatTs(venue.exchangeTimestamp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function venueDisplayName(venue: string): string {
  const map: Record<string, string> = {
    bybit_linear: "Bybit Linear",
    binance_usdm: "Binance USD-M",
    binance_spot: "Binance Spot",
    okx_spot: "OKX Spot",
    bybit_spot: "Bybit Spot",
  };
  return map[venue] || venue;
}

function formatTs(ts: number): string {
  return new Date(ts).toISOString().slice(11, 19);
}
