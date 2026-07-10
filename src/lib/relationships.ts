import type { MacroRatios } from "./formula-engine";
import type { DerivedIndices } from "./derive";
import { healthyBand } from "./macro-bands";
import type { StyleCategory } from "@/data/types";

// Advisory relationship coaching (D6). The per-macro sliders stay independent;
// these hints watch relationships between macros that a single-macro band can't
// see (sandiness, scoopability, ice control). Never constrains a slider.

export interface RelationshipHint {
  key: string;
  message: string;
}

// Per-style scoopability (PAC) window — sucrose-equivalent freeze-point depression
// as a fraction of the batch, measured from the authored bases (home-dasher). A
// value below the window freezes firm; above it, it won't set. See derive().
const PAC_BANDS: Record<StyleCategory, [number, number]> = {
  philadelphia: [0.18, 0.26],
  custard: [0.16, 0.3],
  gelato: [0.2, 0.28],
  sherbet: [0.22, 0.32],
  sorbet: [0.34, 0.54],
  vegan: [0.19, 0.28],
};

// Lactose crystallizes ("sandy") when milk solids are too concentrated in the
// water phase. Rule of thumb: dairy MSNF ≲ 1/6 of the serum (~0.17).
const SANDY_MSNF_IN_SERUM = 0.17;

export function relationshipHints(
  ratios: MacroRatios,
  d: DerivedIndices,
  style: string,
): RelationshipHint[] {
  const hints: RelationshipHint[] = [];

  // Sandiness — dairy MSNF vs. the water it's dissolved in.
  const serumWater = Math.max(0, 1 - d.totalSolids);
  const msnfInSerum = d.dairyMsnf > 0 ? d.dairyMsnf / (d.dairyMsnf + serumWater) : 0;
  if (msnfInSerum > SANDY_MSNF_IN_SERUM) {
    hints.push({ key: "sandiness", message: "Milk solids are high for the water content — sandy (lactose) risk." });
  }

  // Ice control — a watery mix that's under-stabilized grows big ice crystals.
  const [, waterHi] = healthyBand(style, "water");
  const [stabLo] = healthyBand(style, "stabilizer");
  if (ratios.water > waterHi && ratios.stabilizer < stabLo) {
    hints.push({ key: "ice-control", message: "Watery and under-stabilized — add stabilizer to hold off ice crystals." });
  }

  // Scoopability (fat↔sugar↔alcohol via PAC): too firm or too soft to serve.
  const [pacLo, pacHi] = PAC_BANDS[style as StyleCategory] ?? [0.18, 0.3];
  if (d.pac < pacLo) {
    hints.push({ key: "firm", message: "Will freeze firm — raise the sugar (or shift to dextrose) to keep it scoopable." });
  } else if (d.pac > pacHi) {
    hints.push({ key: "soft", message: "Very soft — high sugar/alcohol may keep it from setting." });
  }

  return hints;
}
