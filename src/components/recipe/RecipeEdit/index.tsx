"use client";

import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Recipe, AdditionalIngredient, SmartMixKind, SmartMix } from "@/data/types";
import type { Ingredient, FormulaState } from "@/lib/formula-engine";
import { getIngredientById } from "@/data/ingredients";
import { computeRatiosFromRecipe } from "@/lib/recipe-solver";
import { stateFromRatios } from "@/lib/bootstrap";
import { getPresetById } from "@/data/mix-presets";
import { SectionHeader } from "@/components/shared/SectionHeader";
import styles from "./RecipeEdit.module.scss";

// Sugar and stabilizer are fixed-proportion systems shown as one grouped card;
// everything else (milk, cream, eggs, water, alcohol, additions) is an individual
// ingredient. Grouped cards use the system label; singles use the ingredient name.
const GROUPED_KINDS: SmartMixKind[] = ["sugar", "stabilizer"];
const isGrouped = (kind: SmartMixKind) => GROUPED_KINDS.includes(kind);

function mixLabel(mix: SmartMix): string {
  if (isGrouped(mix.kind)) return mix.label;
  return getPresetById(mix.presetId)?.name ?? mix.label;
}

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
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

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

    const setMixGrams = useCallback((presetId: string, grams: number) => {
      setLocal((prev) => ({
        ...prev,
        smartMixes: prev.smartMixes.map((m) =>
          m.presetId === presetId ? { ...m, grams: Math.max(0, grams) } : m,
        ),
      }));
    }, []);

    // Recipe editing is direct: every ingredient is effectively pinned except the
    // one being changed. No solver runs here — the Mix is recomputed from the final
    // recipe on commit, where any imbalance can surface.
    const setAdditionalGrams = useCallback((ingredientId: string, grams: number) => {
      setLocal((prev) => ({
        ...prev,
        additionalIngredients: prev.additionalIngredients.map((a) =>
          a.ingredientId === ingredientId ? { ...a, grams: Math.max(0, grams) } : a,
        ),
      }));
    }, []);

    const removeAdditional = useCallback((ingredientId: string) => {
      setLocal((prev) => ({
        ...prev,
        additionalIngredients: prev.additionalIngredients.filter((a) => a.ingredientId !== ingredientId),
      }));
      setMenuOpen(null);
    }, []);

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

    // Empty-by-default mixes (unset alcohol / emulsifier) don't belong in the list.
    const activeMixes = local.smartMixes.filter(
      (m) => (getPresetById(m.presetId)?.ingredients.length ?? 0) > 0,
    );

    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <SectionHeader role="ingredients" label="Ingredients" />
          <div className={styles.ingredientList}>
            {activeMixes.map((mix) => (
              <div key={mix.presetId} className={styles.ingredientCard}>
                <div className={styles.cardMain}>
                  <span className={styles.ingName}>{mixLabel(mix)}</span>
                  <div className={styles.gramStepper}>
                    <button
                      className={styles.stepBtn}
                      type="button"
                      onClick={() => setMixGrams(mix.presetId, mix.grams - 10)}
                    >
                      −
                    </button>
                    <div className={styles.gramField}>
                      <input
                        className={styles.gramInput}
                        type="number"
                        value={Math.round(mix.grams)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setMixGrams(mix.presetId, val);
                        }}
                        min={0}
                        step={10}
                      />
                      <span className={styles.gramUnit}>g</span>
                    </div>
                    <button
                      className={styles.stepBtn}
                      type="button"
                      onClick={() => setMixGrams(mix.presetId, mix.grams + 10)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {local.additionalIngredients.map((ai) => {
              const label = getIngredientById(ai.ingredientId)?.name ?? ai.ingredientId;
              return (
                <div key={ai.ingredientId} className={styles.ingredientCard}>
                  <div className={styles.cardMain}>
                    <button
                      className={styles.menuHandle}
                      type="button"
                      onClick={() => setMenuOpen((p) => (p === ai.ingredientId ? null : ai.ingredientId))}
                      aria-label="More options"
                    >
                      ···
                    </button>
                    <span className={styles.ingName}>{label}</span>
                    <div className={styles.gramStepper}>
                      <button
                        className={styles.stepBtn}
                        type="button"
                        onClick={() => setAdditionalGrams(ai.ingredientId, ai.grams - 10)}
                      >
                        −
                      </button>
                      <div className={styles.gramField}>
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
                      </div>
                      <button
                        className={styles.stepBtn}
                        type="button"
                        onClick={() => setAdditionalGrams(ai.ingredientId, ai.grams + 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {menuOpen === ai.ingredientId && (
                    <div className={styles.rowActions}>
                      <button
                        className={styles.rowCloseBtn}
                        type="button"
                        onClick={() => setMenuOpen(null)}
                      >
                        Close
                      </button>
                      <button
                        className={styles.rowRemoveBtn}
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
              Add ingredient
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <SectionHeader role="notes" label="Notes" />
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
