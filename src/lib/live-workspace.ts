import { computeRatiosFromRecipe, solveRecipe } from "./recipe-solver";
import { MACRO_BOUNDS, type MacroRatios, type IngredientMacros } from "./formula-engine";
import { healthyBand } from "./macro-bands";
import { balanceReport } from "./balance";
import { relationshipHints } from "./relationships";
import { derive } from "./derive";
import { DEFAULT_EQUIPMENT, type Recipe, type MixPreset, type SmartMix, type SmartMixKind, type EquipmentProfile } from "@/data/types";

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

// Solve the blend toward a target vector at fixed yield. Only trace additives are
// held out of the solve (it can't nail them); every other mix stays in so its
// target is honored — including topping up sucrose to hold the sugar ratio as
// dairy shifts. Water (plus the dragged macro's coupled dairy partner) is freed
// so the change is absorbed there rather than smeared across the other macros.
function solveBlend(
  ws: LiveWorkspace,
  targets: MacroRatios,
  deps: WorkspaceDeps,
  dragged?: keyof MacroRatios,
): LiveWorkspace {
  const mixes = ws.recipe.smartMixes;
  // Only trace additives are held out (the solve can't nail them). Every other
  // mix stays in the solve so its target is honored — e.g. sucrose tops up to
  // hold the sugar ratio when dairy (and its incidental lactose) shifts.
  const isHeld = (m: SmartMix) => TRACE_KINDS.has(m.kind);
  const held = mixes.filter(isHeld);
  const solveMixes = mixes.filter((m) => !isHeld(m));

  // Free water (the remainder) plus the dragged macro's coupled dairy partner,
  // so the change lands there instead of being smeared into the other targets.
  const free: (keyof MacroRatios)[] = ["water"];
  if (dragged === "fat") free.push("nonfatSolids");
  else if (dragged === "nonfatSolids") free.push("fat");

  const solved = solveRecipe(
    targets,
    ws.yieldGrams,
    ws.recipe.additionalIngredients,
    solveMixes,
    deps.getPreset,
    deps.resolveIngredient,
    free,
    held,
  );
  const gramsFor = new Map<SmartMix, number>();
  solveMixes.forEach((m, i) => gramsFor.set(m, solved[i].grams));
  const smartMixes = mixes.map((m) => (isHeld(m) ? m : { ...m, grams: gramsFor.get(m) ?? m.grams }));
  return { ...ws, recipe: { ...ws.recipe, smartMixes } };
}

