import type { Archetype, Recipe, AdditionalIngredient } from "@/data/types";
import type { FormulaState, Ingredient, IngredientMacros, MacroRatios } from "@/lib/formula-engine";
import { seedRecipe } from "./recipe-seeder";
import { solveRecipe } from "./recipe-solver";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";

const DEFAULT_YIELD = 1000;

// Maps archetype inclusion tags to catalog ingredient IDs + sensible default grams.
// Only inclusions that represent discrete add-ins are mapped; base-system components
// (oat, coconut) are handled by the milk preset.
const INCLUSION_MAP: Record<string, { id: string; grams: number }> = {
  vanilla: { id: "vanilla-bean", grams: 20 },
  chocolate: { id: "dark-chocolate", grams: 80 },
  cocoa: { id: "cocoa-powder", grams: 30 },
  strawberry: { id: "strawberry-puree", grams: 150 },
  raspberry: { id: "raspberry-puree", grams: 150 },
  mango: { id: "mango-puree", grams: 150 },
  lemon: { id: "lemon-juice", grams: 100 },
  "passion fruit": { id: "passion-fruit-puree", grams: 100 },
  hazelnut: { id: "hazelnut-paste", grams: 100 },
  pistachio: { id: "pistachio-paste", grams: 80 },
  honey: { id: "honey", grams: 80 },
  "peanut butter": { id: "peanut-butter", grams: 100 },
};

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

export interface BootstrapResult {
  state: FormulaState;
  recipe: Recipe;
}

export function bootstrapFromArchetype(
  archetype: Archetype,
  yieldGrams = DEFAULT_YIELD,
): BootstrapResult {
  // --- Mix layer (FormulaState) ---
  const ingredients: Ingredient[] = [];

  for (const block of MACRO_BLOCKS) {
    const ratio = archetype.ratios[block.key as keyof typeof archetype.ratios];
    if (ratio <= 0) continue;

    const macros: IngredientMacros = {
      fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0,
      emulsifier: 0, alcohol: 0, water: 0,
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

  const state: FormulaState = { ingredients, yieldGrams, conflict: false };

  // --- Recipe layer ---
  const additionalIngredients: AdditionalIngredient[] = (archetype.attributes?.inclusions ?? [])
    .flatMap((tag) => {
      const mapped = INCLUSION_MAP[tag];
      return mapped ? [{ ingredientId: mapped.id, grams: mapped.grams }] : [];
    });

  const seeded = seedRecipe(archetype.style);
  const solvedMixes = solveRecipe(
    archetype.ratios,
    yieldGrams,
    additionalIngredients,
    seeded.smartMixes,
    getPresetById,
    (id) => getIngredientById(id)?.macros,
  );
  const recipe: Recipe = { smartMixes: solvedMixes, additionalIngredients };

  return { state, recipe };
}

/**
 * Build a FormulaState from a MacroRatios snapshot.
 * Used for Recipe → Mix sync: when recipe grams change, rebuild the FormulaState
 * macro blocks so the Mix sliders reflect the new composition.
 */
export function stateFromRatios(ratios: MacroRatios, yieldGrams: number): FormulaState {
  const ingredients: Ingredient[] = [];

  for (const block of MACRO_BLOCKS) {
    const ratio = ratios[block.key as keyof MacroRatios];
    if (!ratio || ratio <= 0) continue;

    const macros: IngredientMacros = {
      fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0,
      emulsifier: 0, alcohol: 0, water: 0,
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
