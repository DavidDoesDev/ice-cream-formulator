import { describe, it, expect } from "vitest";
import { stateFromRatios } from "./bootstrap";
import { computeRatios } from "./formula-engine";
import type { MacroRatios } from "./formula-engine";

// ---------------------------------------------------------------------------
// stateFromRatios
// ---------------------------------------------------------------------------

describe("stateFromRatios", () => {
  it("fat=0.15, water=0.85, yield=1000 → fat block at 150g, water block at 850g", () => {
    const ratios: MacroRatios = {
      fat: 0.15, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.85,
    };
    const state = stateFromRatios(ratios, 1000);
    const fat = state.ingredients.find((i) => i.macros.fat === 1);
    const water = state.ingredients.find((i) => i.macros.water === 1);
    expect(fat).toBeDefined();
    expect(fat!.grams).toBeCloseTo(150, 4);
    expect(water).toBeDefined();
    expect(water!.grams).toBeCloseTo(850, 4);
  });

  it("zero-ratio macros produce no ingredient for that macro", () => {
    const ratios: MacroRatios = {
      fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0,
    };
    const state = stateFromRatios(ratios, 500);
    const fat = state.ingredients.find((i) => i.macros.fat > 0);
    expect(fat).toBeUndefined();
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0].grams).toBeCloseTo(500, 4);
  });

  it("round-trip: computeRatios(stateFromRatios(r, y)) ≈ r for arbitrary ratios", () => {
    const original: MacroRatios = {
      fat: 0.12, sugar: 0.25, nonfatSolids: 0.08, stabilizer: 0.003,
      emulsifier: 0.001, alcohol: 0, water: 0.546,
    };
    const state = stateFromRatios(original, 1000);
    const recovered = computeRatios(state);
    for (const key of Object.keys(original) as (keyof MacroRatios)[]) {
      expect(recovered[key]).toBeCloseTo(original[key], 4);
    }
  });

  it("yields correct total grams summing to yieldGrams", () => {
    const ratios: MacroRatios = {
      fat: 0.2, sugar: 0.3, nonfatSolids: 0.1, stabilizer: 0.01,
      emulsifier: 0, alcohol: 0, water: 0.39,
    };
    const state = stateFromRatios(ratios, 750);
    const totalGrams = state.ingredients.reduce((s, i) => s + i.grams, 0);
    expect(totalGrams).toBeCloseTo(750, 3);
  });

  it("preserves yieldGrams on the state object", () => {
    const ratios: MacroRatios = {
      fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 1.0,
    };
    const state = stateFromRatios(ratios, 1234);
    expect(state.yieldGrams).toBe(1234);
  });
});
