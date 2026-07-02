import type { StyleCategory, Recipe, SmartMix, SmartMixKind } from "@/data/types";

function mix(kind: SmartMixKind, label: string, presetId: string): SmartMix {
  return { kind, label, presetId, grams: 0 };
}

const ALCOHOL = mix("alcohol", "Alcohol", "alcohol-empty");
const EMULSIFIER = mix("emulsifier", "Emulsifier", "emulsifier-empty");
const SUGAR = mix("sugar", "Sugar Mix", "sugar-sucrose");
const STAB_MODERNIST = mix("stabilizer", "Stabilizer Mix", "stab-modernist");
const STAB_NONE = mix("stabilizer", "Stabilizer Mix", "stab-none");

export function seedRecipe(style: StyleCategory): Recipe {
  let smartMixes: SmartMix[];

  switch (style) {
    case "philadelphia":
      smartMixes = [
        mix("milk", "Whole Milk", "milk-whole"),
        mix("milk", "Heavy Cream", "cream-heavy"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "custard":
      smartMixes = [
        mix("milk", "Whole Milk", "milk-whole"),
        mix("milk", "Heavy Cream", "cream-heavy"),
        mix("eggs", "Egg Mix", "eggs-yolks"),
        SUGAR,
        STAB_NONE,
        ALCOHOL,
      ];
      break;

    case "gelato":
      smartMixes = [
        mix("milk", "Whole Milk", "milk-whole"),
        mix("milk", "Heavy Cream", "cream-heavy"),
        mix("milk", "Skim Milk Powder", "milk-powder"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;

    case "sherbet":
      smartMixes = [
        mix("milk", "Whole Milk", "milk-whole"),
        mix("milk", "Light Cream", "cream-light"),
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
        mix("milk", "Coconut Cream", "milk-coconut-cream"),
        mix("milk", "Oat Milk", "milk-oat"),
        SUGAR,
        STAB_MODERNIST,
        ALCOHOL,
      ];
      break;
  }

  // Emulsifier is empty-by-default in every style (custard's emulsification comes
  // from egg yolks); it activates when the user raises the emulsifier slider.
  return { smartMixes: [...smartMixes, EMULSIFIER], additionalIngredients: [] };
}
