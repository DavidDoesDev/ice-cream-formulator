import { MACRO_BOUNDS, computeSliderBounds, type MacroRatios } from "./formula-engine";

// The healthy window is the style's target ratio plus/minus a narrow tolerance —
// tighter than the slider's roam (MACRO_TOLERANCE), so it reads as a centered
// "in range" zone inside the track. Shared by the slider ticks and the balance
// scorecard so both agree on what "in range" means.
const HEALTHY_TOLERANCE: Record<keyof MacroRatios, number> = {
  fat: 0.02,
  sugar: 0.02,
  nonfatSolids: 0.015,
  stabilizer: 0.004,
  emulsifier: 0.003,
  alcohol: 0.03,
  water: 0.04,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// [lo, hi] healthy window for a macro given the style's target ratio.
export function healthyBand(macro: keyof MacroRatios, target: number): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const tol = HEALTHY_TOLERANCE[macro];
  const lo = target === 0 ? 0 : Math.max(absMin, target - tol);
  const hi = target === 0 ? Math.min(absMax, tol) : Math.min(absMax, target + tol);
  return [lo, Math.max(lo, hi)];
}

export function isInRange(macro: keyof MacroRatios, value: number, target: number): boolean {
  const [lo, hi] = healthyBand(macro, target);
  return value >= lo - 1e-9 && value <= hi + 1e-9;
}

export interface SliderGeometry {
  min: number;
  max: number;
  value: number;
  valuePct: number;
  fillPct: number;
  bandLoPct: number;
  bandHiPct: number;
  inRange: boolean;
}

// Everything a macro slider needs to render: the track travel, the thumb/fill
// position, the healthy-window tick positions, and whether it's in range.
export function sliderGeometry(
  macro: keyof MacroRatios,
  currentValue: number,
  target: number,
): SliderGeometry {
  const [min, max] = computeSliderBounds(macro, target);
  const [bandLo, bandHi] = healthyBand(macro, target);
  const span = max - min;
  const pct = (v: number) => (span > 0 ? clamp(((v - min) / span) * 100, 0, 100) : 0);
  const valuePct = pct(currentValue);
  return {
    min,
    max,
    value: clamp(currentValue, min, max),
    valuePct,
    fillPct: valuePct,
    bandLoPct: pct(bandLo),
    bandHiPct: pct(bandHi),
    inRange: isInRange(macro, currentValue, target),
  };
}
