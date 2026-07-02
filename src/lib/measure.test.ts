import { describe, it, expect } from "vitest";
import { formatPercent, formatGrams } from "./measure";

// Precision zones (from PRD "Precision" section):
//   percent >= 5      -> 1 decimal
//   2 <= percent < 5  -> 2 decimals
//   percent < 2       -> 3 decimals
// Expected strings below are the spec, not recomputed from the implementation.

describe("formatPercent", () => {
  it("shows 1 decimal for values at or above 5%", () => {
    expect(formatPercent(16)).toBe("16.0");
  });

  it("shows 2 decimals for values in the 2%–5% band", () => {
    expect(formatPercent(3)).toBe("3.00");
  });

  it("shows 3 decimals for values below 2%", () => {
    expect(formatPercent(0.4)).toBe("0.400");
  });

  it("places the zone boundaries at 2% and 5% inclusive-below", () => {
    // exactly 5% belongs to the 1-decimal zone; just under 5% is still 2 decimals
    expect(formatPercent(5)).toBe("5.0");
    expect(formatPercent(4.999)).toBe("5.00");
    // exactly 2% belongs to the 2-decimal zone; just under 2% is 3 decimals
    expect(formatPercent(2)).toBe("2.00");
    expect(formatPercent(1.999)).toBe("1.999");
  });
});

// Gram zones (from PRD "Precision" section):
//   grams < 5       -> 2 decimals
//   5 <= grams < 10 -> 1 decimal
//   grams >= 10     -> 0 decimals
describe("formatGrams", () => {
  it("shows whole grams at or above 10g", () => {
    expect(formatGrams(305)).toBe("305");
  });

  it("shows 1 decimal in the 5g–10g band", () => {
    expect(formatGrams(7)).toBe("7.0");
  });

  it("shows 2 decimals below 5g", () => {
    expect(formatGrams(2.4)).toBe("2.40");
  });

  it("places gram boundaries at 5g and 10g inclusive-below", () => {
    expect(formatGrams(10)).toBe("10");
    expect(formatGrams(9.9)).toBe("9.9");
    expect(formatGrams(5)).toBe("5.0");
    expect(formatGrams(4.9)).toBe("4.90");
  });
});
