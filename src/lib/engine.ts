/* ============================================================
   QuantForge·TSM — Motor matemático
   Parser + evaluador de expresiones TSM (price sources)
   Soporta: + - * / ( ) , números con sufijo c/s/g,
   funciones avg/min/max/first/round/rounddown/roundup/abs/sqrt/
   pow/clamp/ifgt/iflt/ifgte/iflte/ifeq/convert y referencias
   a variables de mercado + custom sources con resolución
   memoizada y detección de ciclos.
   ============================================================ */

export type Ast =
  | { t: "num"; v: number }
  | { t: "id"; n: string }
  | { t: "neg"; e: Ast }
  | { t: "bin"; op: "+" | "-" | "*" | "/"; l: Ast; r: Ast }
  | { t: "call"; n: string; args: Ast[] };

const SUFFIX: Record<string, number> = { c: 1, s: 100, g: 10000 };

function tokenize(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const next = src[j];
      if (next && /[csg]/i.test(next) && !/[a-zA-Z0-9_]/.test(src[j + 1] ?? "")) {
        out.push(src.slice(i, j + 1).toLowerCase());
        i = j + 1;
      } else {
        out.push(src.slice(i, j));
        i = j;
      }
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      out.push(src.slice(i, j));
      i = j;
      continue;
    }
    if ("+-*/(),".includes(ch)) { out.push(ch); i++; continue; }
    throw new Error(`Token no válido "${ch}" en: ${src}`);
  }
  return out;
}

export function parseExpr(src: string): Ast {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];

  function primary(): Ast {
    const tk = next();
    if (tk === undefined) throw new Error(`Expresión incompleta: ${src}`);
    if (tk === "(") {
      const e = expr();
      if (next() !== ")") throw new Error(`Falta ")" en: ${src}`);
      return e;
    }
    if (/^[0-9.]/.test(tk)) {
      const m = tk.match(/^([0-9.]+)([csg])?$/);
      if (!m) throw new Error(`Número no válido "${tk}"`);
      return { t: "num", v: parseFloat(m[1]) * (m[2] ? SUFFIX[m[2]] : 1) };
    }
    if (/^[a-zA-Z_]/.test(tk)) {
      if (peek() === "(") {
        next(); // consume "("
        const args: Ast[] = [];
        if (peek() !== ")") {
          args.push(expr());
          while (peek() === ",") { next(); args.push(expr()); }
        }
        if (next() !== ")") throw new Error(`Falta ")" en función ${tk}`);
        return { t: "call", n: tk.toLowerCase(), args };
      }
      return { t: "id", n: tk.toLowerCase() };
    }
    throw new Error(`Token inesperado "${tk}" en: ${src}`);
  }

  function unary(): Ast {
    if (peek() === "-") { next(); return { t: "neg", e: unary() }; }
    if (peek() === "+") { next(); return unary(); }
    return primary();
  }

  function term(): Ast {
    let l = unary();
    while (peek() === "*" || peek() === "/") {
      const op = next() as "*" | "/";
      l = { t: "bin", op, l, r: unary() };
    }
    return l;
  }

  function expr(): Ast {
    let l = term();
    while (peek() === "+" || peek() === "-") {
      const op = next() as "+" | "-";
      l = { t: "bin", op, l, r: term() };
    }
    return l;
  }

  const ast = expr();
  if (p < toks.length) throw new Error(`Entrada residual en: ${src}`);
  return ast;
}

export class MathEngine {
  private parseCache = new Map<string, Ast>();
  private valueCache = new Map<string, number>();
  private visiting = new Set<string>();

  constructor(
    public vars: Record<string, number>,
    public customs: Record<string, string>,
  ) {}

  private ast(src: string): Ast {
    let a = this.parseCache.get(src);
    if (!a) { a = parseExpr(src); this.parseCache.set(src, a); }
    return a;
  }

  resolve(id: string): number {
    if (id in this.vars) return this.vars[id];
    if (id in this.customs) return this.source(id);
    return 0;
  }

  source(name: string): number {
    const cached = this.valueCache.get(name);
    if (cached !== undefined) return cached;
    if (name in this.vars) return this.vars[name];
    const formula = this.customs[name];
    if (!formula || this.visiting.has(name)) return 0;
    this.visiting.add(name);
    let v = this.node(this.ast(formula));
    this.visiting.delete(name);
    if (!Number.isFinite(v)) v = 0;
    this.valueCache.set(name, v);
    return v;
  }

