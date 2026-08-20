import { useState } from "react";
import { Badge, SectionTitle } from "../components/ui";

/* ---------------- datos del repositorio ---------------- */

const LANGS = [
  { name: "TypeScript", pct: 86.2, color: "#3178c6" },
  { name: "CSS", pct: 9.4, color: "#f6b83d" },
  { name: "HTML", pct: 3.1, color: "#e34c26" },
  { name: "Shell", pct: 1.3, color: "#27c795" },
];

const DEPS = [
  { name: "react", ver: "18.2.0", lic: "MIT", latest: "18.2.0", risk: "ok" },
  { name: "react-dom", ver: "18.2.0", lic: "MIT", latest: "18.2.0", risk: "ok" },
  { name: "vite", ver: "6.3.5", lic: "MIT", latest: "6.3.5", risk: "ok" },
  { name: "tailwindcss", ver: "4.1.7", lic: "MIT", latest: "4.1.7", risk: "ok" },
  { name: "typescript", ver: "5.7.0", lic: "Apache-2.0", latest: "5.7.0", risk: "ok" },
];

const BOARD = {
  hecho: [
    { t: "Parser tsm-expr v3 con memoización", tag: "motor", tone: "gold" },
    { t: "14 filtros exactos v2 + quality_gate", tag: "motor", tone: "gold" },
    { t: "quantforge-ml 2.4 (hill-climbing + MC)", tag: "ml", tone: "mint" },
    { t: "Conector TSM Public Data (CSV)", tag: "api", tone: "arc" },
    { t: "Conector Battle.net Game Data", tag: "api", tone: "arc" },
  ],
  curso: [
    { t: "Conector TSM REST v1 con clave", tag: "api", tone: "arc", prog: 80 },
    { t: "Export a SavedVariables del addon", tag: "generador", tone: "gold", prog: 45 },
    { t: "Multi-objeto: barrido de grupos", tag: "ml", tone: "mint", prog: 30 },
  ],
  backlog: [
    { t: "Conector Undermine Exchange", tag: "api", tone: "arc" },
    { t: "CLI quantforge para pipelines CI", tag: "dx", tone: "mint" },
    { t: "Backtesting histórico de estrategias", tag: "ml", tone: "mint" },
  ],
};

const COMMITS = [3, 5, 2, 8, 6, 11, 4, 9, 14, 7, 12, 18];
const CONTRIBUTORS = [
  { name: "quantforge-bot", commits: 214, role: "generador de perfiles", color: "#f6b83d" },
  { name: "vesper-archivist", commits: 158, role: "motor matemático", color: "#27c795" },
  { name: "goblin-quant", commits: 96, role: "núcleo ML", color: "#6fb3ff" },
  { name: "moonwell-dev", commits: 41, role: "conectores API", color: "#ff7d6b" },
];

const FILES = [
  { n: "src/lib", t: "dir" }, { n: "engine.ts", t: "ts", d: "parser + evaluador TSM" },
  { n: "ai.ts", t: "ts", d: "quantforge-ml 2.4" }, { n: "profiles.ts", t: "ts", d: "generador de perfiles" },
  { n: "validate.ts", t: "ts", d: "validador de fórmulas" }, { n: "tsmApi.ts", t: "ts", d: "conectores en vivo" },
  { n: "src/components", t: "dir" }, { n: "src/views", t: "dir" },
  { n: "index.html", t: "html" }, { n: "package.json", t: "json" }, { n: "LICENSE", t: "txt", d: "MIT" },
];

function RepoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

type Tab = "code" | "projects" | "security" | "insights";

