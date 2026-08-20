/* ============================================================
   QuantForge·TSM — Validador de fórmulas TSM
   Verifica que cada expresión generada sea sintáctica y
   semánticamente válida dentro del propio TradeSkillMaster:
   · funciones conocidas con aridad correcta
   · identificadores = fuente base TSM o custom source declarada
   · literales numéricos / moneda (0c, 1c, 1g) bien formados
   · paréntesis balanceados (garantizado por el parser)
   ============================================================ */

import { parseExpr, type Ast } from "./engine";

/** Funciones nativas de TSM con su aridad (-1 = variádica ≥1) */
export const KNOWN_FN: Record<string, number> = {
  avg: -1, min: -1, max: -1, first: -1, sum: -1,
  round: 2, rounddown: 2, roundup: 2, pow: 2,
  ifgt: 4, iflt: 4, ifgte: 4, iflte: 4, ifeq: 4,
  abs: 1, sqrt: 1, floor: 1, ceil: 1, not: 1, even: 1, odd: 1,
  convert: 1, clamp: 3,
};

/** Fuentes de precio base que TSM reconoce de forma nativa */
export const BASE_PRICE_SOURCES = new Set([
  "auction", "auctionhouse", "avgbuy", "avgdaymarket", "avgsell",
  "crafting", "dbhistorical", "dbmarket", "dbminbuyout", "dbrecent",
  "dbregionhistorical", "dbregionmarketavg", "dbregionsaleavg",
  "dbregionsaledays", "dbregionsalerate", "dbregionsoldperday",
  "destroy", "disenchant", "matprice", "milling", "numinventory",
  "percentrarity", "prospecting", "quality", "ilevel", "requiredlevel",
  "transform", "vendorbuy", "vendorsell", "convert_value",
]);

export interface FormulaIssue {
  source: string;
  msg: string;
}

function walk(node: Ast, custom: Set<string>, issues: string[]) {
  switch (node.t) {
    case "num":
      if (!Number.isFinite(node.v)) issues.push("literal numérico no finito");
      break;
    case "id":
      if (!BASE_PRICE_SOURCES.has(node.n) && !custom.has(node.n)) {
        issues.push(`identificador desconocido "${node.n}" (no es fuente base ni custom source)`);
      }
      break;
    case "neg":
      walk(node.e, custom, issues);
      break;
    case "bin":
      walk(node.l, custom, issues);
      walk(node.r, custom, issues);
      break;
    case "call": {
      const arity = KNOWN_FN[node.n];
      if (arity === undefined) {
        issues.push(`función TSM desconocida "${node.n}(...)"`);
      } else if (arity >= 0 && node.args.length !== arity) {
        issues.push(`"${node.n}" espera ${arity} argumento(s), recibió ${node.args.length}`);
      } else if (arity === -1 && node.args.length < 1) {
        issues.push(`"${node.n}" necesita al menos 1 argumento`);
      }
      for (const a of node.args) walk(a, custom, issues);
      break;
    }
  }
}

/** Valida una sola expresión. Devuelve lista de problemas (vacía = válida). */
export function validateFormula(expr: string, customNames: Set<string>): string[] {
  const issues: string[] = [];
  let ast: Ast;
  try {
    ast = parseExpr(expr);
  } catch (e) {
    return [`error de sintaxis: ${(e as Error).message}`];
  }
  walk(ast, customNames, issues);
  return issues;
}

export interface ValidationReport {
  total: number;
  errors: FormulaIssue[];
  ok: boolean;
  /** nº de fuentes / parámetros que son fórmulas evaluadas */
  formulas: number;
}

/** Extrae todas las fórmulas de un perfil (custom sources + valores de sección). */
export function collectFormulas(profile: Record<string, any>): { key: string; expr: string }[] {
  const out: { key: string; expr: string }[] = [];
  const sources = profile?.meta?.custom_sources ?? {};
  for (const [k, v] of Object.entries(sources)) out.push({ key: `custom:${k}`, expr: String(v) });
  for (const section of ["auctioning", "shopping", "sniping", "crafting", "vendor"]) {
    const block = profile?.[section] ?? {};
    for (const [k, v] of Object.entries(block)) {
      if (typeof v === "string") out.push({ key: `${section}:${k}`, expr: v });
    }
  }
  return out;
}

/** Valida todo un perfil contra el vocabulario TSM. */
export function validateProfile(profile: Record<string, any>): ValidationReport {
  const formulas = collectFormulas(profile);
  const customNames = new Set<string>(Object.keys(profile?.meta?.custom_sources ?? {}));
  const errors: FormulaIssue[] = [];
  for (const f of formulas) {
    for (const msg of validateFormula(f.expr, customNames)) {
      errors.push({ source: f.key, msg });
    }
  }
  return { total: formulas.length, errors, ok: errors.length === 0, formulas: formulas.length };
}
