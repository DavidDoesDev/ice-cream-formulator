import { describe, it, expect } from "vitest";
import { seedRecipe } from "./recipe-seeder";
import { getPresetById } from "@/data/mix-presets";
import type { SmartMixKind } from "@/data/types";

function kinds(recipe: ReturnType<typeof seedRecipe>): SmartMixKind[] {
  return recipe.smartMixes.map((m) => m.kind);
}

// The catalog ingredient ids carried by every mix of a given kind.
function ingredientsOfKind(
  recipe: ReturnType<typeof seedRecipe>,
  kind: SmartMixKind,
): string[] {
  return recipe.smartMixes
    .filter((m) => m.kind === kind)
    .flatMap((m) => getPresetById(m.presetId)?.ingredients.map((i) => i.ingredientId) ?? []);
}

// A "single" component is a mix carrying exactly one catalog ingredient.
function isSingleIngredientKind(
  recipe: ReturnType<typeof seedRecipe>,
  kind: SmartMixKind,
): boolean {
  const mixes = recipe.smartMixes.filter((m) => m.kind === kind);
  return mixes.length > 0 && mixes.every((m) => getPresetById(m.presetId)?.ingredients.length === 1);
}

function preset(recipe: ReturnType<typeof seedRecipe>, kind: SmartMixKind): string | undefined {
  return recipe.smartMixes.find((m) => m.kind === kind)?.presetId;
}

// ---------------------------------------------------------------------------
// Philadelphia
// ---------------------------------------------------------------------------

describe("seedRecipe(philadelphia)", () => {
  const recipe = seedRecipe("philadelphia");

  it("includes two milks (whole + cream), sugar, stabilizer, alcohol, emulsifier — no eggs, no liquid", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "emulsifier", "milk", "milk", "stabilizer", "sugar"]);
  });

  it("splits the milk base into individual ingredients (whole milk + cream), not one blend", () => {
    expect(isSingleIngredientKind(recipe, "milk")).toBe(true);
    expect(ingredientsOfKind(recipe, "milk").sort()).toEqual(["cream-35", "whole-milk"]);
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

  it("includes two milks, eggs, sugar, stabilizer, alcohol, emulsifier — no liquid", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "eggs", "emulsifier", "milk", "milk", "stabilizer", "sugar"]);
  });

  it("splits the milk base into individual whole milk + cream", () => {
    expect(isSingleIngredientKind(recipe, "milk")).toBe(true);
    expect(ingredientsOfKind(recipe, "milk").sort()).toEqual(["cream-35", "whole-milk"]);
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

  it("includes three milks (whole, cream, milk powder), sugar, stabilizer, alcohol, emulsifier", () => {
    expect(kinds(recipe).sort()).toEqual(["alcohol", "emulsifier", "milk", "milk", "milk", "stabilizer", "sugar"]);
  });

  it("splits the milk base into individual whole milk, cream, and milk powder", () => {
    expect(isSingleIngredientKind(recipe, "milk")).toBe(true);
    expect(ingredientsOfKind(recipe, "milk").sort()).toEqual(["cream-35", "skim-milk-powder", "whole-milk"]);
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

  it("splits the milk base into individual whole milk + light cream", () => {
    expect(isSingleIngredientKind(recipe, "milk")).toBe(true);
    expect(ingredientsOfKind(recipe, "milk").sort()).toEqual(["cream-18", "whole-milk"]);
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

  it("splits the plant base into individual coconut cream + oat milk", () => {
    expect(isSingleIngredientKind(recipe, "milk")).toBe(true);
    expect(ingredientsOfKind(recipe, "milk").sort()).toEqual(["coconut-cream", "oat-milk"]);
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

  it("emulsifier is always present and always uses emulsifier-empty", () => {
    for (const style of styles) {
      expect(preset(seedRecipe(style), "emulsifier"), style).toBe("emulsifier-empty");
    }
  });
});