  private callFn(name: string, args: Ast[]): number {
    if (name === "convert") {
      return this.vars.convert_value ?? this.node(args[0] ?? { t: "num", v: 0 });
    }
    const a = args.map((x) => this.node(x));
    switch (name) {
      case "avg": return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
      case "sum": return a.reduce((s, x) => s + x, 0);
      case "min": return a.length ? Math.min(...a) : 0;
      case "max": return a.length ? Math.max(...a) : 0;
      case "first": return a.find((x) => x > 0) ?? 0;
      case "round": return Math.round(a[0] / (a[1] ?? 1)) * (a[1] ?? 1);
      case "rounddown": return Math.floor(a[0] / (a[1] ?? 1)) * (a[1] ?? 1);
      case "roundup": return Math.ceil(a[0] / (a[1] ?? 1)) * (a[1] ?? 1);
      case "abs": return Math.abs(a[0]);
      case "sqrt": return Math.sqrt(Math.max(0, a[0]));
      case "pow": return Math.pow(a[0], a[1] ?? 1);
      case "clamp": return Math.min(a[2] ?? 1, Math.max(a[1] ?? 0, a[0]));
      case "ifgt": return a[0] > a[1] ? a[2] : a[3];
      case "iflt": return a[0] < a[1] ? a[2] : a[3];
      case "ifgte": return a[0] >= a[1] ? a[2] : a[3];
      case "iflte": return a[0] <= a[1] ? a[2] : a[3];
      case "ifeq": return a[0] === a[1] ? a[2] : a[3];
      default: return 0;
    }
  }

  private node(n: Ast): number {
    switch (n.t) {
      case "num": return n.v;
      case "id": return this.resolve(n.n);
      case "neg": return -this.node(n.e);
      case "bin": {
        const l = this.node(n.l), r = this.node(n.r);
        if (n.op === "+") return l + r;
        if (n.op === "-") return l - r;
        if (n.op === "*") return l * r;
        return r === 0 ? 0 : l / r;
      }
      case "call": return this.callFn(n.n, n.args);
    }
  }
}

export function evaluateAll(
  vars: Record<string, number>,
  customs: Record<string, string>,
): Record<string, number> {
  const e = new MathEngine(vars, customs);
  const out: Record<string, number> = {};
  for (const k of Object.keys(customs)) out[k] = e.source(k);
  return out;
}

/* ============================================================
   Definición de fuentes — baseline heredado + filtros exactos v2
   + nuevas fuentes de generación de datos de mercado en tiempo real
   ============================================================ */

const P = "tsm_exchange_pack";

