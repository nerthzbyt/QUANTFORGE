import React, { useState } from "react";
import { useHealth, useConfig, useLiquidity, useEvents } from "../hooks/useControlPlane";
import { Header } from "../components/Header";
import { SymbolSelector } from "../components/SymbolSelector";
import { MarketHero } from "../components/MarketHero";
import { LiquidityMatrix } from "../components/LiquidityMatrix";
import { SpreadMonitor } from "../components/SpreadMonitor";
import { ConfigPanel } from "../components/ConfigPanel";
import { EventStream } from "../components/EventStream";
import { DepthVisualization } from "../components/DepthVisualization";

export function DashboardView() {
  const [symbol, setSymbol] = useState("BTCUSD");

  // Fetch data from Control Plane
  const healthQuery = useHealth(3000);
  const configQuery = useConfig(10000);
  const liquidityQuery = useLiquidity(symbol, 2000);
  const eventsQuery = useEvents(5000);

  // Determine control plane status
  const controlPlaneStatus: "online" | "degraded" | "offline" | "unknown" = 
    healthQuery.isSuccess ? "online" :
    healthQuery.isError ? "offline" :
    "unknown";

  // Get best venue for depth visualization
  const bestVenue = liquidityQuery.data?.reduce((best, curr) => 
    (!best || curr.spreadBps < best.spreadBps) ? curr : best
  , undefined);

  return (
    <>
      <Header controlPlaneStatus={controlPlaneStatus} />

      <main className="relative z-10 mx-auto max-w-[1800px] px-4 pb-8 pt-4">
        {/* Top row: Symbol selector and key info */}
        <div className="mb-4 flex items-center justify-between">
          <SymbolSelector value={symbol} onChange={setSymbol} />
          
          <div className="flex items-center gap-3">
            {healthQuery.isError && (
              <span className="rounded border border-risk-500/40 bg-risk-500/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-risk-300">
                CONTROL PLANE OFFLINE
              </span>
            )}
            {liquidityQuery.isStale && (
              <span className="badge-stale rounded px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em]">
                STALE DATA
              </span>
            )}
          </div>
        </div>

        {/* Market Hero */}
        <div className="mb-4 anim-fade-up">
          <MarketHero 
            symbol={symbol} 
            data={liquidityQuery.data} 
            isStale={liquidityQuery.isStale} 
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left column - Liquidity Matrix */}
          <div className="lg:col-span-8">
            <div className="anim-fade-up" style={{ animationDelay: "50ms" }}>
              <LiquidityMatrix data={liquidityQuery.data} />
            </div>
          </div>

          {/* Right column - Spread Monitor + Depth */}
          <div className="space-y-4 lg:col-span-4">
            <div className="anim-fade-up" style={{ animationDelay: "80ms" }}>
              <SpreadMonitor data={liquidityQuery.data} />
            </div>
            
            <div className="anim-fade-up" style={{ animationDelay: "100ms" }}>
              <DepthVisualization 
                bidDepth={bestVenue?.bidDepthNotional}
                askDepth={bestVenue?.askDepthNotional}
              />
            </div>
          </div>
        </div>

        {/* Config Panel */}
        <div className="mt-4 anim-fade-up" style={{ animationDelay: "120ms" }}>
          <ConfigPanel config={configQuery.data} />
        </div>

        {/* Event Stream */}
        <div className="mt-4 anim-fade-up" style={{ animationDelay: "140ms" }}>
          <EventStream events={eventsQuery.data} />
        </div>

        {/* Error states */}
        {healthQuery.isError && (
          <div className="mt-4 panel border-risk-500/30 bg-risk-500/5 p-4 anim-fade-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-risk-400">
                  CONTROL PLANE UNAVAILABLE
                </div>
                <div className="mt-1 font-mono text-[11px] text-fog-500">
                  Cannot connect to http://127.0.0.1:8787
                </div>
              </div>
              <button 
                onClick={() => healthQuery.refetch()}
                className="btn-metal danger"
              >
                RETRY
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
