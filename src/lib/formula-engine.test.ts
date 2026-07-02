import { describe, it, expect } from "vitest";
import {
  computeRatios,
  adjustRatio,
  setIngredientState,
  setIngredientGrams,
  setYield,
  rebalance,
  addIngredient,
  removeIngredient,
  type FormulaState,
  type Ingredient,
} from "./formula-engine";

// --- Fixtures ---

// Macros sum to 1.0 per ingredient (fat + sugar + nonfatSolids + water = 1.0).
// nonfatSolids = protein + minerals only; lactose is tracked separately under sugar.
const wholeMilk: Ingredient = {
  id: "whole-milk",
  name: "Whole Milk",
  state: "normal",
  grams: 500,
  macros: { fat: 0.036, sugar: 0.048, nonfatSolids: 0.039, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.877 },
};

const heavyCream: Ingredient = {
  id: "heavy-cream",
  name: "Heavy Cream",
  state: "normal",
  grams: 200,
  macros: { fat: 0.36, sugar: 0.027, nonfatSolids: 0.028, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.585 },
};

const sugarIngredient: Ingredient = {
  id: "sugar",
  name: "Sugar",
  state: "normal",
  grams: 150,
  macros: { fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
};

const skimMilkPowder: Ingredient = {
  id: "smp",
  name: "Skim Milk Powder",
  state: "normal",
  grams: 30,
  macros: { fat: 0.005, sugar: 0.50, nonfatSolids: 0.455, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.04 },
};

const salt: Ingredient = {
  id: "salt",
  name: "Salt",
  state: "excluded",
  grams: 5,
  macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
};

function baseState(overrides?: Partial<FormulaState>): FormulaState {
  return {
    ingredients: [wholeMilk, heavyCream, sugarIngredient, skimMilkPowder, salt],
    yieldGrams: 880,
    conflict: false,
    ...overrides,
  };
}

// --- Tests ---

describe("computeRatios", () => {
  it("ratios sum to 1.0 for a standard mix", () => {
    const ratios = computeRatios(baseState());
    const sum = Object.values(ratios).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("excluded ingredient does not contribute to ratios", () => {
    const state = baseState();
    const ratiosWithSaltExcluded = computeRatios(state);

    // Including salt (all-zero macros) increases total grams but not macro contributions,
    // so tracked ratios will sum to slightly less than 1.0 — that is correct behavior.
    const stateWithSaltIncluded = setIngredientState(state, "salt", "normal");
    const ratiosSaltIncluded = computeRatios(stateWithSaltIncluded);

    // When excluded, tracked ratios sum to 1.0
    const sumExcluded = Object.values(ratiosWithSaltExcluded).reduce((a, b) => a + b, 0);
    expect(sumExcluded).toBeCloseTo(1.0, 5);

    // When included, fat ratio is lower because the same fat mass is now divided by more total grams
    expect(ratiosSaltIncluded.fat).toBeLessThan(ratiosWithSaltExcluded.fat);
  });

  it("returns zeros when all ingredients are excluded", () => {
    const state: FormulaState = {
      ingredients: [
        { ...wholeMilk, state: "excluded" },
        { ...heavyCream, state: "excluded" },
      ],
      yieldGrams: 700,
      conflict: false,
    };
    const ratios = computeRatios(state);
    expect(ratios.fat).toBe(0);
    expect(ratios.sugar).toBe(0);
    expect(ratios.water).toBe(0);
  });
});

describe("adjustRatio", () => {
  it("resulting ratios still sum to 1.0 after fat adjustment", () => {
    const state = baseState();
    const current = computeRatios(state);
    const targetFat = Math.min(current.fat * 1.3, 0.18);
    const updated = adjustRatio(state, "fat", targetFat);
    if (!updated.conflict) {
      const ratios = computeRatios(updated);
      const sum = Object.values(ratios).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 4);
    }
  });

  it("does not modify pinned ingredient grams", () => {
    const pinnedCream = { ...heavyCream, state: "pinned" as const };
    const state = baseState({
      ingredients: [wholeMilk, pinnedCream, sugarIngredient, skimMilkPowder],
    });
    const current = computeRatios(state);
    const targetFat = Math.max(current.fat * 0.8, 0.06);
    const updated = adjustRatio(state, "fat", targetFat);
    const cream = updated.ingredients.find((i) => i.id === "heavy-cream")!;
    expect(cream.grams).toBe(pinnedCream.grams);
  });

  it("sets conflict when all normals are pinned and target is unachievable", () => {
    const state: FormulaState = {
      ingredients: [
        { ...wholeMilk, state: "pinned" },
        { ...heavyCream, state: "pinned" },
        { ...sugarIngredient, state: "pinned" },
      ],
      yieldGrams: 850,
      conflict: false,
    };
    // Target fat of 0.9 is far outside any realistic achievable value
    const updated = adjustRatio(state, "fat", 0.9);
    expect(updated.conflict).toBe(true);
  });

  describe("single-macro block state (bootstrapped FormulaState)", () => {
    // The bootstrapped state uses pure single-macro blocks — each ingredient contributes
    // exactly one macro at 1.0. adjustRatio must actually change ratios here.
    function singleMacroState(): FormulaState {
      return {
        ingredients: [
          { id: "_fat", name: "Fat", state: "normal", grams: 160, macros: { fat: 1, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 } },
          { id: "_sugar", name: "Sugar", state: "normal", grams: 160, macros: { fat: 0, sugar: 1, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 } },
          { id: "_water", name: "Water", state: "normal", grams: 607, macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 1 } },
          { id: "_nonfat", name: "MSNF", state: "normal", grams: 90, macros: { fat: 0, sugar: 0, nonfatSolids: 1, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 } },
        ],
        yieldGrams: 1017,
        conflict: false,
      };
    }

    it("increases fat ratio to target", () => {
      const state = singleMacroState();
      const updated = adjustRatio(state, "fat", 0.18);
      expect(updated.conflict).toBe(false);
      const ratios = computeRatios(updated);
      expect(ratios.fat).toBeCloseTo(0.18, 3);
    });

    it("decreases fat ratio to target", () => {
      const state = singleMacroState();
      const updated = adjustRatio(state, "fat", 0.12);
      expect(updated.conflict).toBe(false);
      const ratios = computeRatios(updated);
      expect(ratios.fat).toBeCloseTo(0.12, 3);
    });

    it("increases sugar ratio to target", () => {
      const state = singleMacroState();
      const updated = adjustRatio(state, "sugar", 0.22);
      expect(updated.conflict).toBe(false);
      const ratios = computeRatios(updated);
      expect(ratios.sugar).toBeCloseTo(0.22, 3);
    });

    it("other blocks are unchanged when fat is adjusted", () => {
      const state = singleMacroState();
      const updated = adjustRatio(state, "fat", 0.18);
      const sugarGrams = updated.ingredients.find((i) => i.id === "_sugar")!.grams;
      const waterGrams = updated.ingredients.find((i) => i.id === "_water")!.grams;
      expect(sugarGrams).toBe(160);
      expect(waterGrams).toBe(607);
    });

    it("ratios sum to 1.0 after adjustment", () => {
      const state = singleMacroState();
      const updated = adjustRatio(state, "fat", 0.18);
      const ratios = computeRatios(updated);
      const sum = Object.values(ratios).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 4);
    });
  });
});

