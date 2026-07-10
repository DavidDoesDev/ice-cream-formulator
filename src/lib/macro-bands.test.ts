import { describe, it, expect } from "vitest";
import { healthyBand, sliderBounds, isInRange, sliderGeometry } from "./macro-bands";

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
