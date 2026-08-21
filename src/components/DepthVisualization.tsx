import React from "react";

interface DepthVisualizationProps {
  bidDepth?: number;
  askDepth?: number;
  maxDepth?: number;
}

export function DepthVisualization({ 
  bidDepth = 0, 
  askDepth = 0, 
  maxDepth 
}: DepthVisualizationProps) {
  // If maxDepth not provided, use the larger of the two
  const effectiveMax = maxDepth || Math.max(bidDepth, askDepth, 1);
  
  const bidPct = Math.min((bidDepth / effectiveMax) * 100, 100);
  const askPct = Math.min((askDepth / effectiveMax) * 100, 100);
  
  const imbalance = bidDepth + askDepth > 0 
    ? ((bidDepth - askDepth) / (bidDepth + askDepth)) * 100 
    : 0;

  return (
    <div className="panel">
      <div className="section-header px-3">
        <span className="section-title">DEPTH VISUALIZATION</span>
      </div>
      
      <div className="px-3 pb-2">
        {/* Imbalance indicator */}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-fog-600">Imbalance</span>
          <span className={`num-display font-mono text-[12px] font-semibold ${
            imbalance > 10 ? "text-mint-400" : imbalance < -10 ? "text-risk-400" : "text-fog-400"
          }`}>
            {imbalance > 0 ? "+" : ""}{imbalance.toFixed(1)}%
          </span>
        </div>

        {/* Bid bar */}
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-mint-400">BID</span>
            <span className="font-mono text-[9px] text-fog-500">{formatDepth(bidDepth)}</span>
          </div>
          <div className="h-3.5 w-full rounded bg-ink-900">
            <div 
              className="depth-bar depth-bid h-full rounded" 
              style={{ width: `${bidPct}%` }}
            />
          </div>
        </div>

        {/* Ask bar */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-risk-400">ASK</span>
            <span className="font-mono text-[9px] text-fog-500">{formatDepth(askDepth)}</span>
          </div>
          <div className="h-3.5 w-full rounded bg-ink-900">
            <div 
              className="depth-bar depth-ask h-full rounded" 
              style={{ width: `${askPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDepth(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(0);
}
