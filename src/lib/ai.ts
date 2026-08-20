/* ============================================================
   QuantForge·TSM — Capa ML/AI (quantforge-ml 2.4)
   · Extracción de features de mercado
   · Clasificación de régimen con explicabilidad
   · Optimizador de coeficientes (hill-climbing con templado)
   · Simulación Monte Carlo de oro/día por estrategia
   ============================================================ */

export type Coeffs = {
  floorPct: number;
  ceilingMult: number;
  minMult: number;
  normMult: number;
  maxMult: number;
  shoppingPct: number;
  snipePct: number;
};

export const COEFF_RANGES: Record<keyof Coeffs, [number, number]> = {
  floorPct: [0.12, 0.32],
  ceilingMult: [1.7, 3.2],
  minMult: [0.55, 0.9],
  normMult: [0.9, 1.3],
  maxMult: [1.2, 2.7],
  shoppingPct: [0.5, 0.85],
  snipePct: [0.3, 0.62],
};

export const BASELINE_COEFFS: Record<string, Coeffs> = {
  balanced: { floorPct: 0.2, ceilingMult: 2.5, minMult: 0.75, normMult: 1.0, maxMult: 1.6, shoppingPct: 0.75, snipePct: 0.55 },
  fast_liquidity: { floorPct: 0.2, ceilingMult: 2.5, minMult: 0.68, normMult: 0.92, maxMult: 1.25, shoppingPct: 0.75, snipePct: 0.55 },
  premium: { floorPct: 0.2, ceilingMult: 2.5, minMult: 0.85, normMult: 1.15, maxMult: 2.2, shoppingPct: 0.75, snipePct: 0.55 },
};