export const BASE_SOURCES: Record<string, string> = {
  [`${P}_anchor`]: "avg(dbmarket,dbrecent,dbregionmarketavg,dbregionhistorical,dbhistorical,dbregionsaleavg)",
  [`${P}_liquid_guard`]: "iflt(dbregionsalerate,0.05,0,1)",
  [`${P}_volume_guard`]: "iflt(dbregionsoldperday,0.15,0,1)",
  [`${P}_demand_guard`]: `min(${P}_liquid_guard,${P}_volume_guard)`,
  [`${P}_fair`]: "first(dbminbuyout,dbmarket,dbrecent,dbregionmarketavg,dbhistorical)",
  [`${P}_fair_smooth`]: `avg(${P}_fair,${P}_anchor)`,
  [`${P}_floor_vendor`]: "max(vendorsell,0c)",
  [`${P}_floor_craft`]: "max(crafting,matprice)",
  [`${P}_hard_floor`]: `max(${P}_floor_vendor,destroy,${P}_floor_craft)`,
  [`${P}_base_floor`]: `max(${P}_hard_floor,round(${P}_fair_smooth*0.20,1c))`,
  [`${P}_soft_ceiling`]: `round(${P}_fair_smooth*2.50,1c)`,
  [`${P}_sane_price`]: `min(${P}_soft_ceiling,max(${P}_base_floor,${P}_fair_smooth))`,
  [`${P}_craft_profit_target`]: `round(max(${P}_floor_craft*1.18,${P}_hard_floor*1.10,${P}_sane_price*0.95),1c)`,
  [`${P}_craft_profit_aggressive`]: `round(max(${P}_floor_craft*1.10,${P}_hard_floor*1.05,${P}_sane_price*0.85),1c)`,
  [`${P}_craft_profit_conservative`]: `round(max(${P}_floor_craft*1.30,${P}_hard_floor*1.12,${P}_sane_price*1.05),1c)`,
  [`${P}_shopping_max_safe`]: `rounddown(min(${P}_sane_price*0.75,${P}_fair_smooth*0.70,${P}_floor_craft*0.85),1c)`,
  [`${P}_shopping_max_flip`]: `rounddown(min(${P}_sane_price*0.85,${P}_fair_smooth*0.80),1c)`,
  [`${P}_shopping_max_convert`]: `rounddown(min(convert(dbmarket)*0.90,${P}_sane_price*0.80),1c)`,
  [`${P}_shopping_max`]: `max(0c,max(${P}_shopping_max_safe,${P}_shopping_max_flip,${P}_shopping_max_convert))`,
  [`${P}_sniper_max_value`]: `rounddown(min(${P}_sane_price*0.55,${P}_fair_smooth*0.50,${P}_floor_craft*0.65),1c)`,
  [`${P}_sniper_max`]: `max(0c,${P}_sniper_max_value)`,
  [`${P}_premium_guard`]: "ifgt(dbminbuyout-dbmarket,dbmarket*0.15,1,0)",
  [`${P}_dump_guard`]: "iflt(dbminbuyout,dbmarket*0.70,1,0)",
  [`${P}_auction_min`]: `ifgte(${P}_demand_guard,1,round(max(${P}_base_floor,${P}_sane_price*0.75,${P}_craft_profit_aggressive),1c),max(${P}_base_floor,${P}_hard_floor*1.05))`,
  [`${P}_auction_norm`]: `ifgte(${P}_demand_guard,1,round(max(${P}_sane_price*1.00,${P}_craft_profit_target),1c),max(${P}_auction_min,${P}_hard_floor*1.10))`,
  [`${P}_auction_max`]: `ifgte(${P}_demand_guard,1,round(max(${P}_sane_price*1.60,${P}_craft_profit_conservative),1c),max(${P}_auction_norm,${P}_hard_floor*1.15))`,
};

/* Filtros exactos v2 — nuevos parámetros del motor */
export const V2_SOURCES: Record<string, string> = {
  [`${P}_spread_abs`]: "abs(dbminbuyout-dbmarket)",
  [`${P}_spread_ratio`]: `ifgt(dbmarket,0,${P}_spread_abs/dbmarket,0)`,
  [`${P}_volatility_guard`]: `iflt(${P}_spread_ratio,0.35,1,0)`,
  [`${P}_region_divergence`]: "abs(dbmarket-dbregionmarketavg)",
  [`${P}_region_guard`]: `iflt(${P}_region_divergence,max(dbregionmarketavg*0.60,1c),1,0)`,
  [`${P}_momentum_raw`]: "ifgt(dbhistorical,0,(dbrecent-dbhistorical)/dbhistorical,0)",
  [`${P}_momentum`]: `ifgt(${P}_momentum_raw,0.02,1,iflt(${P}_momentum_raw,-0.02,-1,0))`,
  [`${P}_inventory_days`]: "ifgt(dbregionsoldperday,0.01,numinventory/dbregionsoldperday,99)",
  [`${P}_inventory_guard`]: `iflt(${P}_inventory_days,21,1,0)`,
  [`${P}_quality_gate`]: `min(min(${P}_volatility_guard,${P}_region_guard),${P}_inventory_guard)`,
  [`${P}_stability_index`]: `round((1-min(${P}_spread_ratio,1))*100,1)`,
  [`${P}_liquidity_index`]: "round(min(dbregionsalerate/0.25,1)*100,1)",
  [`${P}_demand_index`]: "round(min((dbregionsalerate*2+min(dbregionsoldperday,3)/3)/2,1)*100,1)",
  [`${P}_edge_index`]: `ifgt(${P}_fair_smooth,0,round((${P}_fair_smooth-${P}_hard_floor)/${P}_fair_smooth*100,1),0)`,
};

