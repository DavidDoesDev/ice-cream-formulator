"use client";

import { PintCup } from "@/components/shared/PintCup";
import { useFormulaContext } from "@/context/FormulaContext";
import styles from "./FormulaPreview.module.scss";

const MACRO_LABELS: Record<string, string> = {
  fat: "Fat",
  sugar: "Sugar",
  nonfatSolids: "Milk solids",
  stabilizer: "Stabilizer",
  emulsifier: "Emulsifier",
  alcohol: "Alcohol",
  water: "Water",
};

const MACRO_COLORS: Record<string, string> = {
  fat: "var(--color-macro-fat)",
  sugar: "var(--color-macro-sugar)",
  nonfatSolids: "var(--color-macro-nonfat)",
  stabilizer: "var(--color-macro-stabilizer)",
  emulsifier: "var(--color-macro-emulsifier)",
  alcohol: "var(--color-macro-alcohol)",
  water: "var(--color-bg)",
};

const MACRO_ORDER = ["fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier", "alcohol", "water"];

interface FormulaPreviewProps {
  onEdit: () => void;
  onToggleView: () => void;
  onConfig: () => void;
}

export function FormulaPreview({ onEdit, onToggleView, onConfig }: FormulaPreviewProps) {
  const { state, ratios } = useFormulaContext();

  const included = state.ingredients.filter((i) => i.state !== "excluded");
  const totalGrams = included.reduce((s, i) => s + i.grams, 0);

  return (
    <div className={styles.root}>
      <div className={styles.cupRow}>
        <PintCup ratios={ratios} size="full" />
      </div>

      <div className={styles.macroBreakdown}>
        {MACRO_ORDER.map((key) => {
          const pct = ratios[key as keyof typeof ratios];
          if (pct < 0.001) return null;
          return (
            <div key={key} className={styles.macroRow}>
              <span className={styles.macroSwatch} style={{ background: MACRO_COLORS[key] }} />
              <span className={styles.macroName}>{MACRO_LABELS[key]}</span>
              <span className={styles.macroBar}>
                <span
                  className={styles.macroFill}
                  style={{ width: `${pct * 100}%`, background: MACRO_COLORS[key] }}
                />
              </span>
              <span className={styles.macroPct}>{(pct * 100).toFixed(1)}% of mix</span>
            </div>
          );
        })}
      </div>

      {totalGrams > 0 && (
        <div className={styles.ingredientList}>
          <p className={styles.sectionLabel}>Ingredients</p>
          {included.map((ing) => {
            const pct = (ing.grams / totalGrams) * 100;
            return (
              <div key={ing.id} className={styles.ingredientRow}>
                <span className={styles.ingName}>{ing.name}</span>
                <span className={styles.ingPct}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.toggleBtn} type="button" onClick={onToggleView}>
          Switch to Recipe
        </button>
        <button className={styles.configBtn} type="button" onClick={onConfig} aria-label="Settings">
          ⚙
        </button>
        <button className={styles.editBtn} type="button" onClick={onEdit}>
          Edit formula
        </button>
      </div>
    </div>
  );
}
