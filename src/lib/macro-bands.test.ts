import { describe, it, expect } from "vitest";
import { healthyBand, isInRange, sliderGeometry } from "./macro-bands";

// Worked by hand from the definitions, independent of the implementation:
//   fat target 0.14, slider tolerance 0.04 → slider travel [0.10, 0.18]
//   fat healthy tolerance 0.02            → healthy window [0.12, 0.16]
describe("healthy band", () => {
  it("is the style target plus/minus the healthy tolerance", () => {
    const [lo, hi] = healthyBand("fat", 0.14);
    expect(lo).toBeCloseTo(0.12, 6);
    expect(hi).toBeCloseTo(0.16, 6);
  });

  it("clamps a zero-target macro to a one-sided window", () => {
    // alcohol target 0 → window starts at 0, never negative.
    const [lo] = healthyBand("alcohol", 0);
    expect(lo).toBe(0);
  });

  it("marks a value inside the window as in range, outside as out", () => {
    expect(isInRange("fat", 0.14, 0.14)).toBe(true);
    expect(isInRange("fat", 0.11, 0.14)).toBe(false); // below 0.12
    expect(isInRange("fat", 0.17, 0.14)).toBe(false); // above 0.16
  });
});

describe("slider geometry", () => {
  it("places the value and healthy-window ticks correctly on the track", () => {
    // Track spans the slider travel [0.10, 0.18] (width 0.08).
    const g = sliderGeometry("fat", 0.14, 0.14);
    expect(g.valuePct).toBeCloseTo(50, 5); // (0.14-0.10)/0.08
    expect(g.bandLoPct).toBeCloseTo(25, 5); // (0.12-0.10)/0.08
    expect(g.bandHiPct).toBeCloseTo(75, 5); // (0.16-0.10)/0.08
    expect(g.inRange).toBe(true);
  });

  it("flips out of range and clamps the position at the low edge", () => {
    const g = sliderGeometry("fat", 0.11, 0.14);
    expect(g.valuePct).toBeCloseTo(12.5, 5); // (0.11-0.10)/0.08
    expect(g.inRange).toBe(false);
  });

  it("keeps the value position within the track when the ratio exceeds the max", () => {
    const g = sliderGeometry("fat", 0.30, 0.14); // way past the 0.18 ceiling
    expect(g.valuePct).toBe(100);
  });
});