describe("conflict and rebalance", () => {
  it("rebalance returns conflict:false with valid ratios", () => {
    const conflictState: FormulaState = {
      ...baseState(),
      conflict: true,
    };
    const resolved = rebalance(conflictState);
    expect(resolved.conflict).toBe(false);
    const ratios = computeRatios(resolved);
    const sum = Object.values(ratios).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
  });
});

describe("setIngredientState", () => {
  it("excluding an ingredient removes it from ratio calculation", () => {
    const state = baseState();
    const before = computeRatios(state);

    const updated = setIngredientState(state, "heavy-cream", "excluded");
    const after = computeRatios(updated);

    // Removing cream (high fat) should lower the fat ratio
    expect(after.fat).toBeLessThan(before.fat);

    const sum = Object.values(after).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("pinning an ingredient means autobalance skips it", () => {
    const state = baseState();
    const pinned = setIngredientState(state, "sugar", "pinned");
    const current = computeRatios(pinned);
    const targetFat = Math.min(current.fat * 1.2, 0.2);
    const updated = adjustRatio(pinned, "fat", targetFat);
    const sugarGramsAfter = updated.ingredients.find((i) => i.id === "sugar")!.grams;
    expect(sugarGramsAfter).toBe(sugarIngredient.grams);
  });
});

describe("setYield", () => {
  it("scales all ingredient grams proportionally including excluded", () => {
    const state = baseState();
    const originalTotal = state.ingredients.reduce((sum, i) => sum + i.grams, 0);
    const newYield = 1760;
    const scale = newYield / originalTotal;
    const updated = setYield(state, newYield);

    const saltAfter = updated.ingredients.find((i) => i.id === "salt")!;
    expect(saltAfter.grams).toBeCloseTo(salt.grams * scale, 4);

    const milkAfter = updated.ingredients.find((i) => i.id === "whole-milk")!;
    expect(milkAfter.grams).toBeCloseTo(wholeMilk.grams * scale, 4);
  });

  it("ratios are unchanged after yield scaling", () => {
    const state = baseState();
    const before = computeRatios(state);
    const updated = setYield(state, 2000);
    const after = computeRatios(updated);

    expect(after.fat).toBeCloseTo(before.fat, 5);
    expect(after.sugar).toBeCloseTo(before.sugar, 5);
    expect(after.water).toBeCloseTo(before.water, 5);
  });
});

describe("setIngredientGrams", () => {
  it("updates ratios correctly when cream grams change", () => {
    const state = baseState();
    const before = computeRatios(state);
    const updated = setIngredientGrams(state, "heavy-cream", 400);
    const after = computeRatios(updated);
    // More cream = more fat
    expect(after.fat).toBeGreaterThan(before.fat);
    const sum = Object.values(after).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
});

describe("edge cases", () => {
  it("single ingredient mix: ratios still sum to 1.0", () => {
    const state: FormulaState = {
      ingredients: [wholeMilk],
      yieldGrams: 500,
      conflict: false,
    };
    const ratios = computeRatios(state);
    const sum = Object.values(ratios).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("addIngredient increases ingredient count", () => {
    const state = baseState();
    const newIngredient: Ingredient = {
      id: "vodka",
      name: "Vodka",
      state: "normal",
      grams: 50,
      macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.4, water: 0.6 },
    };
    const updated = addIngredient(state, newIngredient);
    expect(updated.ingredients).toHaveLength(state.ingredients.length + 1);
  });

  it("removeIngredient decreases ingredient count", () => {
    const state = baseState();
    const updated = removeIngredient(state, "salt");
    expect(updated.ingredients).toHaveLength(state.ingredients.length - 1);
    expect(updated.ingredients.find((i) => i.id === "salt")).toBeUndefined();
  });
});
