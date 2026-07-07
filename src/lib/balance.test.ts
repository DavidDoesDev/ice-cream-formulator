import { describe, it, expect } from "vitest";
import { balanceReport } from "./balance";
import type { MacroRatios } from "./formula-engine";

// Philadelphia archetype target — the style's ideal composition.
const target: MacroRatios = {
  fat: 0.14, sugar: 0.16, nonfatSolids: 0.09, stabilizer: 0.003,
  emulsifier: 0, alcohol: 0, water: 0.607,
};

describe("balance report", () => {
  it("scores a formula sitting on its target as fully balanced", () => {
    const r = balanceReport(target, target);
    expect(r.inRange).toBe(r.total);
    expect(r.balanced).toBe(true);
    expect(r.checks.every((c) => c.verdict === "ok")).toBe(true);
  });

  it("flags a low fat as low, with coaching, and drops out of balance", () => {
    const r = balanceReport({ ...target, fat: 0.05 }, target);
    const fat = r.checks.find((c) => c.key === "fat")!;
    expect(fat.verdict).toBe("low");
    expect(fat.advice).toBeTruthy();
    expect(r.balanced).toBe(false);
    expect(r.inRange).toBeLessThan(r.total);
  });

  it("flags a high sugar as high", () => {
    const r = balanceReport({ ...target, sugar: 0.30 }, target);
    expect(r.checks.find((c) => c.key === "sugar")!.verdict).toBe("high");
  });

  it("checks total solids as one of the tracked metrics", () => {
    expect(balanceReport(target, target).checks.some((c) => c.key === "totalSolids")).toBe(true);
  });
});
