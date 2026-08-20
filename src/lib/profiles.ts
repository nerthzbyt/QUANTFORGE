/* ============================================================
   QuantForge·TSM — Generador de perfiles completos
   Baseline heredado (exacto) + estrategias IA con nuevos
   parámetros y filtros de precisión.
   ============================================================ */

import { BASE_SOURCES, V2_SOURCES, tunedSources } from "./engine";
import type { Coeffs, Features, Regime, TrainResult } from "./ai";
import { BASELINE_COEFFS } from "./ai";

const P = "tsm_exchange_pack";

/* ---------------- presets de mercado ---------------- */

export interface Preset {
  id: string;
  label: string;
  desc: string;
  data: Record<string, number>;
}

export const PRESETS: Preset[] = [
  {
    id: "potion",
    label: "Poción de flujo",
    desc: "demanda alta · líquido",
    data: {
      dbmarket: 18500, dbminbuyout: 19200, dbrecent: 19600, dbhistorical: 17400,
      dbregionmarketavg: 18900, dbregionhistorical: 17800, dbregionsaleavg: 19100,
      dbregionsalerate: 0.16, dbregionsoldperday: 2.4,
      vendorsell: 350, vendorbuy: 900, avgbuy: 15200, crafting: 9800, matprice: 10400,
      destroy: 2600, convert_value: 4200, numinventory: 18,
    },
  },
  {
    id: "scale",
    label: "Escama dracónica",
    desc: "volátil · spread amplio",
    data: {
      dbmarket: 92000, dbminbuyout: 134000, dbrecent: 88000, dbhistorical: 97000,
      dbregionmarketavg: 95000, dbregionhistorical: 93000, dbregionsaleavg: 91000,
      dbregionsalerate: 0.07, dbregionsoldperday: 0.6,
      vendorsell: 1200, vendorbuy: 3000, avgbuy: 84000, crafting: 0, matprice: 0,
      destroy: 18000, convert_value: 0, numinventory: 26,
    },
  },
  {
    id: "cloth",
    label: "Tela sombría",
    desc: "estancado · sobrestock",
    data: {
      dbmarket: 5400, dbminbuyout: 5600, dbrecent: 5300, dbhistorical: 5500,
      dbregionmarketavg: 5450, dbregionhistorical: 5400, dbregionsaleavg: 5380,
      dbregionsalerate: 0.018, dbregionsoldperday: 0.12,
      vendorsell: 250, vendorbuy: 600, avgbuy: 4800, crafting: 3900, matprice: 4100,
      destroy: 900, convert_value: 1500, numinventory: 96,
    },
  },
  {
    id: "gem",
    label: "Gema facetada",
    desc: "divergencia regional · prima",
    data: {
      dbmarket: 41000, dbminbuyout: 61000, dbrecent: 44000, dbhistorical: 39000,
      dbregionmarketavg: 78000, dbregionhistorical: 72000, dbregionsaleavg: 74500,
      dbregionsalerate: 0.09, dbregionsoldperday: 0.8,
      vendorsell: 900, vendorbuy: 2200, avgbuy: 38000, crafting: 29500, matprice: 30200,
      destroy: 12000, convert_value: 22000, numinventory: 12,
    },
  },
  {
    id: "oil",
    label: "Aceite de brujo",
    desc: "dump detectado",
    data: {
      dbmarket: 12400, dbminbuyout: 6200, dbrecent: 11800, dbhistorical: 13100,
      dbregionmarketavg: 12600, dbregionhistorical: 12400, dbregionsaleavg: 12300,
      dbregionsalerate: 0.11, dbregionsoldperday: 1.6,
      vendorsell: 400, vendorbuy: 950, avgbuy: 10200, crafting: 7600, matprice: 7900,
      destroy: 2100, convert_value: 3600, numinventory: 34,
    },
  },
];

export interface FieldGroup { label: string; fields: { key: string; label: string }[]; }

