"use client";

import { useState, useCallback } from "react";
import { useFormulaContext } from "@/context/FormulaContext";
import { setYield } from "@/lib/formula-engine";
import styles from "./RecipePreview.module.scss";

interface RecipePreviewProps {
  notes: string;
  onEdit: () => void;
  onToggleView: () => void;
  onConfig: () => void;
}

export function RecipePreview({ notes, onEdit, onToggleView, onConfig }: RecipePreviewProps) {
  const { state, setYield: setCtxYield } = useFormulaContext();
  const totalGrams = state.ingredients.reduce((s, i) => s + i.grams, 0);
  const displayYield = Math.round(totalGrams / 10) * 10 || state.yieldGrams;

  const adjustYield = useCallback(
    (delta: number) => {
      const next = Math.max(100, displayYield + delta);
      setCtxYield(next);
    },
    [displayYield, setCtxYield]
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
        {state.ingredients.map((ing) => (
          <div
            key={ing.id}
            className={`${styles.ingredientRow} ${ing.state === "excluded" ? styles.excluded : ""}`}
          >
            <span className={styles.ingName}>
              {ing.name}
              {ing.state === "excluded" && <span className={styles.excludedTag}>excluded</span>}
              {ing.state === "pinned" && <span className={styles.pinnedTag}>pinned</span>}
            </span>
            <span className={styles.ingGrams}>{ing.grams.toFixed(1)}g</span>
          </div>
        ))}
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
