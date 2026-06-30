"use client";

import { useReducer, useCallback } from "react";
import {
  computeRatios,
  adjustRatio,
  setIngredientState,
  setIngredientGrams,
  setYield,
  rebalance,
  addIngredient,
  removeIngredient,
  type FormulaState,
  type Ingredient,
  type IngredientState,
  type MacroRatios,
} from "@/lib/formula-engine";

type Action =
  | { type: "ADJUST_RATIO"; macro: keyof MacroRatios; value: number }
  | { type: "SET_INGREDIENT_STATE"; id: string; state: IngredientState }
  | { type: "SET_INGREDIENT_GRAMS"; id: string; grams: number }
  | { type: "SET_YIELD"; grams: number }
  | { type: "REBALANCE" }
  | { type: "ADD_INGREDIENT"; ingredient: Ingredient }
  | { type: "REMOVE_INGREDIENT"; id: string }
  | { type: "RESET"; state: FormulaState };

function reducer(state: FormulaState, action: Action): FormulaState {
  switch (action.type) {
    case "ADJUST_RATIO":
      return adjustRatio(state, action.macro, action.value);
    case "SET_INGREDIENT_STATE":
      return setIngredientState(state, action.id, action.state);
    case "SET_INGREDIENT_GRAMS":
      return setIngredientGrams(state, action.id, action.grams);
    case "SET_YIELD":
      return setYield(state, action.grams);
    case "REBALANCE":
      return rebalance(state);
    case "ADD_INGREDIENT":
      return addIngredient(state, action.ingredient);
    case "REMOVE_INGREDIENT":
      return removeIngredient(state, action.id);
    case "RESET":
      return action.state;
  }
}

export interface UseFormulaReturn {
  state: FormulaState;
  ratios: MacroRatios;
  adjustRatio: (macro: keyof MacroRatios, value: number) => void;
  setIngredientState: (id: string, newState: IngredientState) => void;
  setIngredientGrams: (id: string, grams: number) => void;
  setYield: (grams: number) => void;
  rebalance: () => void;
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  reset: (state: FormulaState) => void;
}

export function useFormula(initial: FormulaState): UseFormulaReturn {
  const [state, dispatch] = useReducer(reducer, initial);
  const ratios = computeRatios(state);

  return {
    state,
    ratios,
    adjustRatio: useCallback(
      (macro: keyof MacroRatios, value: number) =>
        dispatch({ type: "ADJUST_RATIO", macro, value }),
      []
    ),
    setIngredientState: useCallback(
      (id: string, newState: IngredientState) =>
        dispatch({ type: "SET_INGREDIENT_STATE", id, state: newState }),
      []
    ),
    setIngredientGrams: useCallback(
      (id: string, grams: number) =>
        dispatch({ type: "SET_INGREDIENT_GRAMS", id, grams }),
      []
    ),
    setYield: useCallback(
      (grams: number) => dispatch({ type: "SET_YIELD", grams }),
      []
    ),
    rebalance: useCallback(() => dispatch({ type: "REBALANCE" }), []),
    addIngredient: useCallback(
      (ingredient: Ingredient) =>
        dispatch({ type: "ADD_INGREDIENT", ingredient }),
      []
    ),
    removeIngredient: useCallback(
      (id: string) => dispatch({ type: "REMOVE_INGREDIENT", id }),
      []
    ),
    reset: useCallback(
      (newState: FormulaState) => dispatch({ type: "RESET", state: newState }),
      []
    ),
  };
}