export const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Precios de mercado",
    fields: [
      { key: "dbmarket", label: "dbmarket" },
      { key: "dbminbuyout", label: "dbminbuyout" },
      { key: "dbrecent", label: "dbrecent" },
      { key: "dbhistorical", label: "dbhistorical" },
    ],
  },
  {
    label: "Datos regionales",
    fields: [
      { key: "dbregionmarketavg", label: "dbregionmarketavg" },
      { key: "dbregionhistorical", label: "dbregionhistorical" },
      { key: "dbregionsaleavg", label: "dbregionsaleavg" },
    ],
  },
  {
    label: "Suelos y costes",
    fields: [
      { key: "vendorsell", label: "vendorsell" },
      { key: "vendorbuy", label: "vendorbuy" },
      { key: "avgbuy", label: "avgbuy" },
      { key: "crafting", label: "crafting" },
      { key: "matprice", label: "matprice" },
      { key: "destroy", label: "destroy" },
      { key: "convert_value", label: "convert (valor)" },
    ],
  },
];

/* ---------------- baseline heredado (secciones exactas) ---------------- */

const AUCT_COMMON = {
  auctioningopmin: `${P}_auction_min`,
  auctioningopnormal: `${P}_auction_norm`,
  auctioningopmax: `${P}_auction_max`,
  fallback: `max(${P}_base_floor,${P}_hard_floor*1.08)`,
  post_cap_guard: `ifgt(numinventory,200,${P}_auction_norm*0.98,${P}_auction_norm)`,
  min_aggressive: `round(max(${P}_base_floor,${P}_sane_price*0.68,${P}_craft_profit_aggressive),1c)`,
  min_conservative: `round(max(${P}_base_floor,${P}_sane_price*0.85,${P}_craft_profit_target),1c)`,
  normal_aggressive: `round(max(${P}_sane_price*0.92,${P}_craft_profit_aggressive),1c)`,
  normal_premium: `round(max(${P}_sane_price*1.15,${P}_craft_profit_conservative),1c)`,
  max_fast: `round(max(${P}_sane_price*1.25,${P}_craft_profit_target),1c)`,
  max_premium: `round(max(${P}_sane_price*2.20,${P}_craft_profit_conservative),1c)`,
  dump_defense_min: `ifgt(${P}_dump_guard,0,max(${P}_base_floor,${P}_hard_floor*1.02),${P}_auction_min)`,
  premium_capture_norm: `ifgt(${P}_premium_guard,0,round(max(${P}_sane_price*1.20,${P}_craft_profit_conservative),1c),${P}_auction_norm)`,
};

const SHOPPING = {
  max_price: `${P}_shopping_max`,
  shoppingopmax: `${P}_shopping_max`,
  max_price_safe: `${P}_shopping_max_safe`,
  max_price_flip: `${P}_shopping_max_flip`,
  max_price_convert: `${P}_shopping_max_convert`,
  restock_guard: `iflt(dbregionsalerate,0.03,0c,${P}_shopping_max)`,
  max_price_vendor_flip: `rounddown(min(${P}_floor_vendor*1.05,${P}_sane_price*0.55),1c)`,
  max_price_destroy: `rounddown(min(destroy*0.90,${P}_sane_price*0.70),1c)`,
  max_price_craft_input: `rounddown(min(${P}_floor_craft*0.65,${P}_sane_price*0.70),1c)`,
};

const SNIPING = {
  max_price: `${P}_sniper_max`,
  sniperopmax: `${P}_sniper_max`,
  max_price_value: `${P}_sniper_max_value`,
  max_price_liquid: `rounddown(min(${P}_sane_price*0.65,${P}_fair_smooth*0.60),1c)`,
  max_price_ultra: `rounddown(min(${P}_sane_price*0.40,${P}_fair_smooth*0.35,${P}_floor_craft*0.50),1c)`,
  max_price_convert: `rounddown(min(convert(dbmarket)*0.65,${P}_sane_price*0.55),1c)`,
};

