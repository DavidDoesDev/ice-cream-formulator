import type { Recipe } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";

// The "fine chemistry" layer (D6/D7): quantities the 7-macro model can't hold,
// computed from the recipe's ACTUAL ingredients — never a MacroRatios snapshot,
// which has already collapsed which sugar it was. All coefficients are relative to
// sucrose = 100 (see docs/formulation/relationships.md).

const ETHANOL_FPD = 740; // freeze-point depression of ethanol vs sucrose (colligative, MW 46)
const LACTOSE_OF_MSNF = 0.545; // lactose is ~54.5% of dairy milk-solids-not-fat

export interface DerivedIndices {
  totalGrams: number;
  pac: number; // freeze-point depression (scoopability), sucrose-equivalent fraction of the batch
  pod: number; // sweetness, sucrose-equivalent fraction of the batch
  dairyMsnf: number; // true dairy milk-solids-not-fat, fraction of the batch
  lactose: number; // lactose, fraction of the batch
  totalSolids: number; // fat + sugar + MSNF + stabilizer + emulsifier, fraction of the batch
}

// Resolve every catalog ingredient the recipe actually contains, with its grams:
// smart mixes expand through their preset's proportions; additionals are direct.
function* ingredientGrams(recipe: Recipe): Generator<{ id: string; grams: number }> {
  for (const mix of recipe.smartMixes) {
    if (mix.grams <= 0) continue;
    const preset = getPresetById(mix.presetId);
    if (!preset) continue;
    for (const ing of preset.ingredients) {
      yield { id: ing.ingredientId, grams: ing.proportion * mix.grams };
    }
  }
  for (const add of recipe.additionalIngredients) {
    if (add.grams > 0) yield { id: add.ingredientId, grams: add.grams };
  }
}

export function derive(recipe: Recipe): DerivedIndices {
  let totalGrams = 0;
  let pacEq = 0;
  let podEq = 0;
  let lactoseGrams = 0;
  let solidGrams = 0;

  for (const { id, grams } of ingredientGrams(recipe)) {
    totalGrams += grams;
    const ing = getIngredientById(id);
    if (!ing) continue;
    const m = ing.macros;
    const sugarGrams = grams * m.sugar;
    const fpd = ing.fpd ?? 100; // unlabelled sugar → treated as sucrose
    const pod = ing.pod ?? 100;
    pacEq += sugarGrams * (fpd / 100);
    pacEq += grams * m.alcohol * (ETHANOL_FPD / 100);
    podEq += sugarGrams * (pod / 100);
    lactoseGrams += grams * (ing.lactose ?? 0);
    solidGrams += grams * (m.fat + m.sugar + m.nonfatSolids + m.stabilizer + m.emulsifier);
  }

  const denom = totalGrams || 1;
  const lactose = lactoseGrams / denom;
  return {
    totalGrams,
    pac: pacEq / denom,
    pod: podEq / denom,
    lactose,
    dairyMsnf: lactose / LACTOSE_OF_MSNF,
    totalSolids: solidGrams / denom,
  };
}

// Directional freezing readout (D7): PAC stands in for serving hardness — higher
// PAC = softer/lower freezing point. Placeholder for a full iterative freezing
// curve later, kept behind this stable signature so callers don't change.
export function computeFreezing(recipe: Recipe): { pac: number } {
  return { pac: derive(recipe).pac };
}
