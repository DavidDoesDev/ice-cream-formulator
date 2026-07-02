// Display precision.
// Percentages use a normalized "constant width" rule — fewer decimals as the
// number grows — so values line up at a consistent character count:
//   < 10  -> 2 decimals   (0.40, 3.00, 9.99)
//   < 100 -> 1 decimal    (10.0, 16.0, 99.9)
//   >= 100 -> 0 decimals  (100)
// Grams keep whole numbers once they're meaningfully weighable (>= 10 g).

function normalizedDecimals(value: number): number {
  if (value < 10) return 2;
  if (value < 100) return 1;
  return 0;
}

export function formatPercent(percent: number): string {
  return percent.toFixed(normalizedDecimals(percent));
}

const GRAMS_HI = 10; // >= this -> 0 decimals
const GRAMS_LO = 5; // >= this (and < HI) -> 1 decimal; below -> 2 decimals

export function formatGrams(grams: number): string {
  if (grams < GRAMS_LO) return grams.toFixed(2);
  if (grams < GRAMS_HI) return grams.toFixed(1);
  return grams.toFixed(0);
}
