import { describe, it, expect } from "vitest";
import { solveRecipe } from "./recipe-solver";
import type { MacroRatios } from "./formula-engine";
import type { SmartMix, AdditionalIngredient } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";

const resolveIngredient = (id: string) => getIngredientById(id)?.macros;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sumGrams(mixes: SmartMix[]): number {
  return mixes.reduce((s, m) => s + m.grams, 0);
}

const sugarMix = (): SmartMix =>
  ({ kind: "sugar", label: "Sugar Mix", presetId: "sugar-sucrose", grams: 0 });

const waterMix = (): SmartMix =>
  ({ kind: "liquid", label: "Liquid Mix", presetId: "liquid-water", grams: 0 });

const alcoholEmptyMix = (): SmartMix =>
  ({ kind: "alcohol", label: "Alcohol", presetId: "alcohol-empty", grams: 0 });

const milkStandardMix = (): SmartMix =>
  ({ kind: "milk", label: "Milk Mix", presetId: "milk-standard", grams: 0 });

const stabModernistMix = (): SmartMix =>
  ({ kind: "stabilizer", label: "Stabilizer Mix", presetId: "stab-modernist", grams: 0 });

// Achievable targets for [milk-standard, sugar-sucrose, stab-modernist].
// milk-standard: fat=16.16%, sugar=3.68%, MSNF=3.14%, water=77.02%
// With fat=12% → x_milk≈743g, x_stab=4g, x_sugar≈253g (fills yield).
// Resulting sugar, MSNF, water are derived from those proportions.
const PHILLY_TARGETS: MacroRatios = {
  fat: 0.120,
  sugar: 0.281,       // 743×3.68% + 253g sugar = ~280g / 1000
  nonfatSolids: 0.023,// 743×3.14% ≈ 23g
  stabilizer: 0.004,
  emulsifier: 0,
  alcohol: 0,
  water: 0.572,       // 743×77.02% ≈ 572g
};

const PURE_SUGAR_TARGETS: MacroRatios = {
  fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0,
};

const PURE_WATER_TARGETS: MacroRatios = {
  fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 1.0,
};

// ---------------------------------------------------------------------------
// Trivial single-mix systems
// ---------------------------------------------------------------------------

describe("solveRecipe — single mix, pure macro", () => {
  it("pure sucrose target + sucrose sugar mix → sugar mix gets ≈ all 1000g", () => {
    const result = solveRecipe(PURE_SUGAR_TARGETS, 1000, [], [sugarMix()], getPresetById, resolveIngredient);
    const sugar = result.find((m) => m.kind === "sugar")!;
    expect(sugar.grams).toBeCloseTo(1000, 0);
  });

  it("pure water target + water liquid mix → liquid mix gets ≈ all 500g", () => {
    const result = solveRecipe(PURE_WATER_TARGETS, 500, [], [waterMix()], getPresetById, resolveIngredient);
    const liquid = result.find((m) => m.kind === "liquid")!;
    expect(liquid.grams).toBeCloseTo(500, 0);
  });
});

// ---------------------------------------------------------------------------
// Non-negativity
// ---------------------------------------------------------------------------

