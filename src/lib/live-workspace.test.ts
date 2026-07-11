import { describe, it, expect } from "vitest";
import { solveRecipe } from "./recipe-solver";
import {
  setMacroTarget,
  setTraceMacro,
  setMixGrams,
  addAdditionalIngredient,
  removeAdditionalIngredient,
  addSmartMix,
  rebalanceWorkspace,
  recalibrate,
  workspaceRatios,
  workspaceConflict,
  totalGrams,
  type LiveWorkspace,
  type WorkspaceDeps,
} from "./live-workspace";
import { isInRange } from "./macro-bands";
import { balanceReport } from "./balance";
import { ARCHETYPES } from "@/data/archetypes";
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

// A Philadelphia-style mix at ~23% sugar — comfortably in the home-dasher window
// (0.19–0.25) but above a colder machine's shifted-down window.
function sweetWorkspace(): LiveWorkspace {
  const ws = setMacroTarget(seededWorkspace(), "sugar", 0.23, deps);
  return ws;
}

describe("addSmartMix (one-tap add, e.g. the custard egg nudge)", () => {
  it("adds a mix of the requested kind that wasn't present", () => {
    const ws = addSmartMix(seededWorkspace(), "eggs", "eggs-yolks", "Egg Yolks", 90);
    const egg = ws.recipe.smartMixes.find((m) => m.kind === "eggs");
    expect(egg).toBeTruthy();
    expect(egg!.presetId).toBe("eggs-yolks");
    expect(egg!.grams).toBeGreaterThan(0); // actually dosed, not a 0-gram placeholder
  });

  it("conserves the batch yield (scales the batch back)", () => {
    const ws0 = seededWorkspace();
    const ws1 = addSmartMix(ws0, "eggs", "eggs-yolks", "Egg Yolks", 90);
    expect(ws1.yieldGrams).toBe(ws0.yieldGrams);
    expect(totalGrams(ws1.recipe)).toBeCloseTo(ws0.yieldGrams, 0);
  });

  it("shifts the composition toward a custard (egg yolk raises fat)", () => {
    const ws0 = seededWorkspace();
    const ws1 = addSmartMix(ws0, "eggs", "eggs-yolks", "Egg Yolks", 90);
    expect(workspaceRatios(ws1, deps).fat).toBeGreaterThan(workspaceRatios(ws0, deps).fat);
  });

  it("is a no-op when a mix of that kind is already present", () => {
    const ws1 = addSmartMix(seededWorkspace(), "eggs", "eggs-yolks", "Egg Yolks", 90);
    const ws2 = addSmartMix(ws1, "eggs", "eggs-yolks", "Egg Yolks", 90);
    expect(ws2.recipe.smartMixes.filter((m) => m.kind === "eggs")).toHaveLength(1);
    expect(ws2).toBe(ws1); // unchanged reference
  });
});

describe("recalibrate (Rebalance to Balanced)", () => {
  it("brings an out-of-range recipe into the green for the colder machine", () => {
    const ws = sweetWorkspace();
    expect(isInRange("philadelphia", "sugar", workspaceRatios(ws, deps).sugar, "commercial-batch")).toBe(false);
    const fixed = recalibrate(ws, deps, "philadelphia", "commercial-batch");
    expect(isInRange("philadelphia", "sugar", workspaceRatios(fixed, deps).sugar, "commercial-batch")).toBe(true);
  });

  it("reaches a balanced scorecard", () => {
    const ws = sweetWorkspace();
    const fixed = recalibrate(ws, deps, "philadelphia", "commercial-batch");
    expect(balanceReport(workspaceRatios(fixed, deps), "philadelphia", "commercial-batch").balanced).toBe(true);
  });

  it("conserves the batch yield while retuning", () => {
    const ws = sweetWorkspace();
    const fixed = recalibrate(ws, deps, "philadelphia", "commercial-batch");
    expect(fixed.yieldGrams).toBe(ws.yieldGrams);
    expect(totalGrams(fixed.recipe)).toBeCloseTo(ws.yieldGrams, 0);
  });

  it("pulls every out-of-range macro in, not just sugar", () => {
    // Fat dragged above the philadelphia window and sugar above the colder
    // machine's window — Rebalance brings BOTH into the green.
    let ws = setMacroTarget(seededWorkspace(), "fat", 0.2, deps);
    ws = setMacroTarget(ws, "sugar", 0.24, deps);
    expect(isInRange("philadelphia", "fat", workspaceRatios(ws, deps).fat, "commercial-batch")).toBe(false);
    const after = workspaceRatios(recalibrate(ws, deps, "philadelphia", "commercial-batch"), deps);
    expect(isInRange("philadelphia", "fat", after.fat, "commercial-batch")).toBe(true);
    expect(isInRange("philadelphia", "sugar", after.sugar, "commercial-batch")).toBe(true);
  });

  it("reaches Balanced with no conflict even for a hard-dragged egg custard", () => {
    // Centering an egg-rich custard pulls in yolk, which nudges the incidental
    // emulsifier over its bound — the final clamp keeps it in, so no conflict.
    const a = ARCHETYPES.find((x) => x.id === "custard-rum-raisin")!;
    let ws: LiveWorkspace = { recipe: a.recipe!, yieldGrams: totalGrams(a.recipe!) };
    ws = setMacroTarget(ws, "sugar", 0.34, deps);
    ws = setMacroTarget(ws, "fat", 0.2, deps);
    ws = setMacroTarget(ws, "nonfatSolids", 0.13, deps);
    const fixed = recalibrate(ws, deps, "custard", "home-dasher");
    expect(workspaceConflict(fixed, deps)).toBe(false);
    expect(balanceReport(workspaceRatios(fixed, deps), "custard", "home-dasher").balanced).toBe(true);
  });

  it("is a no-op once nothing fixable remains (idempotent)", () => {
    const once = recalibrate(sweetWorkspace(), deps, "philadelphia", "commercial-batch");
    const twice = recalibrate(once, deps, "philadelphia", "commercial-batch");
    expect(twice).toBe(once); // same reference — only choice-driven notes could remain
  });
});
