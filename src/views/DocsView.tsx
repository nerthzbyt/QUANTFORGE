import { useEffect, useState, type ReactNode } from "react";
import { V2_SOURCES, BASE_SOURCES } from "../lib/engine";
import { REGIONS } from "../lib/tsmApi";

/* ---------- primitivas de documentación ---------- */

function H2({ id, n, children }: { id: string; n: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-10 flex scroll-mt-24 items-baseline gap-3 border-b border-line-800 pb-2 first:mt-0">
      <span className="font-mono text-[11px] tracking-[0.18em] text-gold-500">{n}</span>
      <span className="font-display text-[21px] font-bold text-fog-100">{children}</span>
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 mt-6 font-display text-[15px] font-semibold text-gold-300">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[13.5px] leading-relaxed text-fog-300">{children}</p>;
}

function Code({ children, lang = "ts" }: { children: string; lang?: string }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-md border border-line-800 bg-ink-950/90 p-3.5 font-mono text-[11px] leading-relaxed text-fog-200">
      <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-fog-600">
        <span>{lang}</span>
        <span>quantforge-tsm</span>
      </div>
      {children}
    </pre>
  );
}

function Tbl({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-md border border-line-800">
      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr className="bg-ink-800/80 text-left">
            {head.map((h) => (
              <th key={h} className="border-b border-line-700 px-3 py-2 text-[9.5px] uppercase tracking-[0.14em] text-gold-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-ink-900/50 even:bg-ink-850/50">
              {r.map((c, j) => (
                <td key={j} className={`border-b border-line-800/70 px-3 py-1.5 align-top ${j === 0 ? "text-mint-300" : "text-fog-300"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ tone, title, children }: { tone: "gold" | "mint" | "risk" | "arc"; title: string; children: ReactNode }) {
  const tones = {
    gold: "border-gold-500/40 bg-gold-500/6 text-gold-300",
    mint: "border-mint-500/40 bg-mint-500/6 text-mint-300",
    risk: "border-risk-500/45 bg-risk-500/6 text-risk-300",
    arc: "border-arc-500/40 bg-arc-500/6 text-arc-300",
  };
  return (
    <div className={`mb-4 rounded-md border-l-2 px-4 py-3 ${tones[tone]}`}>
      <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.18em]">{title}</div>
      <div className="text-[12.5px] leading-relaxed text-fog-200">{children}</div>
    </div>
  );
}

const SECTIONS = [
  ["intro", "01", "Visión general"],
  ["arquitectura", "02", "Arquitectura"],
  ["api", "03", "Conexión API en vivo"],
  ["formulas", "04", "Referencia matemática"],
  ["ml", "05", "Capa ML/AI"],
  ["pack", "06", "Formato del pack"],
  ["importar", "07", "Importar a TSM"],
  ["seguridad", "08", "Seguridad y privacidad"],
  ["changelog", "09", "Changelog"],
  ["faq", "10", "FAQ"],
] as const;

export default function DocsView() {
  const [active, setActive] = useState<string>("intro");

  useEffect(() => {
    const onScroll = () => {
      let cur = "intro";
      for (const [id] of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 lg:grid-cols-[230px_1fr]">
      {/* índice lateral */}
      <aside className="top-20 hidden self-start lg:sticky lg:block">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-fog-500">documentación · v2.5</div>
        <nav className="space-y-0.5 border-l border-line-800">
          {SECTIONS.map(([id, n, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={`-ml-px block border-l-2 px-3 py-1.5 font-mono text-[11px] transition-all duration-150 ${
                active === id
                  ? "border-gold-500 bg-gold-500/8 text-gold-300"
                  : "border-transparent text-fog-500 hover:border-fog-600 hover:text-fog-200"
              }`}
            >
              <span className="mr-2 text-fog-600">{n}</span>
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-5 rounded-md border border-line-800 bg-ink-900/60 p-3 font-mono text-[9.5px] leading-relaxed text-fog-500">
          <span className="text-mint-400">$</span> quantforge --version
          <br />
          <span className="text-fog-300">v2.5.0 «live-api»</span>
          <br />
          <span className="text-mint-400">$</span> licencia <span className="text-fog-300">MIT</span>
        </div>
      </aside>

      {/* contenido */}
      <article className="min-w-0 pb-16">
        <header className="mb-8 anim-fade-up">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-gold-500/50 bg-gold-500/10 px-2 py-0.5 font-mono text-[10px] text-gold-300">docs.quantforge.dev</span>
            <span className="rounded border border-mint-500/45 bg-mint-500/8 px-2 py-0.5 font-mono text-[10px] text-mint-300">API en vivo</span>
            <span className="rounded border border-arc-500/45 bg-arc-500/8 px-2 py-0.5 font-mono text-[10px] text-arc-300">ES · español</span>
          </div>
          <h1 className="font-display text-[34px] font-bold leading-tight text-fog-100">
            Documentación técnica <span className="text-gold-500">QuantForge·TSM</span>
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-fog-400">
            Motor matemático de expresiones TradeSkillMaster, capa de aprendizaje automático para calibración de
            estrategias y conectores reales a las APIs de World of Warcraft (TSM Public Data, TSM REST y Battle.net).
          </p>
        </header>

        {/* 01 */}
        <H2 id="intro" n="01">Visión general</H2>
        <P>
          QuantForge·TSM genera <strong className="text-fog-100">perfiles completos de operaciones para TradeSkillMaster</strong> a
          partir de datos de mercado reales. El sistema está compuesto por tres capas: un parser/evaluador de
          expresiones TSM (que valida cada fórmula antes de exportarla), un núcleo de machine learning que calibra
          coeficientes por régimen de mercado, y un conjunto de conectores que eliminan el hardcoding al traer los
          precios directamente de las APIs oficiales.
        </P>
        <P>
          Todo el procesamiento ocurre <strong className="text-fog-100">en el navegador</strong>: no hay backend propio, no hay
          telemetría y las credenciales nunca abandonan tu equipo salvo hacia las APIs oficiales de Blizzard y
          TradeSkillMaster.
        </P>
        <Callout tone="mint" title="Novedad v2.5">
          Los escenarios empaquetados pasan a ser exclusivamente un modo de demostración sin conexión. La fuente de
          datos principal es la API: busca un objeto por nombre, sincroniza su mercado y el motor recalcula 40 fuentes
          custom, 6 perfiles y los coeficientes IA en tiempo real.
        </Callout>

        {/* 02 */}
        <H2 id="arquitectura" n="02">Arquitectura</H2>
        <Code lang="diagrama">{`┌─────────────────────────────────────────────────────────────┐
│  CAPA DE DATOS EN VIVO                                       │
│  Battle.net Game Data API ──► búsqueda + metadatos + iconos  │
│  TSM REST v1 (con clave)  ──► estadísticas de precio         │
│  TSM Public Data (CSV)    ──► precios por reino, sin clave   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼  variables de mercado (dbmarket…)
┌──────────────────────────────────────────────────────────────┐
│  MOTOR MATEMÁTICO · tsm-expr parser v3                        │
│  tokenizer → AST → evaluación memoizada + detección de ciclos │
│  26 fuentes baseline · 14 filtros exactos v2 · validador      │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  NÚCLEO ML · quantforge-ml 2.4                                │
│  10 features → clasificación de régimen → optimizador         │
│  (hill-climbing con templado) → Monte Carlo 480×14 días       │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  GENERADOR DE PERFILES                                        │
│  6 perfiles · nombres evolutivos gN · multi-fórmulas ·        │
│  pack JSON validado (0 errores garantizados)                  │
└──────────────────────────────────────────────────────────────┘`}</Code>
        <Tbl
          head={["Módulo", "Responsabilidad", "Salida"]}
          rows={[
            ["tsm-expr parser", "Tokeniza, parsea y evalúa expresiones TSM con sufijos de moneda y funciones nativas", "valores numéricos por fuente"],
            ["validate.ts", "Verifica sintaxis, aridades de funciones e identificadores contra el vocabulario TSM", "informe de errores por fórmula"],
            ["quantforge-ml", "Extrae features, detecta régimen, optimiza coeficientes y simula resultados", "coeficientes + E[oro] + convergencia"],
            ["generador", "Compone perfiles con secciones auctioning/shopping/sniping/crafting/vendor", "pack JSON importable"],
            ["tsmApi.ts", "Conectores reales: OAuth Battle.net, REST TSM, CSV Public Data", "variables de mercado en vivo"],
          ]}
        />

        {/* 03 */}
        <H2 id="api" n="03">Conexión API en vivo</H2>
        <P>
          La consola admite dos proveedores de precios y uno de metadatos. Todos los flujos usan APIs oficiales y
          documentadas; no se emplea scraping.
        </P>

        <H3>3.1 · TSM Public Data (sin clave)</H3>
        <P>
          TradeSkillMaster publica sus datos de AuctionDB como archivos estáticos en{" "}
          <span className="font-mono text-[12px] text-arc-300">public-data.tradeskillmaster.com</span>, sin clave, sin registro y
          sin límites de tasa. El conector indexa los reinos de la región elegida y descarga el CSV del reino
          seleccionado, buscando el objeto por <span className="font-mono text-[12px]">itemId</span>.
        </P>
        <Code lang="http">{`GET https://public-data.tradeskillmaster.com/realms
GET https://public-data.tradeskillmaster.com/realms/{realmId}   → CSV`}</Code>

        <H3>3.2 · TSM REST v1 (con clave)</H3>
        <P>
          Si dispones de una clave de la API de TSM (panel de tu cuenta en tradeskillmaster.com), el conector usa el
          endpoint REST de estadísticas, que devuelve la serie completa de campos de precio a nivel de reino y región.
        </P>
        <Code lang="http">{`GET https://api.tradeskillmaster.com/api/v1/item/{itemId}/stats?region={region}&key={API_KEY}`}</Code>

        <H3>3.3 · Battle.net Game Data API (metadatos)</H3>
        <P>
          La búsqueda por nombre, la calidad, el nivel de objeto y el icono provienen de la API oficial de Blizzard
          mediante OAuth2 <em>client credentials</em>. Crea un cliente gratuito en{" "}
          <span className="font-mono text-[12px] text-arc-300">develop.battle.net</span> y copia el Client ID y el Client Secret
          en el panel de conexión. El token se solicita una vez por región y se cachea hasta su expiración.
        </P>
        <Code lang="http">{`POST https://{region}.battle.net/oauth/token          (client_credentials)
GET  https://{region}.api.blizzard.com/data/wow/search/item?name=…
GET  https://{region}.api.blizzard.com/data/wow/media/item/{id}`}</Code>
        <Tbl
          head={["Región", "Host OAuth", "Locale por defecto"]}
          rows={REGIONS.map((r) => [r.id.toUpperCase(), `${r.id}.battle.net`, r.locale])}
        />

        <H3>3.4 · CORS y proxy opcional</H3>
        <P>
          La API de Blizzard responde con cabeceras CORS habilitadas y funciona directamente desde el navegador. Los
          endpoints de TSM pueden no enviarlas según su CDN; en ese caso el panel de conexión admite un{" "}
          <strong className="text-fog-100">proxy propio</strong> (por ejemplo, un Worker de Cloudflare de 10 líneas):
        </P>
        <Code lang="js · worker de cloudflare">{`export default {
  async fetch(request) {
    const target = new URL(request.url).searchParams.get("url");
    return fetch(target, { headers: { "User-Agent": "quantforge-tsm" } });
  },
};`}</Code>
        <Callout tone="risk" title="Seguridad del proxy">
          Usa únicamente un proxy bajo tu control. El panel antepone tu URL a cada petición; nunca envíes tu clave de
          TSM a un proxy de terceros.
        </Callout>

        <H3>3.5 · Mapeo API → motor</H3>
        <P>
          Los campos recibidos se asignan a las variables de mercado que consumen las 40 fuentes custom:
        </P>
        <Tbl
          head={["Campo TSM", "Variable del motor", "Uso"]}
          rows={[
            ["marketValue", "dbmarket", "valor de mercado (anclas)"],
            ["minBuyout", "dbminbuyout", "compra mínima (fair, premium/dump guards)"],
            ["recentlySold", "dbrecent", "precio reciente (ancla, momentum)"],
            ["historical", "dbhistorical", "histórico (ancla, momentum)"],
            ["regionMarketValue", "dbregionmarketavg", "media regional (region_guard)"],
            ["regionHistorical", "dbregionhistorical", "histórico regional (ancla)"],
            ["regionSaleAvg", "dbregionsaleavg", "media de ventas regional (ancla)"],
            ["regionSaleRate", "dbregionsalerate", "tasa de venta (demand_guard, restock)"],
            ["regionSoldPerDay", "dbregionsoldperday", "ventas/día (volume_guard, inventario)"],
            ["vendorSell / vendorBuy", "vendorsell / vendorbuy", "pisos de vendedor"],
            ["saleAvg", "avgbuy", "coste medio de compra"],
          ]}
        />
        <Callout tone="arc" title="Campos no cubiertos por la API">
          matprice, crafting, destroy, convert y numinventory dependen del addon en juego (recetas, desencantado,
          bolsa). Tras una sincronización conservan su valor editable; el pack documenta esta procedencia mixta.
        </Callout>

        {/* 04 */}
        <H2 id="formulas" n="04">Referencia matemática</H2>
        <H3>4.1 · Funciones nativas del parser</H3>
        <Tbl
          head={["Función", "Semántica", "Ejemplo"]}
          rows={[
            ["avg(a,b,…)", "media aritmética", "avg(dbmarket,dbrecent)"],
            ["min / max", "mínimo / máximo", "max(crafting,matprice)"],
            ["first(a,b,…)", "primer valor > 0", "first(dbminbuyout,dbmarket)"],
            ["round(x,n)", "redondeo al múltiplo n", "round(sane*1.15,1c)"],
            ["rounddown / roundup", "redondeo hacia abajo / arriba", "rounddown(min(…),1c)"],
            ["ifgt/iflt/ifgte/iflte(a,b,t,f)", "condicional comparativo", "iflt(dbregionsalerate,0.05,0,1)"],
            ["convert(x)", "valor de conversión del objeto", "convert(dbmarket)"],
            ["abs / sqrt / pow / clamp", "utilidades numéricas", "abs(dbminbuyout-dbmarket)"],
            ["sufijos c · s · g", "cobre, plata (100), oro (10000)", "max(vendorsell,0c)"],
          ]}
        />

        <H3>4.2 · Baseline heredado (26 fuentes)</H3>
        <P>
          Las fuentes originales del pack se conservan <strong className="text-fog-100">textualmente</strong> bajo el prefijo{" "}
          <span className="font-mono text-[12px] text-gold-300">tsm_exchange_pack</span>: anclas (anchor, fair, fair_smooth), pisos
          (floor_vendor, floor_craft, hard_floor, base_floor), techo (soft_ceiling), precio sane, beneficios de crafteo
          (aggressive/target/conservative), límites de shopping y sniping, guardas de demanda y los tres puntos de
          subasta (auction_min/norm/max).
        </P>
        <Code lang="tsm · ejemplo baseline">{`tsm_exchange_pack_anchor:
  avg(dbmarket,dbrecent,dbregionmarketavg,dbregionhistorical,dbhistorical,dbregionsaleavg)

tsm_exchange_pack_auction_norm:
  ifgte(tsm_exchange_pack_demand_guard,1,
    round(max(tsm_exchange_pack_sane_price*1.00,tsm_exchange_pack_craft_profit_target),1c),
    max(tsm_exchange_pack_auction_min,tsm_exchange_pack_hard_floor*1.10))`}</Code>

        <H3>4.3 · Filtros exactos v2 (14 fuentes)</H3>
        <Tbl
          head={["Fuente", "Fórmula", "Rol"]}
          rows={Object.entries(V2_SOURCES).map(([k, f]) => [
            k.replace("tsm_exchange_pack_", ""),
            <span key={k} className="break-all text-fog-400">{f}</span>,
            k.includes("guard") ? "guarda binaria" : k.includes("index") ? "índice compuesto" : k.includes("momentum") ? "direccionalidad" : "métrica",
          ])}
        />
        <P>
          El <span className="font-mono text-[12px] text-gold-300">quality_gate</span> es el producto lógico de las guardas de
          volatilidad (spread &lt; 35 %), región (divergencia &lt; 60 %) e inventario (&lt; 21 días). Cuando bloquea, los puntos
          de subasta IA conmutan a una rama defensiva anclada al piso duro.
        </P>

        <H3>4.4 · Baseline dinámico</H3>
        <P>
          Desde v2.4 el baseline equilibrado deja de ser estático: la función{" "}
          <span className="font-mono text-[12px]">dynamicBaseline()</span> deriva los coeficientes según el régimen detectado
          (dump ⇒ sube pisos y recorta normal; prima ⇒ eleva máximos; volatilidad ⇒ reduce shopping/snipe) y la
          estrategia <em>Balanced Evo</em> los materializa en fórmulas. Cada re-entrenamiento incrementa la generación
          y los nombres de perfil evolucionan (<span className="font-mono text-[12px]">…_g2:balanced</span>), con genealogía
          trazable en <span className="font-mono text-[12px]">meta.lineage</span>.
        </P>

        {/* 05 */}
        <H2 id="ml" n="05">Capa ML/AI</H2>
        <Tbl
          head={["Feature", "Cálculo", "Interpretación"]}
          rows={[
            ["liquidez", "salerate / 0.25", "facilidad de venta"],
            ["demanda", "salerate×2.2 + volumen", "rotación del objeto"],
            ["volatilidad", "spread / dbmarket", "fiabilidad del precio"],
            ["momento", "dbrecent vs dbhistorical", "tendencia de corto plazo"],
            ["estabilidad", "1 − volatilidad − divergencia", "ruido del mercado"],
            ["margen", "(fair − hard_floor) / fair", "colchón de crafteo"],
            ["inventario (días)", "numinventory / soldperday", "presión de stock"],
            ["dump risk", "buyout < 70 % market", "guerra de precios"],
            ["premium gap", "buyout > 115 % market", "escasez capturada"],
            ["divergencia regional", "|market − regionavg| / regionavg", "arbitraje entre reinos"],
          ]}
        />
        <P>
          El optimizador maximiza una función objetivo compuesta por el oro diario esperado (venta a normal vs.
          undercut), una penalización por aversión al riesgo y un término de sniping opcional. Hill-climbing con
          templado explora 7 coeficientes dentro de sus rangos; la semilla fija hace el resultado{" "}
          <strong className="text-fog-100">reproducible</strong>. Monte Carlo (480 simulaciones × 14 días) estima la
          distribución de oro: media, p10, p90 y desviación, base del veredicto «recomendada».
        </P>

        {/* 06 */}
        <H2 id="pack" n="06">Formato del pack</H2>
        <P>El artefacto exportable es un JSON con esta estructura de primer nivel:</P>
        <Code lang="json">{`{
  "generated_at": "2026-07-28T13:23:26Z",
  "engine": { "name": "QuantForge·TSM", "math_core": "…", "ml_core": "…" },
  "dynamic_baseline": { "generation": 3, "version": "v2.4.3", "coefficients": { }, "deltas_vs_static": [ ] },
  "market_snapshot": { "inputs": { }, "computed": { } },
  "tsm_profiles": [
    {
      "name": "tsm_exchange_pack_g3:balanced",
      "auctioning": { "min": "…", "normal": "…", "max": "…", "…": "…" },
      "shopping":  { "max_price": "…", "…": "…" },
      "sniping":   { "max_price": "…", "…": "…" },
      "crafting":  { "craft_value_ai": "…", "…": "…" },
      "vendor":    { "…": "…" },
      "meta": {
        "custom_source_prefix": "…",
        "custom_sources": { "40+ fuentes validadas": "…" },
        "multi_formula": { "min": ["…_min_aggr", "…_min_target"], "normal": ["…"], "max": ["…"] },
        "lineage": ["…_g3:…", "…_g2:…", "…_g1:…"],
        "validation": { "formulas": 62, "errors": 0 },
        "ai": { "regime": "…", "coefficients": { }, "expected_14d_gold": { } }
      }
    }
  ]
}`}</Code>
        <Callout tone="mint" title="Garantía de validez">
          Antes de exportar, cada fórmula del pack atraviesa el validador: sintaxis, aridad de funciones e
          identificadores resueltos contra fuentes base de TSM o custom sources declaradas. El pack solo se emite con{" "}
          <span className="font-mono text-[12px]">errors: 0</span>.
        </Callout>

        {/* 07 */}
        <H2 id="importar" n="07">Importar a TSM</H2>
        <P>
          <strong className="text-fog-100">1.</strong> En el juego, abre TSM → Opciones → <em>Custom Price Sources</em> y crea
          cada fuente de <span className="font-mono text-[12px]">meta.custom_sources</span> con su nombre exacto y su fórmula
          (botón «Copiar fuentes» del panel de perfiles).
          <br />
          <strong className="text-fog-100">2.</strong> Crea las operaciones de Auctioning/Shopping/Sniping y asigna a los
          campos de precio las fuentes correspondientes (<span className="font-mono text-[12px]">min</span>,{" "}
          <span className="font-mono text-[12px]">normal</span>, <span className="font-mono text-[12px]">max</span>,{" "}
          <span className="font-mono text-[12px]">shoppingopmax</span>…).
          <br />
          <strong className="text-fog-100">3.</strong> Elige la variante de cada punto de operación desde{" "}
          <span className="font-mono text-[12px]">meta.multi_formula</span> según tu tolerancia al riesgo.
          <br />
          <strong className="text-fog-100">4.</strong> Re-escanea la casa de subastas: las guardas (quality_gate, demand_guard,
          dump_guard) conmutan las ramas automáticamente.
        </P>

        {/* 08 */}
        <H2 id="seguridad" n="08">Seguridad y privacidad</H2>
        <Tbl
          head={["Dato", "Dónde reside", "A dónde viaja"]}
          rows={[
            ["Clave TSM / credenciales Battle.net", "localStorage del navegador", "solo a api.tradeskillmaster.com y *.battle.net"],
            ["Datos de mercado", "memoria de la pestaña", "—"],
            ["Perfiles exportados", "descarga local", "—"],
            ["Telemetría", "no existe", "—"],
          ]}
        />
        <Callout tone="risk" title="Buenas prácticas">
          Usa un cliente de Battle.net sin permisos adicionales (el scope por defecto basta) y rota tu clave de TSM si
          alguna vez la compartes. El código no escribe credenciales en la URL ni en logs exportables.
        </Callout>

        {/* 09 */}
        <H2 id="changelog" n="09">Changelog</H2>
        <Tbl
          head={["Versión", "Fecha", "Cambios"]}
          rows={[
            ["v2.5.0 «live-api»", "2026-07-28", "Conectores reales TSM Public Data + REST + Battle.net; fin del hardcoding; panel de conexión con bitácora; documentación completa"],
            ["v2.4.0", "2026-07-28", "Baseline dinámico por régimen, nombres evolutivos gN, multi-fórmulas y validador TSM"],
            ["v2.0.0", "2026-07-20", "14 filtros exactos v2, quality_gate, núcleo quantforge-ml (hill-climbing + Monte Carlo)"],
            ["v1.0.0", "2026-07-05", "Baseline heredado: 26 fuentes y 3 perfiles (balanced / fast_liquidity / premium)"],
          ]}
        />

        {/* 10 */}
        <H2 id="faq" n="10">FAQ</H2>
        {[
          ["¿Necesito cuenta de TSM para usar la app?", "No. Sin clave se usa TSM Public Data (CSV por reino, gratis e ilimitado). La clave solo habilita el endpoint REST con series regionales completas."],
          ["¿Por qué la búsqueda por nombre pide credenciales de Blizzard?", "El catálogo de objetos (nombres → ids) vive en la API oficial de Battle.net. El registro de desarrollador es gratuito y tarda dos minutos."],
          ["El navegador bloquea la petición, ¿qué hago?", "Configura el proxy opcional (§3.4) con un Worker bajo tu control, o usa un navegador/entorno sin restricción CORS."],
          ["¿Los perfiles son compatibles con TSM 4/5?", "Sí: solo usan fuentes de precio nativas (dbmarket, vendorsell, crafting…) y funciones documentadas de custom price sources."],
          ["¿Puedo reproducir un resultado exacto?", "Sí: fija la semilla y las iteraciones del panel de datos. El optimizador es determinista para una misma entrada."],
          ["¿Qué pasa si el objeto no está en el CSV del reino?", "El conector devuelve un error NOT_FOUND con el reino probado; elige otro reino conectado o activa la API REST con clave, que cubre toda la región."],
        ].map(([q, a]) => (
          <details key={q} className="group mb-2 rounded-md border border-line-800 bg-ink-900/50 px-4 py-3 open:border-gold-500/40">
            <summary className="cursor-pointer list-none font-display text-[13.5px] font-semibold text-fog-200 transition-colors group-open:text-gold-300">
              <span className="mr-2 text-gold-500">?</span>
              {q}
            </summary>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fog-400">{a}</p>
          </details>
        ))}
      </article>
    </div>
  );
}
