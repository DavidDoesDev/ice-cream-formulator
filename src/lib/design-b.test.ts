import { describe, it, expect } from "vitest";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "./bootstrap";
import { computeRatios } from "./formula-engine";
import { totalGrams } from "./live-workspace";
import type { Recipe } from "@/data/types";

const custards = ARCHETYPES.filter((a) => a.style === "custard");
const gramsOf = (r: Recipe, presetId: string) =>
  r.smartMixes.filter((m) => m.presetId === presetId).reduce((s, m) => s + m.grams, 0);

describe("design B: custard defaults load as authored recipes (#52)", () => {
  it("all 6 custard archetypes carry an explicit recipe", () => {
    expect(custards).toHaveLength(6);
    for (const a of custards) expect(a.recipe).toBeDefined();
  });

  for (const a of custards) {
    describe(a.id, () => {
      const { state, recipe } = bootstrapFromArchetype(a);

      it("does not collapse to a pure egg-yolk mix (#52 regression)", () => {
        // The bug loaded ~1000 g egg yolks and zeroed everything else.
        const yolks = gramsOf(recipe, "eggs-yolks");
        expect(yolks).toBeGreaterThan(0);
        expect(yolks).toBeLessThan(150);
      });

      it("keeps the base dairy + sugar present (nothing zeroed)", () => {
        expect(gramsOf(recipe, "milk-whole")).toBeGreaterThan(0);
        expect(gramsOf(recipe, "cream-heavy")).toBeGreaterThan(0);
        expect(gramsOf(recipe, "sugar-glucose-blend")).toBeGreaterThan(0);
      });

      it("batches to ~1000 g", () => {
        expect(totalGrams(recipe)).toBeCloseTo(1000, 0);
      });

      it("derives sane custard macros — emulsifier ~0.2%, not the unreachable 2%", () => {
        const r = computeRatios(state);
        expect(r.emulsifier).toBeLessThan(0.01);
        expect(r.fat).toBeGreaterThan(0.1);
        expect(r.fat).toBeLessThan(0.22);
        expect(r.water).toBeGreaterThan(0.45);
        expect(r.water).toBeLessThan(0.65);
      });
    });
  }
});
