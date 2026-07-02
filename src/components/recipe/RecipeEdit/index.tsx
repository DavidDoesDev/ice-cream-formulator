"use client";

import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Recipe, AdditionalIngredient } from "@/data/types";
import type { Ingredient, FormulaState } from "@/lib/formula-engine";
import { getIngredientById } from "@/data/ingredients";
import { computeRatiosFromRecipe, solveRecipe } from "@/lib/recipe-solver";
import { stateFromRatios } from "@/lib/bootstrap";
import { getPresetById } from "@/data/mix-presets";
import styles from "./RecipeEdit.module.scss";

interface RecipeEditProps {
  recipe: Recipe;
  initialNotes: string;
  onDone: (recipe: Recipe, state: FormulaState, notes: string) => void;
  onOpenIngredientSelector: (onAdd: (ingredient: Ingredient) => void) => void;
}

export interface RecipeEditHandle {
  commit: () => void;
}

export const RecipeEdit = forwardRef<RecipeEditHandle, RecipeEditProps>(
  function RecipeEdit({ recipe, initialNotes, onDone, onOpenIngredientSelector }, ref) {
    const [local, setLocal] = useState(recipe);
    const [notes, setNotes] = useState(initialNotes);
    const [swipeOpen, setSwipeOpen] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      commit: () => {
        const yieldGrams = [
          ...local.smartMixes.map((m) => m.grams),
          ...local.additionalIngredients.map((a) => a.grams),
        ].reduce((s, g) => s + g, 0) || recipe.smartMixes.reduce((s, m) => s + m.grams, 0) || 1000;
        const ratios = computeRatiosFromRecipe(local, getPresetById, (id) => getIngredientById(id)?.macros);
        const newState = stateFromRatios(ratios, yieldGrams);
        onDone(local, newState, notes);
      },
    }), [local, notes, recipe, onDone]);

    const setMixGrams = useCallback((kind: string, grams: number) => {
      setLocal((prev) => ({
        ...prev,
        smartMixes: prev.smartMixes.map((m) =>
          m.kind === kind ? { ...m, grams: Math.max(0, grams) } : m,
        ),
      }));
    }, []);

    const rebalanceWithAdditionals = useCallback(
      (prev: Recipe, newAdditionals: AdditionalIngredient[]): Recipe => {
        const smartTotal = prev.smartMixes.reduce((s, m) => s + m.grams, 0) || 1000;
        const targets = computeRatiosFromRecipe(
          { smartMixes: prev.smartMixes, additionalIngredients: [] },
          getPresetById,
        );
        const addTotal = newAdditionals.reduce((s, a) => s + a.grams, 0);
        const solved = solveRecipe(
          targets,
          smartTotal + addTotal,
          newAdditionals,
          prev.smartMixes,
          getPresetById,
          (id) => getIngredientById(id)?.macros,
        );
        return { smartMixes: solved, additionalIngredients: newAdditionals };
      },
      [],
    );

    const setAdditionalGrams = useCallback((ingredientId: string, grams: number) => {
      setLocal((prev) => {
        const newAdditionals = prev.additionalIngredients.map((a) =>
          a.ingredientId === ingredientId ? { ...a, grams: Math.max(0, grams) } : a,
        );
        return rebalanceWithAdditionals(prev, newAdditionals);
      });
    }, [rebalanceWithAdditionals]);

    const removeAdditional = useCallback((ingredientId: string) => {
      setLocal((prev) => {
        const newAdditionals = prev.additionalIngredients.filter((a) => a.ingredientId !== ingredientId);
        return rebalanceWithAdditionals(prev, newAdditionals);
      });
      setSwipeOpen(null);
    }, [rebalanceWithAdditionals]);

    const handleAddIngredient = useCallback(() => {
      onOpenIngredientSelector((ing: Ingredient) => {
        const item: AdditionalIngredient = { ingredientId: ing.id, grams: ing.grams };
        setLocal((prev) => ({
          ...prev,
          additionalIngredients: [
            ...prev.additionalIngredients.filter((a) => a.ingredientId !== ing.id),
            item,
          ],
        }));
      });
    }, [onOpenIngredientSelector]);

    const isAlcoholEmpty = (mix: typeof local.smartMixes[0]) =>
      mix.kind === "alcohol" && mix.presetId === "alcohol-empty";

    return (
      <div className={styles.root}>
        <div className={styles.ingredientList}>
          <p className={styles.sectionLabel}>Smart Mixes</p>

          {local.smartMixes.map((mix) => {
            const preset = getPresetById(mix.presetId);
            const displayLabel = preset?.name ?? mix.label;
            return (
            <div
              key={mix.kind}
              className={`${styles.ingredientCard} ${isAlcoholEmpty(mix) ? styles.inactive : ""}`}
            >
              <div className={styles.cardMain}>
                <div className={styles.cardLeft}>
                  <div className={styles.cardInfo}>
                    <span className={styles.ingName}>{displayLabel}</span>
                    <span className={styles.mixKind}>{mix.kind}</span>
                  </div>
                </div>
                {!isAlcoholEmpty(mix) && (
                  <div className={styles.gramStepper}>
                    <button
                      className={styles.stepBtn}
                      type="button"
                      onClick={() => setMixGrams(mix.kind, mix.grams - 10)}
                    >
                      −
                    </button>
                    <input
                      className={styles.gramInput}
                      type="number"
                      value={Math.round(mix.grams)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setMixGrams(mix.kind, val);
                      }}
                      min={0}
                      step={10}
                    />
                    <span className={styles.gramUnit}>g</span>
                    <button
                      className={styles.stepBtn}
                      type="button"
                      onClick={() => setMixGrams(mix.kind, mix.grams + 10)}
                    >
                      +
                    </button>
                  </div>
                )}
                {isAlcoholEmpty(mix) && (
                  <span className={styles.inactiveLabel}>not set</span>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {(local.additionalIngredients.length > 0 || true) && (
          <div className={styles.ingredientList}>
            <p className={styles.sectionLabel}>Additional Ingredients</p>

            {local.additionalIngredients.map((ai) => {
              const catalogIng = getIngredientById(ai.ingredientId);
              const label = catalogIng?.name ?? ai.ingredientId;
              return (
                <div key={ai.ingredientId} className={styles.ingredientCard}>
                  <div className={styles.cardMain}>
                    <div className={styles.cardLeft}>
                      <button
                        className={styles.swipeHandle}
                        type="button"
                        onClick={() => setSwipeOpen((p) => (p === ai.ingredientId ? null : ai.ingredientId))}
                        aria-label="More options"
                      >
                        ···
                      </button>
                      <div className={styles.cardInfo}>
                        <span className={styles.ingName}>{label}</span>
                      </div>
                    </div>
                    <div className={styles.gramStepper}>
                      <button
                        className={styles.stepBtn}
                        type="button"
                        onClick={() => setAdditionalGrams(ai.ingredientId, ai.grams - 10)}
                      >
                        −
                      </button>
                      <input
                        className={styles.gramInput}
                        type="number"
                        value={Math.round(ai.grams)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setAdditionalGrams(ai.ingredientId, val);
                        }}
                        min={0}
                        step={10}
                      />
                      <span className={styles.gramUnit}>g</span>
                      <button
                        className={styles.stepBtn}
                        type="button"
                        onClick={() => setAdditionalGrams(ai.ingredientId, ai.grams + 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {swipeOpen === ai.ingredientId && (
                    <div className={styles.swipeActions}>
                      <button
                        className={styles.swipeMoreBtn}
                        type="button"
                        onClick={() => setSwipeOpen(null)}
                      >
                        Close
                      </button>
                      <button
                        className={styles.swipeDeleteBtn}
                        type="button"
                        onClick={() => removeAdditional(ai.ingredientId)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <button className={styles.addBtn} type="button" onClick={handleAddIngredient}>
              + Add ingredient
            </button>
          </div>
        )}

        <div className={styles.notesSection}>
          <label className={styles.sectionLabel} htmlFor="recipe-notes">Notes</label>
          <textarea
            id="recipe-notes"
            className={styles.notesInput}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Process notes, variations, tips…"
            rows={4}
          />
        </div>
      </div>
    );
  }
);
