import { describe, it, expect } from "vitest";
import { derive, computeFreezing } from "./derive";
import { getIngredientById } from "@/data/ingredients";
import { healthyBand } from "./macro-bands";
import type { Recipe } from "@/data/types";

// LITERATURE-VALIDATION SUITE.
//
// derive.test.ts proves the engine is self-CONSISTENT (the code reproduces the
// coefficients in the data file). This suite proves the coefficients are CORRECT —
// it pins each one to a published source so a future refactor can't silently drift
// the science away from the literature. If an assertion here fails, the fix is
// usually to restore the coefficient, not to change the test — read the citation.
//
// Sources verified 2026-07-14 via a source-checked deep-research pass (3-vote
// adversarial verification). Full audit + provenance:
//   docs/research/business-and-science-audit.md
//
// Tags: CONFIRMED = matches primary/textbook sources; PARTIAL = matches with a
// documented caveat; UNAUDITED = locked to catch drift, but provenance is thin.

const only = (id: string, grams: number): Recipe => ({
  smartMixes: [],
  additionalIngredients: [{ ingredientId: id, grams }],
});

const ing = (id: string) => {
  const found = getIngredientById(id);
  if (!found) throw new Error(`missing ingredient ${id}`);
  return found;
};

describe("PAC coefficients — freeze-point depression, sucrose=100 [CONFIRMED]", () => {
  it("sucrose is the 1.0 baseline (the sucrose=100 convention)", () => {
    // Standard gelato convention (POD/PAC relative to sucrose). — under-belly.org,
    // iceicedaddy, Ice Cream Calc. CONFIRMED 3-0.
    expect(ing("sucrose").fpd).toBe(100);
  });

  it("dextrose = 190, exactly the colligative MW ratio 342/180 ≈ 1.9", () => {
    // Monosaccharide MW 180 → 342/180 = 1.90× sucrose per gram. Goff & Hartel
    // "sucrose equivalent" 1.9; Ice Cream Calc dextrose=190. CONFIRMED 3-0.
    expect(Math.round((342 / 180) * 100)).toBe(190);
    expect(ing("dextrose").fpd).toBe(190);
  });

  it("invert sugar = 190 (glucose+fructose, both MW ~180)", () => {
    // dairyscience.info FPDF table: invert sugar = 1.9. CONFIRMED (2nd pass).
    expect(ing("invert-sugar").fpd).toBe(190);
  });

  it("honey = 190 (predominantly invert sugars)", () => {
    // Follows from honey being mostly invert. CONFIRMED (2nd pass).
    expect(ing("honey").fpd).toBe(190);
  });

  it("trehalose = 100 (disaccharide MW ~342, ≈ sucrose)", () => {
    // MW 342.31 ≈ sucrose → same molal FPD per gram. CONFIRMED (Sigma-Aldrich MW).
    expect(ing("trehalose").fpd).toBe(100);
  });

  it("sucrose-based sweeteners (brown sugar, molasses, maple) ≈ 100", () => {
    // Chemically dominated by sucrose → PAC ≈ 100. Inferred (no discrete tabulated
    // value in the verified set), consistent with composition. CONFIRMED-by-inference.
    expect(ing("brown-sugar").fpd).toBe(100);
    expect(ing("molasses").fpd).toBe(100);
    expect(ing("maple-syrup").fpd).toBe(100);
  });

  it("glucose syrup = 70 — DE-DEPENDENT, ≈38-40 DE [PARTIAL]", () => {
    // Glucose/corn syrup FPD is strongly DE-dependent and CANNOT be one fixed value.
    // Published: 62 DE=115, 42 DE=80, 36 DE=64, 28 DE=50 (Smith & Bradley 1983;
    // dairyscience.info). App's 70 interpolates to ~38-40 DE — the LOW end of the
    // 38-42 DE band. A true 42 DE syrup would be 80, not 70. This is a modelling
    // choice, not a bug; revisit if glucose syrup is ever relabelled as 42 DE, or
    // expose DE as a parameter. See open questions in the audit doc.
    expect(ing("glucose-syrup").fpd).toBe(70);
  });
});

describe("Ethanol freeze-point depression = 740 [CONFIRMED, idealized]", () => {
  it("vodka (40% ABV) contributes PAC via the 740 factor", () => {
    // Ice Cream Calc & dairyscience.info list ethanol FPD=740. 100 g × 0.40 alcohol
    // × 740/100 / 100 g = 2.96. CONFIRMED 3-0.
    expect(derive(only("vodka", 100)).pac).toBeCloseTo(2.96, 2);
  });

  it("740 is the pure-colligative prediction 342/46 (app rounds 743→740)", () => {
    // Ethanol MW 46, non-electrolyte (i=1): 342/46 = 7.43 → 743. CAVEAT: ethanol-
    // water is strongly non-ideal, so 740 is an engineering approximation, not a
    // deviation-corrected measurement — fine for the app's comparative model.
    expect(Math.round((342 / 46) * 100)).toBe(743);
  });
});

