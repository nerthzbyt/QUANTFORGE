import { FIELD_GROUPS, PRESETS } from "../lib/profiles";
import { fmtNum, fmtShort, SectionTitle } from "./ui";

interface Props {
  env: Record<string, number>;
  setField: (k: string, v: number) => void;
  presetId: string;
  applyPreset: (id: string) => void;
  itemName: string;
  setItemName: (s: string) => void;
  seed: number;
  setSeed: (n: number) => void;
  iterations: number;
  setIterations: (n: number) => void;
  aversion: number;
  setAversion: (n: number) => void;
  onRetrain: () => void;
  training: boolean;
}

export default function InputsPanel(p: Props) {
  return (
    <div className="space-y-4">
      <section className="panel p-4 anim-fade-up">
        <SectionTitle code="01" title="Datos de mercado" />

        <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-[0.16em] text-fog-500">
          ítem analizado
        </label>
        <input
          className="num-input mb-3 !text-fog-100"
          value={p.itemName}
          onChange={(e) => p.setItemName(e.target.value)}
          spellCheck={false}
        />

        <div className="mb-4 flex flex-wrap gap-1.5">
          {PRESETS.map((pr) => {
            const active = p.presetId === pr.id;
            return (
              <button
                key={pr.id}
                onClick={() => p.applyPreset(pr.id)}
                className={`group rounded border px-2 py-1 text-left transition-all duration-150 ${
                  active
                    ? "border-gold-500/60 bg-gold-500/12 shadow-[0_0_0_3px_rgba(246,184,61,0.08)]"
                    : "border-line-700 bg-ink-800/60 hover:border-fog-600 hover:bg-ink-750"
                }`}
              >
                <span className={`block font-display text-[11.5px] font-semibold leading-tight ${active ? "text-gold-300" : "text-fog-200"}`}>
                  {pr.label}
                </span>
                <span className="block font-mono text-[9px] tracking-wide text-fog-500 group-hover:text-fog-400">
                  {pr.desc}
                </span>
              </button>
            );
          })}
        </div>

        {FIELD_GROUPS.map((g) => (
          <div key={g.label} className="mb-3.5">
            <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-fog-500">
              {g.label} <span className="text-fog-600">· cobre</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="font-mono text-[10px] text-fog-400">{f.label}</span>
                    <span className="font-mono text-[10px] font-medium text-gold-500/90">
                      {fmtShort(p.env[f.key] ?? 0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    className="num-input"
                    value={p.env[f.key] ?? 0}
                    onChange={(e) => p.setField(f.key, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2.5 border-t border-line-800 pt-3">
          <div>
            <div className="mb-0.5 flex justify-between font-mono text-[10px]">
              <span className="text-fog-400">dbregionsalerate</span>
              <span className="text-mint-300">{((p.env.dbregionsalerate ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range" min={0} max={0.5} step={0.002}
              value={p.env.dbregionsalerate ?? 0}
              onChange={(e) => p.setField("dbregionsalerate", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-0.5 flex justify-between font-mono text-[10px]">
              <span className="text-fog-400">dbregionsoldperday</span>
              <span className="text-mint-300">{fmtNum(p.env.dbregionsoldperday ?? 0, 2)}/día</span>
            </div>
            <input
              type="range" min={0} max={5} step={0.05}
              value={p.env.dbregionsoldperday ?? 0}
              onChange={(e) => p.setField("dbregionsoldperday", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-0.5 flex justify-between font-mono text-[10px]">
              <span className="text-fog-400">numinventory</span>
              <span className="text-mint-300">{p.env.numinventory ?? 0} uds</span>
            </div>
            <input
              type="range" min={0} max={300} step={1}
              value={p.env.numinventory ?? 0}
              onChange={(e) => p.setField("numinventory", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="panel p-4 anim-fade-up" style={{ animationDelay: "70ms" }}>
        <SectionTitle code="02" title="Parámetros del modelo" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <div className="mb-0.5 font-mono text-[10px] text-fog-400">semilla</div>
            <input
              type="number"
              className="num-input"
              value={p.seed}
              onChange={(e) => p.setSeed(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div>
            <div className="mb-0.5 font-mono text-[10px] text-fog-400">iteraciones</div>
            <select
              className="num-input appearance-none"
              value={p.iterations}
              onChange={(e) => p.setIterations(parseInt(e.target.value, 10))}
            >
              <option value={120}>120 · rápido</option>
              <option value={240}>240 · estándar</option>
              <option value={480}>480 · profundo</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-0.5 flex justify-between font-mono text-[10px]">
            <span className="text-fog-400">aversión al riesgo</span>
            <span className="text-gold-400">{(p.aversion * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={p.aversion}
            onChange={(e) => p.setAversion(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="mt-0.5 flex justify-between font-mono text-[8.5px] uppercase tracking-wider text-fog-600">
            <span>agresivo</span>
            <span>conservador</span>
          </div>
        </div>
        <button
          onClick={p.onRetrain}
          disabled={p.training}
          className="relative w-full overflow-hidden rounded-md border border-gold-500/50 bg-gradient-to-b from-gold-500/20 to-gold-500/8 px-3 py-2.5 font-display text-[13px] font-semibold tracking-wide text-gold-300 transition-all duration-150 hover:border-gold-400 hover:text-gold-200 hover:shadow-[0_0_24px_rgba(246,184,61,0.18)] active:scale-[0.985] disabled:opacity-70"
        >
          {p.training ? (
            <span className="flex items-center justify-center gap-2">
              <span className="scan-pulse">▮</span> REENTRENANDO MODELO…
            </span>
          ) : (
            "REENTRENAR MODELO ML"
          )}
          {p.training && (
            <span className="progress-sweep absolute bottom-0 left-0 h-[2px] bg-gold-400/80" />
          )}
        </button>
        <p className="mt-2 text-center font-mono text-[9px] text-fog-600">
          hill-climbing + monte-carlo · determinista por semilla
        </p>
      </section>
    </div>
  );
}
