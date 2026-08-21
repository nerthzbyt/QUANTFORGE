import React from "react";

interface SymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

export function SymbolSelector({ value, onChange }: SymbolSelectorProps) {
  const symbols = ["BTCUSD", "ETHUSD"];

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-fog-500">SYMBOL:</span>
      <div className="flex rounded border border-line-700 bg-ink-900">
        {symbols.map((sym) => (
          <button
            key={sym}
            onClick={() => onChange(sym)}
            className={`px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-all ${
              value === sym
                ? "bg-gold-500/15 text-gold-300 shadow-[inset_0_1px_0_rgba(246,184,61,0.2)]"
                : "text-fog-500 hover:text-fog-300"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
