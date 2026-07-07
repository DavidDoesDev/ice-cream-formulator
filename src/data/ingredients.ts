import type { CatalogIngredient } from "./types";

// All macros are fractions of ingredient weight summing to ~1.0.
// nonfatSolids = protein + minerals only (lactose is tracked under sugar).

export const INGREDIENTS: CatalogIngredient[] = [
  // --- Dairy ---
  {
    id: "whole-milk",
    name: "Whole Milk",
    description: "The backbone of most ice cream. Adds water, a little fat, and milk solids.",
    category: "dairy",
    macros: { fat: 0.036, sugar: 0.048, nonfatSolids: 0.039, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.877 },
  },
  {
    id: "skim-milk",
    name: "Skim Milk",
    description: "All the milk solids, almost none of the fat. Good for boosting MSNF without adding fat.",
    category: "dairy",
    macros: { fat: 0.001, sugar: 0.048, nonfatSolids: 0.044, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.907 },
  },
  {
    id: "cream-18",
    name: "Light Cream (18%)",
    description: "Lower-fat cream. Adds richness without the full weight of heavy cream.",
    category: "dairy",
    macros: { fat: 0.18, sugar: 0.027, nonfatSolids: 0.028, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.765 },
  },
  {
    id: "cream-35",
    name: "Heavy Cream (35%)",
    description: "High-fat cream. The primary fat source in American-style ice cream.",
    category: "dairy",
    macros: { fat: 0.35, sugar: 0.020, nonfatSolids: 0.020, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.610 },
  },
  {
    id: "butter",
    name: "Butter",
    description: "Almost pure fat. Used in small amounts in brown butter or ultra-rich formulas.",
    category: "dairy",
    macros: { fat: 0.82, sugar: 0, nonfatSolids: 0.02, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.16 },
  },
  {
    id: "brown-butter",
    name: "Brown Butter",
    description: "Butter cooked until the water evaporates and the milk solids caramelize. Nutty and intensely flavored.",
    category: "dairy",
    macros: { fat: 0.80, sugar: 0, nonfatSolids: 0.18, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.02 },
  },
  {
    id: "skim-milk-powder",
    name: "Skim Milk Powder",
    description: "Concentrated milk solids with no fat. The standard way to boost MSNF in a formula.",
    category: "dairy",
    macros: { fat: 0.005, sugar: 0.50, nonfatSolids: 0.455, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.04 },
  },
  {
    id: "sweetened-condensed-milk",
    name: "Sweetened Condensed Milk",
    description: "Milk concentrated with added sugar. Adds sweetness and solids in one ingredient.",
    category: "dairy",
    macros: { fat: 0.08, sugar: 0.45, nonfatSolids: 0.19, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.28 },
  },

  // --- Sweeteners ---
  {
    id: "sucrose",
    name: "Sucrose",
    description: "Plain table sugar. The standard sweetener and the baseline for all sugar comparisons.",
    category: "sweetener",
    macros: { fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "dextrose",
    name: "Dextrose",
    description: "Glucose in powder form. Less sweet than sugar, lowers the freezing point more, makes for a softer scoop.",
    category: "sweetener",
    macros: { fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "invert-sugar",
    name: "Invert Sugar",
    description: "Equal mix of glucose and fructose. Stays liquid, resists crystallization, and keeps texture smooth over time.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.75, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.25 },
  },
  {
    id: "trehalose",
    name: "Trehalose",
    description: "A mild, clean-tasting sugar that protects texture during freeze-thaw cycles.",
    category: "sweetener",
    macros: { fat: 0, sugar: 1.0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "honey",
    name: "Honey",
    description: "Natural sweetener with floral notes. High fructose content softens the scoop.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.82, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.17 },
  },
  {
    id: "maple-syrup",
    name: "Maple Syrup",
    description: "Adds distinctive caramel-woody sweetness. Grade B has the strongest flavor.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.67, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.33 },
  },

  // --- Stabilizers ---
  {
    id: "carrageenan",
    name: "Carrageenan",
    description: "Seaweed-derived stabilizer. Excellent at preventing ice crystal growth and whey separation.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "locust-bean-gum",
    name: "Locust Bean Gum",
    description: "Smooth, creamy texture. Often paired with other gums — synergistic with carrageenan and guar.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "guar-gum",
    name: "Guar Gum",
    description: "Strong water-binding gum. Controls ice crystal size and improves body.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "tara-gum",
    name: "Tara Gum",
    description: "A clean-label alternative to locust bean gum with a neutral flavor.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "gelatin",
    name: "Gelatin",
    description: "Animal-derived protein that gives a slightly chewy, old-fashioned body.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0.90, stabilizer: 0.10, emulsifier: 0, alcohol: 0, water: 0 },
  },

  // --- Emulsifiers ---
  {
    id: "egg-yolk",
    name: "Egg Yolk",
    description: "The classic emulsifier in French custard. Adds richness and a silky, coating mouthfeel.",
    category: "emulsifier",
    macros: { fat: 0.27, sugar: 0, nonfatSolids: 0.14, stabilizer: 0, emulsifier: 0.02, alcohol: 0, water: 0.50 },
  },
  {
    id: "egg-white",
    name: "Egg White",
    description: "Mostly water and protein. Adds body and lift without fat or the yolk's emulsification.",
    category: "misc",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0.11, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.89 },
  },
  {
    id: "soy-lecithin",
    name: "Soy Lecithin",
    description: "Plant-based emulsifier. Improves body and reduces iciness without adding richness.",
    category: "emulsifier",
    // Modeled as a pure emulsifier so the emulsifier slider is a clean, independent
    // lever (real lecithin is mostly fat, but that coupling isn't useful here).
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 1, alcohol: 0, water: 0 },
  },

  // --- Inclusions ---
  {
    id: "cocoa-powder",
    name: "Cocoa Powder",
    description: "Dutch-process cocoa for deep chocolate flavor with minimal fat.",
    category: "inclusion",
    macros: { fat: 0.12, sugar: 0, nonfatSolids: 0.76, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.03 },
  },
  {
    id: "dark-chocolate",
    name: "Dark Chocolate (70%)",
    description: "Melted-in dark chocolate. Adds fat and intense chocolate flavor.",
    category: "inclusion",
    macros: { fat: 0.42, sugar: 0.28, nonfatSolids: 0.14, stabilizer: 0, emulsifier: 0.01, alcohol: 0, water: 0.01 },
  },
  {
    id: "peanut-butter",
    name: "Peanut Butter",
    description: "Natural, no-stir peanut butter. Adds fat, protein, and a strong roasted nut flavor.",
    category: "inclusion",
    macros: { fat: 0.50, sugar: 0.06, nonfatSolids: 0.25, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.02 },
  },
  {
    id: "hazelnut-paste",
    name: "Hazelnut Paste",
    description: "Pure roasted hazelnut paste, no sugar added. Intensely nutty and rich.",
    category: "inclusion",
    macros: { fat: 0.62, sugar: 0.05, nonfatSolids: 0.24, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.02 },
  },
  {
    id: "pistachio-paste",
    name: "Pistachio Paste",
    description: "Pure roasted pistachio paste, no sugar added. Delicate, slightly savory, and intensely green.",
    category: "inclusion",
    macros: { fat: 0.62, sugar: 0.05, nonfatSolids: 0.24, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.02 },
  },
  {
    id: "vanilla-bean",
    name: "Vanilla Bean",
    description: "Whole vanilla bean scraped into the mix. Adds visible specks and complex floral flavor.",
    category: "inclusion",
    macros: { fat: 0, sugar: 0.10, nonfatSolids: 0.85, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.05 },
  },

  {
    id: "raisins",
    name: "Raisins",
    description: "Dried grapes, used rum-soaked in rum raisin ice cream. High natural sugar; soak in spirit before adding so they stay plump when frozen.",
    category: "inclusion",
    macros: { fat: 0.004, sugar: 0.62, nonfatSolids: 0.04, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.15 },
  },

  // --- Alcohol ---
  {
    id: "vodka",
    name: "Vodka",
    description: "Neutral spirit. Lowers the freezing point for a softer, spoonable texture straight from the freezer.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.40, water: 0.60 },
  },
  {
    id: "dark-rum",
    name: "Dark Rum",
    description: "Adds a molasses-caramel note alongside the freeze-point-lowering effect of alcohol.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0.02, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.40, water: 0.58 },
  },

  // --- Fruit ---
  {
    id: "strawberry-puree",
    name: "Strawberry Purée",
    description: "Fresh-tasting, bright, and slightly tart. High water content — account for dilution.",
    category: "fruit",
    macros: { fat: 0, sugar: 0.07, nonfatSolids: 0.005, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.925 },
  },
  {
    id: "raspberry-puree",
    name: "Raspberry Purée",
    description: "Intensely tangy and fragrant. The seeds are strained out in most applications.",
    category: "fruit",
    macros: { fat: 0, sugar: 0.09, nonfatSolids: 0.005, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.905 },
  },
  {
    id: "lemon-juice",
    name: "Lemon Juice",
    description: "Adds brightness and tartness. Almost no sugar — the flavor comes from acid, not sweetness.",
    category: "fruit",
    macros: { fat: 0, sugar: 0.025, nonfatSolids: 0.005, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.97 },
  },
  {
    id: "mango-puree",
    name: "Mango Purée",
    description: "Tropical and intensely sweet. Alphonso variety gives the most aromatic result.",
    category: "fruit",
    macros: { fat: 0, sugar: 0.14, nonfatSolids: 0.005, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.855 },
  },
  {
    id: "passion-fruit-puree",
    name: "Passion Fruit Purée",
    description: "Sharp, tropical, and complex. A little goes a long way.",
    category: "fruit",
    macros: { fat: 0, sugar: 0.11, nonfatSolids: 0.01, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.88 },
  },

  // --- Vegan Dairy ---
  {
    id: "coconut-cream",
    name: "Coconut Cream",
    description: "High-fat coconut extract. The richest plant-based fat source for ice cream.",
    category: "vegan-dairy",
    macros: { fat: 0.24, sugar: 0.06, nonfatSolids: 0.03, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.67 },
  },
  {
    id: "oat-milk",
    name: "Oat Milk",
    description: "Mild, slightly sweet. Lower fat than coconut — works best with stabilizers.",
    category: "vegan-dairy",
    macros: { fat: 0.015, sugar: 0.07, nonfatSolids: 0.01, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.905 },
  },
  {
    id: "cashew-cream",
    name: "Cashew Cream",
    description: "Blended soaked cashews. Neutral flavor, creamy body, naturally emulsified.",
    category: "vegan-dairy",
    macros: { fat: 0.12, sugar: 0.05, nonfatSolids: 0.07, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.76 },
  },

  // --- Misc ---
  {
    id: "salt",
    name: "Salt",
    description: "Enhances every other flavor. Used in small amounts — typically excluded from mix calculations.",
    category: "misc",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
  },
];

export function getIngredientById(id: string): CatalogIngredient | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}

export function getIngredientsByCategory(category: CatalogIngredient["category"]): CatalogIngredient[] {
  return INGREDIENTS.filter((i) => i.category === category);
}