export interface Features {
  liquidity: number;
  demand: number;
  volatility: number;
  momentum: number;
  stability: number;
  regionDiv: number;
  marginPct: number;
  inventoryDays: number;
  dumpRisk: number;
  premiumGap: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function extractFeatures(
  env: Record<string, number>,
  src: Record<string, number>,
): Features {
  const P = "tsm_exchange_pack_";
  const market = env.dbmarket ?? 0;
  const spreadRatio = market > 0 ? Math.abs((env.dbminbuyout ?? 0) - market) / market : 0;
  const momentumRaw = (env.dbhistorical ?? 0) > 0
    ? ((env.dbrecent ?? 0) - env.dbhistorical) / env.dbhistorical
    : 0;
  const regionDiv = (env.dbregionmarketavg ?? 0) > 0
    ? Math.abs(market - env.dbregionmarketavg) / env.dbregionmarketavg
    : 0;
  const fair = src[`${P}fair_smooth`] ?? 0;
  const hard = src[`${P}hard_floor`] ?? 0;
  return {
    liquidity: clamp01((env.dbregionsalerate ?? 0) / 0.25),
    demand: clamp01(((env.dbregionsalerate ?? 0) * 2.2 + Math.min(env.dbregionsoldperday ?? 0, 5) / 5) / 2),
    volatility: clamp01(spreadRatio / 0.5),
    momentum: clamp01((momentumRaw + 0.1) / 0.2),
    stability: clamp01(1 - clamp01(spreadRatio / 0.5) * 0.7 - Math.min(regionDiv, 1) * 0.3),
    regionDiv,
    marginPct: fair > 0 ? clamp01((fair - hard) / fair) : 0,
    inventoryDays: (env.dbregionsoldperday ?? 0) > 0.01
      ? (env.numinventory ?? 0) / env.dbregionsoldperday
      : 99,
    dumpRisk: market > 0 ? clamp01((market * 0.7 - (env.dbminbuyout ?? 0)) / (market * 0.3)) : 0,
    premiumGap: market > 0 ? clamp01(((env.dbminbuyout ?? 0) - market * 1.15) / (market * 0.5)) : 0,
  };
}

export interface Regime {
  label: string;
  color: "mint" | "gold" | "risk" | "arc";
  confidence: number;
  reasons: string[];
}

export function classifyRegime(f: Features): Regime {
  const cands: { label: string; color: Regime["color"]; score: number; reason: string }[] = [
    { label: "Demanda alta", color: "mint", score: f.demand * 1.15 - f.volatility * 0.35, reason: `salerate y volumen diarios sostienen rotación rápida (demanda ${(f.demand * 100).toFixed(0)}%)` },
    { label: "Prima de escasez", color: "gold", score: f.premiumGap * 1.2, reason: `minbuyout cotiza >15% sobre dbmarket — captura de prima activa` },
    { label: "Dump / guerra de precios", color: "risk", score: f.dumpRisk * 1.2, reason: `minbuyout <70% de dbmarket — defensa de piso recomendada` },
    { label: "Alta volatilidad", color: "arc", score: f.volatility * 1.1 - f.demand * 0.2, reason: `spread amplio entre buyout y market — precios poco fiables` },
    { label: "Mercado estancado", color: "arc", score: (1 - f.demand) * 0.9 - f.liquidity * 0.3, reason: `salerate baja${f.inventoryDays > 15 ? ` e inventario para ${f.inventoryDays.toFixed(0)} días` : ""}` },
  ];
  cands.sort((a, b) => b.score - a.score);
  const top = cands[0];
  const label = top.score > 0.32 ? top.label : "Equilibrio estable";
  const color: Regime["color"] = top.score > 0.32 ? top.color : "mint";
  const reasons = [top.reason];
  if (f.momentum > 0.66) reasons.push(`momento alcista: dbrecent sobre dbhistorical (+${((f.momentum - 0.5) * 20).toFixed(0)}%)`);
  if (f.momentum < 0.34) reasons.push(`momento bajista: presión vendedora en el corto plazo`);
  if (f.regionDiv > 0.45) reasons.push(`divergencia regional ${(f.regionDiv * 100).toFixed(0)}% — arbitraje inter-reino posible`);
  if (f.marginPct > 0.55) reasons.push(`margen de crafteo sano: ${(f.marginPct * 100).toFixed(0)}% sobre piso duro`);
  return { label, color, confidence: clamp01(0.45 + top.score * 0.4), reasons };
}

/* ---------------- función objetivo ---------------- */

interface ObjCtx {
  env: Record<string, number>;
  src: Record<string, number>;
  feats: Features;
  aversion: number;
  snipeFocus: boolean;
}

export function objective(c: Coeffs, ctx: ObjCtx): number {
  const { env, src, feats } = ctx;
  const P = "tsm_exchange_pack_";
  const fair = Math.max(src[`${P}fair_smooth`] ?? 1, 1);
  const hard = src[`${P}hard_floor`] ?? 0;
  const base = src[`${P}base_floor`] ?? 0;
  const craft = src[`${P}floor_craft`] ?? 0;
  const craftTarget = src[`${P}craft_profit_target`] ?? 0;

  const dailyAt = (f: number) => {
    const sane = Math.min(f * c.ceilingMult, Math.max(f * c.floorPct, f));
    const norm = Math.max(sane * c.normMult, craftTarget * (f / fair));
    const minP = Math.max(base * (f / fair), sane * c.minMult);
    const cost = Math.max(hard, craft * 0.9, f * 0.42);
    const marginN = norm * 0.95 - cost;
    const marginM = Math.min(minP * 0.95 - cost, marginN);
    const priceRatio = norm / f;
    const pSale = Math.min(0.92, Math.max(0.004,
      (env.dbregionsalerate ?? 0.02) * (1.45 - 0.95 * priceRatio) * (0.55 + 0.45 * feats.liquidity)));
    const pUnder = Math.min(0.8, Math.max(0.02,
      0.05 + 0.5 * feats.volatility + (feats.inventoryDays > 10 ? 0.12 : 0) + 0.08 * feats.dumpRisk));
    return pSale * ((1 - pUnder) * marginN + pUnder * marginM);
  };

  const eBase = dailyAt(fair);
  const eDown = dailyAt(fair * 0.85);
  const eUp = dailyAt(fair * 1.15);
  const worst = Math.min(eBase, eDown, eUp);
  const riskGap = Math.max(0, eBase - worst);

  const pDeal = Math.min(0.3, Math.max(0, feats.liquidity * 0.16 * (1 - feats.volatility * 0.5)));
  const dealMargin = fair * (1 - c.snipePct) * 0.9;
  const volFactor = Math.min(env.dbregionsoldperday ?? 0.5, 3) / 3;
  const snipeTerm = pDeal * dealMargin * (0.3 + 0.7 * volFactor);

  const core = 0.7 * eBase + 0.3 * worst - ctx.aversion * riskGap;
  return core + snipeTerm * (ctx.snipeFocus ? 2.6 : 1);
}

/* ---------------- optimizador hill-climbing ---------------- */

const clampCoeff = (k: keyof Coeffs, v: number) => {
  const [lo, hi] = COEFF_RANGES[k];
  return Math.min(hi, Math.max(lo, v));
};

export function hillClimb(
  start: Coeffs,
  ctx: ObjCtx,
  iterations: number,
  rng: () => number,
): { best: Coeffs; history: number[] } {
  let current: Coeffs = { ...start };
  let curScore = objective(current, ctx);
  let best: Coeffs = { ...current };
  let bestScore = curScore;
  const history: number[] = [curScore];
  const keys = Object.keys(COEFF_RANGES) as (keyof Coeffs)[];

  for (let it = 0; it < iterations; it++) {
    const temp = 1 - it / iterations;
    const cand: Coeffs = { ...current };
    const k = keys[Math.floor(rng() * keys.length)];
    const [lo, hi] = COEFF_RANGES[k];
    cand[k] = clampCoeff(k, cand[k] + (rng() - 0.5) * (hi - lo) * 0.42 * (0.25 + 0.75 * temp));
    if (rng() < 0.12) {
      const k2 = keys[Math.floor(rng() * keys.length)];
      const [l2, h2] = COEFF_RANGES[k2];
      cand[k2] = clampCoeff(k2, cand[k2] + (rng() - 0.5) * (h2 - l2) * 0.2 * temp);
    }
    const s = objective(cand, ctx);
    if (s >= curScore - 1e-9) {
      current = cand;
      curScore = s;
      if (s > bestScore) { bestScore = s; best = { ...cand }; }
    }
    history.push(bestScore);
  }
  return { best, history };
}

/* ---------------- Monte Carlo ---------------- */

export interface McResult { mean: number; p10: number; p90: number; std: number; }

export function monteCarlo(c: Coeffs, ctx: ObjCtx, rng: () => number, runs = 480, days = 14): McResult {
  const { env, src, feats } = ctx;
  const P = "tsm_exchange_pack_";
  const fair = Math.max(src[`${P}fair_smooth`] ?? 1, 1);
  const hard = src[`${P}hard_floor`] ?? 0;
  const craft = src[`${P}floor_craft`] ?? 0;
  const base = src[`${P}base_floor`] ?? 0;
  const craftTarget = src[`${P}craft_profit_target`] ?? 0;

  const sane = Math.min(fair * c.ceilingMult, Math.max(fair * c.floorPct, fair));
  const norm = Math.max(sane * c.normMult, craftTarget);
  const minP = Math.max(base, sane * c.minMult);
  const cost = Math.max(hard, craft * 0.9, fair * 0.42);
  const marginN = norm * 0.95 - cost;
  const marginM = Math.min(minP * 0.95 - cost, marginN);
  const pSale = Math.min(0.92, Math.max(0.004,
    (env.dbregionsalerate ?? 0.02) * (1.45 - 0.95 * (norm / fair)) * (0.55 + 0.45 * feats.liquidity)));
  const pUnder = Math.min(0.8, Math.max(0.02,
    0.05 + 0.5 * feats.volatility + (feats.inventoryDays > 10 ? 0.12 : 0) + 0.08 * feats.dumpRisk));
  const pDeal = Math.min(0.3, Math.max(0, feats.liquidity * 0.16 * (1 - feats.volatility * 0.5)));
  const deal = fair * (1 - c.snipePct) * 0.9;

  const totals: number[] = [];
  for (let r = 0; r < runs; r++) {
    let gold = 0;
    for (let d = 0; d < days; d++) {
      if (rng() < pSale) gold += (rng() < pUnder ? marginM : marginN) * (0.82 + 0.36 * rng());
      if (rng() < pDeal) gold += deal * 0.5 * rng();
    }
    totals.push(Math.max(0, gold));
  }
  totals.sort((a, b) => a - b);
  const mean = totals.reduce((s, x) => s + x, 0) / runs;
  const std = Math.sqrt(totals.reduce((s, x) => s + (x - mean) ** 2, 0) / runs);
  return {
    mean,
    p10: totals[Math.floor(runs * 0.1)],
    p90: totals[Math.floor(runs * 0.9)],
    std,
  };
}

/* ---------------- orquestación del entrenamiento ---------------- */

export interface StrategyResult {
  id: string;
  label: string;
  kind: "baseline" | "ia";
  coeffs: Coeffs;
  objectiveScore: number;
  mc: McResult;
  deltaPct: number;
}

export interface TrainResult {
  seed: number;
  iterations: number;
  aversion: number;
  history: number[];
  convergence: number;
  adaptive: Coeffs;
  sniper: Coeffs;
  strategies: StrategyResult[];
  recommended: StrategyResult;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function trainModel(
  env: Record<string, number>,
  src: Record<string, number>,
  feats: Features,
  opts: { seed: number; iterations: number; aversion: number },
): TrainResult {
  const rng = mulberry32(opts.seed);
  const ctx: ObjCtx = { env, src, feats, aversion: opts.aversion, snipeFocus: false };
  const ctxSnipe: ObjCtx = { ...ctx, snipeFocus: true };

  const runA = hillClimb(BASELINE_COEFFS.balanced, ctx, opts.iterations, rng);
  const runS = hillClimb({ ...BASELINE_COEFFS.balanced, snipePct: 0.45, shoppingPct: 0.62 }, ctxSnipe, Math.floor(opts.iterations * 0.7), rng);
  const adaptive = Object.fromEntries(
    Object.entries(runA.best).map(([k, v]) => [k, r3(v as number)]),
  ) as unknown as Coeffs;
  const sniper = Object.fromEntries(
    Object.entries(runS.best).map(([k, v]) => [k, r3(v as number)]),
  ) as unknown as Coeffs;

  const defs: { id: string; label: string; kind: "baseline" | "ia"; coeffs: Coeffs }[] = [
    { id: "balanced", label: "Balanced", kind: "baseline", coeffs: BASELINE_COEFFS.balanced },
    { id: "fast_liquidity", label: "Fast Liquidity", kind: "baseline", coeffs: BASELINE_COEFFS.fast_liquidity },
    { id: "premium", label: "Premium", kind: "baseline", coeffs: BASELINE_COEFFS.premium },
    { id: "adaptive_quant", label: "Adaptive Quant", kind: "ia", coeffs: adaptive },
    { id: "sniper_quant", label: "Sniper Quant", kind: "ia", coeffs: sniper },
  ];

  const mcRng = mulberry32(opts.seed + 7919);
  const strategies: StrategyResult[] = defs.map((d) => ({
    ...d,
    objectiveScore: r2(objective(d.coeffs, ctx)),
    mc: monteCarlo(d.coeffs, ctx, mcRng),
    deltaPct: 0,
  }));

  const ref = strategies[0].mc.mean || 1;
  for (const s of strategies) s.deltaPct = r2(((s.mc.mean - strategies[0].mc.mean) / Math.abs(ref)) * 100);

  const recommended = [...strategies].sort(
    (a, b) => (b.mc.mean - 0.4 * b.mc.std) - (a.mc.mean - 0.4 * a.mc.std),
  )[0];

  const h0 = runA.history[0] || 1;
  const hEnd = runA.history[runA.history.length - 1];
  const convergence = r2(Math.max(0, ((hEnd - h0) / Math.abs(h0 || 1)) * 100));

  return {
    seed: opts.seed,
    iterations: opts.iterations,
    aversion: opts.aversion,
    history: runA.history,
    convergence,
    adaptive,
    sniper,
    strategies,
    recommended,
  };
}