/* NUEVAS FUENTES DE DATOS DE MERCADO EN TIEMPO REAL - v3 */
export const V3_REALTIME_SOURCES: Record<string, string> = {
  /* Análisis de tendencia temporal */
  [`${P}_trend_short`]: "ifgt(dbrecent,dbhistorical,1,iflt(dbrecent,dbhistorical,-1,0))",
  [`${P}_trend_region`]: "ifgt(dbmarket,dbregionmarketavg,1,iflt(dbmarket,dbregionmarketavg,-1,0))",
  [`${P}_trend_momentum_pct`]: "ifgt(dbhistorical,0,(dbrecent-dbhistorical)/dbhistorical*100,0)",
  
  /* Métricas de rotación de inventario */
  [`${P}_turnover_rate`]: "ifgt(numinventory,0,dbregionsoldperday*numinventory/numinventory,0)",
  [`${P}_days_to_sell`]: "ifgt(dbregionsoldperday,0.01,numinventory/dbregionsoldperday,999)",
  [`${P}_stock_pressure`]: "ifgt(numinventory,100,ifgt(dbregionsoldperday,1,0,1),0)",
  
  /* Análisis de margen y rentabilidad */
  [`${P}_margin_absolute`]: "max(0c,dbminbuyout-crafting)",
  [`${P}_margin_pct`]: "ifgt(crafting,0,(dbminbuyout-crafting)/crafting*100,0)",
  [`${P}_roi_craft`]: "ifgt(matprice,0,(dbmarket-matprice)/matprice*100,0)",
  [`${P}_roi_flip`]: "ifgt(avgbuy,0,(dbminbuyout-avgbuy)/avgbuy*100,0)",
  
  /* Indicadores de oportunidad */
  [`${P}_arbitrage_signal`]: "ifgt(${P}_region_divergence,dbmarket*0.30,1,0)",
  [`${P}_buy_signal`]: "ifgt(${P}_margin_pct,25,ifgt(${P}_liquid_guard,1,1,0),0)",
  [`${P}_sell_signal`]: "ifgt(${P}_momentum,0,ifgt(dbregionsalerate,0.08,1,0),0)",
  
  /* Métricas de riesgo avanzado */
  [`${P}_crash_risk`]: "iflt(dbrecent,dbhistorical*0.85,ifgt(dbregionsoldperday,0.5,1,0),0)",
  [`${P}_saturation_index`]: "min(numinventory/(dbregionsoldperday*10+1),10)",
  [`${P}_competition_idx`]: "ifgt(dbregionsalerate,0.20,iflt(${P}_margin_pct,15,1,0),0)",
  
  /* Fuentes compuestas de decisión */
  [`${P}_opportunity_score`]: `avg(${P}_buy_signal,${P}_sell_signal,ifgt(${P}_arbitrage_signal,0,1,0))`,
  [`${P}_risk_score`]: `avg(${P}_crash_risk,${P}_competition_idx,min(${P}_saturation_index/10,1))`,
  [`${P}_action_signal`]: `ifgt(${P}_opportunity_score,0.66,iflt(${P}_risk_score,0.33,1,0),0)`,
};

/* Fuentes ajustadas por IA para un prefijo y coeficientes dados */
export function tunedSources(prefix: string, c: Record<string, number>): Record<string, string> {
  const n = (x: number) => String(Math.round(x * 1000) / 1000);
  return {
    [`${prefix}_floor_ai`]: `max(${P}_hard_floor,round(${P}_fair_smooth*${n(c.floorPct)},1c))`,
    [`${prefix}_ceiling_ai`]: `round(${P}_fair_smooth*${n(c.ceilingMult)},1c)`,
    [`${prefix}_sane_ai`]: `min(${prefix}_ceiling_ai,max(${prefix}_floor_ai,${P}_fair_smooth))`,
    [`${prefix}_auction_min_ai`]: `ifgte(${P}_quality_gate,1,round(max(${prefix}_floor_ai,${prefix}_sane_ai*${n(c.minMult)},${P}_craft_profit_aggressive),1c),max(${P}_base_floor,${P}_hard_floor*1.05))`,
    [`${prefix}_auction_norm_ai`]: `ifgte(${P}_quality_gate,1,round(max(${prefix}_sane_ai*${n(c.normMult)},${P}_craft_profit_target),1c),max(${prefix}_auction_min_ai,${P}_hard_floor*1.10))`,
    [`${prefix}_auction_max_ai`]: `ifgte(${P}_quality_gate,1,round(max(${prefix}_sane_ai*${n(c.maxMult)},${P}_craft_profit_conservative),1c),max(${prefix}_auction_norm_ai,${P}_hard_floor*1.15))`,
    [`${prefix}_momentum_norm`]: `ifgt(${P}_momentum,0,round(${prefix}_auction_norm_ai*1.06,1c),iflt(${P}_momentum,0,round(${prefix}_auction_norm_ai*0.96,1c),${prefix}_auction_norm_ai))`,
    [`${prefix}_shopping_max_ai`]: `rounddown(min(${prefix}_sane_ai*${n(c.shoppingPct)},${P}_fair_smooth*${n(c.shoppingPct * 0.94)},${P}_floor_craft*0.85),1c)`,
    [`${prefix}_sniper_max_ai`]: `rounddown(min(${prefix}_sane_ai*${n(c.snipePct)},${P}_fair_smooth*${n(c.snipePct * 0.9)},${P}_floor_craft*0.65),1c)`,
    [`${prefix}_undercut_defense`]: `iflt(dbminbuyout,${prefix}_auction_min_ai,${prefix}_auction_min_ai,${prefix}_auction_norm_ai)`,
  };
}

