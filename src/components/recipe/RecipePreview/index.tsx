"use client";

import { useState, useCallback, useMemo } from "react";
import type { Recipe } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import styles from "./RecipePreview.module.scss";

interface RecipePreviewProps {
  recipe: Recipe;
  notes: string;
  onEdit: () => void;
  onToggleView: () => void;
  onConfig: () => void;
}

export function RecipePreview({ recipe, notes, onEdit, onToggleView, onConfig }: RecipePreviewProps) {
  // Original yield = sum of all smart mix grams + additional ingredient grams
  const originalYield = useMemo(() => {
    const smartTotal = recipe.smartMixes.reduce((s, m) => s + m.grams, 0);
    const addTotal = recipe.additionalIngredients.reduce((s, a) => s + a.grams, 0);
    return Math.round((smartTotal + addTotal) / 10) * 10 || 1000;
  }, [recipe]);

  const [displayYield, setDisplayYield] = useState(originalYield);
  const scale = displayYield / (originalYield || 1);

  const adjustYield = useCallback(
    (delta: number) => setDisplayYield((prev) => Math.max(100, prev + delta)),
    [],
  );

  return (
    <div className={styles.root}>
      <div className={styles.yieldRow}>
        <span className={styles.yieldLabel}>Yield</span>
        <div className={styles.yieldStepper}>
          <button className={styles.stepBtn} type="button" onClick={() => adjustYield(-100)}>−</button>
          <span className={styles.yieldValue}>{displayYield}g</span>
          <button className={styles.stepBtn} type="button" onClick={() => adjustYield(100)}>+</button>
        </div>
      </div>

      <div className={styles.ingredientList}>
        <p className={styles.sectionLabel}>Ingredients</p>

        {recipe.smartMixes.map((mix) => {
          if (mix.presetId === "alcohol-empty" || mix.grams === 0) return null;
          const preset = getPresetById(mix.presetId);
          if (!preset || preset.ingredients.length === 0) return null;

          return (
            <div key={mix.kind} className={styles.mixSection}>
              {preset.ingredients.length > 1 && (
                <p className={styles.mixLabel}>{preset.name}</p>
              )}
              {preset.ingredients.map(({ ingredientId, proportion }) => {
                const ing = getIngredientById(ingredientId);
                const grams = proportion * mix.grams * scale;
                return (
                  <div key={ingredientId} className={styles.ingredientRow}>
                    <span className={styles.ingName}>{ing?.name ?? ingredientId}</span>
                    <span className={styles.ingGrams}>{grams.toFixed(1)}g</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {recipe.additionalIngredients.map((ai) => {
          const ing = getIngredientById(ai.ingredientId);
          const grams = ai.grams * scale;
          return (
            <div key={ai.ingredientId} className={styles.ingredientRow}>
              <span className={styles.ingName}>{ing?.name ?? ai.ingredientId}</span>
              <span className={styles.ingGrams}>{grams.toFixed(1)}g</span>
            </div>
          );
        })}
      </div>

      {notes && (
        <div className={styles.notes}>
          <p className={styles.sectionLabel}>Notes</p>
          <p className={styles.notesText}>{notes}</p>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.toggleBtn} type="button" onClick={onToggleView}>
          Switch to Formula
        </button>
        <button className={styles.configBtn} type="button" onClick={onConfig} aria-label="Settings">
          ⚙
        </button>
        <button className={styles.editBtn} type="button" onClick={onEdit}>
          Edit recipe
        </button>
      </div>
    </div>
  );
}
