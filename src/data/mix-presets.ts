import type { MixPreset, MixPresetIngredient, SmartMixKind } from "./types";
import type { IngredientMacros } from "@/lib/formula-engine";
import { getIngredientById } from "./ingredients";

// Derive effective macros from a list of proportioned sub-ingredients.
// Proportions must sum to 1.0 within each preset.
function computeEffectiveMacros(ingredients: MixPresetIngredient[]): IngredientMacros {
  const zero: IngredientMacros = {
    fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0,
    emulsifier: 0, alcohol: 0, water: 0,
  };
  return ingredients.reduce((acc, { ingredientId, proportion }) => {
    const ing = getIngredientById(ingredientId);
    if (!ing) return acc;
    const m = ing.macros;
    return {
      fat: acc.fat + m.fat * proportion,
      sugar: acc.sugar + m.sugar * proportion,
      nonfatSolids: acc.nonfatSolids + m.nonfatSolids * proportion,
      stabilizer: acc.stabilizer + m.stabilizer * proportion,
      emulsifier: acc.emulsifier + m.emulsifier * proportion,
      alcohol: acc.alcohol + m.alcohol * proportion,
      water: acc.water + m.water * proportion,
    };
  }, zero);
}

function preset(
  id: string,
  kind: SmartMixKind,
  name: string,
  ingredients: MixPresetIngredient[],
): MixPreset {
  return { id, kind, name, ingredients, effectiveMacros: computeEffectiveMacros(ingredients) };
}

