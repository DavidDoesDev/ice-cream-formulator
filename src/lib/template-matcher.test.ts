import { describe, it, expect } from "vitest";
import { matchTemplate } from "./template-matcher";
import { ARCHETYPES } from "@/data/archetypes";

describe("matchTemplate", () => {
  it("returns all archetypes ranked (never empty)", () => {
    const results = matchTemplate("something", ARCHETYPES);
    expect(results).toHaveLength(ARCHETYPES.length);
  });

  it("a known style term returns that style as the top match", () => {
    const results = matchTemplate("gelato", ARCHETYPES);
    expect(results[0].archetype.style).toBe("gelato");
  });

  it("'sorbet' returns a sorbet as the top match", () => {
    const results = matchTemplate("sorbet", ARCHETYPES);
    expect(results[0].archetype.style).toBe("sorbet");
  });

  it("'vegan' returns a vegan archetype at the top", () => {
    const results = matchTemplate("vegan", ARCHETYPES);
    expect(results[0].archetype.style).toBe("vegan");
  });

  it("a specific inclusion narrows the result", () => {
    const results = matchTemplate("pistachio gelato", ARCHETYPES);
    expect(results[0].archetype.id).toBe("gelato-pistachio");
  });

  it("'peanut butter' as multi-word inclusion resolves correctly", () => {
    const results = matchTemplate("peanut butter custard", ARCHETYPES);
    expect(results[0].archetype.id).toBe("custard-peanut-butter");
  });

  it("multi-cue query produces a different ranking than single-cue", () => {
    const single = matchTemplate("chocolate", ARCHETYPES).map((r) => r.archetype.id);
    const multi = matchTemplate("lean fruity cold", ARCHETYPES).map((r) => r.archetype.id);
    expect(single[0]).not.toBe(multi[0]);
  });

  it("'lean fruity cold' scores sorbets or sherbets highly", () => {
    const results = matchTemplate("lean fruity cold", ARCHETYPES);
    const top3Styles = results.slice(0, 3).map((r) => r.archetype.style);
    const hasFruity = top3Styles.some((s) => s === "sorbet" || s === "sherbet");
    expect(hasFruity).toBe(true);
  });

  it("a nonsense query returns the closest archetype rather than throwing", () => {
    const results = matchTemplate("xyzzy frobnitz quux", ARCHETYPES);
    expect(results).toHaveLength(ARCHETYPES.length);
    expect(results[0].archetype).toBeDefined();
  });

  it("metadata contains which attributes matched", () => {
    const results = matchTemplate("silky pistachio gelato", ARCHETYPES);
    const top = results[0];
    expect(top.metadata.matchedStyle).toBe(true);
    expect(top.metadata.matchedInclusions).toContain("pistachio");
    expect(top.metadata.matchedTextures).toContain("silky");
    expect(top.metadata.userQuery).toBe("silky pistachio gelato");
  });

  it("confidence is 'high' when style matches", () => {
    const results = matchTemplate("gelato", ARCHETYPES);
    expect(results[0].metadata.confidence).toBe("high");
  });

  it("confidence is 'low' for a nonsense query", () => {
    const results = matchTemplate("xyzzy", ARCHETYPES);
    expect(results[0].metadata.confidence).toBe("low");
  });

  it("fat tier keyword 'lean' boosts lean archetypes", () => {
    const results = matchTemplate("lean", ARCHETYPES);
    expect(results[0].metadata.matchedFatTier).toBe(true);
    expect(results[0].archetype.attributes.fatTier).toBe("lean");
  });

  it("works with a custom archetype list", () => {
    const custom = [ARCHETYPES[0], ARCHETYPES[1]];
    const results = matchTemplate("anything", custom);
    expect(results).toHaveLength(2);
  });

  it("score is between 0 and 1", () => {
    const results = matchTemplate("rich chocolate custard", ARCHETYPES);
    for (const r of results) {
      expect(r.metadata.score).toBeGreaterThanOrEqual(0);
      expect(r.metadata.score).toBeLessThanOrEqual(1);
    }
  });
});
