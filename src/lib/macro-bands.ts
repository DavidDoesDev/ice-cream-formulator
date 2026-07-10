import { MACRO_BOUNDS, type MacroRatios } from "./formula-engine";
import { DEFAULT_EQUIPMENT, type StyleCategory, type EquipmentProfile } from "@/data/types";
import { pacOffset } from "./equipment";

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

// Which macros the equipment PAC-target offset shifts, and by how much of it (D8).
// Sugar is the primary freeze-depression lever → the full offset. Stabilizer is a
// secondary scoopability knob (a colder/faster freeze grows less ice, needs less
// stabilizer) → a small fraction of it. Composition macros are never shifted.
const STABILIZER_OFFSET_SCALE = 0.05;

function equipmentShift(macro: keyof MacroRatios, equipment: EquipmentProfile): number {
  const off = pacOffset(equipment);
  if (macro === "sugar") return off;
  if (macro === "stabilizer") return off * STABILIZER_OFFSET_SCALE;
  return 0;
}

// [lo, hi] healthy (green) window for a macro under a given (style, equipment),
// clamped to physical bounds. Style sets the home-dasher baseline; equipment shifts
// only the scoopability macros (sugar/stabilizer). Default equipment = today's window.
export function healthyBand(
  style: string,
  macro: keyof MacroRatios,
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const [lo, hi] = targetsFor(style)[macro];
  const shift = equipmentShift(macro, equipment);
  return [clamp(lo + shift, absMin, absMax), clamp(hi + shift, absMin, absMax)];
}

// [min, max] slider travel: the green band padded outward, clamped to physical bounds.
export function sliderBounds(
  style: string,
  macro: keyof MacroRatios,
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const [lo, hi] = healthyBand(style, macro, equipment);
  const pad = SLIDER_PAD[macro];
  return [clamp(lo - pad, absMin, absMax), clamp(hi + pad, absMin, absMax)];
}

export function isInRange(
  style: string,
  macro: keyof MacroRatios,
  value: number,
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): boolean {
  const [lo, hi] = healthyBand(style, macro, equipment);
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
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): SliderGeometry {
  const [min, max] = sliderBounds(style, macro, equipment);
  const [bandLo, bandHi] = healthyBand(style, macro, equipment);
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
    inRange: isInRange(style, macro, currentValue, equipment),
  };
}
