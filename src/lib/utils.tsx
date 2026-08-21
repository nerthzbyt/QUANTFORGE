import React from "react";

export const colors = {
  // Base
  black: "#0a0a0a",
  charcoal: "#121214",
  graphite: "#1a1a1d",
  steel: "#2a2a2f",
  offWhite: "#e5e5e7",
  
  // Lines/borders
  line800: "#2a2a2f",
  line700: "#3a3a3f",
  
  // Fog (text)
  fog100: "#fafafa",
  fog200: "#e5e5e7",
  fog300: "#c7c7cc",
  fog400: "#a1a1aa",
  fog500: "#71717a",
  fog600: "#52525b",
  
  // Accents
  mint: "#27c795",    // green - healthy, connected, accepted
  gold: "#f6b83d",    // amber - warning, stale, degraded, canary
  blue: "#6fb3ff",    // info
  risk: "#ef4444",    // red - danger, kill switch, errors
  
  // Specific tones
  mintDark: "#1a8f6b",
  goldDark: "#b8862a",
  riskDark: "#b91c1c",
};

export type Tone = "mint" | "gold" | "risk" | "blue" | "neutral";

export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: React.ReactNode; title?: string }) {
  const bgMap: Record<Tone, string> = {
    mint: "bg-mint-500/10 text-mint-300 border-mint-500/40",
    gold: "bg-gold-500/10 text-gold-300 border-gold-500/40",
    risk: "bg-risk-500/10 text-risk-300 border-risk-500/40",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/40",
    neutral: "bg-ink-800/70 text-fog-500 border-line-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.14em] ${bgMap[tone]}`}
      title={title}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: "online" | "degraded" | "offline" | "unknown" }) {
  const colorMap = {
    online: "bg-mint-400",
    degraded: "bg-gold-400",
    offline: "bg-risk-400",
    unknown: "bg-fog-600",
  };

  return <span className={`h-[6px] w-[6px] rounded-full ${colorMap[status]}`} />;
}

export function fmtPrice(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  if (value >= 1000) return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

export function fmtBps(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)} bps`;
}

export function fmtTimestamp(ts: number | undefined | null): string {
  if (ts === undefined || ts === null || Number.isNaN(ts)) return "N/A";
  return new Date(ts).toISOString().replace("T", " ").slice(0, 23);
}

export function fmtShortNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(0);
}
