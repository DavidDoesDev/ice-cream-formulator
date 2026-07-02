import type { MacroRatios, IngredientMacros } from "./formula-engine";
import type { SmartMix, AdditionalIngredient, MixPreset, Recipe } from "@/data/types";

const MACROS: (keyof IngredientMacros)[] = [
  "fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier", "alcohol", "water",
];

// Soft yield-conservation penalty weight.
// High enough to keep sum(x) close to yieldRemaining during gradient descent;
// exact conservation is enforced by post-normalization.
const YIELD_WEIGHT = 10;

function macroVec(m: IngredientMacros): number[] {
  return MACROS.map((k) => m[k]);
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function matVec(A: number[][], x: number[]): number[] {
  return A.map((row) => dot(row, x));
}

function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

function matTVec(A: number[][], v: number[]): number[] {
  const cols = A[0]?.length ?? 0;
  return Array.from({ length: cols }, (_, j) =>
    A.reduce((s, row, i) => s + row[j] * v[i], 0),
  );
}

function frobeniusSq(A: number[][]): number {
  return A.reduce((s, row) => s + row.reduce((s2, v) => s2 + v * v, 0), 0);
}

/**
 * Compute MacroRatios from a Recipe's current gram assignments.
 * Used for Recipe → Mix sync: when smart mix grams change, derive updated Mix ratios.
 */
export function computeRatiosFromRecipe(
  recipe: Recipe,
  getPreset: (id: string) => MixPreset | undefined,
  resolveIngredient: (id: string) => IngredientMacros | undefined = () => undefined,
): MacroRatios {
  const zero: MacroRatios = {
    fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0,
    emulsifier: 0, alcohol: 0, water: 0,
  };

  let totalGrams = 0;
  const total = { ...zero };

  for (const mix of recipe.smartMixes) {
    if (mix.grams <= 0) continue;
    const preset = getPreset(mix.presetId);
    if (!preset) continue;
    const m = preset.effectiveMacros;
    for (const k of MACROS) total[k] += m[k] * mix.grams;
    totalGrams += mix.grams;
  }

  for (const { ingredientId, grams } of recipe.additionalIngredients) {
    if (grams <= 0) continue;
    const m = resolveIngredient(ingredientId);
    if (!m) continue;
    for (const k of MACROS) total[k] += m[k] * grams;
    totalGrams += grams;
  }

  if (totalGrams === 0) return zero;
  const result = { ...zero };
  for (const k of MACROS) result[k] = total[k] / totalGrams;
  return result;
}

/**
 * Solve for Smart Mix gram amounts using projected gradient descent (NNLS) with
 * a soft yield-conservation penalty row, followed by exact post-normalization.
 *
 * @param resolveIngredient  Looks up IngredientMacros by catalog ID (for
 *   additional ingredients). Optional; omit when there are no additionals or
 *   when their macro contribution is handled upstream.
 */
export function solveRecipe(
  targets: MacroRatios,
  yieldGrams: number,
  additionals: AdditionalIngredient[],
  smartMixes: SmartMix[],
  getPreset: (id: string) => MixPreset | undefined,
  resolveIngredient: (id: string) => IngredientMacros | undefined = () => undefined,
): SmartMix[] {
  // --- 1. Compute fixed macro contributions from additional ingredients ---
  const additionalGrams = additionals.reduce((s, a) => s + a.grams, 0);
  const addMacros: IngredientMacros = {
    fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0,
    emulsifier: 0, alcohol: 0, water: 0,
  };
  for (const { ingredientId, grams } of additionals) {
    const m = resolveIngredient(ingredientId);
    if (!m) continue;
    for (const k of MACROS) addMacros[k] += m[k] * grams;
  }

  const yieldRemaining = yieldGrams - additionalGrams;

  // --- 2. Identify active mixes (non-zero effective macros) ---
  const presets = smartMixes.map((m) => getPreset(m.presetId));
  const isActive = presets.map((p) => {
    if (!p) return false;
    return MACROS.some((k) => p.effectiveMacros[k] > 0);
  });
  const activeIdx = smartMixes.flatMap((_, i) => (isActive[i] ? [i] : []));
  const n = activeIdx.length;

  if (n === 0 || yieldRemaining <= 0) {
    return smartMixes.map((m) => ({ ...m, grams: 0 }));
  }

  const activeMacros = activeIdx.map((i) => macroVec(presets[i]!.effectiveMacros));

  // --- 3. Build augmented system: macro rows + yield-conservation row ---
  // Target grams per macro = target ratio × totalYield − fixed additional contribution
  const targetGrams = MACROS.map((k) => targets[k] * yieldGrams - addMacros[k]);

  const A: number[][] = [
    ...MACROS.map((_, ki) => activeMacros.map((mv) => mv[ki])),
    Array(n).fill(YIELD_WEIGHT),           // yield row
  ];
  const b: number[] = [...targetGrams, YIELD_WEIGHT * yieldRemaining];

  // --- 4. Projected gradient descent (NNLS) ---
  const lr = 1 / (2 * (frobeniusSq(A) + 1e-10));
  let x = Array<number>(n).fill(yieldRemaining / n);

  const MAX_ITER = 3000;
  const TOL = 1e-8;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const grad = matTVec(A, vecSub(matVec(A, x), b)).map((v) => 2 * v);

    let maxGrad = 0;
    x = x.map((xi, j) => {
      const next = Math.max(0, xi - lr * grad[j]);
      maxGrad = Math.max(maxGrad, Math.abs(grad[j]));
      return next;
    });

    if (maxGrad < TOL) break;
  }

  // --- 5. Post-normalize for exact yield conservation ---
  // Scaling by a small factor (close to 1) preserves proportions while guaranteeing
  // sum(x) = yieldRemaining exactly.
  const sumX = x.reduce((s, v) => s + v, 0);
  if (sumX > 1e-10) {
    const scale = yieldRemaining / sumX;
    x = x.map((v) => v * scale);
  }

  // --- 6. Reconstruct SmartMix array ---
  const gramsMap = new Map<number, number>();
  activeIdx.forEach((globalIdx, j) => gramsMap.set(globalIdx, x[j]));

  return smartMixes.map((mix, i) => ({
    ...mix,
    grams: gramsMap.get(i) ?? 0,
  }));
}