export const FULL_SOURCES: Record<string, string> = { ...BASE_SOURCES, ...V2_SOURCES, ...V3_REALTIME_SOURCES };

export interface SourceGroup {
  label: string;
  keys: string[];
  guard?: boolean;
  ratio?: string[];
  index?: boolean;
}

export const SOURCE_GROUPS: SourceGroup[] = [
  { label: "Anclas de valor", keys: [`${P}_anchor`, `${P}_fair`, `${P}_fair_smooth`, `${P}_sane_price`] },
  { label: "Pisos y techos", keys: [`${P}_floor_vendor`, `${P}_floor_craft`, `${P}_hard_floor`, `${P}_base_floor`, `${P}_soft_ceiling`] },
  { label: "Subasta · auctioning", keys: [`${P}_auction_min`, `${P}_auction_norm`, `${P}_auction_max`] },
  { label: "Compras · shopping", keys: [`${P}_shopping_max_safe`, `${P}_shopping_max_flip`, `${P}_shopping_max_convert`, `${P}_shopping_max`] },
  { label: "Sniping", keys: [`${P}_sniper_max_value`, `${P}_sniper_max`] },
  { label: "Crafteo y margen", keys: [`${P}_craft_profit_aggressive`, `${P}_craft_profit_target`, `${P}_craft_profit_conservative`] },
  { label: "Guardas de demanda · baseline", keys: [`${P}_liquid_guard`, `${P}_volume_guard`, `${P}_demand_guard`, `${P}_premium_guard`, `${P}_dump_guard`], guard: true },
  { label: "Filtros exactos · v2", keys: [`${P}_spread_ratio`, `${P}_volatility_guard`, `${P}_region_divergence`, `${P}_region_guard`, `${P}_momentum`, `${P}_inventory_days`, `${P}_inventory_guard`, `${P}_quality_gate`], guard: true, ratio: [`${P}_spread_ratio`, `${P}_momentum`] },
  { label: "Índices compuestos · IA", keys: [`${P}_liquidity_index`, `${P}_demand_index`, `${P}_stability_index`, `${P}_edge_index`], index: true },
  { label: "Tendencias · v3 realtime", keys: [`${P}_trend_short`, `${P}_trend_region`, `${P}_trend_momentum_pct`], ratio: [`${P}_trend_momentum_pct`] },
  { label: "Rotación inventario · v3", keys: [`${P}_turnover_rate`, `${P}_days_to_sell`, `${P}_stock_pressure`] },
  { label: "Márgenes y ROI · v3", keys: [`${P}_margin_absolute`, `${P}_margin_pct`, `${P}_roi_craft`, `${P}_roi_flip`], ratio: [`${P}_margin_pct`, `${P}_roi_craft`, `${P}_roi_flip`] },
  { label: "Señales de mercado · v3", keys: [`${P}_arbitrage_signal`, `${P}_buy_signal`, `${P}_sell_signal`, `${P}_action_signal`], guard: true },
  { label: "Riesgo avanzado · v3", keys: [`${P}_crash_risk`, `${P}_saturation_index`, `${P}_competition_idx`, `${P}_risk_score`], ratio: [`${P}_risk_score`] },
  { label: "Scores de decisión · v3", keys: [`${P}_opportunity_score`, `${P}_risk_score`, `${P}_action_signal`], index: true },
];

export const GUARD_KEYS = new Set(
  SOURCE_GROUPS.filter((g) => g.guard).flatMap((g) => g.keys),
);

export const shortName = (k: string) => k.replace(`${P}_`, "");