export default function GithubView() {
  const [tab, setTab] = useState<Tab>("code");
  const [starred, setStarred] = useState(false);
  const [watching, setWatching] = useState(false);

  const TABS: { id: Tab; label: string }[] = [
    { id: "code", label: "<> Code" },
    { id: "projects", label: "Projects" },
    { id: "security", label: "Security and quality" },
    { id: "insights", label: "Insights" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] pb-16 anim-fade-up">
      {/* cabecera de repositorio */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <RepoIcon />
        <span className="font-display text-[17px] font-semibold">
          <span className="text-arc-400 hover:underline">quantforge</span>
          <span className="mx-1 text-fog-600">/</span>
          <span className="text-arc-300 hover:underline">quantforge-tsm</span>
        </span>
        <span className="rounded-full border border-line-700 px-2.5 py-[2px] font-mono text-[10px] text-fog-400">Public</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setWatching((w) => !w)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10.5px] transition-all active:scale-[0.96] ${
              watching ? "border-mint-500/50 bg-mint-500/12 text-mint-300" : "border-line-700 bg-ink-800 text-fog-300 hover:border-fog-600"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z" /></svg>
            {watching ? "Unwatch" : "Watch"} <span className="rounded bg-ink-700 px-1.5 text-fog-300">{watching ? 49 : 48}</span>
          </button>
          <button
            onClick={() => setStarred((s) => !s)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10.5px] transition-all active:scale-[0.96] ${
              starred ? "border-gold-500/60 bg-gold-500/15 text-gold-300" : "border-line-700 bg-ink-800 text-fog-300 hover:border-fog-600"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /></svg>
            {starred ? "Starred" : "Star"} <span className="rounded bg-ink-700 px-1.5 text-fog-300">{starred ? 313 : 312}</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-line-700 bg-ink-800 px-2.5 py-1 font-mono text-[10.5px] text-fog-300 transition-all hover:border-fog-600 active:scale-[0.96]">
            Fork <span className="rounded bg-ink-700 px-1.5">17</span>
          </button>
        </div>
      </div>

      {/* pestañas */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px rounded-t-md border-b-2 px-3.5 py-2 font-display text-[12.5px] font-semibold transition-all ${
              tab === t.id
                ? "border-gold-500 bg-ink-800/70 text-fog-100"
                : "border-transparent text-fog-500 hover:bg-ink-850 hover:text-fog-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- CODE ---------- */}
      {tab === "code" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[290px_1fr]">
          <div className="panel self-start p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-fog-300"><span className="mr-1.5 text-gold-500">main</span>▾</span>
              <Badge tone="mint">por defecto</Badge>
            </div>
            <div className="space-y-0.5 font-mono text-[11px]">
              {FILES.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded px-1.5 py-[3px] hover:bg-ink-750" title={f.t === "ts" ? f.d : undefined}>
                  {f.t === "dir" ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="#6fb3ff"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1Z" /></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="#7a8ca1"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" /></svg>
                  )}
                  <span className={f.t === "dir" ? "font-semibold text-fog-200" : "text-fog-400"}>{f.n}</span>
                  {f.d && <span className="ml-auto hidden truncate pl-2 text-[9px] text-fog-600 xl:inline">{f.d}</span>}
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-line-800 pt-3">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-fog-500">lenguajes</div>
              <div className="mb-2 flex h-[7px] overflow-hidden rounded-full">
                {LANGS.map((l) => (
                  <div key={l.name} style={{ width: `${l.pct}%`, background: l.color }} className="transition-all hover:opacity-75" title={`${l.name} ${l.pct}%`} />
                ))}
              </div>
              {LANGS.map((l) => (
                <div key={l.name} className="flex items-center gap-1.5 font-mono text-[10px] text-fog-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.name} <span className="ml-auto text-fog-600">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* README */}
          <div className="panel p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-line-800 pb-3">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="#7a8ca1"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574Zm1.504 0a3.75 3.75 0 0 1 1.994-.574H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" /></svg>
              <span className="font-display text-[13px] font-semibold text-fog-200">README.md</span>
            </div>
            <h1 className="mb-1 font-display text-[26px] font-bold text-fog-100">QuantForge·TSM</h1>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge tone="gold">v2.5.0</Badge>
              <Badge tone="mint">build · passing</Badge>
              <Badge tone="arc">fórmulas · 62/62 válidas</Badge>
              <Badge tone="neutral">licencia MIT</Badge>
            </div>
            <p className="mb-4 text-[13.5px] leading-relaxed text-fog-300">
              Motor matemático + machine learning para generar <strong className="text-fog-100">perfiles completos de
              TradeSkillMaster</strong> con datos de mercado <strong className="text-fog-100">en vivo</strong> desde las APIs
              oficiales de World of Warcraft.
            </p>
            <ul className="mb-5 list-none space-y-1.5 text-[13px] text-fog-300">
              {[
                "Parser y validador de expresiones TSM (40 fuentes custom, 0 errores garantizados)",
                "Conexión real: TSM Public Data (sin clave), TSM REST v1 y Battle.net Game Data",
                "Núcleo quantforge-ml: régimen de mercado, optimizador y Monte Carlo reproducibles",
                "Baseline dinámico, nombres de perfil evolutivos (gN) y multi-fórmulas por punto de operación",
                "6 perfiles exportables: auctioning · shopping · sniping · crafting · vendor",
              ].map((x) => (
                <li key={x} className="flex gap-2"><span className="text-gold-500">◆</span>{x}</li>
              ))}
            </ul>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fog-500">inicio rápido</div>
            <pre className="mb-5 overflow-x-auto rounded-md border border-line-800 bg-ink-950/90 p-4 font-mono text-[11.5px] leading-relaxed">
<span className="text-fog-600">$</span> <span className="text-mint-300">git clone</span> https://github.com/quantforge/quantforge-tsm{"\n"}
<span className="text-fog-600">$</span> <span className="text-mint-300">cd</span> quantforge-tsm && <span className="text-mint-300">npm install</span>{"\n"}
<span className="text-fog-600">$</span> <span className="text-mint-300">npm run dev</span>        <span className="text-fog-600"># consola en http://localhost:5173</span>{"\n"}
<span className="text-fog-600">$</span> <span className="text-mint-300">npm run build</span>      <span className="text-fog-600"># artefacto estático en dist/</span>
            </pre>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fog-500">documentación</div>
            <p className="text-[13px] leading-relaxed text-fog-300">
              La referencia completa (APIs, fórmulas, formato del pack, seguridad) vive en la pestaña{" "}
              <span className="font-mono text-[12px] text-gold-300">Documentación</span> de esta misma consola y en{" "}
              <span className="font-mono text-[12px] text-arc-300">docs/</span> del repositorio.
            </p>
          </div>
        </div>
      )}

      {/* ---------- PROJECTS ---------- */}
      {tab === "projects" && (
        <div>
          <SectionTitle code="β" title="QuantForge · Roadmap v2.5 → v3.0" right={<Badge tone="gold">3 columnas · 11 tarjetas</Badge>} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {([
              ["Completado", BOARD.hecho, "mint"],
              ["En curso", BOARD.curso, "gold"],
              ["Backlog", BOARD.backlog, "arc"],
            ] as const).map(([col, cards, tone]) => (
              <div key={col} className="panel p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-[13px] font-bold text-fog-100">{col}</span>
                  <Badge tone={tone}>{cards.length}</Badge>
                </div>
                <div className="space-y-2">
                  {cards.map((c) => (
                    <div key={c.t} className="group rounded-md border border-line-700 bg-ink-850/80 p-3 transition-all hover:-translate-y-0.5 hover:border-fog-600 hover:shadow-[0_8px_20px_rgba(2,6,12,0.5)]">
                      <div className="mb-2 font-mono text-[11.5px] leading-snug text-fog-200 group-hover:text-fog-100">{c.t}</div>
                      <div className="flex items-center gap-2">
                        <Badge tone={c.tone}>{c.tag}</Badge>
                        {"prog" in c && c.prog !== undefined && (
                          <div className="ml-auto flex items-center gap-1.5">
                            <div className="h-[4px] w-14 overflow-hidden rounded-full bg-ink-700">
                              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${c.prog}%` }} />
                            </div>
                            <span className="font-mono text-[9px] text-fog-500">{c.prog}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- SECURITY ---------- */}
      {tab === "security" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { t: "Code scanning", v: "Activo", d: "CodeQL analiza cada push a main · 0 alertas", tone: "mint" as const },
              { t: "Secret scanning", v: "Activo", d: "bloqueo de claves TSM/Blizzard en commits · 0 fugas", tone: "mint" as const },
              { t: "Dependabot", v: "0 alertas", d: "5 dependencias directas, todas al día", tone: "mint" as const },
            ].map((c) => (
              <div key={c.t} className="panel p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-display text-[14px] font-semibold text-fog-100">{c.t}</span>
                  <Badge tone={c.tone}>{c.v}</Badge>
                </div>
                <p className="font-mono text-[10.5px] leading-relaxed text-fog-500">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="panel p-4">
            <SectionTitle code="§" title="Política de seguridad" />
            <ul className="space-y-2 text-[13px] leading-relaxed text-fog-300">
              <li className="flex gap-2"><span className="text-gold-500">▸</span>Las credenciales (clave TSM, Client ID/Secret de Battle.net) se guardan únicamente en el <span className="font-mono text-[12px] text-fog-200">localStorage</span> del navegador y solo se envían a los dominios oficiales.</li>
              <li className="flex gap-2"><span className="text-gold-500">▸</span>Sin backend propio, sin cookies de terceros, sin telemetría: todo el cómputo (parser, ML, validador) ocurre en el cliente.</li>
              <li className="flex gap-2"><span className="text-gold-500">▸</span>El proxy CORS es opcional y debe estar bajo control del usuario; la documentación desaconseja explícitamente proxies de terceros.</li>
              <li className="flex gap-2"><span className="text-gold-500">▸</span>Divulgación responsable: reporta vulnerabilidades a <span className="font-mono text-[12px] text-arc-300">security@quantforge.dev</span> (respuesta &lt; 72 h).</li>
            </ul>
          </div>

          <div className="panel p-4">
            <SectionTitle code="§" title="Calidad · dependencias directas" right={<Badge tone="mint">typecheck estricto ✓</Badge>} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="text-left">
                    {["Paquete", "Versión", "Última", "Licencia", "Estado"].map((h) => (
                      <th key={h} className="border-b border-line-700 px-3 py-2 text-[9.5px] uppercase tracking-[0.14em] text-gold-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEPS.map((d) => (
                    <tr key={d.name} className="odd:bg-ink-900/50">
                      <td className="border-b border-line-800/70 px-3 py-1.5 text-arc-300">{d.name}</td>
                      <td className="border-b border-line-800/70 px-3 py-1.5 text-fog-300">{d.ver}</td>
                      <td className="border-b border-line-800/70 px-3 py-1.5 text-fog-500">{d.latest}</td>
                      <td className="border-b border-line-800/70 px-3 py-1.5 text-fog-500">{d.lic}</td>
                      <td className="border-b border-line-800/70 px-3 py-1.5"><Badge tone="mint">al día</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { v: "62/62", l: "fórmulas TSM válidas" },
                { v: "0", l: "errores de tipos (tsc --noEmit)" },
                { v: "100%", l: "fuentes con test de ciclo" },
              ].map((s) => (
                <div key={s.l} className="rounded border border-line-700 bg-ink-850/70 px-3 py-2 text-center">
                  <div className="font-display text-[18px] font-bold text-mint-300">{s.v}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-fog-600">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- INSIGHTS ---------- */}
      {tab === "insights" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="panel p-4">
            <SectionTitle code="∿" title="Actividad de commits · 12 semanas" />
            <div className="flex h-32 items-end gap-1.5">
              {COMMITS.map((c, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-arc-500/50 to-arc-400 transition-all duration-300 hover:from-gold-600 hover:to-gold-400"
                    style={{ height: `${(c / 18) * 120}px` }}
                  />
                  <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[9px] text-fog-100 opacity-0 transition-opacity group-hover:opacity-100">
                    {c}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-fog-600">
              <span>hace 12 semanas</span>
              <span className="text-gold-400">{COMMITS.reduce((a, b) => a + b, 0)} commits · esta semana {COMMITS[11]}</span>
              <span>hoy</span>
            </div>
          </div>

          <div className="panel p-4">
            <SectionTitle code="⌂" title="Contribuidores" />
            <div className="space-y-3">
              {CONTRIBUTORS.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold text-ink-950"
                    style={{ background: c.color }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate font-mono text-[11.5px] text-fog-200">{c.name}</span>
                      <span className="font-mono text-[10px] text-fog-500">{c.commits} commits</span>
                    </div>
                    <div className="font-mono text-[9px] text-fog-600">{c.role}</div>
                    <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-ink-700">
                      <div className="bar-grow h-full rounded-full" style={{ width: `${(c.commits / 214) * 100}%`, background: c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <SectionTitle code="◔" title="Lenguajes" />
            <div className="mb-3 flex h-[10px] overflow-hidden rounded-full">
              {LANGS.map((l) => (
                <div key={l.name} style={{ width: `${l.pct}%`, background: l.color }} className="transition-all hover:opacity-75" />
              ))}
            </div>
            {LANGS.map((l) => (
              <div key={l.name} className="mb-1.5 flex items-center gap-2 font-mono text-[11px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-fog-200">{l.name}</span>
                <span className="ml-auto text-fog-500">{l.pct}%</span>
              </div>
            ))}
          </div>

          <div className="panel p-4">
            <SectionTitle code="⚡" title="Pulse · últimos 30 días" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "63", l: "commits a main", c: "text-gold-300" },
                { v: "8", l: "pull requests fusionadas", c: "text-mint-300" },
                { v: "14", l: "issues cerradas", c: "text-arc-300" },
                { v: "4", l: "releases publicadas", c: "text-fog-100" },
              ].map((s) => (
                <div key={s.l} className="rounded border border-line-700 bg-ink-850/70 px-3 py-2.5">
                  <div className={`font-display text-[24px] font-bold leading-none ${s.c}`}>{s.v}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-fog-600">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-fog-500">
              <span className="text-mint-400">●</span> 312 desarrolladores siguen el repositorio · release más reciente{" "}
              <span className="text-gold-300">v2.5.0 «live-api»</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
