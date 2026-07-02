"use client";

import { useMemo } from "react";
import { PintCup } from "@/components/shared/PintCup";
import { useFormulaContext } from "@/context/FormulaContext";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import type { Recipe } from "@/data/types";
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
  recipe: Recipe;
}

export function FormulaPreview({ recipe }: FormulaPreviewProps) {
  const { ratios } = useFormulaContext();

  const ingredientRows = useMemo(() => {
    const rows: { id: string; name: string; grams: number }[] = [];

    for (const mix of recipe.smartMixes) {
      if (mix.presetId === "alcohol-empty" || mix.grams <= 0) continue;
      const preset = getPresetById(mix.presetId);
      if (!preset || preset.ingredients.length === 0) continue;

      for (const { ingredientId, proportion } of preset.ingredients) {
        const grams = proportion * mix.grams;
        if (grams < 0.5) continue;
        const existing = rows.find((r) => r.id === ingredientId);
        if (existing) {
          existing.grams += grams;
        } else {
          const ing = getIngredientById(ingredientId);
          rows.push({ id: ingredientId, name: ing?.name ?? ingredientId, grams });
        }
      }
    }

    for (const ai of recipe.additionalIngredients) {
      if (ai.grams <= 0) continue;
      const ing = getIngredientById(ai.ingredientId);
      rows.push({ id: ai.ingredientId, name: ing?.name ?? ai.ingredientId, grams: ai.grams });
    }

    return rows;
  }, [recipe]);

  const totalGrams = ingredientRows.reduce((s, r) => s + r.grams, 0);

  return (
    <div className={styles.root}>
      <div className={styles.cupRow}>
        <PintCup ratios={ratios} width={240} />
      </div>

      <div className={styles.macroBreakdown}>
        {MACRO_ORDER.map((key) => {
          const pct = ratios[key as keyof typeof ratios];
          if (pct < 0.001) return null;
          const isWater = key === "water";
          return (
            <div key={key} className={styles.macroRow}>
              <span
                className={`${styles.macroSwatch} ${isWater ? styles.macroSwatchOutline : ""}`}
                style={isWater ? undefined : { background: MACRO_COLORS[key] }}
              />
              <span className={styles.macroName}>{MACRO_LABELS[key]}</span>
              <span className={styles.macroPct}>{(pct * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      {totalGrams > 0 && (
        <div className={styles.ingredientList}>
          <p className={styles.sectionLabel}>Ingredients</p>
          {ingredientRows.map((row) => (
            <div key={row.id} className={styles.ingredientRow}>
              <span className={styles.ingName}>{row.name}</span>
              <span className={styles.ingPct}>{((row.grams / totalGrams) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
