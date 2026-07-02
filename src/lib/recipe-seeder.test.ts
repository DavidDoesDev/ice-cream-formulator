import { describe, it, expect } from "vitest";
import { seedRecipe } from "./recipe-seeder";
import type { SmartMixKind } from "@/data/types";

function kinds(recipe: ReturnType<typeof seedRecipe>): SmartMixKind[] {
  return recipe.smartMixes.map((m) => m.kind);
}

function preset(recipe: ReturnType<typeof seedRecipe>, kind: SmartMixKind): string | undefined {
  return recipe.smartMixes.find((m) => m.kind === kind)?.presetId;
}

// ---------------------------------------------------------------------------
// Philadelphia
// ---------------------------------------------------------------------------

describe("seedRecipe(philadelphia)", () => {
  const recipe = seedRecipe("philadelphia");

  it("includes milk, sugar, stabilizer, alcohol — no eggs, no liquid", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "milk", "stabilizer", "sugar"]);
  });

  it("milk uses milk-standard preset", () => {
    expect(preset(recipe, "milk")).toBe("milk-standard");
  });

  it("sugar uses sugar-sucrose preset", () => {
    expect(preset(recipe, "sugar")).toBe("sugar-sucrose");
  });

  it("stabilizer uses stab-modernist preset", () => {
    expect(preset(recipe, "stabilizer")).toBe("stab-modernist");
  });

  it("alcohol uses alcohol-empty preset", () => {
    expect(preset(recipe, "alcohol")).toBe("alcohol-empty");
  });
});

// ---------------------------------------------------------------------------
// Custard
// ---------------------------------------------------------------------------

describe("seedRecipe(custard)", () => {
  const recipe = seedRecipe("custard");

  it("includes milk, eggs, sugar, stabilizer, alcohol — no liquid", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "eggs", "milk", "stabilizer", "sugar"]);
  });

  it("eggs uses eggs-yolks preset", () => {
    expect(preset(recipe, "eggs")).toBe("eggs-yolks");
  });

  it("stabilizer uses stab-none (custard relies on egg yolk emulsification)", () => {
    expect(preset(recipe, "stabilizer")).toBe("stab-none");
  });
});

// ---------------------------------------------------------------------------
// Gelato
// ---------------------------------------------------------------------------

describe("seedRecipe(gelato)", () => {
  const recipe = seedRecipe("gelato");

  it("includes milk, sugar, stabilizer, alcohol — no eggs by default, no liquid", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "milk", "stabilizer", "sugar"]);
  });

  it("milk uses milk-milk-heavy preset", () => {
    expect(preset(recipe, "milk")).toBe("milk-milk-heavy");
  });
});

// ---------------------------------------------------------------------------
// Sherbet
// ---------------------------------------------------------------------------

describe("seedRecipe(sherbet)", () => {
  const recipe = seedRecipe("sherbet");

  it("includes both milk and liquid kinds", () => {
    const k = kinds(recipe);
    expect(k).toContain("milk");
    expect(k).toContain("liquid");
  });

  it("milk uses milk-small-cream preset", () => {
    expect(preset(recipe, "milk")).toBe("milk-small-cream");
  });

  it("liquid uses liquid-water preset", () => {
    expect(preset(recipe, "liquid")).toBe("liquid-water");
  });
});

// ---------------------------------------------------------------------------
// Sorbet
// ---------------------------------------------------------------------------

describe("seedRecipe(sorbet)", () => {
  const recipe = seedRecipe("sorbet");

  it("has no milk kind, only liquid for the dairy-free base", () => {
    const k = kinds(recipe);
    expect(k).not.toContain("milk");
    expect(k).toContain("liquid");
  });
});

// ---------------------------------------------------------------------------
// Vegan
// ---------------------------------------------------------------------------

describe("seedRecipe(vegan)", () => {
  const recipe = seedRecipe("vegan");

  it("includes milk kind", () => {
    expect(kinds(recipe)).toContain("milk");
  });

  it("milk uses milk-plant-based preset", () => {
    expect(preset(recipe, "milk")).toBe("milk-plant-based");
  });
});

// ---------------------------------------------------------------------------
// All styles
// ---------------------------------------------------------------------------

describe("seedRecipe — invariants across all styles", () => {
  const styles = ["philadelphia", "custard", "gelato", "sherbet", "sorbet", "vegan"] as const;

  it("additionalIngredients is always empty", () => {
    for (const style of styles) {
      expect(seedRecipe(style).additionalIngredients, style).toEqual([]);
    }
  });

  it("all smart mix grams start at 0", () => {
    for (const style of styles) {
      const recipe = seedRecipe(style);
      for (const mix of recipe.smartMixes) {
        expect(mix.grams, `${style}/${mix.kind}`).toBe(0);
      }
    }
  });

  it("alcohol is always present and always uses alcohol-empty", () => {
    for (const style of styles) {
      expect(preset(seedRecipe(style), "alcohol"), style).toBe("alcohol-empty");
    }
  });
});
