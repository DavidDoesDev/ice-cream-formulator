import { MACRO_BOUNDS, type MacroRatios } from "./formula-engine";
import type { StyleCategory } from "@/data/types";

// Per-style healthy windows — the green "in range" zone (D3/D8). Keyed by frozen-
// dessert style; the home-dasher baseline (equipment shifts sugar/stabilizer later).
//
// APP CONVENTION, not Goff's. The catalog models dairy lactose inside the `sugar`
// macro (whole milk sugar 0.048) and leaves protein+minerals in `nonfatSolids`, so
// the app reads ~+3% sugar and ~−5% nonfatSolids vs. Goff's tables. These bands are
// therefore calibrated to what computeRatios actually produces from the authored
// recipes, not transcribed from docs/formulation/style-targets.md.
// Custard is measured from its 6 authored bases; the other styles are provisional
// until their recipes land (#60), which will tighten them.
// All six styles are now measured from their authored bases (#60). App convention:
// dairy lactose sits in `sugar`, so sugar reads high and nonfatSolids (protein+
// minerals) reads low vs Goff. Bands contain each style's recipe span with margin.
const STYLE_TARGETS: Record<StyleCategory, Record<keyof MacroRatios, [number, number]>> = {
  philadelphia: { fat: [0.03, 0.18], sugar: [0.19, 0.25], nonfatSolids: [0.02, 0.10], stabilizer: [0, 0.005], emulsifier: [0, 0.003], alcohol: [0, 0.06], water: [0.52, 0.67] },
  custard:      { fat: [0.12, 0.22], sugar: [0.16, 0.24], nonfatSolids: [0.025, 0.09], stabilizer: [0, 0.005], emulsifier: [0.001, 0.005], alcohol: [0, 0.06], water: [0.50, 0.62] },
  gelato:       { fat: [0.03, 0.13], sugar: [0.21, 0.28], nonfatSolids: [0.03, 0.09], stabilizer: [0.002, 0.006], emulsifier: [0, 0.003], alcohol: [0, 0.05], water: [0.53, 0.68] },
  sherbet:      { fat: [0.02, 0.07], sugar: [0.23, 0.31], nonfatSolids: [0.005, 0.04], stabilizer: [0.002, 0.006], emulsifier: [0, 0.002], alcohol: [0, 0.04], water: [0.61, 0.71] },
  sorbet:       { fat: [0, 0.02], sugar: [0.27, 0.38], nonfatSolids: [0, 0.02], stabilizer: [0.002, 0.006], emulsifier: [0, 0.001], alcohol: [0, 0.06], water: [0.59, 0.73] },
  vegan:        { fat: [0.05, 0.18], sugar: [0.20, 0.28], nonfatSolids: [0, 0.07], stabilizer: [0.002, 0.006], emulsifier: [0, 0.003], alcohol: [0, 0.05], water: [0.52, 0.68] },
};

// How far the slider roams beyond the green band on each side (clamped to MACRO_BOUNDS),
// so a value can stray out of range but stays on a usefully-scaled track.
const SLIDER_PAD: Record<keyof MacroRatios, number> = {
  fat: 0.03, sugar: 0.03, nonfatSolids: 0.02, stabilizer: 0.002,
  emulsifier: 0.002, alcohol: 0.02, water: 0.05,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function targetsFor(style: string): Record<keyof MacroRatios, [number, number]> {
  return STYLE_TARGETS[style as StyleCategory] ?? STYLE_TARGETS.philadelphia;
}

// [lo, hi] healthy (green) window for a macro in a given style, clamped to physical bounds.
export function healthyBand(style: string, macro: keyof MacroRatios): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const [lo, hi] = targetsFor(style)[macro];
  return [clamp(lo, absMin, absMax), clamp(hi, absMin, absMax)];
}

// [min, max] slider travel: the green band padded outward, clamped to physical bounds.
export function sliderBounds(style: string, macro: keyof MacroRatios): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const [lo, hi] = healthyBand(style, macro);
  const pad = SLIDER_PAD[macro];
  return [clamp(lo - pad, absMin, absMax), clamp(hi + pad, absMin, absMax)];
}

export function isInRange(style: string, macro: keyof MacroRatios, value: number): boolean {
  const [lo, hi] = healthyBand(style, macro);
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
  style: string,
  macro: keyof MacroRatios,
  currentValue: number,
): SliderGeometry {
  const [min, max] = sliderBounds(style, macro);
  const [bandLo, bandHi] = healthyBand(style, macro);
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
    inRange: isInRange(style, macro, currentValue),
  };
}
