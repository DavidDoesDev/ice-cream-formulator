import { describe, it, expect } from "vitest";
import { healthyBand, sliderBounds, isInRange, sliderGeometry } from "./macro-bands";
import { pacOffset } from "./equipment";

describe("healthy band (per style)", () => {
  it("returns the style's window for a macro", () => {
    // custard fat window, from the STYLE_TARGETS table (app convention).
    expect(healthyBand("custard", "fat")).toEqual([0.12, 0.22]);
  });

  it("differs by style — a sorbet has far less fat than a custard", () => {
    expect(healthyBand("sorbet", "fat")[1]).toBeLessThan(healthyBand("custard", "fat")[0]);
  });

  it("falls back to a default window for an unknown style", () => {
    expect(healthyBand("nonsense", "fat")).toEqual(healthyBand("philadelphia", "fat"));
  });
});

describe("healthy band (per equipment)", () => {
  it("home-dasher reproduces the style-only window exactly (strict superset)", () => {
    for (const macro of ["fat", "sugar", "nonfatSolids", "stabilizer"] as const) {
      expect(healthyBand("custard", macro, "home-dasher")).toEqual(healthyBand("custard", macro));
    }
  });

  it("a colder machine shifts the sugar window down by its PAC offset", () => {
    const [homeLo, homeHi] = healthyBand("custard", "sugar", "home-dasher");
    const [coldLo, coldHi] = healthyBand("custard", "sugar", "commercial-batch");
    const off = pacOffset("commercial-batch"); // negative
    expect(coldLo).toBeCloseTo(homeLo + off, 6);
    expect(coldHi).toBeCloseTo(homeHi + off, 6);
    expect(coldHi).toBeLessThan(homeHi); // strictly lower — needs less sugar
  });

  it("shifts the stabilizer window down too, but by less than the sugar shift", () => {
    const homeStab = healthyBand("gelato", "stabilizer", "home-dasher");
    const coldStab = healthyBand("gelato", "stabilizer", "commercial-batch");
    const sugarShift = healthyBand("gelato", "sugar", "home-dasher")[1] - healthyBand("gelato", "sugar", "commercial-batch")[1];
    const stabShift = homeStab[1] - coldStab[1];
    expect(stabShift).toBeGreaterThan(0); // moves down
    expect(stabShift).toBeLessThan(sugarShift); // secondary effect, smaller
  });

  it("leaves composition macros (fat, MSNF, emulsifier) untouched by equipment", () => {
    for (const macro of ["fat", "nonfatSolids", "emulsifier"] as const) {
      expect(healthyBand("custard", macro, "commercial-batch")).toEqual(healthyBand("custard", macro, "home-dasher"));
    }
  });
});

describe("equipment shift is visible on the slider", () => {
  // Regression: the track used to rescale with the band, so the sugar green zone
  // landed at the same track % for every machine and the shift was invisible.
  it("keeps the slider track fixed across machines", () => {
    const home = sliderGeometry("custard", "sugar", 0.2, "home-dasher");
    const cold = sliderGeometry("custard", "sugar", 0.2, "commercial-batch");
    expect(cold.min).toBe(home.min);
    expect(cold.max).toBe(home.max);
  });

  it("slides the green window down within that fixed track for a colder machine", () => {
    const home = sliderGeometry("custard", "sugar", 0.2, "home-dasher");
    const cold = sliderGeometry("custard", "sugar", 0.2, "commercial-batch");
    expect(cold.bandLoPct).toBeLessThan(home.bandLoPct);
    expect(cold.bandHiPct).toBeLessThan(home.bandHiPct);
  });

  it("keeps a composition macro's window put (fat doesn't slide)", () => {
    const home = sliderGeometry("custard", "fat", 0.15, "home-dasher");
    const cold = sliderGeometry("custard", "fat", 0.15, "commercial-batch");
    expect(cold.bandLoPct).toBe(home.bandLoPct);
    expect(cold.bandHiPct).toBe(home.bandHiPct);
  });
});

describe("in range", () => {
  it("marks values inside/outside the style window", () => {
    expect(isInRange("custard", "fat", 0.15)).toBe(true);
    expect(isInRange("custard", "fat", 0.05)).toBe(false); // below the band
    expect(isInRange("custard", "fat", 0.3)).toBe(false); // above the band
  });
});

describe("slider bounds", () => {
  it("pads the band outward but never past the physical bounds", () => {
    const [lo, hi] = sliderBounds("custard", "fat");
    const [blo, bhi] = healthyBand("custard", "fat");
    expect(lo).toBeLessThanOrEqual(blo);
    expect(hi).toBeGreaterThanOrEqual(bhi);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(0.22); // MACRO_BOUNDS.fat ceiling
  });
});

describe("slider geometry", () => {
  it("positions value and band ticks on the padded track", () => {
    // custard fat band [0.12, 0.22], pad 0.03, clamped to bounds → track [0.09, 0.22].
    const g = sliderGeometry("custard", "fat", 0.15);
    expect(g.min).toBeCloseTo(0.09, 6);
    expect(g.max).toBeCloseTo(0.22, 6);
    expect(g.inRange).toBe(true);
    expect(g.valuePct).toBeGreaterThan(0);
    expect(g.valuePct).toBeLessThan(100);
  });

  it("clamps the thumb inside the track when the value exceeds the max", () => {
    expect(sliderGeometry("custard", "fat", 0.4).valuePct).toBe(100);
  });
});
