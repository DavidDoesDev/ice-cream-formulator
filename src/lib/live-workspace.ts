import { computeRatiosFromRecipe, solveRecipe } from "./recipe-solver";
import { MACRO_BOUNDS, type MacroRatios, type IngredientMacros } from "./formula-engine";
import type { Recipe, MixPreset } from "@/data/types";

// The always-live workspace: a Recipe (the source of truth for grams) plus the
// batch yield. Ratios are always derived from the recipe; a macro-slider change
// re-solves the smart-mix grams while holding the yield fixed; a direct gram
// edit is a real batch change, so the yield follows the new sum.
export interface LiveWorkspace {
  recipe: Recipe;
  yieldGrams: number;
}

// Injected lookups keep this module pure and testable (same shape as solveRecipe).
export interface WorkspaceDeps {
  getPreset: (id: string) => MixPreset | undefined;
  resolveIngredient: (id: string) => IngredientMacros | undefined;
}

const MACRO_KEYS = Object.keys(MACRO_BOUNDS) as (keyof MacroRatios)[];

export function totalGrams(recipe: Recipe): number {
  const mixes = recipe.smartMixes.reduce((s, m) => s + m.grams, 0);
  const adds = recipe.additionalIngredients.reduce((s, a) => s + a.grams, 0);
  return mixes + adds;
}

export function workspaceRatios(ws: LiveWorkspace, deps: WorkspaceDeps): MacroRatios {
  return computeRatiosFromRecipe(ws.recipe, deps.getPreset, deps.resolveIngredient);
}

// Direct edit of a smart-mix amount: the batch changes, so yield follows the sum.
export function setMixGrams(
  ws: LiveWorkspace,
  presetId: string,
  grams: number,
): LiveWorkspace {
  const smartMixes = ws.recipe.smartMixes.map((m) =>
    m.presetId === presetId ? { ...m, grams: Math.max(0, grams) } : m,
  );
  const recipe = { ...ws.recipe, smartMixes };
  return { recipe, yieldGrams: totalGrams(recipe) };
}

// Direct edit of an additional ingredient's amount: same — a real batch change.
export function setAdditionalGrams(
  ws: LiveWorkspace,
  ingredientId: string,
  grams: number,
): LiveWorkspace {
  const additionalIngredients = ws.recipe.additionalIngredients.map((a) =>
    a.ingredientId === ingredientId ? { ...a, grams: Math.max(0, grams) } : a,
  );
  const recipe = { ...ws.recipe, additionalIngredients };
  return { recipe, yieldGrams: totalGrams(recipe) };
}

// Macro-slider change: re-solve the smart-mix grams to hit the new target while
// holding the current yield. Other macros move to make room (the solver settles
// on the least-change grams); the yield is invariant.
export function setMacroTarget(
  ws: LiveWorkspace,
  macro: keyof MacroRatios,
  target: number,
  deps: WorkspaceDeps,
): LiveWorkspace {
  const targets: MacroRatios = { ...workspaceRatios(ws, deps), [macro]: target };
  const solved = solveRecipe(
    targets,
    ws.yieldGrams,
    ws.recipe.additionalIngredients,
    ws.recipe.smartMixes,
    deps.getPreset,
    deps.resolveIngredient,
  );
  return { ...ws, recipe: { ...ws.recipe, smartMixes: solved } };
}

// Add an additional (individual) ingredient; the batch grows by its grams.
// Re-adding an ingredient already present just replaces its amount.
export function addAdditionalIngredient(
  ws: LiveWorkspace,
  ingredientId: string,
  grams: number,
): LiveWorkspace {
  const additionalIngredients = [
    ...ws.recipe.additionalIngredients.filter((a) => a.ingredientId !== ingredientId),
    { ingredientId, grams: Math.max(0, grams) },
  ];
  const recipe = { ...ws.recipe, additionalIngredients };
  return { recipe, yieldGrams: totalGrams(recipe) };
}