export function setMacroTarget(
  ws: LiveWorkspace,
  macro: keyof MacroRatios,
  target: number,
  deps: WorkspaceDeps,
): LiveWorkspace {
  return solveBlend(ws, { ...workspaceRatios(ws, deps), [macro]: target }, deps, macro);
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

// Add a smart mix of a kind not yet present (e.g. the custard egg-yolk nudge:
// `eggs` → `eggs-yolks`), dosed at `grams`, then scale the batch back to its
// prior yield so the size doesn't drift. No-op if a mix of that kind already
// exists, so tapping is safe. Adding real ingredient mass shifts the macros (egg
// yolk brings fat + emulsifier) — that's the point of turning a base into a
// custard; the composition change is honest, and nothing happens until tapped.
export function addSmartMix(
  ws: LiveWorkspace,
  kind: SmartMixKind,
  presetId: string,
  label: string,
  grams: number,
): LiveWorkspace {
  if (ws.recipe.smartMixes.some((m) => m.kind === kind)) return ws;
  const smartMixes = [...ws.recipe.smartMixes, { kind, label, presetId, grams: Math.max(0, grams) }];
  const grown: LiveWorkspace = {
    recipe: { ...ws.recipe, smartMixes },
    yieldGrams: totalGrams({ ...ws.recipe, smartMixes }),
  };
  return setYield(grown, ws.yieldGrams);
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

// Pull every out-of-bound macro back to its nearest healthy bound. Trace
// additives are dosed directly (the solver can't nail them); everything else is
// solved at once toward the clamped vector, holding only trace and freeing water.
export function rebalanceWorkspace(ws: LiveWorkspace, deps: WorkspaceDeps): LiveWorkspace {
  let cur = ws;

  // 1. Dose out-of-bound trace additives to their bound.
  const r0 = workspaceRatios(cur, deps);
  for (const macro of ["stabilizer", "emulsifier"] as (keyof MacroRatios)[]) {
    const [min, max] = MACRO_BOUNDS[macro];
    if (r0[macro] > max + 1e-6 || r0[macro] < min - 1e-6) {
      cur = setTraceMacro(cur, macro, Math.max(min, Math.min(max, r0[macro])), deps);
    }
  }

  // 2. Solve all blend mixes (sugar / alcohol / dairy) toward the clamped target
  //    vector, holding only trace and letting water absorb.
  const r = workspaceRatios(cur, deps);
  const targets = { ...r };
  for (const k of MACRO_KEYS) {
    const [min, max] = MACRO_BOUNDS[k];
    // Aim just inside the bound so the least-squares residual still lands in range.
    const margin = (max - min) * 0.03;
    if (r[k] < min) targets[k] = min + margin;
    else if (r[k] > max) targets[k] = max - margin;
  }
  const mixes = cur.recipe.smartMixes;
  const heldTrace = mixes.filter((m) => TRACE_KINDS.has(m.kind));
  const solveMixes = mixes.filter((m) => !TRACE_KINDS.has(m.kind));
  const solved = solveRecipe(
    targets,
    cur.yieldGrams,
    cur.recipe.additionalIngredients,
    solveMixes,
    deps.getPreset,
    deps.resolveIngredient,
    ["water"],
    heldTrace,
  );
  const gramsFor = new Map<SmartMix, number>();
  solveMixes.forEach((m, i) => gramsFor.set(m, solved[i].grams));
  const smartMixes = mixes.map((m) =>
    TRACE_KINDS.has(m.kind) ? m : { ...m, grams: gramsFor.get(m) ?? m.grams },
  );
  return { ...cur, recipe: { ...cur.recipe, smartMixes } };
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

// Macros the scorecard (balanceReport) judges against the healthy windows.
const WINDOW_KEYS: (keyof MacroRatios)[] = ["fat", "sugar", "nonfatSolids"];

// User-invoked "Rebalance": reach a Balanced state at fixed yield. Resolves any
// out-of-bound conflict (clamp trace to bounds), guarantees no ice control (dose
// stabilizer into its window), and centers each tracked macro on its window
// midpoint (windows + total solids). This reliably clears every *blocker*.
// Sandiness usually clears too (milk solids ease down) but isn't guaranteed, and
// scoopability from sugar type / alcohol is left alone — both are shown as notes,
// not blockers, so Rebalance never chases something it can't cleanly fix. No-op
// once already Balanced; tapping is always safe.
export function recalibrate(
  ws: LiveWorkspace,
  deps: WorkspaceDeps,
  style: string,
  equipment: EquipmentProfile = DEFAULT_EQUIPMENT,
): LiveWorkspace {
  const r0 = workspaceRatios(ws, deps);
  const icy = relationshipHints(r0, derive(ws.recipe), style, equipment).some((h) => h.key === "ice-control");
  // Already good (windows + no conflict + no ice control) → no-op. Sandiness and
  // scoopability are choice-driven notes, not blockers, so they don't force work.
  if (!workspaceConflict(ws, deps) && balanceReport(r0, style, equipment).balanced && !icy) return ws;

  let cur = ws;
  // 1. Clamp any out-of-bound trace additive back to bounds (resolves a conflict).
  for (const macro of ["stabilizer", "emulsifier"] as (keyof MacroRatios)[]) {
    const [min, max] = MACRO_BOUNDS[macro];
    const v = workspaceRatios(cur, deps)[macro];
    if (v > max + 1e-6 || v < min - 1e-6) cur = setTraceMacro(cur, macro, Math.max(min, Math.min(max, v)), deps);
  }
  // 2. Center the trace additives on their windows (dosed exactly). Stabilizer
  //    always — it's scored, so the slider and status agree, and it can't be
  //    watery+under-stabilized. Emulsifier only when it's a dedicated mix, not
  //    egg-derived (egg yolk's emulsifier is a byproduct we leave alone).
  const [stabLo, stabHi] = healthyBand(style, "stabilizer", equipment);
  const sv = workspaceRatios(cur, deps).stabilizer;
  if (sv < stabLo - 1e-9 || sv > stabHi + 1e-9) {
    cur = setTraceMacro(cur, "stabilizer", (stabLo + stabHi) / 2, deps);
  }
  const hasEmulMix = cur.recipe.smartMixes.some(
    (m) => m.kind === "emulsifier" && (deps.getPreset(m.presetId)?.ingredients.length ?? 0) > 0,
  );
  const hasEggs = cur.recipe.smartMixes.some((m) => m.kind === "eggs");
  if (hasEmulMix && !hasEggs) {
    const [emLo, emHi] = healthyBand(style, "emulsifier", equipment);
    const ev = workspaceRatios(cur, deps).emulsifier;
    if (ev < emLo - 1e-9 || ev > emHi + 1e-9) cur = setTraceMacro(cur, "emulsifier", (emLo + emHi) / 2, deps);
  }
  // 3. Center each tracked macro on its window midpoint — lands the windows + the
  //    total-solids sum, and eases milk solids down (which usually clears sandiness).
  const r = workspaceRatios(cur, deps);
  const targets = { ...r };
  for (const key of WINDOW_KEYS) {
    const [lo, hi] = healthyBand(style, key, equipment);
    targets[key] = (lo + hi) / 2;
  }
  let out = solveBlend(cur, targets, deps);

  // 4. Final clamp: centering an egg-rich custard pulls in yolk, which can push
  //    its incidental emulsifier just over the bound — clamp trace back in.
  for (const macro of ["stabilizer", "emulsifier"] as (keyof MacroRatios)[]) {
    const [min, max] = MACRO_BOUNDS[macro];
    const v = workspaceRatios(out, deps)[macro];
    if (v > max + 1e-6 || v < min - 1e-6) out = setTraceMacro(out, macro, Math.max(min, Math.min(max, v)), deps);
  }
  return out;
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
