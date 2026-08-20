import { useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- formato de moneda (cobre → oro/plata/cobre) ---------- */

export function fmtFull(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const neg = v < 0;
  const n = Math.round(Math.abs(v));
  const g = Math.floor(n / 10000);
  const s = Math.floor((n % 10000) / 100);
  const c = n % 100;
  let out: string;
  if (g > 0) out = `${g.toLocaleString("es-ES")}g ${s}s ${c}c`;
  else if (s > 0) out = `${s}s ${c}c`;
  else out = `${c}c`;
  return (neg ? "−" : "") + out;
}

export function fmtShort(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const n = Math.abs(v);
  if (n >= 10000000) return `${(v / 10000).toLocaleString("es-ES", { maximumFractionDigits: 0 })}g`;
  if (n >= 10000) return `${(v / 10000).toLocaleString("es-ES", { maximumFractionDigits: 1 })}g`;
  if (n >= 100) return `${Math.round(v / 100)}s`;
  return `${Math.round(v)}c`;
}

export function fmtNum(v: number, d = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("es-ES", { maximumFractionDigits: d });
}

/* ---------- copiar al portapapeles con feedback ---------- */

export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), timeout);
  };
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return { copied, copy };
}

/* ---------- bloques ---------- */

export function SectionTitle({ code, title, right }: { code: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5 min-w-0">
        <span className="font-mono text-[10px] tracking-[0.18em] text-gold-500 shrink-0">{code}</span>
        <h2 className="font-display text-[15px] font-semibold tracking-wide text-fog-100 truncate">{title}</h2>
      </div>
      {right}
    </div>
  );
}

const TONES: Record<string, string> = {
  mint: "bg-mint-500/12 text-mint-300 border-mint-500/35",
  gold: "bg-gold-500/12 text-gold-300 border-gold-500/35",
  risk: "bg-risk-500/12 text-risk-300 border-risk-500/40",
  arc: "bg-arc-500/12 text-arc-300 border-arc-500/35",
  neutral: "bg-ink-700/60 text-fog-300 border-line-700",
};

export function Badge({ tone = "neutral", children }: { tone?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-[1px] font-mono text-[9.5px] font-medium tracking-[0.08em] uppercase ${TONES[tone] ?? TONES.neutral}`}>
      {children}
    </span>
  );
}

export function FeatureBar({ label, value, tone = "gold", suffix = "%" }: { label: string; value: number; tone?: string; suffix?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const colors: Record<string, string> = {
    mint: "from-mint-600 to-mint-400",
    gold: "from-gold-700 to-gold-400",
    risk: "from-risk-500 to-risk-300",
    arc: "from-arc-500 to-arc-300",
  };
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-400 group-hover:text-fog-200 transition-colors">{label}</span>
        <span className="font-mono text-[11px] text-fog-200">{pct}{suffix}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-ink-700/80">
        <div
          key={pct}
          className={`bar-grow h-full rounded-full bg-gradient-to-r ${colors[tone] ?? colors.gold}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function Sparkline({ data, tone = "#f6b83d", h = 74 }: { data: number[]; tone?: string; h?: number }) {
  const w = 320;
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 6 - ((v - min) / span) * (h - 14)).toFixed(1)}`)
    .join(" ");
  const last = pts.split(" ").pop()!.split(",");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sparkfill)" />
      <polyline key={data.length + data[data.length - 1]} points={pts} fill="none" stroke={tone} strokeWidth="1.6" className="chart-line" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={tone} className="scan-pulse" />
    </svg>
  );
}

/* ---------- visor JSON con coloreado ---------- */

const JSON_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export function JsonView({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  JSON_RE.lastIndex = 0;
  while ((m = JSON_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(<span key={k++} className="jp">{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (m[1] !== undefined && m[2] !== undefined) {
      nodes.push(<span key={k++} className="jk">{m[1]}</span>);
      nodes.push(<span key={k++} className="jp">{m[2]}</span>);
    } else if (tok.startsWith('"')) {
      nodes.push(<span key={k++} className="js">{tok}</span>);
    } else {
      nodes.push(<span key={k++} className="jn">{tok}</span>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(<span key={k++} className="jp">{text.slice(last)}</span>);
  return <pre className="json-view">{nodes}</pre>;
}
