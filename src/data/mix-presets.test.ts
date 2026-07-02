import { describe, it, expect } from "vitest";
import { MIX_PRESETS, getPresetById, getPresetsByKind } from "./mix-presets";
import { getIngredientById } from "./ingredients";

describe("mix-presets", () => {
  it("every preset's sub-ingredient proportions sum to 1.0 (or 0 for empty presets)", () => {
    for (const preset of MIX_PRESETS) {
      if (preset.ingredients.length === 0) continue;
      const sum = preset.ingredients.reduce((acc, i) => acc + i.proportion, 0);
      expect(sum, `${preset.id} proportions sum`).toBeCloseTo(1.0, 5);
    }
  });

  it("effective macros for non-empty presets sum to <= 1.0", () => {
    for (const preset of MIX_PRESETS) {
      if (preset.ingredients.length === 0) continue;
      const m = preset.effectiveMacros;
      const total = m.fat + m.sugar + m.nonfatSolids + m.stabilizer + m.emulsifier + m.alcohol + m.water;
      expect(total, `${preset.id} macro total`).toBeLessThanOrEqual(1.01); // allow float rounding
    }
  });

  it("effective macros for empty presets are all zero (except liquid-water)", () => {
    const empty = MIX_PRESETS.filter(
      (p) => p.ingredients.length === 0 && p.id !== "liquid-water",
    );
    for (const preset of empty) {
      const m = preset.effectiveMacros;
      expect(m.fat + m.sugar + m.nonfatSolids + m.alcohol + m.water, `${preset.id} all-zero`).toBe(0);
    }
  });

  it("liquid-water preset has water: 1.0", () => {
    const p = getPresetById("liquid-water");
    expect(p).toBeDefined();
    expect(p!.effectiveMacros.water).toBe(1.0);
  });

  it("getPresetById returns undefined for unknown id", () => {
    expect(getPresetById("does-not-exist")).toBeUndefined();
  });

  it("getPresetsByKind returns only presets of the requested kind", () => {
    const sugar = getPresetsByKind("sugar");
    expect(sugar.length).toBeGreaterThan(0);
    expect(sugar.every((p) => p.kind === "sugar")).toBe(true);
  });

  it("all SmartMixKind values are covered", () => {
    const kinds = ["milk", "liquid", "sugar", "stabilizer", "eggs", "alcohol"] as const;
    for (const kind of kinds) {
      expect(getPresetsByKind(kind).length, `kind=${kind}`).toBeGreaterThan(0);
    }
  });

  it("every preset references only ingredient ids that exist in the catalog", () => {
    for (const preset of MIX_PRESETS) {
      for (const { ingredientId } of preset.ingredients) {
        expect(
          getIngredientById(ingredientId),
          `${preset.id} → ${ingredientId}`,
        ).toBeDefined();
      }
    }
  });
});