describe("solveRecipe — non-negativity", () => {
  it("all returned grams are >= 0", () => {
    const mixes = [milkStandardMix(), sugarMix(), stabModernistMix(), alcoholEmptyMix()];
    const result = solveRecipe(PHILLY_TARGETS, 1000, [], mixes, getPresetById, resolveIngredient);
    for (const mix of result) {
      expect(mix.grams, `${mix.kind} grams`).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Yield conservation
// ---------------------------------------------------------------------------

describe("solveRecipe — yield conservation", () => {
  it("sum of smart mix grams ≈ yield when no additional ingredients", () => {
    const mixes = [milkStandardMix(), sugarMix(), stabModernistMix(), alcoholEmptyMix()];
    const result = solveRecipe(PHILLY_TARGETS, 1000, [], mixes, getPresetById, resolveIngredient);
    expect(sumGrams(result)).toBeCloseTo(1000, 0);
  });

  it("sum of smart mix grams + additional grams ≈ yield", () => {
    const additional: AdditionalIngredient[] = [{ ingredientId: "cocoa-powder", grams: 50 }];
    const mixes = [milkStandardMix(), sugarMix(), stabModernistMix(), alcoholEmptyMix()];
    const result = solveRecipe(PHILLY_TARGETS, 1000, additional, mixes, getPresetById, resolveIngredient);
    expect(sumGrams(result) + 50).toBeCloseTo(1000, 0);
  });
});

// ---------------------------------------------------------------------------
// Alcohol-empty stays at 0
// ---------------------------------------------------------------------------

describe("solveRecipe — alcohol-empty stays at 0", () => {
  it("alcohol-empty mix always gets 0 grams regardless of other targets", () => {
    const mixes = [milkStandardMix(), sugarMix(), stabModernistMix(), alcoholEmptyMix()];
    const result = solveRecipe(PHILLY_TARGETS, 1000, [], mixes, getPresetById, resolveIngredient);
    const alcohol = result.find((m) => m.kind === "alcohol")!;
    expect(alcohol.grams).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Additional ingredients as fixed constraints
// ---------------------------------------------------------------------------

describe("solveRecipe — additional ingredients as fixed constraints", () => {
  it("200g of sucrose as additional reduces sugar mix grams by ~200g", () => {
    const mixes1 = [sugarMix(), alcoholEmptyMix()];
    const baseline = solveRecipe(PURE_SUGAR_TARGETS, 1000, [], mixes1, getPresetById, resolveIngredient);
    const sugarBaseline = baseline.find((m) => m.kind === "sugar")!.grams;

    const mixes2 = [sugarMix(), alcoholEmptyMix()];
    const additional: AdditionalIngredient[] = [{ ingredientId: "sucrose", grams: 200 }];
    const constrained = solveRecipe(PURE_SUGAR_TARGETS, 1000, additional, mixes2, getPresetById, resolveIngredient);
    const sugarConstrained = constrained.find((m) => m.kind === "sugar")!.grams;

    expect(sugarConstrained).toBeLessThan(sugarBaseline - 150);
  });
});

// ---------------------------------------------------------------------------
// Philadelphia integration: macro satisfaction
// ---------------------------------------------------------------------------

describe("solveRecipe — Philadelphia macro satisfaction", () => {
  const mixes = [milkStandardMix(), sugarMix(), stabModernistMix(), alcoholEmptyMix()];
  const result = solveRecipe(PHILLY_TARGETS, 1000, [], mixes, getPresetById, resolveIngredient);

  function computedRatios() {
    const total = sumGrams(result);
    let fat = 0, sugar = 0, nonfatSolids = 0, stabilizer = 0, water = 0;
    for (const mix of result) {
      const p = getPresetById(mix.presetId);
      if (!p || mix.grams === 0) continue;
      const m = p.effectiveMacros;
      fat += m.fat * mix.grams;
      sugar += m.sugar * mix.grams;
      nonfatSolids += m.nonfatSolids * mix.grams;
      stabilizer += m.stabilizer * mix.grams;
      water += m.water * mix.grams;
    }
    return {
      fat: fat / total, sugar: sugar / total,
      nonfatSolids: nonfatSolids / total, stabilizer: stabilizer / total, water: water / total,
    };
  }

  it("achieved fat ratio is within 2pp of target", () => {
    expect(Math.abs(computedRatios().fat - PHILLY_TARGETS.fat)).toBeLessThan(0.02);
  });

  it("achieved sugar ratio is within 2pp of target", () => {
    expect(Math.abs(computedRatios().sugar - PHILLY_TARGETS.sugar)).toBeLessThan(0.02);
  });

  it("achieved stabilizer ratio is within 0.3pp of target", () => {
    expect(Math.abs(computedRatios().stabilizer - PHILLY_TARGETS.stabilizer)).toBeLessThan(0.003);
  });
});
