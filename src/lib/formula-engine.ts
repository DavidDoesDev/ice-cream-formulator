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
  stabilizer: [0.0, 0.008],  // 0–0.8%: full expression, down to none
  emulsifier: [0.0, 0.006],  // 0–0.6%: full expression, down to none
  alcohol: [0.0, 0.06],      // 0–6%: past ~6% by weight it won't freeze scoopable
  water: [0.45, 0.80],       // raised: high-water sorbets
};

// How far above/below the archetype target each slider is allowed to roam.
// The micro-macros (stabilizer, emulsifier) span their whole range from any start
// so they're expressive rather than pinned near the archetype.
const MACRO_TOLERANCE: Record<keyof MacroRatios, number> = {
  fat: 0.04,
  sugar: 0.04,
  nonfatSolids: 0.02,
  stabilizer: 0.008,
  emulsifier: 0.006,
  alcohol: 0.06,   // full range from any start, so it can always return to 0
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

const MACRO_BLOCK_NAMES: Record<keyof MacroRatios, string> = {
  fat: "Fat",
  sugar: "Sugar",
  nonfatSolids: "Non-fat solids",
  stabilizer: "Stabilizer",
  emulsifier: "Emulsifier",
  alcohol: "Alcohol",
  water: "Water",
};

// A pure single-macro block: contributes exactly `macro` at 100%. Mirrors the
// blocks seeded by bootstrap so a macro can be introduced when the state has none.
function makeMacroBlock(macro: keyof MacroRatios, grams: number): Ingredient {
  const zero: IngredientMacros = {
    fat: 0, sugar: 0, nonfatSolids: 0, stabilizer: 0, emulsifier: 0, alcohol: 0, water: 0,
  };
  return {
    id: `_base-${macro}`,
    name: MACRO_BLOCK_NAMES[macro],
    state: "normal",
    grams,
    macros: { ...zero, [macro]: 1 },
  };
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

  const currentCarrierMacro = carriers.reduce((sum, i) => sum + i.grams * i.macros[macro], 0);
  const currentCarrierGrams = carriers.reduce((sum, i) => sum + i.grams, 0);

  // Grams and macro contribution from non-scaling ingredients
  const otherGrams =
    anchors.reduce((sum, i) => sum + i.grams, 0) +
    pinned.reduce((sum, i) => sum + i.grams, 0);
  const otherMacroContrib =
    anchors.reduce((sum, i) => sum + i.grams * i.macros[macro], 0) +
    pinned.reduce((sum, i) => sum + i.grams * i.macros[macro], 0);

  // Zero-mass carriers cannot be grown by scaling (0 × k = 0). When the macro has
  // no mass yet — an absent block or one at zero grams — inject grams into a pure
  // single-macro carrier (creating the block if none exists), holding others fixed.
  if (currentCarrierGrams < 1e-9) {
    if (clamped <= 1e-12) return { ...state, conflict: false };
    const carrier = carriers[0];
    const coeff = carrier ? carrier.macros[macro] : 1;
    if (coeff <= clamped) return { ...state, conflict: true };
    const injected = (clamped * otherGrams - otherMacroContrib) / (coeff - clamped);
    if (injected < 0) return { ...state, conflict: true };
    const ingredients = carrier
      ? state.ingredients.map((i) => (i.id === carrier.id ? { ...i, grams: injected } : i))
      : [...state.ingredients, makeMacroBlock(macro, injected)];
    return { ...state, ingredients, conflict: false };
  }

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
