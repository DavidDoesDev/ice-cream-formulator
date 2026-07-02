export type IngredientState = "normal" | "pinned" | "excluded";

export interface IngredientMacros {
  fat: number;
  sugar: number;
  nonfatSolids: number;
  stabilizer: number;
  emulsifier: number;
  alcohol: number;
  water: number;
}

export interface Ingredient {
  id: string;
  name: string;
  state: IngredientState;
  grams: number;
  macros: IngredientMacros;
}

export interface MacroRatios {
  fat: number;
  sugar: number;
  nonfatSolids: number;
  stabilizer: number;
  emulsifier: number;
  alcohol: number;
  water: number;
}

export interface FormulaState {
  ingredients: Ingredient[];
  yieldGrams: number;
  conflict: boolean;
}

export const MACRO_BOUNDS: Record<keyof MacroRatios, [number, number]> = {
  sugar: [0.08, 0.38],       // raised: sorbets can have 30-35% sugar
  fat: [0.0, 0.22],          // 0% valid for sorbets
  nonfatSolids: [0.0, 0.14], // 0% valid for sorbets
  stabilizer: [0.002, 0.006],
  emulsifier: [0.001, 0.003],
  alcohol: [0.0, 0.12],
  water: [0.45, 0.80],       // raised: high-water sorbets
};

// How far above/below the archetype target each slider is allowed to roam.
const MACRO_TOLERANCE: Record<keyof MacroRatios, number> = {
  fat: 0.04,
  sugar: 0.04,
  nonfatSolids: 0.02,
  stabilizer: 0.002,
  emulsifier: 0.001,
  alcohol: 0.04,
  water: 0.06,
};

/**
 * Returns [min, max] for a slider given the archetype's target ratio for that macro.
 * Centered on the target with MACRO_TOLERANCE, clamped to MACRO_BOUNDS.
 * For zero-target macros (alcohol, emulsifier) the lower bound stays at 0.
 */
export function computeSliderBounds(
  macro: keyof MacroRatios,
  target: number
): [number, number] {
  const [absMin, absMax] = MACRO_BOUNDS[macro];
  const tol = MACRO_TOLERANCE[macro];
  const lo = target === 0 ? 0 : Math.max(absMin, target - tol);
  const hi = target === 0 ? Math.min(absMax, tol) : Math.min(absMax, target + tol);
  return [lo, Math.max(lo, hi)]; // guard against inversion when target exceeds absMax
}

const MACRO_KEYS: (keyof MacroRatios)[] = [
  "fat",
  "sugar",
  "nonfatSolids",
  "stabilizer",
  "emulsifier",
  "alcohol",
  "water",
];

export function computeRatios(state: FormulaState): MacroRatios {
  const included = state.ingredients.filter((i) => i.state !== "excluded");
  const totalGrams = included.reduce((sum, i) => sum + i.grams, 0);

  if (totalGrams === 0) {
    return { fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0 };
  }

  const ratios = {} as MacroRatios;
  for (const key of MACRO_KEYS) {
    const contribution = included.reduce((sum, i) => sum + i.grams * i.macros[key], 0);
    ratios[key] = contribution / totalGrams;
  }
  return ratios;
}

export function setIngredientState(
  state: FormulaState,
  id: string,
  newState: IngredientState
): FormulaState {
  return {
    ...state,
    ingredients: state.ingredients.map((i) =>
      i.id === id ? { ...i, state: newState } : i
    ),
  };
}

export function setIngredientGrams(
  state: FormulaState,
  id: string,
  grams: number
): FormulaState {
  return {
    ...state,
    ingredients: state.ingredients.map((i) =>
      i.id === id ? { ...i, grams } : i
    ),
  };
}

export function setYield(state: FormulaState, yieldGrams: number): FormulaState {
  const currentYield = state.ingredients.reduce((sum, i) => sum + i.grams, 0);
  if (currentYield === 0) return { ...state, yieldGrams };
  const scale = yieldGrams / currentYield;
  return {
    ...state,
    yieldGrams,
    ingredients: state.ingredients.map((i) => ({ ...i, grams: i.grams * scale })),
  };
}

