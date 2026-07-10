import { describe, it, expect } from "vitest";
import { derive, computeFreezing } from "./derive";
import { ARCHETYPES } from "@/data/archetypes";
import type { Recipe } from "@/data/types";

// A one-ingredient recipe (additional ingredient) — the simplest lens on the math.
const only = (id: string, grams: number): Recipe => ({
  smartMixes: [],
  additionalIngredients: [{ ingredientId: id, grams }],
});

describe("PAC (freeze-point depression)", () => {
  it("makes a pure-sucrose mix the 1.0 baseline", () => {
    // sucrose is the sucrose=100 reference: 100 g of pure sugar → PAC 1.0/g.
    expect(derive(only("sucrose", 100)).pac).toBeCloseTo(1.0, 6);
  });

  it("preserves sugar identity — dextrose depresses ~1.9x sucrose", () => {
    // The whole point of the ingredient-level field: same `sugar` macro, different PAC.
    const suc = derive(only("sucrose", 100)).pac;
    const dex = derive(only("dextrose", 100)).pac;
    expect(dex / suc).toBeCloseTo(1.9, 2); // dextrose fpd 190 vs sucrose 100
  });

  it("counts ethanol, which depresses freezing far more than sugar per gram", () => {
    // vodka is 40% alcohol; ethanol factor ~740 → strong PAC from a little booze.
    const pac = derive(only("vodka", 100)).pac;
    expect(pac).toBeCloseTo(0.4 * 7.4, 2); // 100 g x 0.40 alcohol x 740/100 / 100 g
  });
});

describe("POD (sweetness)", () => {
  it("makes sucrose the 1.0 baseline and dextrose less sweet", () => {
    expect(derive(only("sucrose", 100)).pod).toBeCloseTo(1.0, 6);
    expect(derive(only("dextrose", 100)).pod).toBeCloseTo(0.7, 2); // dextrose pod 70
  });
});

describe("dairy MSNF + lactose", () => {
  it("reconstructs whole milk's ~8.8% MSNF from its lactose", () => {
    // whole-milk lactose 0.048; MSNF ≈ lactose / 0.545 ≈ 8.8% — a dairy-science check.
    const d = derive(only("whole-milk", 1000));
    expect(d.lactose).toBeCloseTo(0.048, 4);
    expect(d.dairyMsnf).toBeCloseTo(0.088, 2);
  });

  it("reads zero dairy MSNF for a dairy-free mix", () => {
    expect(derive(only("sucrose", 100)).dairyMsnf).toBe(0);
  });
});

describe("total solids", () => {
  it("computes whole milk at ~12.3% solids", () => {
    // fat 0.036 + sugar 0.048 + nonfatSolids 0.039 = 0.123.
    expect(derive(only("whole-milk", 1000)).totalSolids).toBeCloseTo(0.123, 3);
  });
});

describe("on a real authored recipe", () => {
  const custard = ARCHETYPES.find((a) => a.id === "custard-vanilla")!;

  it("resolves smart-mix presets down to ingredients (grams add up)", () => {
    expect(derive(custard.recipe!).totalGrams).toBeCloseTo(1000, 0);
  });

  it("gives a plausible scoopable PAC for a home custard", () => {
    const { pac } = computeFreezing(custard.recipe!);
    expect(pac).toBeGreaterThan(0.18);
    expect(pac).toBeLessThan(0.32);
  });
});

describe("freezing curve (iterative FPD model)", () => {
  const base = ARCHETYPES.find((a) => a.style === "custard")!.recipe!;
  const sorbet = ARCHETYPES.find((a) => a.style === "sorbet")!.recipe!;

  it("keeps the directional PAC on the return (backward-compatible seam)", () => {
    expect(computeFreezing(base).pac).toBeCloseTo(derive(base).pac, 6);
  });

  it("reports a frozen-water fraction in (0,1] at serving temp", () => {
    const f = computeFreezing(base, -12).frozenFraction;
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThanOrEqual(1);
  });

  it("freezes more as it gets colder (monotonic in temperature)", () => {
    const colder = computeFreezing(base, -20).frozenFraction;
    const warmer = computeFreezing(base, -8).frozenFraction;
    expect(colder).toBeGreaterThan(warmer);
  });

  it("a high-sugar sorbet is softer (less frozen) than a lean custard at the same temp", () => {
    // The acceptance ordering: more freeze-point depression → less ice at a given temp.
    expect(computeFreezing(sorbet, -12).frozenFraction).toBeLessThan(
      computeFreezing(base, -12).frozenFraction,
    );
  });

  it("has frozen nothing just below 0 °C, above the mix's initial freezing point", () => {
    // A sugary mix's freezing point is a few °C below zero, so at −0.5 °C no ice yet.
    expect(computeFreezing(sorbet, -0.5).frozenFraction).toBe(0);
  });

  it("puts the initial freezing point a few degrees below zero", () => {
    const t0 = computeFreezing(base).initialFreezingC;
    expect(t0).toBeLessThan(0);
    expect(t0).toBeGreaterThan(-6);
  });
});
