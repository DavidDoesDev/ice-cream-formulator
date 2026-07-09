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

  {
    id: "mascarpone",
    name: "Mascarpone",
    description: "Italian cream cheese — high fat, low tang. Adds richness and a dense, custardy body.",
    category: "dairy",
    macros: { fat: 0.44, sugar: 0.03, nonfatSolids: 0.05, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.48 },
  },
  {
    id: "cream-cheese",
    name: "Cream Cheese",
    description: "Tangy and firm. The signature note in cheesecake ice cream; adds fat and body.",
    category: "dairy",
    macros: { fat: 0.344, sugar: 0.038, nonfatSolids: 0.074, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.53 },
  },
  {
    id: "creme-fraiche",
    name: "Crème Fraîche",
    description: "Cultured heavy cream. High fat with a gentle sour tang that offsets sweetness.",
    category: "dairy",
    macros: { fat: 0.30, sugar: 0.03, nonfatSolids: 0.03, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.64 },
  },
  {
    id: "buttermilk",
    name: "Buttermilk",
    description: "Cultured low-fat milk. Bright, tangy, and thin — boosts MSNF with almost no fat.",
    category: "dairy",
    macros: { fat: 0.01, sugar: 0.047, nonfatSolids: 0.038, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.905 },
  },
  {
    id: "whole-milk-powder",
    name: "Whole Milk Powder",
    description: "Dried whole milk. Boosts MSNF and adds a cooked-milk richness that skim powder can't.",
    category: "dairy",
    macros: { fat: 0.267, sugar: 0.384, nonfatSolids: 0.324, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.025 },
  },
  {
    id: "evaporated-milk",
    name: "Evaporated Milk",
    description: "Milk reduced by half, unsweetened. Concentrated solids without the sugar of condensed milk.",
    category: "dairy",
    macros: { fat: 0.075, sugar: 0.10, nonfatSolids: 0.08, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.745 },
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt (Whole)",
    description: "Strained whole-milk yogurt. High protein and a clean tartness for frozen-yogurt styles.",
    category: "dairy",
    macros: { fat: 0.044, sugar: 0.045, nonfatSolids: 0.095, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.813 },
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

  {
    id: "glucose-syrup",
    name: "Glucose Syrup",
    description: "Thick corn-derived syrup. Adds solids and chew, blocks crystallization, keeps the scoop smooth.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.80, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.20 },
  },
  {
    id: "brown-sugar",
    name: "Brown Sugar",
    description: "Sucrose with molasses clinging to it. Adds a warm caramel-toffee note along with sweetness.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.97, nonfatSolids: 0.005, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.025 },
  },
  {
    id: "molasses",
    name: "Molasses",
    description: "Dark, bitter-sweet syrup left from refining sugar. Intense flavor; use in small amounts.",
    category: "sweetener",
    macros: { fat: 0, sugar: 0.747, nonfatSolids: 0.03, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.223 },
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

  {
    id: "xanthan-gum",
    name: "Xanthan Gum",
    description: "Powerful water-binder from fermented sugar. A tiny dose thickens the mix and slows melt.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "cmc",
    name: "Cellulose Gum (CMC)",
    description: "Plant-fiber-derived gum. Cheap, effective, and neutral — controls ice crystals and body.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "pectin",
    name: "Pectin",
    description: "Fruit-derived gelling fiber. Especially at home in sorbets, where it lends a soft, clean set.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 1.0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "stabilizer-blend",
    name: "Stabilizer Blend",
    description: "All-in-one blend of gums and emulsifier (guar, locust bean, carrageenan, mono-diglycerides). One-shot dose for body and smoothness.",
    category: "stabilizer",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0.75, emulsifier: 0.25, alcohol: 0, water: 0 },
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

  {
    id: "mono-diglycerides",
    name: "Mono- & Diglycerides",
    description: "The workhorse commercial emulsifier. Sharpens the fat network for a dry, stiff, slow-melting scoop.",
    category: "emulsifier",
    macros: { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 1, alcohol: 0, water: 0 },
  },
  {
    id: "sunflower-lecithin",
    name: "Sunflower Lecithin",
    description: "Soy-free plant emulsifier. Improves body and smooths texture without adding richness.",
    category: "emulsifier",
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

  {
    id: "milk-chocolate",
    name: "Milk Chocolate",
    description: "Melted-in milk chocolate. Sweeter and milder than dark, adding fat, sugar, and milk solids.",
    category: "inclusion",
    macros: { fat: 0.30, sugar: 0.51, nonfatSolids: 0.13, stabilizer: 0, emulsifier: 0.01, alcohol: 0, water: 0.015 },
  },
  {
    id: "white-chocolate",
    name: "White Chocolate",
    description: "Cocoa butter, sugar, and milk solids — no cocoa. Sweet and rich with a soft dairy flavor.",
    category: "inclusion",
    macros: { fat: 0.32, sugar: 0.59, nonfatSolids: 0.07, stabilizer: 0, emulsifier: 0.01, alcohol: 0, water: 0.01 },
  },
  {
    id: "almond-butter",
    name: "Almond Butter",
    description: "Roasted almonds ground to a paste. Adds fat, protein, and a mellow marzipan-nut flavor.",
    category: "inclusion",
    macros: { fat: 0.555, sugar: 0.063, nonfatSolids: 0.24, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.016 },
  },
  {
    id: "tahini",
    name: "Tahini",
    description: "Ground sesame paste. Savory, faintly bitter, and rich — pairs with honey and halva flavors.",
    category: "inclusion",
    macros: { fat: 0.53, sugar: 0.005, nonfatSolids: 0.225, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.03 },
  },
  {
    id: "dulce-de-leche",
    name: "Dulce de Leche",
    description: "Slowly caramelized sweetened milk. Deep toffee flavor plus sugar and milk solids.",
    category: "inclusion",
    macros: { fat: 0.073, sugar: 0.52, nonfatSolids: 0.12, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.287 },
  },
  {
    id: "salted-caramel",
    name: "Salted Caramel",
    description: "Cooked-sugar caramel with cream and salt. Swirled or blended for buttery caramel flavor.",
    category: "inclusion",
    macros: { fat: 0.14, sugar: 0.55, nonfatSolids: 0.03, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.28 },
  },
  {
    id: "espresso-powder",
    name: "Espresso Powder",
    description: "Instant espresso. Concentrated coffee flavor with no dilution — a little darkens and deepens the base.",
    category: "inclusion",
    macros: { fat: 0.002, sugar: 0.02, nonfatSolids: 0.80, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.03 },
  },
  {
    id: "matcha-powder",
    name: "Matcha Powder",
    description: "Stone-ground green tea. Grassy, slightly bitter, and vivid green; use in small amounts.",
    category: "inclusion",
    macros: { fat: 0.05, sugar: 0, nonfatSolids: 0.60, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.05 },
  },
  {
    id: "malted-milk-powder",
    name: "Malted Milk Powder",
    description: "Malted barley and milk solids. The toasty, nostalgic malt note in a classic malted scoop.",
    category: "inclusion",
    macros: { fat: 0.08, sugar: 0.55, nonfatSolids: 0.20, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.03 },
  },
  {
    id: "marshmallow",
    name: "Marshmallow Fluff",
    description: "Whipped sugar syrup and egg white. Adds a sticky sweetness and gooey ribbon when swirled.",
    category: "inclusion",
    macros: { fat: 0, sugar: 0.70, nonfatSolids: 0.015, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.20 },
  },
  {
    id: "cookie-crumbs",
    name: "Cookie Crumbs",
    description: "Crushed sandwich cookies. A crunchy mix-in that softens to a fudgy chew in the frozen base.",
    category: "inclusion",
    macros: { fat: 0.18, sugar: 0.35, nonfatSolids: 0.42, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.03 },
  },
  {
    id: "brownie-pieces",
    name: "Brownie Pieces",
    description: "Chunks of fudgy brownie folded in. Adds pockets of dense chocolate cake to the scoop.",
    category: "inclusion",
    macros: { fat: 0.25, sugar: 0.45, nonfatSolids: 0.25, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.05 },
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

  {
    id: "bourbon",
    name: "Bourbon",
    description: "Barrel-aged corn whiskey. Vanilla-oak warmth plus the freeze-point drop of any spirit.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0.005, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.40, water: 0.595 },
  },
  {
    id: "coffee-liqueur",
    name: "Coffee Liqueur",
    description: "Sweet, low-proof coffee spirit (Kahlúa-style). Adds coffee flavor, sugar, and a soft scoop.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0.33, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.20, water: 0.47 },
  },
  {
    id: "amaretto",
    name: "Amaretto",
    description: "Sweet almond-flavored liqueur. Marzipan aroma with a moderate freeze-point drop.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0.25, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.24, water: 0.51 },
  },
  {
    id: "orange-liqueur",
    name: "Orange Liqueur",
    description: "Cognac-based orange spirit (Grand Marnier-style). Bright citrus with full spirit strength.",
    category: "alcohol",
    macros: { fat: 0, sugar: 0.10, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0.40, water: 0.50 },
  },
  {
    id: "irish-cream",
    name: "Irish Cream",
    description: "Cream, whiskey, and sugar in one (Baileys-style). Brings fat and milk solids along with the alcohol.",
    category: "alcohol",
    macros: { fat: 0.13, sugar: 0.19, nonfatSolids: 0.03, stabilizer: 0, emulsifier: 0, alcohol: 0.17, water: 0.48 },
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

  {
    id: "banana-puree",
    name: "Banana Purée",
    description: "Mashed ripe banana. Naturally sweet and starchy — adds body as well as flavor.",
    category: "fruit",
    macros: { fat: 0.003, sugar: 0.15, nonfatSolids: 0.02, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.827 },
  },
  {
    id: "blueberry-puree",
    name: "Blueberry Purée",
    description: "Deep, jammy, and mildly sweet. Turns the base a striking violet-blue.",
    category: "fruit",
    macros: { fat: 0.003, sugar: 0.10, nonfatSolids: 0.01, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.887 },
  },
  {
    id: "cherry-puree",
    name: "Cherry Purée",
    description: "Sweet-tart dark cherry. Classic paired with chocolate chunks in a chunky-cherry scoop.",
    category: "fruit",
    macros: { fat: 0.002, sugar: 0.13, nonfatSolids: 0.015, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.853 },
  },
  {
    id: "peach-puree",
    name: "Peach Purée",
    description: "Soft, floral, and gently sweet. High water content — account for dilution.",
    category: "fruit",
    macros: { fat: 0.003, sugar: 0.085, nonfatSolids: 0.013, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.899 },
  },
  {
    id: "blackberry-puree",
    name: "Blackberry Purée",
    description: "Winey and tart with deep color. Lower in sugar than most berries; seeds usually strained.",
    category: "fruit",
    macros: { fat: 0.005, sugar: 0.05, nonfatSolids: 0.018, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.927 },
  },
  {
    id: "pineapple-puree",
    name: "Pineapple Purée",
    description: "Bright, tropical, and acidic. Raw pineapple's enzymes stop gelatin from setting — cook it first or use another stabilizer.",
    category: "fruit",
    macros: { fat: 0.002, sugar: 0.10, nonfatSolids: 0.007, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.891 },
  },
  {
    id: "apricot-puree",
    name: "Apricot Purée",
    description: "Honeyed and slightly tart. Concentrated flavor that survives the cold well.",
    category: "fruit",
    macros: { fat: 0.004, sugar: 0.092, nonfatSolids: 0.021, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.883 },
  },
  {
    id: "pumpkin-puree",
    name: "Pumpkin Purée",
    description: "Earthy, mild, and starchy. Low sugar but adds solids and body; the base for spiced autumn flavors.",
    category: "fruit",
    macros: { fat: 0.003, sugar: 0.033, nonfatSolids: 0.05, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.914 },
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

  {
    id: "almond-milk",
    name: "Almond Milk",
    description: "Light and faintly nutty. Very low fat and solids — leans hard on stabilizers for body.",
    category: "vegan-dairy",
    macros: { fat: 0.016, sugar: 0.003, nonfatSolids: 0.012, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.969 },
  },
  {
    id: "soy-milk",
    name: "Soy Milk",
    description: "The highest-protein plant milk. Its protein mimics dairy MSNF for a fuller body.",
    category: "vegan-dairy",
    macros: { fat: 0.017, sugar: 0.005, nonfatSolids: 0.035, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.943 },
  },
  {
    id: "coconut-milk",
    name: "Coconut Milk",
    description: "Lighter than coconut cream. A balanced plant fat source with mild coconut flavor.",
    category: "vegan-dairy",
    macros: { fat: 0.15, sugar: 0.03, nonfatSolids: 0.015, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.805 },
  },
  {
    id: "cocoa-butter",
    name: "Cocoa Butter",
    description: "Pure vegan fat from the cocoa bean. Firms up structure and carries a faint chocolate aroma.",
    category: "vegan-dairy",
    macros: { fat: 1.0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 },
  },
  {
    id: "vegan-butter",
    name: "Vegan Butter",
    description: "Plant-oil butter substitute. Near-pure fat for enriching dairy-free formulas.",
    category: "vegan-dairy",
    macros: { fat: 0.80, sugar: 0, nonfatSolids: 0.01, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0.16 },
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
