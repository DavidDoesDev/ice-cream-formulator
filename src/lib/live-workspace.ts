import { computeRatiosFromRecipe, solveRecipe } from "./recipe-solver";
import { MACRO_BOUNDS, type MacroRatios, type IngredientMacros } from "./formula-engine";
import type { Recipe, MixPreset, SmartMix, SmartMixKind } from "@/data/types";

// Trace additives are dosed directly (setTraceMacro), so a big-macro solve must
// leave them alone — otherwise the solver flings their grams around to minimize
// a trace target it can't meaningfully influence.
const TRACE_KINDS = new Set<SmartMixKind>(["stabilizer", "emulsifier"]);

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
// Solve the blend (non-trace) mixes toward a target ratio vector, holding the
// trace additives fixed and the batch yield exact. The one place the solver runs.
function solveBlend(ws: LiveWorkspace, targets: MacroRatios, deps: WorkspaceDeps): LiveWorkspace {
  const mixes = ws.recipe.smartMixes;
  const heldGrams = mixes.filter((m) => TRACE_KINDS.has(m.kind)).reduce((s, m) => s + m.grams, 0);
  const solveMixes = mixes.filter((m) => !TRACE_KINDS.has(m.kind));
  const solved = solveRecipe(
    targets,
    ws.yieldGrams - heldGrams,
    ws.recipe.additionalIngredients,
    solveMixes,
    deps.getPreset,
    deps.resolveIngredient,
  );
  const gramsFor = new Map<SmartMix, number>();
  solveMixes.forEach((m, i) => gramsFor.set(m, solved[i].grams));
  const smartMixes = mixes.map((m) =>
    TRACE_KINDS.has(m.kind) ? m : { ...m, grams: gramsFor.get(m) ?? m.grams },
  );
  return { ...ws, recipe: { ...ws.recipe, smartMixes } };
}

export function setMacroTarget(
  ws: LiveWorkspace,
  macro: keyof MacroRatios,
  target: number,
  deps: WorkspaceDeps,
): LiveWorkspace {
  return solveBlend(ws, { ...workspaceRatios(ws, deps), [macro]: target }, deps);
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
  // Trace additives are dosed directly (the solve can't nail them); blend macros
  // are clamped as a vector and solved at once (clamping one at a time
  // oscillates, since the macros are coupled). A few passes settle it.
  let cur = ws;
  for (let pass = 0; pass < 4; pass++) {
    if (!workspaceConflict(cur, deps)) break;
    const rTrace = workspaceRatios(cur, deps);
    for (const macro of ["stabilizer", "emulsifier"] as (keyof MacroRatios)[]) {
      const [min, max] = MACRO_BOUNDS[macro];
      if (rTrace[macro] > max + 1e-6 || rTrace[macro] < min - 1e-6) {
        cur = setTraceMacro(cur, macro, Math.max(min, Math.min(max, rTrace[macro])), deps);
      }
    }
    const r = workspaceRatios(cur, deps);
    const targets = { ...r };
    for (const k of MACRO_KEYS) {
      const [min, max] = MACRO_BOUNDS[k];
      targets[k] = Math.max(min, Math.min(max, r[k]));
    }
    cur = solveBlend(cur, targets, deps);
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
  const Y = ws.yieldGrams;
  // Grams of source needed to hit the target fraction of the fixed yield; the
  // rest of the batch scales to fill the remainder, so the yield stays put.
  const sourceGrams = f <= target ? Y : Math.max(0, Math.min(Y, (target * Y) / f));
  const otherGrams = totalGrams(ws.recipe) - mixes[srcIdx].grams;
  const scale = otherGrams > 1e-9 ? (Y - sourceGrams) / otherGrams : 0;

  const smartMixes = mixes.map((m, i) =>
    i === srcIdx ? { ...m, grams: sourceGrams } : { ...m, grams: m.grams * scale },
  );
  const additionalIngredients = ws.recipe.additionalIngredients.map((a) => ({ ...a, grams: a.grams * scale }));
  return { recipe: { ...ws.recipe, smartMixes, additionalIngredients }, yieldGrams: Y };
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