const CRAFTING = {
  crafting_cost: `${P}_floor_craft`,
  mat_price: "matprice",
  mat_buy_cap_safe: `rounddown(min(${P}_sane_price*0.25,${P}_fair_smooth*0.22),1c)`,
  mat_buy_cap_fast: `rounddown(min(${P}_sane_price*0.32,${P}_fair_smooth*0.28),1c)`,
  destroy_value: "destroy",
  convert_value: "convert(dbmarket)",
  sell_value: `${P}_sane_price`,
  sell_value_floor: `${P}_base_floor`,
  sell_value_anchor: `${P}_fair_smooth`,
  craft_value_balanced: `${P}_craft_profit_target`,
  craft_value_aggressive: `${P}_craft_profit_aggressive`,
  craft_value_conservative: `${P}_craft_profit_conservative`,
  craft_value_floor: `${P}_base_floor`,
  craft_value_ceiling: `${P}_soft_ceiling`,
  craft_value_min_roi_10: `round(max(${P}_floor_craft*1.10,${P}_base_floor),1c)`,
  craft_value_min_roi_18: `round(max(${P}_floor_craft*1.18,${P}_base_floor),1c)`,
  craft_value_min_roi_30: `round(max(${P}_floor_craft*1.30,${P}_base_floor),1c)`,
  default_material_cost_method: "first(min(vendorbuy,avgbuy,dbminbuyout,dbmarket),dbregionmarketavg,dbhistorical)",
  default_craft_value_method: `round(max(crafting*1.10,${P}_anchor*0.95,${P}_fair_smooth*0.90),1c)`,
  auction_house_post_after_cut: `(${P}_auction_norm)/0.95`,
};

const VENDOR = {
  vendor_floor: `${P}_floor_vendor`,
  vendor_plus_fees_guard: `round(max(${P}_floor_vendor,${P}_floor_vendor*1.05),1c)`,
  vendor_flip_cap: `rounddown(min(${P}_floor_vendor*1.50,${P}_sane_price*0.60),1c)`,
};

const OPERATION_VARS = {
  auctioningopmin: "auctioningopmin",
  auctioningopnormal: "auctioningopnormal",
  auctioningopmax: "auctioningopmax",
  shoppingopmax: "shoppingopmax",
  sniperopmax: "sniperopmax",
};

/* ---------------- catálogo de estrategias ---------------- */

export interface StrategyDef {
  id: string;
  label: string;
  kind: "baseline" | "ia";
  desc: string;
}

export const STRATEGIES: StrategyDef[] = [
  { id: "balanced", label: "Balanced", kind: "baseline", desc: "referencia heredada del baseline" },
  { id: "fast_liquidity", label: "Fast Liquidity", kind: "baseline", desc: "rotación rápida, margen comprimido" },
  { id: "premium", label: "Premium", kind: "baseline", desc: "margen alto, ventas lentas" },
  { id: "adaptive_quant", label: "Adaptive Quant", kind: "ia", desc: "coeficientes calibrados por el optimizador" },
  { id: "sniper_quant", label: "Sniper Quant", kind: "ia", desc: "sesgo de compra agresiva a descuento" },
];

export function coeffsFor(id: string, train: TrainResult): Coeffs {
  if (id === "adaptive_quant") return train.adaptive;
  if (id === "sniper_quant") return train.sniper;
  return BASELINE_COEFFS[id] ?? BASELINE_COEFFS.balanced;
}

/* ---------------- construcción de perfiles ---------------- */

interface BuildCtx {
  env: Record<string, number>;
  src: Record<string, number>;
  feats: Features;
  regime: Regime;
  train: TrainResult;
  item: string;
  generatedAt: string;
}

const r2 = (x: number) => Math.round(x * 100) / 100;

