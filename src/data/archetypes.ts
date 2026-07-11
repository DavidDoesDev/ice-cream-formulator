import type { Archetype, Recipe, SmartMixKind } from "./types";

// Explicit-recipe builder (design B). Every gram is visible at the call site — the
// tuples are the authored recipe, `mk` is just less noise than object literals.
// Bases per docs/formulation/archetype-recipes.md, batched to 1000 g.
type MixTuple = [kind: SmartMixKind, label: string, presetId: string, grams: number];
type AddTuple = [ingredientId: string, grams: number];
function mk(mixes: MixTuple[], adds: AddTuple[] = []): Recipe {
  return {
    smartMixes: mixes.map(([kind, label, presetId, grams]) => ({ kind, label, presetId, grams })),
    additionalIngredients: adds.map(([ingredientId, grams]) => ({ ingredientId, grams })),
  };
}

export const ARCHETYPES: Archetype[] = [
  // ─── Philadelphia ────────────────────────────────────────────────────────────
  {
    id: "philly-vanilla",
    name: "Classic Vanilla",
    style: "philadelphia",
    description: "Cream-forward, no eggs, pure dairy sweetness. The cleanest canvas.",
    recipe: mk([["milk","Whole Milk","milk-whole",377],["milk","Heavy Cream","cream-heavy",380],["sugar","Sugar","sugar-glucose-blend",200],["milk","Skim Milk Powder","milk-powder",20],["stabilizer","Stabilizer","stab-modernist",3]], [["vanilla-bean",20]]),
    ratios: { fat: 0.14, sugar: 0.16, nonfatSolids: 0.09, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.607 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "sucrose",
      texture: ["creamy", "smooth", "clean"],
      inclusions: ["vanilla"],
    },
    prose: "No eggs, no fuss. A Philadelphia-style base lets the dairy shine — bright, cold, and clean. Fat comes primarily from heavy cream, which keeps the flavor forward and the texture silky without the custardy weight.",
    decisionCards: [
      { label: "Style", reason: "Philadelphia — no eggs means a cleaner, colder, brighter flavor" },
      { label: "Fat", reason: "14% from cream — enough body without masking the dairy" },
      { label: "Sugar", reason: "16% sucrose — neutral sweetness that doesn't compete with vanilla" },
    ],
  },
  {
    id: "philly-chocolate",
    name: "Dark Chocolate",
    style: "philadelphia",
    description: "Deep cocoa, no eggs. Intense and direct.",
    recipe: mk([["milk","Whole Milk","milk-whole",397],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",170],["milk","Skim Milk Powder","milk-powder",20],["stabilizer","Stabilizer","stab-modernist",3]], [["dark-chocolate",80],["cocoa-powder",30]]),
    ratios: { fat: 0.13, sugar: 0.17, nonfatSolids: 0.10, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.597 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "sucrose",
      texture: ["intense", "smooth", "cold"],
      inclusions: ["chocolate", "cocoa"],
    },
    prose: "Dutch-process cocoa gives a deep, almost bitter chocolate hit without the richness of a custard base. The extra MSNF from the cocoa solids gives it body.",
    decisionCards: [
      { label: "Style", reason: "Philadelphia — cocoa flavor reads cleaner without egg yolks in the way" },
      { label: "Fat", reason: "13% — slightly lower than vanilla to keep chocolate sharp, not heavy" },
      { label: "Sugar", reason: "17% — cocoa's bitterness needs slightly more sugar to balance" },
    ],
  },
  {
    id: "philly-strawberry",
    name: "Strawberry",
    style: "philadelphia",
    description: "Bright and fruity. Dairy-light to let the fruit come through.",
    recipe: mk([["milk","Whole Milk","milk-whole",347],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",180],["milk","Skim Milk Powder","milk-powder",20],["stabilizer","Stabilizer","stab-modernist",3]], [["strawberry-puree",150]]),
    ratios: { fat: 0.11, sugar: 0.17, nonfatSolids: 0.08, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.637 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["fruity", "fresh", "light"],
      inclusions: ["strawberry"],
    },
    prose: "Lower fat than a classic base so the strawberry flavor isn't buried. The extra water from the purée is already factored in — this is a formulated-in fruit base, not a swirl.",
    decisionCards: [
      { label: "Style", reason: "Philadelphia — cream alone, no yolks competing with the fruit" },
      { label: "Fat", reason: "11% — light enough that strawberry stays the star" },
      { label: "Sugar", reason: "17% — accounts for the natural tartness of the fruit" },
    ],
  },
  {
    id: "philly-lemon-curd",
    name: "Lemon Curd",
    style: "philadelphia",
    description: "Tangy, bright, and cold. Tastes like frozen lemon curd.",
    recipe: mk([["milk","Whole Milk","milk-whole",327],["milk","Heavy Cream","cream-heavy",350],["sugar","Sugar","sugar-glucose-blend",200],["milk","Skim Milk Powder","milk-powder",20],["stabilizer","Stabilizer","stab-modernist",3]], [["lemon-juice",100]]),
    ratios: { fat: 0.12, sugar: 0.18, nonfatSolids: 0.08, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.617 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["tangy", "bright", "refreshing"],
      inclusions: ["lemon"],
    },
    prose: "High sugar balances the acid from fresh lemon juice. Medium fat keeps it from feeling heavy — this one is meant to feel cold and sharp.",
    decisionCards: [
      { label: "Style", reason: "Philadelphia — no eggs, so the lemon flavor is pure and uncooked" },
      { label: "Fat", reason: "12% — enough richness to smooth the acid without dulling it" },
      { label: "Sugar", reason: "18% — higher to offset the tartness of lemon juice" },
    ],
  },
  {
    id: "philly-high-protein",
    name: "High Protein",
    style: "philadelphia",
    description: "Lean and high in milk solids. More like a frozen yogurt in structure.",
    recipe: mk([["milk","Whole Milk","milk-whole",617],["milk","Light Cream","cream-light",120],["sugar","Sugar","sugar-glucose-blend",150],["milk","Skim Milk Powder","milk-powder",90],["stabilizer","Stabilizer","stab-modernist",3]], [["vanilla-bean",20]]),
    ratios: { fat: 0.08, sugar: 0.14, nonfatSolids: 0.13, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.647 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["lean", "dense", "cold"],
      inclusions: ["vanilla"],
    },
    prose: "Heavy on skim milk powder and lean on cream. Lower sugar keeps calories down. Expect a firmer, icier texture — this isn't trying to be creamy, it's trying to be clean.",
    decisionCards: [
      { label: "Style", reason: "Philadelphia — lean base with no yolks keeps protein high and fat low" },
      { label: "Fat", reason: "8% — minimum for acceptable texture without going icy" },
      { label: "Sugar", reason: "14% — lower than standard, use dextrose blend for softer scoop" },
    ],
  },

  // ─── Custard ─────────────────────────────────────────────────────────────────
  {
    id: "custard-vanilla",
    name: "Vanilla Custard",
    style: "custard",
    description: "Egg yolk–enriched, coating, silky. The French way.",
    recipe: mk([["milk","Whole Milk","milk-whole",378],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",200],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2]], [["vanilla-bean",20]]),
    ratios: { fat: 0.16, sugar: 0.16, nonfatSolids: 0.09, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0, water: 0.568 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "sucrose",
      texture: ["silky", "rich", "coating", "creamy"],
      inclusions: ["vanilla"],
    },
    prose: "Egg yolks contribute lecithin as a natural emulsifier, giving the base a coating, custard-like quality that clings to the tongue. Richer and softer than Philadelphia, with a yellower color.",
    decisionCards: [
      { label: "Style", reason: "French custard — egg yolks for emulsification and a cooked-cream flavor" },
      { label: "Fat", reason: "16% total — cream plus the fat in yolks makes this genuinely rich" },
      { label: "Emulsifier", reason: "2% from egg yolks — natural lecithin gives a silky, coating finish" },
    ],
  },
  {
    id: "custard-chocolate",
    name: "Chocolate Custard",
    style: "custard",
    description: "Dense, dark, custardy. The richest chocolate expression.",
    recipe: mk([["milk","Whole Milk","milk-whole",338],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",150],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2]], [["dark-chocolate",80],["cocoa-powder",30]]),
    ratios: { fat: 0.15, sugar: 0.17, nonfatSolids: 0.10, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0, water: 0.558 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "sucrose",
      texture: ["dense", "rich", "intense", "silky"],
      inclusions: ["chocolate", "cocoa"],
    },
    prose: "Dark chocolate base with egg yolks for body and coating texture. Richer and more molten-feeling than the Philadelphia chocolate — this is a dessert-first flavor.",
    decisionCards: [
      { label: "Style", reason: "Custard — egg yolks make chocolate taste cooked and deep, not just dark" },
      { label: "Fat", reason: "15% — slightly lower than vanilla custard so chocolate dominates" },
      { label: "Sugar", reason: "17% — cocoa needs the extra sweetness to balance its bitterness" },
    ],
  },
  {
    id: "custard-brown-butter",
    name: "Brown Butter Caramel",
    style: "custard",
    description: "Nutty, warm, deeply caramelized. Fat-forward.",
    recipe: mk([["milk","Whole Milk","milk-whole",318],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",200],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2]], [["brown-butter",80]]),
    ratios: { fat: 0.17, sugar: 0.18, nonfatSolids: 0.08, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0, water: 0.548 },
    attributes: {
      fatTier: "ultra-rich",
      sugarSystem: "natural",
      texture: ["rich", "warm", "nutty", "caramel"],
      inclusions: ["brown butter"],
    },
    prose: "Butter browned until the milk solids caramelize, then built into a custard base. Higher fat and sugar than a standard custard to carry all that roasty flavor. Eat it warm if you could.",
    decisionCards: [
      { label: "Style", reason: "Custard — cooked egg yolks amplify the browned, caramelized flavors" },
      { label: "Fat", reason: "17% — the highest fat tier, because browned butter is the flavor" },
      { label: "Sugar", reason: "18% — caramelized sugars taste less sweet, so you need more" },
    ],
  },
  {
    id: "custard-salted-honey",
    name: "Salted Honey",
    style: "custard",
    description: "Floral, sweet, and savory all at once.",
    recipe: mk([["milk","Whole Milk","milk-whole",378],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",140],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2]], [["honey",80]]),
    ratios: { fat: 0.15, sugar: 0.19, nonfatSolids: 0.09, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0, water: 0.548 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "natural",
      texture: ["floral", "silky", "warm"],
      inclusions: ["honey"],
    },
    prose: "Honey's fructose content keeps the texture soft and helps it stay scoopable. The egg yolk base rounds out the floral sharpness of the honey. Salt is added at the end, kept out of the mix calculation.",
    decisionCards: [
      { label: "Style", reason: "Custard — egg yolks soften honey's sharpness and round the flavor" },
      { label: "Sugar", reason: "19% — honey's sweetness is intense but short, needs the extra to sustain it" },
      { label: "Sugar blend", reason: "Natural (honey) — fructose keeps texture soft straight from the freezer" },
    ],
  },
  {
    id: "custard-peanut-butter",
    name: "Peanut Butter",
    style: "custard",
    description: "Dense, nutty, and rich. Almost savory.",
    recipe: mk([["milk","Whole Milk","milk-whole",348],["milk","Heavy Cream","cream-heavy",250],["sugar","Sugar","sugar-glucose-blend",200],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2]], [["peanut-butter",100]]),
    ratios: { fat: 0.16, sugar: 0.16, nonfatSolids: 0.08, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0, water: 0.578 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "sucrose",
      texture: ["dense", "nutty", "rich"],
      inclusions: ["peanut butter"],
    },
    prose: "Peanut butter adds fat and protein, making this denser than a straight cream base. Egg yolks push the emulsification and give it a coating quality that makes each bite feel complete.",
    decisionCards: [
      { label: "Style", reason: "Custard — yolks and peanut butter together create a uniquely dense emulsion" },
      { label: "Fat", reason: "16% total — peanut butter contributes most of it" },
      { label: "Emulsifier", reason: "2% from egg yolks — peanut protein also helps emulsify" },
    ],
  },
  {
    id: "custard-rum-raisin",
    name: "Rum Raisin",
    style: "custard",
    description: "Old-school, boozy, warming. Alcohol keeps it soft.",
    recipe: mk([["milk","Whole Milk","milk-whole",293],["milk","Heavy Cream","cream-heavy",300],["sugar","Sugar","sugar-glucose-blend",170],["eggs","Egg Yolks","eggs-yolks",100],["stabilizer","Stabilizer","stab-modernist",2],["alcohol","Dark Rum","alcohol-dark-rum",75]], [["raisins",60]]),
    ratios: { fat: 0.15, sugar: 0.16, nonfatSolids: 0.09, stabilizer: 0.002, emulsifier: 0.02, alcohol: 0.03, water: 0.548 },
    attributes: {
      fatTier: "rich",
      sugarSystem: "blended",
      texture: ["rich", "warming", "boozy"],
      inclusions: ["raisin"],
      alcoholPresetId: "alcohol-dark-rum",
    },
    prose: "The alcohol from dark rum acts as an antifreeze — this scoops softer than it looks. Raisins are soaked in rum before adding so they stay plump and don't freeze solid.",
    decisionCards: [
      { label: "Style", reason: "Custard — egg yolks balance the sharp edge of the alcohol" },
      { label: "Alcohol", reason: "3% — just enough to lower the freezing point noticeably" },
      { label: "Sugar", reason: "16% — use invert sugar blend so the base stays pliable despite alcohol" },
    ],
  },

  // ─── Gelato ───────────────────────────────────────────────────────────────────
  {
    id: "gelato-fior-di-latte",
    name: "Fior di Latte",
    style: "gelato",
    description: "Pure milk flavor, nothing else. Minimalist by design.",
    recipe: mk([["milk","Whole Milk","milk-whole",666],["milk","Heavy Cream","cream-heavy",80],["milk","Skim Milk Powder","milk-powder",40],["sugar","Sugar","sugar-glucose-blend",210],["stabilizer","Stabilizer","stab-modernist",4]], []),
    ratios: { fat: 0.08, sugar: 0.17, nonfatSolids: 0.11, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.637 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["delicate", "milky", "clean", "dense"],
      inclusions: [],
    },
    prose: "The Italian milk-and-cream base, nothing added. Lower fat than American ice cream and served warmer, which makes the flavor more vivid. The MSNF is pushed higher to compensate for the reduced fat.",
    decisionCards: [
      { label: "Style", reason: "Gelato — lower fat, higher MSNF, served closer to freezing point" },
      { label: "Fat", reason: "8% — lean enough to let the milk flavor be the whole story" },
      { label: "Solids", reason: "Higher MSNF compensates for lower fat and keeps it from going icy" },
    ],
  },
  {
    id: "gelato-pistachio",
    name: "Pistachio",
    style: "gelato",
    description: "Delicate, slightly savory, unmistakably green.",
    recipe: mk([["milk","Whole Milk","milk-whole",586],["milk","Heavy Cream","cream-heavy",80],["milk","Skim Milk Powder","milk-powder",40],["sugar","Sugar","sugar-glucose-blend",210],["stabilizer","Stabilizer","stab-modernist",4]], [["pistachio-paste",80]]),
    ratios: { fat: 0.10, sugar: 0.17, nonfatSolids: 0.10, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.627 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["delicate", "nutty", "silky"],
      inclusions: ["pistachio"],
    },
    prose: "Pistachio paste adds fat and an elusive, almost savory nuttiness. The gelato base keeps it restrained — this isn't sweet-forward, it's about the pistachio.",
    decisionCards: [
      { label: "Style", reason: "Gelato — lower fat lets the pistachio flavor read clearly" },
      { label: "Fat", reason: "10% — slightly above fior di latte to carry the nut paste" },
      { label: "Sugar", reason: "17% neutral — pistachio isn't sweet, so sugar stays in the background" },
    ],
  },
  {
    id: "gelato-hazelnut",
    name: "Hazelnut",
    style: "gelato",
    description: "Roasted, nutty, and intense. Not Nutella — drier and more concentrated.",
    recipe: mk([["milk","Whole Milk","milk-whole",566],["milk","Heavy Cream","cream-heavy",80],["milk","Skim Milk Powder","milk-powder",40],["sugar","Sugar","sugar-glucose-blend",210],["stabilizer","Stabilizer","stab-modernist",4]], [["hazelnut-paste",100]]),
    ratios: { fat: 0.11, sugar: 0.17, nonfatSolids: 0.10, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.617 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["nutty", "roasted", "intense"],
      inclusions: ["hazelnut"],
    },
    prose: "Pure hazelnut paste, no chocolate. The roasted nut oil pushes the fat slightly higher. Served dense and compact — this is the gelato equivalent of espresso.",
    decisionCards: [
      { label: "Style", reason: "Gelato — the density amplifies the concentrated roasted nut flavor" },
      { label: "Fat", reason: "11% — hazelnut paste is high fat, this accounts for it" },
      { label: "Sugar", reason: "17% — hazelnut is savory-forward, sugar is in balance not dominant" },
    ],
  },
  {
    id: "gelato-chocolate",
    name: "Chocolate Gelato",
    style: "gelato",
    description: "Dark and dense. More bitter than an American chocolate.",
    recipe: mk([["milk","Whole Milk","milk-whole",586],["milk","Heavy Cream","cream-heavy",80],["milk","Skim Milk Powder","milk-powder",40],["sugar","Sugar","sugar-glucose-blend",180],["stabilizer","Stabilizer","stab-modernist",4]], [["dark-chocolate",80],["cocoa-powder",30]]),
    ratios: { fat: 0.09, sugar: 0.18, nonfatSolids: 0.11, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.617 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["dark", "dense", "intense", "bitter"],
      inclusions: ["chocolate", "cocoa"],
    },
    prose: "More cocoa solids, less cream fat. Eaten warmer than American ice cream, the chocolate hits you immediately — no fat buffer getting in the way. Slightly more sugar to balance the bitterness.",
    decisionCards: [
      { label: "Style", reason: "Gelato — lean fat means the cocoa is the dominant sensation" },
      { label: "Solids", reason: "11% MSNF + cocoa solids give it structure without adding fat" },
      { label: "Sugar", reason: "18% — cocoa needs a little extra to stay pleasant without dairy softening it" },
    ],
  },
  {
    id: "gelato-stracciatella",
    name: "Stracciatella",
    style: "gelato",
    description: "Fior di latte base with dark chocolate drizzled in as it churns.",
    recipe: mk([["milk","Whole Milk","milk-whole",666],["milk","Heavy Cream","cream-heavy",80],["milk","Skim Milk Powder","milk-powder",40],["sugar","Sugar","sugar-glucose-blend",210],["stabilizer","Stabilizer","stab-modernist",4]], []),
    ratios: { fat: 0.08, sugar: 0.17, nonfatSolids: 0.11, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.637 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["milky", "delicate", "clean"],
      inclusions: [],
    },
    prose: "The base is pure fior di latte — the chocolate is added as a thin drizzle during the last minute of churning, where it shatters into shards. The base formula doesn't change; the chocolate is a process addition.",
    decisionCards: [
      { label: "Style", reason: "Gelato — the clean milk base is the point, chocolate is just texture" },
      { label: "Fat", reason: "8% — same as fior di latte, chocolate shards add fat as a separate process" },
      { label: "Sugar", reason: "17% balanced — the bittersweet chocolate will add complexity without extra sugar" },
    ],
  },

  // ─── Sorbet ───────────────────────────────────────────────────────────────────
  {
    id: "sorbet-lemon",
    name: "Lemon Sorbet",
    style: "sorbet",
    description: "Sharp, clean, and intensely cold. No dairy, nothing to hide behind.",
    recipe: mk([["liquid","Water","liquid-water",430],["sugar","Sugar","sugar-glucose-blend",315],["stabilizer","Stabilizer","stab-modernist",5]], [["lemon-juice",250]]),
    ratios: { fat: 0, sugar: 0.26, nonfatSolids: 0, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.737 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["sharp", "bright", "cold", "refreshing", "tangy"],
      inclusions: ["lemon"],
    },
    prose: "High sugar is necessary — without fat or solids, sugar is the only thing holding the texture together and keeping it from freezing too hard. Use dextrose alongside sucrose so it stays scoopable.",
    decisionCards: [
      { label: "Style", reason: "Sorbet — no dairy, fruit flavor is everything" },
      { label: "Sugar", reason: "26% — high ratio needed to keep it soft and balance the acid" },
      { label: "Sugar system", reason: "Blended (sucrose + dextrose) — dextrose lowers the freezing point" },
    ],
  },
  {
    id: "sorbet-raspberry",
    name: "Raspberry Sorbet",
    style: "sorbet",
    description: "Tangy, fragrant, and vivid. Seeds strained out.",
    recipe: mk([["liquid","Water","liquid-water",180],["sugar","Sugar","sugar-glucose-blend",300],["stabilizer","Stabilizer","stab-modernist",5]], [["raspberry-puree",500],["lemon-juice",15]]),
    ratios: { fat: 0, sugar: 0.24, nonfatSolids: 0, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.757 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["tangy", "bright", "fruity", "refreshing"],
      inclusions: ["raspberry"],
    },
    prose: "Raspberry's natural acid means you need less added sugar than lemon while still getting a clean, cold hit. Strain the seeds for a smooth texture.",
    decisionCards: [
      { label: "Style", reason: "Sorbet — raspberry's natural acids and aromatics shine without dairy" },
      { label: "Sugar", reason: "24% — slightly less than lemon, raspberry contributes its own sugars" },
      { label: "Sugar system", reason: "Blended — invert sugar keeps it from freezing too firm" },
    ],
  },
  {
    id: "sorbet-mango",
    name: "Mango Sorbet",
    style: "sorbet",
    description: "Tropical, sweet, and intensely aromatic.",
    recipe: mk([["liquid","Water","liquid-water",180],["sugar","Sugar","sugar-glucose-blend",300],["stabilizer","Stabilizer","stab-modernist",5]], [["mango-puree",500],["lemon-juice",15]]),
    ratios: { fat: 0, sugar: 0.25, nonfatSolids: 0, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.747 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "sucrose",
      texture: ["tropical", "aromatic", "sweet", "fruity"],
      inclusions: ["mango"],
    },
    prose: "Ripe mango already carries a lot of natural sugar, so the added sucrose is moderate. Alphonso variety has the most aroma — Ataulfo is a close second. This one is unambiguously sweet-forward.",
    decisionCards: [
      { label: "Style", reason: "Sorbet — ripe mango doesn't need dairy to taste rich" },
      { label: "Sugar", reason: "25% total — mango's own sugars contribute, so added sugar stays moderate" },
      { label: "Sugar system", reason: "Sucrose — mango's natural fructose already softens the freezing point" },
    ],
  },
  {
    id: "sorbet-passion-fruit",
    name: "Passion Fruit Sorbet",
    style: "sorbet",
    description: "Intensely tropical and complex. A little goes a long way.",
    recipe: mk([["liquid","Water","liquid-water",380],["sugar","Sugar","sugar-glucose-blend",305],["stabilizer","Stabilizer","stab-modernist",5]], [["passion-fruit-puree",300],["lemon-juice",10]]),
    ratios: { fat: 0, sugar: 0.23, nonfatSolids: 0.01, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.757 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["tropical", "complex", "tangy", "aromatic"],
      inclusions: ["passion fruit"],
    },
    prose: "Passion fruit has a deep, funky tropical aroma that intensifies when frozen. Lower sugar than lemon because the flavor is already complex — you don't need to push the sweetness to make it interesting.",
    decisionCards: [
      { label: "Style", reason: "Sorbet — the intensity of passion fruit doesn't need dairy to read" },
      { label: "Sugar", reason: "23% — the lowest of the sorbets, flavor is complex enough on its own" },
      { label: "Sugar system", reason: "Blended — invert sugar keeps the syrup mobile at freezer temperatures" },
    ],
  },

  // ─── Sherbet ─────────────────────────────────────────────────────────────────
  {
    id: "sherbet-lemon",
    name: "Lemon Sherbet",
    style: "sherbet",
    description: "The bridge between sorbet and ice cream. Fruit-forward with a creamy finish.",
    recipe: mk([["milk","Whole Milk","milk-whole",426],["milk","Heavy Cream","cream-heavy",100],["sugar","Sugar","sugar-glucose-blend",250],["stabilizer","Stabilizer","stab-modernist",4]], [["buttermilk",100],["lemon-juice",120]]),
    ratios: { fat: 0.03, sugar: 0.22, nonfatSolids: 0.04, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.707 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["tangy", "bright", "light", "refreshing"],
      inclusions: ["lemon"],
    },
    prose: "A small amount of cream and milk solids smooths the sharp edge of the lemon sorbet while keeping it light and refreshing. The fat is almost imperceptible in flavor but completely changes the mouthfeel.",
    decisionCards: [
      { label: "Style", reason: "Sherbet — a touch of dairy rounds the acid without making it a cream flavor" },
      { label: "Fat", reason: "3% — just enough to soften the texture, not enough to taste" },
      { label: "Sugar", reason: "22% — slightly lower than sorbet because dairy adds perceived sweetness" },
    ],
  },
  {
    id: "sherbet-raspberry",
    name: "Raspberry Sherbet",
    style: "sherbet",
    description: "Bright raspberry with a rounded, slightly creamy finish.",
    recipe: mk([["milk","Whole Milk","milk-whole",296],["milk","Heavy Cream","cream-heavy",100],["sugar","Sugar","sugar-glucose-blend",250],["stabilizer","Stabilizer","stab-modernist",4]], [["buttermilk",100],["raspberry-puree",250]]),
    ratios: { fat: 0.03, sugar: 0.21, nonfatSolids: 0.04, stabilizer: 0.003, emulsifier: 0, alcohol: 0, water: 0.717 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "blended",
      texture: ["fruity", "bright", "light"],
      inclusions: ["raspberry"],
    },
    prose: "Raspberry's natural pectin already helps with texture, so the stabilizer can stay minimal. The cream keeps it from reading as sour while preserving the vivid fruit color.",
    decisionCards: [
      { label: "Style", reason: "Sherbet — cream rounds raspberry's tartness without dulling the color" },
      { label: "Fat", reason: "3% — minimal dairy presence, the fruit is still the whole story" },
      { label: "Sugar", reason: "21% — raspberry's natural sugars mean less added sweetness needed" },
    ],
  },

  // ─── Vegan ────────────────────────────────────────────────────────────────────
  {
    id: "vegan-coconut",
    name: "Coconut",
    style: "vegan",
    description: "Rich, tropical, and fully plant-based. Coconut cream does all the work.",
    recipe: mk([["milk","Coconut Cream","milk-coconut-cream",465],["milk","Oat Milk","milk-oat",330],["sugar","Sugar","sugar-glucose-blend",200],["stabilizer","Stabilizer","stab-modernist",5]], []),
    ratios: { fat: 0.12, sugar: 0.16, nonfatSolids: 0, stabilizer: 0.004, emulsifier: 0, alcohol: 0, water: 0.716 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["tropical", "rich", "creamy"],
      inclusions: ["coconut"],
    },
    prose: "Coconut cream is the closest plant-based analog to heavy cream in terms of fat content and emulsion stability. This base is rich without tasting like a compromise.",
    decisionCards: [
      { label: "Style", reason: "Vegan — coconut cream provides the fat and body without dairy" },
      { label: "Fat", reason: "12% from coconut cream — enough for a rich, satisfying texture" },
      { label: "Stabilizer", reason: "Slightly higher at 0.4% — plant fats behave differently, need more support" },
    ],
  },
  {
    id: "vegan-oat-milk",
    name: "Oat Milk Vanilla",
    style: "vegan",
    description: "Light, mild, and clean. The most approachable vegan base.",
    recipe: mk([["milk","Oat Milk","milk-oat",500],["milk","Coconut Cream","milk-coconut-cream",280],["sugar","Sugar","sugar-glucose-blend",195],["stabilizer","Stabilizer","stab-modernist",5]], [["vanilla-bean",20]]),
    ratios: { fat: 0.05, sugar: 0.16, nonfatSolids: 0.02, stabilizer: 0.004, emulsifier: 0, alcohol: 0, water: 0.766 },
    attributes: {
      fatTier: "lean",
      sugarSystem: "sucrose",
      texture: ["light", "mild", "clean", "lean"],
      inclusions: ["vanilla", "oat"],
    },
    prose: "Oat milk's natural sweetness and mild flavor make it easy to work with. Lower fat than coconut — this is the lean option in the vegan family. Stabilizer is essential here to prevent iciness.",
    decisionCards: [
      { label: "Style", reason: "Vegan — oat milk for a neutral flavor that won't compete with toppings" },
      { label: "Fat", reason: "5% — oat milk is naturally low-fat; add a neutral oil if more richness is needed" },
      { label: "Stabilizer", reason: "0.4% — higher than dairy-based because oat milk lacks natural emulsifiers" },
    ],
  },
  {
    id: "vegan-chocolate",
    name: "Chocolate Vegan",
    style: "vegan",
    description: "Dark chocolate without any dairy. Coconut base, pure cocoa.",
    recipe: mk([["milk","Coconut Cream","milk-coconut-cream",420],["milk","Oat Milk","milk-oat",285],["sugar","Sugar","sugar-glucose-blend",180],["stabilizer","Stabilizer","stab-modernist",5]], [["dark-chocolate",80],["cocoa-powder",30]]),
    ratios: { fat: 0.10, sugar: 0.18, nonfatSolids: 0.01, stabilizer: 0.004, emulsifier: 0, alcohol: 0, water: 0.706 },
    attributes: {
      fatTier: "medium",
      sugarSystem: "sucrose",
      texture: ["dark", "rich", "intense"],
      inclusions: ["chocolate", "cocoa", "coconut"],
    },
    prose: "Coconut cream provides the fat base; dark chocolate and cocoa powder bring the chocolate intensity. The coconut flavor retreats behind the cocoa — most people can't detect it.",
    decisionCards: [
      { label: "Style", reason: "Vegan — coconut fat + dark chocolate makes this the richest vegan option" },
      { label: "Fat", reason: "10% — cocoa butter from the chocolate contributes alongside coconut" },
      { label: "Sugar", reason: "18% — cocoa bitterness needs more sugar than a standard vegan base" },
    ],
  },
];

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function getArchetypesByStyle(style: Archetype["style"]): Archetype[] {
  return ARCHETYPES.filter((a) => a.style === style);
}
