import type { Archetype } from "@/data/types";
import type { FormulaState, Ingredient, IngredientMacros } from "@/lib/formula-engine";

const DEFAULT_YIELD = 1000;

// Each macro block contributes exactly one macro at 100%.
// This gives a FormulaState where computeRatios() returns the archetype's ratios exactly.
const MACRO_BLOCKS: { id: string; name: string; key: keyof IngredientMacros }[] = [
  { id: "_base-water", name: "Water", key: "water" },
  { id: "_base-fat", name: "Fat blend", key: "fat" },
  { id: "_base-sugar", name: "Sugar blend", key: "sugar" },
  { id: "_base-nonfat", name: "Milk solids", key: "nonfatSolids" },
  { id: "_base-stabilizer", name: "Stabilizer", key: "stabilizer" },
  { id: "_base-emulsifier", name: "Emulsifier", key: "emulsifier" },
  { id: "_base-alcohol", name: "Alcohol", key: "alcohol" },
];

export function bootstrapFromArchetype(
  archetype: Archetype,
  yieldGrams = DEFAULT_YIELD
): FormulaState {
  const ingredients: Ingredient[] = [];

  for (const block of MACRO_BLOCKS) {
    const ratio = archetype.ratios[block.key as keyof typeof archetype.ratios];
    if (ratio <= 0) continue;

    const macros: IngredientMacros = {
      fat: 0,
      sugar: 0,
      nonfatSolids: 0,
      stabilizer: 0,
      emulsifier: 0,
      alcohol: 0,
      water: 0,
      [block.key]: 1.0,
    };

    ingredients.push({
      id: block.id,
      name: block.name,
      state: "normal",
      grams: ratio * yieldGrams,
      macros,
    });
  }

  return { ingredients, yieldGrams, conflict: false };
}

export function generateFormulaId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
