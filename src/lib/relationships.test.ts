import { describe, it, expect } from "vitest";
import { relationshipHints } from "./relationships";
import { derive } from "./derive";
import { computeRatios } from "./formula-engine";
import { bootstrapFromArchetype } from "./bootstrap";
import { ARCHETYPES } from "@/data/archetypes";
import type { MacroRatios } from "./formula-engine";
import type { DerivedIndices } from "./derive";

const ratios = (o: Partial<MacroRatios> = {}): MacroRatios => ({
  fat: 0.14, sugar: 0.2, nonfatSolids: 0.05, stabilizer: 0.003,
  emulsifier: 0.002, alcohol: 0, water: 0.585, ...o,
});
const derived = (o: Partial<DerivedIndices> = {}): DerivedIndices => ({
  totalGrams: 1000, pac: 0.22, pod: 0.2, dairyMsnf: 0.05, lactose: 0.027, totalSolids: 0.4, ...o,
});
const keys = (hs: { key: string }[]) => hs.map((h) => h.key);

describe("sandiness (milk solids vs water)", () => {
  it("warns when dairy MSNF is too concentrated in the serum", () => {
    // dairyMSNF 0.15, water phase 0.60 → 0.20 in serum, past the ~0.17 threshold.
    const hints = relationshipHints(ratios(), derived({ dairyMsnf: 0.15, totalSolids: 0.4 }), "philadelphia");
    expect(keys(hints)).toContain("sandiness");
  });
  it("stays quiet at normal milk-solids levels", () => {
    const hints = relationshipHints(ratios(), derived({ dairyMsnf: 0.05 }), "philadelphia");
    expect(keys(hints)).not.toContain("sandiness");
  });
});

describe("ice control (watery + under-stabilized)", () => {
  it("warns when a watery mix lacks stabilizer", () => {
    const hints = relationshipHints(ratios({ water: 0.78, stabilizer: 0 }), derived(), "sorbet");
    expect(keys(hints)).toContain("ice-control");
  });
});

describe("scoopability (PAC)", () => {
  it("warns firm when freeze-point depression is below the style window", () => {
    const hints = relationshipHints(ratios(), derived({ pac: 0.08 }), "custard");
    expect(keys(hints)).toContain("firm");
  });
  it("warns soft when it's above the window", () => {
    const hints = relationshipHints(ratios(), derived({ pac: 0.45 }), "custard");
    expect(keys(hints)).toContain("soft");
  });
  it("stays quiet for an in-window PAC", () => {
    const hints = relationshipHints(ratios(), derived({ pac: 0.22 }), "custard");
    expect(keys(hints)).not.toContain("firm");
    expect(keys(hints)).not.toContain("soft");
  });
});

describe("scoopability window shifts with equipment", () => {
  // PAC 0.28 sits inside the home-dasher custard band (0.16–0.30) but above the
  // colder commercial-batch band (shifted down ~0.04 → 0.12–0.26) → reads soft there.
  it("passes a PAC that's fine for the warm home churn", () => {
    const hints = relationshipHints(ratios(), derived({ pac: 0.28 }), "custard", "home-dasher");
    expect(keys(hints)).not.toContain("soft");
  });
  it("flags the same PAC as soft on a colder machine", () => {
    const hints = relationshipHints(ratios(), derived({ pac: 0.28 }), "custard", "commercial-batch");
    expect(keys(hints)).toContain("soft");
  });
});

describe("on real authored recipes", () => {
  const hintsFor = (id: string) => {
    const a = ARCHETYPES.find((x) => x.id === id)!;
    const r = computeRatios(bootstrapFromArchetype(a).state);
    return keys(relationshipHints(r, derive(a.recipe!), a.style));
  };

  it("flags the high-protein Philadelphia base as sandy", () => {
    expect(hintsFor("philly-high-protein")).toContain("sandiness");
  });
  it("flags rum raisin as very soft (the alcohol antifreeze)", () => {
    expect(hintsFor("custard-rum-raisin")).toContain("soft");
  });
  it("leaves a plain vanilla custard hint-free", () => {
    expect(hintsFor("custard-vanilla")).toHaveLength(0);
  });
});
