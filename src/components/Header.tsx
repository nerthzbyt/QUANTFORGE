import React from "react";

interface HeaderProps {
  controlPlaneStatus: "online" | "degraded" | "offline" | "unknown";
  marketDataStatus?: "online" | "degraded" | "offline" | "unknown";
  dataPlaneStatus?: "online" | "degraded" | "offline" | "unknown";
  strategicPlaneStatus?: "online" | "degraded" | "offline" | "unknown";
}

export function Header({
  controlPlaneStatus,
  marketDataStatus = "unknown",
  dataPlaneStatus = "unknown",
  strategicPlaneStatus = "unknown",
}: HeaderProps) {
  const statusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-mint-400";
      case "degraded":
        return "text-gold-400";
      case "offline":
        return "text-risk-400";
      default:
        return "text-fog-600";
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case "online":
        return "bg-mint-400";
      case "degraded":
        return "bg-gold-400";
      case "offline":
        return "bg-risk-400";
      default:
        return "bg-fog-600";
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line-800 bg-ink-950/95 backdrop-blur-md header-accent">
      <div className="mx-auto flex max-w-[1800px] items-center gap-4 px-4 py-3">
        {/* Sigil / Logo */}
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
            <rect
              x="8"
              y="8"
              width="24"
              height="24"
              rx="3"
              transform="rotate(45 20 20)"
              stroke="#f6b83d"
              strokeWidth="1.6"
            />
            <rect x="13" y="17" width="3" height="9" rx="1" fill="#27c795" />
            <rect x="18.5" y="12" width="3" height="14" rx="1" fill="#f6b83d" />
            <rect x="24" y="15" width="3" height="11" rx="1" fill="#6fb3ff" />
            <circle cx="20" cy="20" r="1.4" fill="#e5e5e7" />
          </svg>
          <div>
            <div className="font-display text-[16px] font-bold leading-none tracking-tight text-fog-100">
              NERTZ<span className="text-gold-500">·</span>METAL
            </div>
            <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.25em] text-fog-500">
              HFT HYBRID CONTROL SYSTEM
            </div>
          </div>
        </div>

        {/* System Status Indicators */}
        <nav className="ml-4 flex items-center gap-2 rounded-md border border-line-800 bg-ink-900/70 px-2 py-1.5">
          <SystemIndicator label="CONTROL" status={controlPlaneStatus} />
          <div className="h-3 w-px bg-line-700" />
          <SystemIndicator label="MARKET" status={marketDataStatus} />
          <div className="h-3 w-px bg-line-700" />
          <SystemIndicator label="DATA" status={dataPlaneStatus} />
          <div className="h-3 w-px bg-line-700" />
          <SystemIndicator label="STRAT" status={strategicPlaneStatus} />
        </nav>

        {/* Command line display */}
        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-line-800 bg-ink-900/70 px-3 py-1.5 lg:flex">
          <span className="font-mono text-[10px] text-mint-400">$</span>
          <span className="truncate font-mono text-[9px] text-fog-400">
            nertz-engine --status <span className="text-gold-300">live</span> --plane{" "}
            <span className="text-mint-300">control</span>
          </span>
          <span className="caret font-mono text-[10px] text-gold-400">▊</span>
        </div>

        {/* Connection badge */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {controlPlaneStatus === "online" ? (
            <span className="flex items-center gap-1.5 rounded border border-mint-500/40 bg-mint-500/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-mint-300">
              <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-mint-400" />
              CONNECTED
            </span>
          ) : controlPlaneStatus === "degraded" ? (
            <span className="flex items-center gap-1.5 rounded border border-gold-500/40 bg-gold-500/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-gold-300">
              <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-gold-400" />
              DEGRADED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded border border-risk-500/40 bg-risk-500/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] text-risk-300">
              <span className="h-[6px] w-[6px] rounded-full bg-risk-400" />
              OFFLINE
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function SystemIndicator({ label, status }: { label: string; status: string }) {
  const colorClass =
    status === "online"
      ? "text-mint-400"
      : status === "degraded"
      ? "text-gold-400"
      : status === "offline"
      ? "text-risk-400"
      : "text-fog-600";

  const dotClass =
    status === "online"
      ? "bg-mint-400"
      : status === "degraded"
      ? "bg-gold-400"
      : status === "offline"
      ? "bg-risk-400"
      : "bg-fog-600";

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${status}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${dotClass}`} />
      <span className={`font-mono text-[8px] font-semibold uppercase tracking-[0.15em] ${colorClass}`}>{label}</span>
    </div>
  );
}