// Build a per-formula custom system from user-chosen ingredients and weights.
// Weights are normalized to sum to 1.0; effective macros follow from them.
export function buildCustomPreset(
  kind: SmartMixKind,
  name: string,
  ingredients: MixPresetIngredient[],
): MixPreset {
  const total = ingredients.reduce((s, i) => s + i.proportion, 0) || 1;
  const normalized = ingredients.map((i) => ({
    ingredientId: i.ingredientId,
    proportion: i.proportion / total,
  }));
  return {
    id: `custom-${kind}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    name,
    ingredients: normalized,
    effectiveMacros: computeEffectiveMacros(normalized),
  };
}

// A single row in the custom-blend builder: an ingredient and its raw weight
// (normalized to a proportion at save time, mirroring buildCustomPreset).
export interface CustomBlendItem {
  ingredientId: string;
  weight: number;
}

// Seed the custom-blend builder from an existing preset, so choosing "Custom…"
// starts as an editable copy of the current blend rather than a blank slate.
// Proportions become friendly integer weights (×100) that rebuild to the same
// blend; a positive floor keeps a real ingredient from seeding at weight 0.
export function seedCustomItems(preset: MixPreset): CustomBlendItem[] {
  return preset.ingredients.map((i) => ({
    ingredientId: i.ingredientId,
    weight: Math.max(1, Math.round(i.proportion * 100)),
  }));
}

// A custom blend is degenerate — it would contribute nothing — when it has no
// ingredients or every weight is zero. Save is blocked in this state.
export function isDegenerateBlend(items: CustomBlendItem[]): boolean {
  return items.reduce((s, i) => s + i.weight, 0) === 0;
}

// ---------------------------------------------------------------------------
// Sugar Mix presets
// ---------------------------------------------------------------------------

const SUGAR_SUCROSE = preset("sugar-sucrose", "sugar", "Sucrose", [
  { ingredientId: "sucrose", proportion: 1.0 },
]);

const SUGAR_DEXTROSE_BLEND = preset("sugar-dextrose-blend", "sugar", "Dextrose Blend", [
  { ingredientId: "sucrose", proportion: 0.70 },
  { ingredientId: "dextrose", proportion: 0.30 },
]);

const SUGAR_INVERT = preset("sugar-invert", "sugar", "Invert Sugar", [
  { ingredientId: "sucrose", proportion: 0.50 },
  { ingredientId: "invert-sugar", proportion: 0.50 },
]);

const SUGAR_NATURAL = preset("sugar-natural", "sugar", "Natural Sweeteners", [
  { ingredientId: "sucrose", proportion: 0.50 },
  { ingredientId: "honey", proportion: 0.25 },
  { ingredientId: "maple-syrup", proportion: 0.25 },
]);

// Dana Cree's dairy bases pair sucrose with glucose syrup (150 g + 50 g → 75/25);
// glucose adds solids + anti-crystallization softness without full sweetness.
const SUGAR_GLUCOSE_BLEND = preset("sugar-glucose-blend", "sugar", "Sucrose + Glucose", [
  { ingredientId: "sucrose", proportion: 0.75 },
  { ingredientId: "glucose-syrup", proportion: 0.25 },
]);

// ---------------------------------------------------------------------------
// Stabilizer Mix presets
// ---------------------------------------------------------------------------

const STAB_MODERNIST = preset("stab-modernist", "stabilizer", "LBG + Carrageenan + Guar", [
  { ingredientId: "locust-bean-gum", proportion: 0.40 },
  { ingredientId: "carrageenan", proportion: 0.35 },
  { ingredientId: "guar-gum", proportion: 0.25 },
]);

const STAB_CORNSTARCH = preset("stab-cornstarch", "stabilizer", "Tara + Carrageenan", [
  { ingredientId: "carrageenan", proportion: 0.10 },
  { ingredientId: "tara-gum", proportion: 0.90 },
]);

const STAB_CREMODAN = preset("stab-cremodan", "stabilizer", "Cremodan", [
  { ingredientId: "locust-bean-gum", proportion: 0.40 },
  { ingredientId: "guar-gum", proportion: 0.30 },
  { ingredientId: "carrageenan", proportion: 0.20 },
  { ingredientId: "gelatin", proportion: 0.10 },
]);

const STAB_NONE = preset("stab-none", "stabilizer", "None", [
  // Used for custard, which relies on egg yolk emulsification; sub-ingredients intentionally empty.
  // effectiveMacros will be all zeros.
]);

// ---------------------------------------------------------------------------
// Milk Mix presets
// ---------------------------------------------------------------------------

// Single-ingredient milk-family components. Milk, cream, etc. are individual
// items (decision A) — each its own solver column — rather than a locked blend.
const MILK_WHOLE = preset("milk-whole", "milk", "Whole Milk (3.6% Fat)", [
  { ingredientId: "whole-milk", proportion: 1.0 },
]);

const CREAM_HEAVY = preset("cream-heavy", "milk", "Heavy Cream (40% Fat)", [
  { ingredientId: "cream-35", proportion: 1.0 },
]);

const CREAM_LIGHT = preset("cream-light", "milk", "Light Cream (18% Fat)", [
  { ingredientId: "cream-18", proportion: 1.0 },
]);

const MILK_POWDER = preset("milk-powder", "milk", "Skim Milk Powder", [
  { ingredientId: "skim-milk-powder", proportion: 1.0 },
]);

const MILK_COCONUT_CREAM = preset("milk-coconut-cream", "milk", "Coconut Cream", [
  { ingredientId: "coconut-cream", proportion: 1.0 },
]);

const MILK_OAT = preset("milk-oat", "milk", "Oat Milk", [
  { ingredientId: "oat-milk", proportion: 1.0 },
]);

const MILK_STANDARD = preset("milk-standard", "milk", "Standard", [
  { ingredientId: "whole-milk", proportion: 0.60 },
  { ingredientId: "cream-35", proportion: 0.40 },
]);

const MILK_MSNF_BOOSTED = preset("milk-msnf-boosted", "milk", "MSNF-Boosted", [
  { ingredientId: "whole-milk", proportion: 0.55 },
  { ingredientId: "cream-35", proportion: 0.35 },
  { ingredientId: "skim-milk-powder", proportion: 0.10 },
]);

const MILK_MILK_HEAVY = preset("milk-milk-heavy", "milk", "Milk-Heavy (Gelato)", [
  { ingredientId: "whole-milk", proportion: 0.75 },
  { ingredientId: "cream-35", proportion: 0.20 },
  { ingredientId: "skim-milk-powder", proportion: 0.05 },
]);

const MILK_SMALL_CREAM = preset("milk-small-cream", "milk", "Small Cream (Sherbet)", [
  { ingredientId: "whole-milk", proportion: 0.80 },
  { ingredientId: "cream-18", proportion: 0.20 },
]);

const MILK_PLANT_BASED = preset("milk-plant-based", "milk", "Plant-Based", [
  { ingredientId: "coconut-cream", proportion: 0.50 },
  { ingredientId: "oat-milk", proportion: 0.50 },
]);

// ---------------------------------------------------------------------------
// Liquid Mix presets (sorbet / sherbet water base)
// ---------------------------------------------------------------------------

// Pure water has no corresponding catalog ingredient — represent as a special preset
// that the solver treats as pure water (all macros zero except water: 1.0).
const LIQUID_WATER: MixPreset = {
  id: "liquid-water",
  kind: "liquid",
  name: "Water",
  ingredients: [],
  effectiveMacros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 1.0 },
};

// ---------------------------------------------------------------------------
// Egg Mix presets
// ---------------------------------------------------------------------------

const EGGS_YOLKS = preset("eggs-yolks", "eggs", "Egg Yolks", [
  { ingredientId: "egg-yolk", proportion: 1.0 },
]);

const EGGS_WHITES = preset("eggs-whites", "eggs", "Egg Whites", [
  { ingredientId: "egg-white", proportion: 1.0 },
]);

// A whole egg is roughly one part yolk to two parts white by weight.
const EGGS_WHOLE = preset("eggs-whole", "eggs", "Whole Eggs", [
  { ingredientId: "egg-yolk", proportion: 0.34 },
  { ingredientId: "egg-white", proportion: 0.66 },
]);

// ---------------------------------------------------------------------------
// Alcohol Mix preset
// Default is empty / unset. When the user activates the alcohol slider,
// the app auto-selects vodka as a neutral default.
// ---------------------------------------------------------------------------

const ALCOHOL_EMPTY: MixPreset = {
  id: "alcohol-empty",
  kind: "alcohol",
  name: "None",
  ingredients: [],
  effectiveMacros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
};

const ALCOHOL_VODKA = preset("alcohol-vodka", "alcohol", "Vodka", [
  { ingredientId: "vodka", proportion: 1.0 },
]);

const ALCOHOL_DARK_RUM = preset("alcohol-dark-rum", "alcohol", "Dark Rum", [
  { ingredientId: "dark-rum", proportion: 1.0 },
]);

// ---------------------------------------------------------------------------
// Emulsifier Mix presets
// Empty by default (custard gets its emulsification from egg yolks); when the
// user raises the emulsifier slider, the app auto-selects soy lecithin.
// ---------------------------------------------------------------------------

const EMULSIFIER_EMPTY: MixPreset = {
  id: "emulsifier-empty",
  kind: "emulsifier",
  name: "None",
  ingredients: [],
  effectiveMacros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
};

const EMULSIFIER_LECITHIN = preset("emulsifier-lecithin", "emulsifier", "Soy Lecithin", [
  { ingredientId: "soy-lecithin", proportion: 1.0 },
]);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const MIX_PRESETS: MixPreset[] = [
  SUGAR_SUCROSE,
  SUGAR_DEXTROSE_BLEND,
  SUGAR_INVERT,
  SUGAR_NATURAL,
  SUGAR_GLUCOSE_BLEND,
  STAB_MODERNIST,
  STAB_CORNSTARCH,
  STAB_CREMODAN,
  STAB_NONE,
  MILK_WHOLE,
  CREAM_HEAVY,
  CREAM_LIGHT,
  MILK_POWDER,
  MILK_COCONUT_CREAM,
  MILK_OAT,
  MILK_STANDARD,
  MILK_MSNF_BOOSTED,
  MILK_MILK_HEAVY,
  MILK_SMALL_CREAM,
  MILK_PLANT_BASED,
  LIQUID_WATER,
  EGGS_YOLKS,
  EGGS_WHITES,
  EGGS_WHOLE,
  ALCOHOL_EMPTY,
  ALCOHOL_VODKA,
  ALCOHOL_DARK_RUM,
  EMULSIFIER_EMPTY,
  EMULSIFIER_LECITHIN,
];

// Per-formula custom systems, registered at runtime so getPresetById (used by the
// solver and every view) can resolve their ids like any built-in preset.
const customRegistry = new Map<string, MixPreset>();

export function registerCustomPreset(preset: MixPreset): void {
  customRegistry.set(preset.id, preset);
}

export function getPresetById(id: string): MixPreset | undefined {
  return MIX_PRESETS.find((p) => p.id === id) ?? customRegistry.get(id);
}

export function getPresetsByKind(kind: SmartMixKind): MixPreset[] {
  return MIX_PRESETS.filter((p) => p.kind === kind);
}