function aiMetaBlock(id: string, ctx: BuildCtx): Record<string, unknown> {
  const coeffs = coeffsFor(id, ctx.train);
  const strat = ctx.train.strategies.find((s) => s.id === id);
  return {
    engine: "quantforge-ml",
    version: "2.4.0",
    model: "hill-climbing + monte-carlo",
    seed: ctx.train.seed,
    iterations: ctx.train.iterations,
    risk_aversion: ctx.train.aversion,
    regime: { label: ctx.regime.label, confidence: r2(ctx.regime.confidence), reasons: ctx.regime.reasons },
    features: {
      liquidity: r2(ctx.feats.liquidity),
      demand: r2(ctx.feats.demand),
      volatility: r2(ctx.feats.volatility),
      momentum: r2(ctx.feats.momentum),
      stability: r2(ctx.feats.stability),
      region_divergence: r2(ctx.feats.regionDiv),
      margin_pct: r2(ctx.feats.marginPct),
      inventory_days: r2(ctx.feats.inventoryDays),
      dump_risk: r2(ctx.feats.dumpRisk),
      premium_gap: r2(ctx.feats.premiumGap),
    },
    coefficients: coeffs,
    expected_14d_gold: strat
      ? { mean: r2(strat.mc.mean), p10: r2(strat.mc.p10), p90: r2(strat.mc.p90), std: r2(strat.mc.std) }
      : null,
    objective_score: strat ? strat.objectiveScore : null,
    delta_vs_balanced_pct: strat ? strat.deltaPct : null,
    recommended: ctx.train.recommended.id === id,
  };
}

