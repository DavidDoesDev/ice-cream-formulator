import { describe, it, expect } from "vitest";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "./bootstrap";
import { computeRatios } from "./formula-engine";
import { healthyBand } from "./macro-bands";
import type { MacroRatios } from "./formula-engine";

// Every authored base must open inside its style's healthy windows — the "slider
// starts in the green" guarantee (D8). Recipes (archetypes.ts) and bands
// (macro-bands.ts) are independent data, so this is a real cross-check, not a
// restatement. Currently covers the authored custards; extends automatically as
// #60 authors the other styles.
describe("authored recipes open inside their style's healthy bands", () => {
  const authored = ARCHETYPES.filter((a) => a.recipe);
  const MACROS: (keyof MacroRatios)[] = [
    "fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier", "alcohol", "water",
  ];

  it("there are authored recipes to check", () => {
    expect(authored.length).toBeGreaterThan(0);
  });

  for (const a of authored) {
    it(`${a.id} sits in every ${a.style} band`, () => {
      const r = computeRatios(bootstrapFromArchetype(a).state);
      for (const macro of MACROS) {
        const [lo, hi] = healthyBand(a.style, macro);
        const v = r[macro];
        expect(v, `${a.id} ${macro}=${(v * 100).toFixed(1)}% outside [${lo}, ${hi}]`).toBeGreaterThanOrEqual(lo - 1e-6);
        expect(v, `${a.id} ${macro}=${(v * 100).toFixed(1)}% outside [${lo}, ${hi}]`).toBeLessThanOrEqual(hi + 1e-6);
      }
    });
  }
});
