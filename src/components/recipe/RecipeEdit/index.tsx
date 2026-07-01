"use client";

import { useState, useCallback } from "react";
import { useFormula } from "@/hooks/useFormula";
import type { FormulaState, Ingredient } from "@/lib/formula-engine";
import styles from "./RecipeEdit.module.scss";

interface RecipeEditProps {
  initial: FormulaState;
  initialNotes: string;
  onDone: (state: FormulaState, notes: string) => void;
  onCancel: () => void;
  onOpenIngredientSelector: (onAdd: (ingredient: Ingredient) => void) => void;
}

export function RecipeEdit({ initial, initialNotes, onDone, onCancel, onOpenIngredientSelector }: RecipeEditProps) {
  const local = useFormula(initial);
  const [notes, setNotes] = useState(initialNotes);
  const [swipeOpen, setSwipeOpen] = useState<string | null>(null);

  const handleGramsChange = useCallback(
    (id: string, raw: string) => {
      const val = parseFloat(raw);
      if (!isNaN(val) && val >= 0) {
        local.setIngredientGrams(id, val);
      }
    },
    [local]
  );

  const handleAddIngredient = useCallback(() => {
    onOpenIngredientSelector((ing: Ingredient) => {
      local.addIngredient(ing);
    });
  }, [local, onOpenIngredientSelector]);

  const toggleSwipe = useCallback((id: string) => {
    setSwipeOpen((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.ingredientList}>
        <p className={styles.sectionLabel}>Ingredients</p>
        {local.state.ingredients.map((ing) => (
          <div key={ing.id} className={styles.ingredientCard}>
            <div className={styles.cardMain}>
              <div className={styles.cardLeft}>
                <button
                  className={styles.swipeHandle}
                  type="button"
                  onClick={() => toggleSwipe(ing.id)}
                  aria-label="More options"
                >
                  ···
                </button>
                <div className={styles.cardInfo}>
                  <span className={styles.ingName}>{ing.name}</span>
                  <div className={styles.ingStates}>
                    <button
                      className={`${styles.stateBtn} ${ing.state === "pinned" ? styles.stateBtnActive : ""}`}
                      type="button"
                      onClick={() =>
                        local.setIngredientState(ing.id, ing.state === "pinned" ? "normal" : "pinned")
                      }
                    >
                      Pin
                    </button>
                    <button
                      className={`${styles.stateBtn} ${ing.state === "excluded" ? styles.stateBtnActive : ""}`}
                      type="button"
                      onClick={() =>
                        local.setIngredientState(ing.id, ing.state === "excluded" ? "normal" : "excluded")
                      }
                    >
                      Exclude
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.gramStepper}>
                <button
                  className={styles.stepBtn}
                  type="button"
                  onClick={() => local.setIngredientGrams(ing.id, Math.max(0, ing.grams - 10))}
                >
                  −
                </button>
                <input
                  className={styles.gramInput}
                  type="number"
                  value={ing.grams.toFixed(1)}
                  onChange={(e) => handleGramsChange(ing.id, e.target.value)}
                  min={0}
                  step={1}
                />
                <span className={styles.gramUnit}>g</span>
                <button
                  className={styles.stepBtn}
                  type="button"
                  onClick={() => local.setIngredientGrams(ing.id, ing.grams + 10)}
                >
                  +
                </button>
              </div>
            </div>

            {swipeOpen === ing.id && (
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
                  onClick={() => {
                    local.removeIngredient(ing.id);
                    setSwipeOpen(null);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        <button className={styles.addBtn} type="button" onClick={handleAddIngredient}>
          + Add ingredient
        </button>
      </div>

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

      <div className={styles.actions}>
        <button className={styles.cancelBtn} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.doneBtn}
          type="button"
          onClick={() => onDone(local.state, notes)}
        >
          Done
        </button>
      </div>
    </div>
  );
}