export function addIngredient(state: FormulaState, ingredient: Ingredient): FormulaState {
  return { ...state, ingredients: [...state.ingredients, ingredient] };
}

export function removeIngredient(state: FormulaState, id: string): FormulaState {
  return { ...state, ingredients: state.ingredients.filter((i) => i.id !== id) };
}

export function adjustRatio(
  state: FormulaState,
  macro: keyof MacroRatios,
  targetValue: number
): FormulaState {
  const [min, max] = MACRO_BOUNDS[macro];
  const clamped = Math.min(max, Math.max(min, targetValue));

  const included = state.ingredients.filter((i) => i.state !== "excluded");
  const normals = included.filter((i) => i.state === "normal");

  if (normals.length === 0) return { ...state, conflict: true };

  const totalGrams = included.reduce((sum, i) => sum + i.grams, 0);
  if (totalGrams === 0) return { ...state, conflict: true };

  // Only the ingredients that actually carry this macro can be scaled to achieve the target.
  // Non-carrier normals and pinned ingredients stay fixed.
  const carriers = normals.filter((i) => i.macros[macro] > 0);
  const anchors = normals.filter((i) => i.macros[macro] === 0);
  const pinned = included.filter((i) => i.state === "pinned");

  if (carriers.length === 0) return { ...state, conflict: true };

  const currentCarrierMacro = carriers.reduce((sum, i) => sum + i.grams * i.macros[macro], 0);
  const currentCarrierGrams = carriers.reduce((sum, i) => sum + i.grams, 0);

  // Grams and macro contribution from non-scaling ingredients
  const otherGrams =
    anchors.reduce((sum, i) => sum + i.grams, 0) +
    pinned.reduce((sum, i) => sum + i.grams, 0);
  const otherMacroContrib =
    anchors.reduce((sum, i) => sum + i.grams * i.macros[macro], 0) +
    pinned.reduce((sum, i) => sum + i.grams * i.macros[macro], 0);

  // Find scale factor k such that:
  //   (k * currentCarrierMacro + otherMacroContrib) / (k * currentCarrierGrams + otherGrams) = clamped
  // Rearranges to: k * (currentCarrierMacro - clamped * currentCarrierGrams) = clamped * otherGrams - otherMacroContrib
  const numerator = clamped * otherGrams - otherMacroContrib;
  const denominator = currentCarrierMacro - clamped * currentCarrierGrams;

  if (Math.abs(denominator) < 1e-9) {
    const current = computeRatios(state)[macro];
    return Math.abs(current - clamped) < 1e-4 ? state : { ...state, conflict: true };
  }

  const k = numerator / denominator;
  if (k < 0) return { ...state, conflict: true };

  const carrierIds = new Set(carriers.map((i) => i.id));
  const updatedIngredients = state.ingredients.map((i) =>
    carrierIds.has(i.id) ? { ...i, grams: i.grams * k } : i,
  );

  return { ...state, ingredients: updatedIngredients, conflict: false };
}

export function rebalance(state: FormulaState): FormulaState {
  if (!state.conflict) return state;

  const included = state.ingredients.filter((i) => i.state !== "excluded");
  const normals = included.filter((i) => i.state === "normal");

  if (normals.length === 0) return state;

  // Compute current ratios and find the smallest adjustment to bring them within bounds
  const current = computeRatios(state);
  const totalGrams = included.reduce((sum, i) => sum + i.grams, 0);
  if (totalGrams === 0) return state;

  // Find the most violated macro and clamp it, distributing the diff to normals
  let newState = state;
  for (const key of MACRO_KEYS) {
    const [min, max] = MACRO_BOUNDS[key];
    const val = current[key];
    if (val < min) {
      newState = adjustRatio(newState, key, min);
    } else if (val > max) {
      newState = adjustRatio(newState, key, max);
    }
  }

  return { ...newState, conflict: false };
}
