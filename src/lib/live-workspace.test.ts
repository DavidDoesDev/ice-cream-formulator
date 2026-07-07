import { describe, it, expect } from "vitest";
import { solveRecipe } from "./recipe-solver";
import {
  setMacroTarget,
  setTraceMacro,
  setMixGrams,
  addAdditionalIngredient,
  removeAdditionalIngredient,
  rebalanceWorkspace,
  workspaceRatios,
  workspaceConflict,
  totalGrams,
  type LiveWorkspace,
  type WorkspaceDeps,
} from "./live-workspace";
import type { MacroRatios } from "./formula-engine";
import type { SmartMix } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";

const deps: WorkspaceDeps = {
  getPreset: getPresetById,
  resolveIngredient: (id) => getIngredientById(id)?.macros,
};

const mix = (kind: string, presetId: string): SmartMix =>
  ({ kind: kind as SmartMix["kind"], label: presetId, presetId, grams: 0 });

// A realistic Philadelphia-ish recipe solved to a known target at 1000 g.
function seededWorkspace(): LiveWorkspace {
  const mixes = [
    mix("milk", "milk-whole"),
    mix("milk", "cream-heavy"),
    mix("sugar", "sugar-sucrose"),
    mix("stabilizer", "stab-modernist"),
    mix("alcohol", "alcohol-empty"),
  ];
  const target: MacroRatios = {
    fat: 0.13, sugar: 0.16, nonfatSolids: 0.09, stabilizer: 0.003,
    emulsifier: 0, alcohol: 0, water: 0.607,
  };
  const solved = solveRecipe(target, 1000, [], mixes, getPresetById, deps.resolveIngredient);
  return { recipe: { smartMixes: solved, additionalIngredients: [] }, yieldGrams: 1000 };
}

describe("live workspace binding", () => {
  it("holds the yield constant when a macro target changes", () => {
    const ws0 = seededWorkspace();
    // The independent invariant: yield was set to 1000; a slider must not move it.
    const ws1 = setMacroTarget(ws0, "fat", 0.17, deps);
    expect(totalGrams(ws1.recipe)).toBeCloseTo(1000, 0);
    expect(ws1.yieldGrams).toBe(1000);
  });

  it("leaves trace mixes untouched when a big macro is solved", () => {
    // Dragging sugar must not thrash the stabilizer grams — trace additives are
    // held out of the blend solve.
    const ws0 = seededWorkspace();
    const stabBefore = ws0.recipe.smartMixes.find((m) => m.presetId === "stab-modernist")!.grams;
    const ws1 = setMacroTarget(ws0, "sugar", 0.2, deps);
    const stabAfter = ws1.recipe.smartMixes.find((m) => m.presetId === "stab-modernist")!.grams;
    expect(stabAfter).toBe(stabBefore);
  });

  it("actually moves the fat ratio toward the requested target", () => {
    const ws0 = seededWorkspace();
    const before = workspaceRatios(ws0, deps).fat;
    const ws1 = setMacroTarget(ws0, "fat", 0.18, deps);
    const after = workspaceRatios(ws1, deps).fat;
    expect(after).toBeGreaterThan(before);
  });

  it("recomputes ratios live when a mix gram amount is edited directly", () => {
    const ws0 = seededWorkspace();
    const sugarBefore = workspaceRatios(ws0, deps).sugar;
    const sugarGrams = ws0.recipe.smartMixes.find((m) => m.presetId === "sugar-sucrose")!.grams;
    const ws1 = setMixGrams(ws0, "sugar-sucrose", sugarGrams + 200);
    expect(workspaceRatios(ws1, deps).sugar).toBeGreaterThan(sugarBefore);
  });

  it("treats a direct gram edit as a real batch change (yield follows the sum)", () => {
    const ws0 = seededWorkspace();
    const sugarGrams = ws0.recipe.smartMixes.find((m) => m.presetId === "sugar-sucrose")!.grams;
    const ws1 = setMixGrams(ws0, "sugar-sucrose", sugarGrams + 200);
    expect(ws1.yieldGrams).toBeCloseTo(1200, 0);
  });

  it("adds an additional ingredient and grows the yield by its grams", () => {
    const ws0 = seededWorkspace();
    const ws1 = addAdditionalIngredient(ws0, "cocoa", 60);
    expect(ws1.recipe.additionalIngredients.some((a) => a.ingredientId === "cocoa")).toBe(true);
    expect(ws1.yieldGrams).toBeCloseTo(1060, 0);
  });

  it("removes an additional ingredient and shrinks the yield back", () => {
    const ws0 = addAdditionalIngredient(seededWorkspace(), "cocoa", 60);
    const ws1 = removeAdditionalIngredient(ws0, "cocoa");
    expect(ws1.recipe.additionalIngredients.some((a) => a.ingredientId === "cocoa")).toBe(false);
    expect(ws1.yieldGrams).toBeCloseTo(1000, 0);
  });

  it("places a trace macro exactly at its target by dosing its pure source", () => {
    // stabilizer's source (stab-modernist) is 100% stabilizer — dosing it hits
    // the target exactly, unlike the whole-recipe solve which washes it out.
    const ws1 = setTraceMacro(seededWorkspace(), "stabilizer", 0.005, deps);
    expect(workspaceRatios(ws1, deps).stabilizer).toBeCloseTo(0.005, 3);
  });

  it("doses emulsifier to its target while holding the batch yield", () => {
    const seed = seededWorkspace();
    const ws0: LiveWorkspace = {
      ...seed,
      recipe: {
        ...seed.recipe,
        smartMixes: [
          ...seed.recipe.smartMixes,
          { kind: "emulsifier", label: "Emulsifier", presetId: "emulsifier-lecithin", grams: 0 },
        ],
      },
    };
    const ws1 = setTraceMacro(ws0, "emulsifier", 0.004, deps);
    expect(workspaceRatios(ws1, deps).emulsifier).toBeCloseTo(0.004, 3);
    expect(totalGrams(ws1.recipe)).toBeCloseTo(ws0.yieldGrams, 0); // yield held, batch redistributed
  });

  it("rebalances an out-of-bound formula back into every macro's bounds", () => {
    // Drive sugar just past its upper bound to force a conflict, then rebalance.
    const pushed = setMacroTarget(seededWorkspace(), "sugar", 0.42, deps);
    // Sanity: the push actually created a conflict (independent of rebalance).
    expect(workspaceConflict(pushed, deps)).toBe(true);
    const fixed = rebalanceWorkspace(pushed, deps);
    expect(workspaceConflict(fixed, deps)).toBe(false);
  });
});
