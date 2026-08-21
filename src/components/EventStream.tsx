import React, { useMemo, useState } from "react";
import type { TradingEvent } from "../api/controlPlane";

interface EventStreamProps {
  events?: TradingEvent[];
}

type EventTypeFilter = "all" | "accepted" | "rejected";
type SideFilter = "all" | "buy" | "sell";

export function EventStream({ events = [] }: EventStreamProps) {
  const [symbolFilter, setSymbolFilter] = useState<"all" | "BTCUSD" | "ETHUSD">("all");
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Symbol filter
      if (symbolFilter !== "all" && event.symbol !== symbolFilter) return false;
      
      // Type filter
      if (typeFilter !== "all") {
        const isAccepted = event.payload.accepted === true;
        const isRejected = event.payload.accepted === false;
        
        if (typeFilter === "accepted" && !isAccepted) return false;
        if (typeFilter === "rejected" && !isRejected) return false;
      }
      
      // Side filter
      if (sideFilter !== "all" && event.payload.side?.toLowerCase() !== sideFilter) return false;
      
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${event.type} ${event.symbol} ${event.payload.reason || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      
      return true;
    });
  }, [events, symbolFilter, typeFilter, sideFilter, searchQuery]);

  // Calculate rejection stats
  const stats = useMemo(() => {
    const total = events.length;
    const accepted = events.filter(e => e.payload.accepted === true).length;
    const rejected = events.filter(e => e.payload.accepted === false).length;
    
    const reasons: Record<string, number> = {};
    events.filter(e => e.payload.accepted === false && e.payload.reason).forEach(e => {
      reasons[e.payload.reason!] = (reasons[e.payload.reason!] || 0) + 1;
    });

    return { total, accepted, rejected, reasons };
  }, [events]);

  return (
    <div className="panel">
      <div className="section-header px-3">
        <span className="section-title">EVENT STREAM</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-fog-500">{filteredEvents.length} events</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-800 px-3 pb-2">
        <select
          value={symbolFilter}
          onChange={(e) => setSymbolFilter(e.target.value as typeof symbolFilter)}
          className="input-metal py-1"
        >
          <option value="all">All Symbols</option>
          <option value="BTCUSD">BTCUSD</option>
          <option value="ETHUSD">ETHUSD</option>
        </select>

        <div className="flex rounded border border-line-700">
          {(["all", "accepted", "rejected"] as EventTypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${
                typeFilter === t
                  ? t === "accepted"
                    ? "bg-mint-500/20 text-mint-300"
                    : t === "rejected"
                    ? "bg-risk-500/20 text-risk-300"
                    : "bg-ink-700 text-fog-200"
                  : "text-fog-500 hover:text-fog-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex rounded border border-line-700">
          {(["all", "buy", "sell"] as SideFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${
                sideFilter === s ? "bg-ink-700 text-fog-200" : "text-fog-500 hover:text-fog-300"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-metal ml-auto py-1"
        />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2 border-b border-line-800 px-3 py-2">
        <StatMini label="Total" value={stats.total} />
        <StatMini label="Accepted" value={stats.accepted} tone="mint" />
        <StatMini label="Rejected" value={stats.rejected} tone="risk" />
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-fog-600">Rejection Reasons</div>
          <div className="num-display font-mono text-[11px] text-fog-400">
            {Object.keys(stats.reasons).length > 0 
              ? Object.entries(stats.reasons).map(([r, c]) => `${r}: ${c}`).join(", ")
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="ledger max-h-64 overflow-y-auto p-2">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center font-mono text-[10px] text-fog-500">
            No events match filters
          </div>
        ) : (
          filteredEvents.slice(0, 100).map((event, idx) => (
            <div key={`${event.ts}-${idx}`} className="ledger-line">
              <span className="ledger-ts">{formatTs(event.ts)}</span>
              <span className={`ledger-type ${!event.payload.accepted ? "rejected" : "accepted"}`}>
                {event.type}
              </span>
              <span className="ledger-symbol">{event.symbol}</span>
              <span className="ledger-detail">
                {event.payload.side && <span className="mr-2">{event.payload.side.toUpperCase()}</span>}
                {event.payload.qty !== undefined && <span className="mr-2">Qty: {event.payload.qty}</span>}
                {event.payload.mid !== undefined && <span className="mr-2">Mid: {event.payload.mid.toFixed(2)}</span>}
                {event.payload.spread_bps !== undefined && <span className="mr-2">Spread: {event.payload.spread_bps.toFixed(2)}bps</span>}
                {event.payload.position !== undefined && <span className="mr-2">Pos: {event.payload.position}</span>}
                {event.payload.reason && <span className="text-risk-400">Reason: {event.payload.reason}</span>}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Historical badge */}
      <div className="border-t border-line-800 px-3 py-2">
        <span className="badge-historical inline-flex rounded px-2 py-[2px] font-mono text-[8px] uppercase tracking-[0.12em]">
          HISTORICAL EVENTS — NOT LIVE
        </span>
      </div>
    </div>
  );
}

function StatMini({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "mint" | "risk" | "neutral" }) {
  const colorClass = tone === "mint" ? "text-mint-400" : tone === "risk" ? "text-risk-400" : "text-fog-300";
  
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-fog-600">{label}</div>
      <div className={`num-display font-mono text-[14px] font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}

function formatTs(ts: number): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 23);
}