export function buildProfile(id: string, ctx: BuildCtx): Record<string, unknown> {
  const def = STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];

  if (def.kind === "baseline") {
    const auct =
      id === "balanced"
        ? { min: `${P}_auction_min`, normal: `${P}_auction_norm`, max: `${P}_auction_max`, ...AUCT_COMMON }
        : id === "fast_liquidity"
          ? {
              min: AUCT_COMMON.min_aggressive,
              normal: AUCT_COMMON.normal_aggressive,
              max: AUCT_COMMON.max_fast,
              ...AUCT_COMMON,
            }
          : {
              min: AUCT_COMMON.min_conservative,
              normal: AUCT_COMMON.normal_premium,
              max: AUCT_COMMON.max_premium,
              ...AUCT_COMMON,
            };
    const metaFull = {
      custom_source_prefix: P,
      custom_sources: BASE_SOURCES,
      anchor: `${P}_anchor`,
      fair: `${P}_fair`,
      sane_price: `${P}_sane_price`,
      hard_floor: `${P}_hard_floor`,
      base_floor: `${P}_base_floor`,
      soft_ceiling: `${P}_soft_ceiling`,
      demand_guard: `${P}_demand_guard`,
      operation_vars: OPERATION_VARS,
    };
    const metaShort = {
      custom_source_prefix: P,
      custom_sources: BASE_SOURCES,
      anchor: `${P}_anchor`,
      sane_price: `${P}_sane_price`,
      hard_floor: `${P}_hard_floor`,
      demand_guard: `${P}_demand_guard`,
      operation_vars: OPERATION_VARS,
    };
    return {
      name: `${P}:${id}`,
      auctioning: auct,
      shopping: SHOPPING,
      sniping: SNIPING,
      crafting: CRAFTING,
      vendor: VENDOR,
      meta: id === "balanced" ? metaFull : metaShort,
    };
  }

  /* ---- estrategias IA: parámetros nuevos + filtros exactos ---- */
  const ap = `tsm_${id}`;
  const c = coeffsFor(id, ctx.train);
  const n = (x: number) => String(Math.round(x * 1000) / 1000);
  const sources = { ...BASE_SOURCES, ...V2_SOURCES, ...tunedSources(ap, c) };
  const roiMult = n(Math.max(1.1, c.normMult * 1.12));

  return {
    name: `${ap}:${id}`,
    auctioning: {
      ...AUCT_COMMON,
      min: `${ap}_auction_min_ai`,
      normal: `${ap}_auction_norm_ai`,
      max: `${ap}_auction_max_ai`,
      auctioningopmin: `${ap}_auction_min_ai`,
      auctioningopnormal: `${ap}_auction_norm_ai`,
      auctioningopmax: `${ap}_auction_max_ai`,
      fallback: `max(${P}_base_floor,${P}_hard_floor*1.08)`,
      post_cap_guard: `ifgt(numinventory,200,${ap}_auction_norm_ai*0.98,${ap}_auction_norm_ai)`,
      momentum_norm: `${ap}_momentum_norm`,
      undercut_defense: `${ap}_undercut_defense`,
      quality_gated_min: `${ap}_auction_min_ai`,
      premium_capture_ai: `ifgt(${P}_premium_guard,0,round(max(${ap}_sane_ai*1.20,${P}_craft_profit_conservative),1c),${ap}_auction_norm_ai)`,
      dump_defense_ai: `ifgt(${P}_dump_guard,0,max(${P}_base_floor,${P}_hard_floor*1.02),${ap}_auction_min_ai)`,
    },
    shopping: {
      ...SHOPPING,
      max_price: `${ap}_shopping_max_ai`,
      shoppingopmax: `${ap}_shopping_max_ai`,
      max_price_ai: `${ap}_shopping_max_ai`,
      restock_ai: `iflt(dbregionsalerate,0.03,0c,${ap}_shopping_max_ai)`,
      quality_gated_price: `ifgte(${P}_quality_gate,1,${ap}_shopping_max_ai,rounddown(${ap}_shopping_max_ai*0.80,1c))`,
    },
    sniping: {
      ...SNIPING,
      max_price: `${ap}_sniper_max_ai`,
      sniperopmax: `${ap}_sniper_max_ai`,
      max_price_ai: `${ap}_sniper_max_ai`,
      max_price_deep: `rounddown(min(${ap}_sane_ai*${n(c.snipePct * 0.72)},${P}_fair_smooth*${n(c.snipePct * 0.65)},${P}_floor_craft*0.50),1c)`,
      quality_gated_snipe: `ifgte(${P}_quality_gate,1,${ap}_sniper_max_ai,rounddown(${ap}_sniper_max_ai*0.75,1c))`,
    },
    crafting: {
      craft_value_ai: `round(max(${P}_floor_craft*${roiMult},${ap}_auction_min_ai),1c)`,
      mat_buy_cap_ai: `rounddown(min(${ap}_sane_ai*${n(c.shoppingPct * 0.33)},${P}_fair_smooth*0.25),1c)`,
      ...CRAFTING,
    },
    vendor: {
      vendor_dump_guard: `ifgt(${P}_dump_guard,0,round(${P}_floor_vendor*1.10,1c),${P}_floor_vendor)`,
      ...VENDOR,
    },
    meta: {
      custom_source_prefix: ap,
      inherited_source_prefix: P,
      custom_sources: sources,
      anchor: `${P}_anchor`,
      fair: `${P}_fair`,
      sane_price: `${ap}_sane_ai`,
      hard_floor: `${P}_hard_floor`,
      base_floor: `${P}_base_floor`,
      soft_ceiling: `${ap}_ceiling_ai`,
      demand_guard: `${P}_demand_guard`,
      quality_gate: `${P}_quality_gate`,
      operation_vars: OPERATION_VARS,
      ai: aiMetaBlock(id, ctx),
    },
  };
}

export function buildPack(ctx: BuildCtx): Record<string, unknown> {
  const s = ctx.src;
  return {
    generated_at: ctx.generatedAt,
    engine: {
      name: "QuantForge·TSM",
      math_core: "tsm-expr parser v3 (recursivo descendente, memoizado)",
      ml_core: "quantforge-ml 2.4 — hill-climbing + monte-carlo",
      filters: "baseline guards + filtros exactos v2 (volatilidad, región, inventario, momentum, quality_gate)",
      item: ctx.item,
    },
    market_snapshot: {
      inputs: ctx.env,
      computed: {
        anchor: Math.round(s[`${P}_anchor`] ?? 0),
        fair_smooth: Math.round(s[`${P}_fair_smooth`] ?? 0),
        sane_price: Math.round(s[`${P}_sane_price`] ?? 0),
        hard_floor: Math.round(s[`${P}_hard_floor`] ?? 0),
        quality_gate: s[`${P}_quality_gate`] ?? 0,
        regime: ctx.regime.label,
      },
    },
    tsm_profiles: STRATEGIES.map((st) => buildProfile(st.id, ctx)),
  };
}
