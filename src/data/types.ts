import type { MacroRatios, IngredientMacros } from "@/lib/formula-engine";

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