// Remove an additional ingredient; the batch shrinks by its grams.
export function removeAdditionalIngredient(
  ws: LiveWorkspace,
  ingredientId: string,
): LiveWorkspace {
  const additionalIngredients = ws.recipe.additionalIngredients.filter(
    (a) => a.ingredientId !== ingredientId,
  );
  const recipe = { ...ws.recipe, additionalIngredients };
  return { recipe, yieldGrams: totalGrams(recipe) };
}

// Pull every out-of-bound macro back to its nearest healthy bound. Macros are
// coupled at fixed yield, so clamping one perturbs others — re-check and repeat
// until the whole formula sits inside its bounds (or passes run out).
export function rebalanceWorkspace(ws: LiveWorkspace, deps: WorkspaceDeps): LiveWorkspace {
  let cur = ws;
  for (let pass = 0; pass < 8; pass++) {
    const r = workspaceRatios(cur, deps);
    let changed = false;
    for (const k of MACRO_KEYS) {
      const [min, max] = MACRO_BOUNDS[k];
      if (r[k] < min - 1e-6) {
        cur = setMacroTarget(cur, k, min, deps);
        changed = true;
      } else if (r[k] > max + 1e-6) {
        cur = setMacroTarget(cur, k, max, deps);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return cur;
}

// Directly dose a trace macro (stabilizer, emulsifier) by setting its source
// mix's grams to hit the target fraction exactly — holding every other
// ingredient fixed, so the batch follows. Deterministic and always placeable,
// unlike routing a trace target through the whole-recipe solve (which the big
// macros dominate). For a fat-carrying source (lecithin) the batch grows and
// fat rises with it — an honest consequence, not a fight.
export function setTraceMacro(
  ws: LiveWorkspace,
  macro: keyof MacroRatios,
  target: number,
  deps: WorkspaceDeps,
): LiveWorkspace {
  const mixes = ws.recipe.smartMixes;
  const srcIdx = mixes.findIndex((m) => (deps.getPreset(m.presetId)?.effectiveMacros[macro] ?? 0) > 0);
  if (srcIdx < 0) return ws;

  const f = deps.getPreset(mixes[srcIdx].presetId)!.effectiveMacros[macro];
  const otherGrams = totalGrams(ws.recipe) - mixes[srcIdx].grams;
  // newGrams * f / (otherGrams + newGrams) = target  →  solve for newGrams.
  const newGrams = f - target <= 1e-6 ? otherGrams * 10 : Math.max(0, (target * otherGrams) / (f - target));

  const smartMixes = mixes.map((m, i) => (i === srcIdx ? { ...m, grams: newGrams } : m));
  const recipe = { ...ws.recipe, smartMixes };
  return { recipe, yieldGrams: totalGrams(recipe) };
}

// Explicit yield change: scale every gram so the whole batch grows or shrinks.
export function setYield(ws: LiveWorkspace, yieldGrams: number): LiveWorkspace {
  const current = totalGrams(ws.recipe);
  if (current <= 0 || yieldGrams <= 0) return { ...ws, yieldGrams };
  const f = yieldGrams / current;
  const recipe: Recipe = {
    ...ws.recipe,
    smartMixes: ws.recipe.smartMixes.map((m) => ({ ...m, grams: m.grams * f })),
    additionalIngredients: ws.recipe.additionalIngredients.map((a) => ({ ...a, grams: a.grams * f })),
  };
  return { recipe, yieldGrams };
}

// A macro sits outside its physically-healthy bound — the hard conflict state.
export function workspaceConflict(ws: LiveWorkspace, deps: WorkspaceDeps): boolean {
  const r = workspaceRatios(ws, deps);
  return MACRO_KEYS.some((k) => {
    const [min, max] = MACRO_BOUNDS[k];
    return r[k] < min - 1e-6 || r[k] > max + 1e-6;
  });
}
