import type { StyleCategory, Recipe, SmartMix, SmartMixKind } from "@/data/types";

function mix(kind: SmartMixKind, label: string, presetId: string): SmartMix {
  return { kind, label, presetId, grams: 0 };
}

const ALCOHOL = mix("alcohol", "Alcohol", "alcohol-empty");
const SUGAR = mix("sugar", "Sugar Mix", "sugar-sucrose");
const STAB_MODERNIST = mix("stabilizer", "Stabilizer Mix", "stab-modernist");
const STAB_NONE = mix("stabilizer", "Stabilizer Mix", "stab-none");

export function seedRecipe(style: StyleCategory): Recipe {
  let smartMixes: SmartMix[];

  switch (style) {
    case "philadelphia":
      smartMixes = [
        mix("milk", "Milk Mix", "milk-standard"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "custard":
      smartMixes = [
        mix("milk", "Milk Mix", "milk-standard"),
        mix("eggs", "Egg Mix", "eggs-yolks"),
        SUGAR,
        STAB_NONE,
        ALCOHOL,
      ];
      break;

    case "gelato":
      smartMixes = [
        mix("milk", "Milk Mix", "milk-milk-heavy"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "sherbet":
      smartMixes = [
        mix("milk", "Milk Mix", "milk-small-cream"),
        mix("liquid", "Liquid Mix", "liquid-water"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "sorbet":
      smartMixes = [
        mix("liquid", "Liquid Mix", "liquid-water"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "vegan":
      smartMixes = [
        mix("milk", "Milk Mix", "milk-plant-based"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;
  }

  return { smartMixes, additionalIngredients: [] };
}
