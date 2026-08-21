import React from "react";
import { fmtPrice, fmtBps } from "../lib/utils";
import type { LiquidityResponse } from "../api/controlPlane";

interface MarketHeroProps {
  symbol: string;
  data?: LiquidityResponse[];
  isStale?: boolean;
}

export function MarketHero({ symbol, data, isStale = false }: MarketHeroProps) {
  // Find best venue by spread
  const bestVenue = data?.reduce((best, curr) => 
    (!best || curr.spreadBps < best.spreadBps) ? curr : best
  , undefined);

  if (!bestVenue) {
    return (
      <div className="panel kpi-tile">
        <div className="section-header">
          <span className="section-title">MARKET OVERVIEW</span>
          <span className="badge-stale rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            NO DATA
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Kpi label="BEST BID" value="N/A" />
          <Kpi label="BEST ASK" value="N/A" />
          <Kpi label="MID" value="N/A" />
          <Kpi label="SPREAD" value="N/A" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel kpi-tile">
      <div className="section-header">
        <span className="section-title">
          MARKET OVERVIEW · <span className="text-gold-400">{symbol}</span>
        </span>
        {isStale ? (
          <span className="badge-stale rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            STALE
          </span>
        ) : (
          <span className="badge-live rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
            LIVE
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="BEST BID" value={fmtPrice(bestVenue.bestBid)} />
        <Kpi label="BEST ASK" value={fmtPrice(bestVenue.bestAsk)} />
        <Kpi label="MID" value={fmtPrice(bestVenue.mid)} />
        <Kpi label="SPREAD" value={fmtBps(bestVenue.spreadBps)} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line-800 pt-2">
        <div className="font-mono text-[9px] text-fog-500">
          BEST VENUE: <span className="text-fog-300">{venueDisplayName(bestVenue.venue)}</span>
        </div>
        <div className="font-mono text-[9px] text-fog-500">
          EXCHANGE TS: <span className="text-fog-300">{new Date(bestVenue.exchangeTimestamp).toISOString().slice(11, 23)}</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value num-display">{value}</div>
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
