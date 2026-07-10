import { healthyBand } from "./macro-bands";
import type { MacroRatios } from "./formula-engine";
import { DEFAULT_EQUIPMENT, type EquipmentProfile } from "@/data/types";

export type Verdict = "low" | "ok" | "high";

const SOLID_KEYS: (keyof MacroRatios)[] = ["fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier"];
export const totalSolids = (r: MacroRatios) => SOLID_KEYS.reduce((s, k) => s + r[k], 0);

// Plain-language coaching per macro, keyed by which way it's off.
const ADVICE: Record<string, { low: string; high: string }> = {
  fat: { low: "Lean — add cream for body.", high: "Heavy — ease off the cream." },
  sugar: { low: "Firm scoop — bump the sugar.", high: "Will freeze soft — cut sugar back." },
  nonfatSolids: { low: "Watery body — add milk powder.", high: "Sandy risk — reduce milk solids." },
  totalSolids: { low: "Thin — needs more solids.", high: "Dense — add milk or water." },
};
const LABEL: Record<string, string> = {
  fat: "Fat",
  sugar: "Sugar",
  nonfatSolids: "Non-fat solids",
  totalSolids: "Total solids",
};
const TS_TOLERANCE = 0.04;

export interface MacroCheck {
  key: string;
  label: string;
  verdict: Verdict;
  value: number;
  band: [number, number];
  advice: string | null;
}

export interface BalanceReport {
  checks: MacroCheck[];
  inRange: number;
  total: number;
  balanced: boolean;
}

function verdictFor(value: number, [lo, hi]: [number, number]): Verdict {
  if (value < lo - 1e-9) return "low";
  if (value > hi + 1e-9) return "high";
  return "ok";
}

function check(key: string, value: number, band: [number, number]): MacroCheck {
  const verdict = verdictFor(value, band);
  return { key, label: LABEL[key], verdict, value, band, advice: verdict === "ok" ? null : ADVICE[key][verdict] };
}

// Soft, stylistic balance: does each tracked macro land inside its healthy
// window for this style? Advisory (distinct from the hard conflict → Rebalance).
export function balanceReport(
  ratios: MacroRatios,
  style: string,
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): BalanceReport {
  const checks: MacroCheck[] = (["fat", "sugar", "nonfatSolids"] as (keyof MacroRatios)[]).map((key) =>
    check(key, ratios[key], healthyBand(style, key, equipment)),
  );

  // Total-solids target = sum of the style's solid-macro band midpoints.
  const tsTarget = SOLID_KEYS.reduce((s, k) => {
    const [lo, hi] = healthyBand(style, k, equipment);
    return s + (lo + hi) / 2;
  }, 0);
  checks.push(check("totalSolids", totalSolids(ratios), [tsTarget - TS_TOLERANCE, tsTarget + TS_TOLERANCE]));

  const inRange = checks.filter((c) => c.verdict === "ok").length;
  return { checks, inRange, total: checks.length, balanced: inRange === checks.length };
}
