// Zone-based display precision for percentages and grams.
// Small quantities carry more decimals (0.05% is meaningful); large ones stay tidy.
// Breakpoints are tunable — see docs/prds/ui-mockup-alignment.md "Precision".

const PERCENT_HI = 5; // >= this -> 1 decimal
const PERCENT_LO = 2; // >= this (and < HI) -> 2 decimals; below -> 3 decimals

const GRAMS_HI = 10; // >= this -> 0 decimals
const GRAMS_LO = 5; // >= this (and < HI) -> 1 decimal; below -> 2 decimals

export function formatPercent(percent: number): string {
  if (percent < PERCENT_LO) return percent.toFixed(3);
  if (percent < PERCENT_HI) return percent.toFixed(2);
  return percent.toFixed(1);
}

export function formatGrams(grams: number): string {
  if (grams < GRAMS_LO) return grams.toFixed(2);
  if (grams < GRAMS_HI) return grams.toFixed(1);
  return grams.toFixed(0);
}
