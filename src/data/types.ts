import type { MacroRatios, IngredientMacros } from "@/lib/formula-engine";

export type SmartMixKind = "milk" | "liquid" | "sugar" | "stabilizer" | "eggs" | "alcohol" | "emulsifier";

export interface MixPresetIngredient {
  ingredientId: string;
  proportion: number; // fraction of mix's total grams; all entries in a preset sum to 1.0
}

export interface MixPreset {
  id: string;
  kind: SmartMixKind;
  name: string;
  ingredients: MixPresetIngredient[];
  effectiveMacros: IngredientMacros; // weighted sum of sub-ingredient macros × proportions
}

export interface SmartMix {
  kind: SmartMixKind;
  label: string; // display name; for alcohol matches the selected ingredient name
  presetId: string;
  grams: number;
  note?: string; // per-formula note for this ingredient (not global to the catalog)
}

export interface AdditionalIngredient {
  ingredientId: string;
  grams: number;
  note?: string; // per-formula note for this ingredient
}

export interface Recipe {
  smartMixes: SmartMix[];
  additionalIngredients: AdditionalIngredient[];
}

export type StyleCategory =
  | "philadelphia"
  | "custard"
  | "gelato"
  | "sorbet"
  | "sherbet"
  | "vegan";

export type FatTier = "lean" | "medium" | "rich" | "ultra-rich";
export type SugarSystem = "sucrose" | "blended" | "invert" | "natural";

export type IngredientCategory =
  | "dairy"
  | "sweetener"
  | "stabilizer"
  | "emulsifier"
  | "inclusion"
  | "alcohol"
  | "fruit"
  | "vegan-dairy"
  | "misc";

export interface DecisionCard {
  label: string;
  reason: string;
}

export interface Archetype {
  id: string;
  name: string;
  style: StyleCategory;
  description: string;
  ratios: MacroRatios;
  attributes: {
    fatTier: FatTier;
    sugarSystem: SugarSystem;
    texture: string[];
    inclusions: string[];
    alcoholPresetId?: string; // overrides "alcohol-empty" in bootstrapFromArchetype when archetype has non-zero alcohol
  };
  prose: string;
  decisionCards: DecisionCard[];
}

export interface CatalogIngredient {
  id: string;
  name: string;
  description: string;
  category: IngredientCategory;
  macros: IngredientMacros;
}
