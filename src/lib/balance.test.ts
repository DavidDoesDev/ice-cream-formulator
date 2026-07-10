import { describe, it, expect } from "vitest";
import { balanceReport } from "./balance";
import type { MacroRatios } from "./formula-engine";

// A custard sitting inside the custard style windows (fat 0.12–0.22, sugar
// 0.16–0.24, MSNF 0.025–0.09) with a total-solids sum near the style midpoint.
const custard: MacroRatios = {
  fat: 0.15, sugar: 0.2, nonfatSolids: 0.05, stabilizer: 0.002,
  emulsifier: 0.002, alcohol: 0, water: 0.576,
};

describe("balance report (per style)", () => {
  it("scores an in-window custard as fully balanced", () => {
    const r = balanceReport(custard, "custard");
    expect(r.balanced).toBe(true);
    expect(r.checks.every((c) => c.verdict === "ok")).toBe(true);
  });

  it("flags a low fat as low, with coaching, and drops out of balance", () => {
    const r = balanceReport({ ...custard, fat: 0.05 }, "custard");
    const fat = r.checks.find((c) => c.key === "fat")!;
    expect(fat.verdict).toBe("low");
    expect(fat.advice).toBeTruthy();
    expect(r.balanced).toBe(false);
  });

  it("flags a high sugar as high", () => {
    const r = balanceReport({ ...custard, sugar: 0.32 }, "custard");
    expect(r.checks.find((c) => c.key === "sugar")!.verdict).toBe("high");
  });

  it("judges the same ratios differently under a different style", () => {
    // 5% fat is fine for a sorbet-ish lean mix but low for a custard.
    expect(balanceReport({ ...custard, fat: 0.05 }, "custard").checks.find((c) => c.key === "fat")!.verdict).toBe("low");
    expect(balanceReport({ ...custard, fat: 0.05 }, "gelato").checks.find((c) => c.key === "fat")!.verdict).toBe("ok");
  });

  it("checks total solids as one of the tracked metrics", () => {
    expect(balanceReport(custard, "custard").checks.some((c) => c.key === "totalSolids")).toBe(true);
  });
});

describe("balance report (per equipment)", () => {
  // Sugar 0.23 sits inside the home-dasher custard window (0.16–0.24) but above
  // the colder commercial-batch window (shifted down ~0.04 → ~0.12–0.20).
  const sweet: MacroRatios = { ...custard, sugar: 0.23, water: 0.546 };

  it("passes sugar for the warm home churn", () => {
    expect(balanceReport(sweet, "custard", "home-dasher").checks.find((c) => c.key === "sugar")!.verdict).toBe("ok");
  });

  it("flags the same sugar as high for a colder machine", () => {
    expect(balanceReport(sweet, "custard", "commercial-batch").checks.find((c) => c.key === "sugar")!.verdict).toBe("high");
  });

  it("leaves fat unchanged by equipment", () => {
    const home = balanceReport(sweet, "custard", "home-dasher").checks.find((c) => c.key === "fat")!;
    const cold = balanceReport(sweet, "custard", "commercial-batch").checks.find((c) => c.key === "fat")!;
    expect(cold.verdict).toBe(home.verdict);
    expect(cold.band).toEqual(home.band);
  });
});
