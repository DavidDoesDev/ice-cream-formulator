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
  water: number; // free water, fraction of the batch (the phase ice crystallizes from)
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
  let waterGrams = 0;

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
    waterGrams += grams * m.water;
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
    water: waterGrams / denom,
  };
}

// Ideal cryoscopic constant: °C of freeze-point depression per (gram of
// sucrose-equivalent solute ÷ gram of water). From Kf(water) 1.86 °C·kg/mol and
// sucrose MW 342 → 1.86 × 1000/342 ≈ 5.44. (PAC is already sucrose-equivalent.)
const CRYOSCOPIC_K = 5.44;

// Typical ice-cream scooping temperature (≈ 10 °F). The serving temp the frozen
// fraction is reported at unless a caller asks for another.
export const DEFAULT_SERVING_TEMP_C = -12;

// Freeze-point depression of the unfrozen solution once fraction `x` of the
// original water has crystallized out as pure ice. Ice removes water and leaves
// the solute behind, so the leftover solution is 1/(1-x) more concentrated.
// Linear (ideal) for now; this is the seam where a non-ideal sucrose ΔT(conc.)
// curve drops in without touching computeFreezing().
function fpdAtFrozenFraction(initialFpd: number, x: number): number {
  return x >= 1 ? Infinity : initialFpd / (1 - x);
}

// Bisect for the frozen-water fraction whose concentrated solution freezes exactly
// at the serving temp — the equilibrium ice content. Iterative so a non-ideal
// fpdAtFrozenFraction() can replace the linear law with no caller changes.
function solveFrozenFraction(initialFpd: number, targetFpd: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (fpdAtFrozenFraction(initialFpd, mid) < targetFpd) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// The freezing model (D7, #64). Returns the directional `pac` (unchanged seam),
// the mix's initial freezing point, and the equilibrium frozen-water fraction at
// `tempC` — the real "how hard is the scoop" number. As water freezes it
// concentrates the remaining solutes, depressing their freezing point further;
// solving that fixed point gives the ice content at serving temp.
export function computeFreezing(
  recipe: Recipe,
  tempC: number = DEFAULT_SERVING_TEMP_C,
): { pac: number; initialFreezingC: number; frozenFraction: number } {
  const d = derive(recipe);
  // Initial freeze-point depression: solute concentrated in the water phase. pac
  // and water are batch fractions, so their ratio is g-solute per g-water and the
  // batch size cancels.
  const initialFpd = d.water > 0 ? CRYOSCOPIC_K * (d.pac / d.water) : 0;
  const targetFpd = -tempC; // depression needed to be liquid at tempC (tempC < 0)
  // Above the mix's own freezing point → still liquid, no ice yet.
  const frozenFraction = targetFpd <= initialFpd ? 0 : solveFrozenFraction(initialFpd, targetFpd);
  return { pac: d.pac, initialFreezingC: -initialFpd, frozenFraction };
}