describe("Cryoscopic constant K = 5.44 [CONFIRMED]", () => {
  it("arithmetic: Kf(water) 1.86 × 1000 / sucrose MW 342 = 5.44", () => {
    // Kf(water)=1.86 K·kg/mol (Wikipedia; also cited 1.853), sucrose 342.30 g/mol.
    // Standard Goff & Hartel mix-freezing approach. CONFIRMED 3-0.
    expect((1.86 * 1000) / 342).toBeCloseTo(5.44, 2);
  });

  it("the wired constant recovers 5.44 through computeFreezing", () => {
    // initialFreezingC = -K·(pac/water). Recovering K from a real dairy mix pins the
    // coded CRYOSCOPIC_K (derive.ts) to 5.44 independent of the mix's water content.
    const wm = only("whole-milk", 1000);
    const d = derive(wm);
    const { initialFreezingC } = computeFreezing(wm);
    expect(-initialFreezingC / (d.pac / d.water)).toBeCloseTo(5.44, 2);
  });
});

describe("Lactose = 54.5% of MSNF [CONFIRMED]", () => {
  it("dairy MSNF is reconstructed as lactose / 0.545", () => {
    // Standard milk MSNF composition: ~54.5% lactose, ~37% protein, ~8% minerals.
    // Van Slyke & Bosworth (1915) via dairyscience.info; Ice Cream Calc; Guelph.
    // CONFIRMED 3-0. (Value also circulates as 55.5% — 54.5% is a legit common figure.)
    const d = derive(only("whole-milk", 1000));
    expect(d.lactose / d.dairyMsnf).toBeCloseTo(0.545, 3);
  });
});

describe("POD coefficients — sweetness, sucrose=100", () => {
  it("dextrose = 70, trehalose = 45 [CONFIRMED]", () => {
    // Dextrose ~3/4 sucrose (lit. 70-75; Owl Software 74); trehalose 45-50.
    // CONFIRMED (1st pass). POD is empirically panel-tasted, so a few points vary.
    expect(ing("dextrose").pod).toBe(70);
    expect(derive(only("dextrose", 100)).pod).toBeCloseTo(0.7, 2);
    expect(ing("trehalose").pod).toBe(45);
  });

  it("invert 125 / honey 130 / glucose syrup 50 / molasses 70 [UNAUDITED]", () => {
    // These POD values were NOT independently corroborated with primary quotes in
    // the audit (verification concentrated on PAC/FPD). Locked here only to catch
    // silent drift — treat provenance as thin until a POD-specific source pass runs.
    // See open questions in docs/research/business-and-science-audit.md.
    expect(ing("invert-sugar").pod).toBe(125);
    expect(ing("honey").pod).toBe(130);
    expect(ing("glucose-syrup").pod).toBe(50);
    expect(ing("molasses").pod).toBe(70);
  });
});

describe("Per-style composition bands vs. published ranges", () => {
  // IMPORTANT: the app's sugar/MSNF bands are an APP CONVENTION, not Goff's — dairy
  // lactose is modelled inside `sugar` (see macro-bands.ts), so sugar reads ~+3% and
  // nonfatSolids ~-5% vs Goff's tables BY DESIGN. Only FAT is a clean literature
  // comparison (unaffected by the lactose convention).

  it("gelato fat band overlaps Goff & Hartel gelato fat 4-8% [CONFIRMED]", () => {
    // Goff/Dream Scoops gelato: fat 4-8%. App gelato fat [0.03, 0.13] overlaps.
    const [lo, hi] = healthyBand("gelato", "fat");
    expect(lo).toBeLessThanOrEqual(0.08);
    expect(hi).toBeGreaterThanOrEqual(0.04);
  });

  it("custard fat band overlaps hard-frozen ice cream fat 10-16% [CONFIRMED]", () => {
    // Guelph "Suggested Mixes" hard-frozen: fat 10-16%. App custard fat [0.12, 0.22].
    const [lo, hi] = healthyBand("custard", "fat");
    expect(lo).toBeLessThanOrEqual(0.16);
    expect(hi).toBeGreaterThanOrEqual(0.1);
  });

  it("sherbet fat floor 2% sits ABOVE Goff's 0.5-1.5% [PARTIAL — known deviation]", () => {
    // Guelph sherbet: milk fat 0.5-1.5%. App floor is 0.02 (2%) — above the published
    // range. Documented here so the mismatch is visible and revisitable, NOT asserted
    // as correct. Lower the floor to ~0.005 if aligning to Goff.
    expect(healthyBand("sherbet", "fat")[0]).toBe(0.02);
  });
});
