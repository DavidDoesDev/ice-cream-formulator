import { describe, it, expect } from "vitest";
import { formatPercent, formatGrams } from "./measure";

// Normalized-width precision (constant ~character count):
//   percent < 10   -> 2 decimals
//   10 <= p < 100  -> 1 decimal
//   percent >= 100 -> 0 decimals
// Expected strings below are the spec, not recomputed from the implementation.

describe("formatPercent", () => {
  it("shows 2 decimals below 10%", () => {
    expect(formatPercent(0.4)).toBe("0.40");
    expect(formatPercent(3)).toBe("3.00");
    expect(formatPercent(9.99)).toBe("9.99");
  });

  it("shows 1 decimal from 10% up to 100%", () => {
    expect(formatPercent(10)).toBe("10.0");
    expect(formatPercent(16)).toBe("16.0");
    expect(formatPercent(99.9)).toBe("99.9");
  });

  it("shows whole numbers at 100% and above", () => {
    expect(formatPercent(100)).toBe("100");
  });

  it("places the zone boundaries at 10 and 100 inclusive-below", () => {
    expect(formatPercent(9.99)).toBe("9.99");   // just under 10 -> 2 decimals
    expect(formatPercent(10)).toBe("10.0");     // exactly 10 -> 1 decimal
    expect(formatPercent(99.9)).toBe("99.9");   // just under 100 -> 1 decimal
    expect(formatPercent(100)).toBe("100");     // exactly 100 -> 0 decimals
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
