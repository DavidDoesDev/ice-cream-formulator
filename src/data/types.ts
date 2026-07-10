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
  customPresets?: MixPreset[]; // per-formula custom systems (registered on load)
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

// Second axis orthogonal to style (D8): the freezing/serving equipment sets the
// scoopability windows (sugar/PAC, stabilizer). Placeholder — only home-dasher is
// calibrated this migration; the picker + profile windows are a later feature.
export type EquipmentProfile = "home-dasher" | "creami" | "pacojet" | "commercial-batch";
export const DEFAULT_EQUIPMENT: EquipmentProfile = "home-dasher";

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
  // Design B (D2): the authored, explicit gram recipe. When present, bootstrap loads
  // it verbatim and derives ratios from it. Optional during the migration — archetypes
  // without one fall back to the legacy ratio-solve seed until authored (#60).
  recipe?: Recipe;
  equipment?: EquipmentProfile; // defaults to DEFAULT_EQUIPMENT
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
  // Two-layer schema (D6/D7): optional ingredient coefficients the 7-macro model
  // can't hold, consumed by the derivation module (never persisted). fpd/pod are
  // relative to sucrose = 100, PER GRAM OF THE INGREDIENT'S SUGAR MASS.
  fpd?: number; // freezing-point depression (scoopability). sucrose 100; absent → treated as 100
  pod?: number; // sweetening power. sucrose 100
  lactose?: number; // lactose mass fraction 0..1 (dairy only) → true dairy MSNF + sandiness
}
