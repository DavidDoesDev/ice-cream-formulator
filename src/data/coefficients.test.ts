import { describe, it, expect } from "vitest";
import { INGREDIENTS } from "./ingredients";
import { getPresetById } from "./mix-presets";

const byId = (id: string) => INGREDIENTS.find((i) => i.id === id);

describe("sugar-glucose-blend preset", () => {
  it("blends 75% sucrose + 25% glucose syrup into the mix's effective macros", () => {
    const p = getPresetById("sugar-glucose-blend");
    expect(p).toBeDefined();
    // Spec (relationships.md): sucrose(sugar 1.0) 0.75 + glucose-syrup(sugar 0.8, water 0.2) 0.25
    // → sugar 0.95, water 0.05. Independent of how computeEffectiveMacros sums it.
    expect(p!.effectiveMacros.sugar).toBeCloseTo(0.95, 3);
    expect(p!.effectiveMacros.water).toBeCloseTo(0.05, 3);
  });
});

describe("sweetener coefficients", () => {
  it("every sweetener defines fpd and pod", () => {
    const sweeteners = INGREDIENTS.filter((i) => i.category === "sweetener");
    expect(sweeteners.length).toBeGreaterThan(0);
    for (const s of sweeteners) {
      expect(s.fpd, `${s.id} fpd`).toBeTypeOf("number");
      expect(s.pod, `${s.id} pod`).toBeTypeOf("number");
    }
  });

  it("uses the spec's freeze-point factors (sucrose 100 baseline, monosaccharides ~190)", () => {
    // Values from relationships.md / colligative physics (342/MW), not recomputed from code.
    expect(byId("sucrose")!.fpd).toBe(100);
    expect(byId("dextrose")!.fpd).toBe(190);
    expect(byId("dextrose")!.pod).toBe(70);
    expect(byId("sucrose")!.pod).toBe(100);
  });
});

describe("dairy lactose", () => {
  it("every dairy ingredient defines a lactose fraction", () => {
    const dairy = INGREDIENTS.filter((i) => i.category === "dairy");
    expect(dairy.length).toBeGreaterThan(0);
    for (const d of dairy) {
      expect(d.lactose, `${d.id} lactose`).toBeTypeOf("number");
    }
  });

  it("puts most of skim milk powder's mass in lactose, almost none in butter", () => {
    // Dairy-science reference points, independent of the catalog's own sugar macro.
    expect(byId("skim-milk-powder")!.lactose).toBeGreaterThan(0.4);
    expect(byId("butter")!.lactose).toBeLessThan(0.02);
  });
});
