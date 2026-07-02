"use client";

import { useMemo } from "react";
import { PintCup } from "@/components/shared/PintCup";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useFormulaContext } from "@/context/FormulaContext";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatPercent } from "@/lib/measure";
import type { Recipe } from "@/data/types";
import styles from "./FormulaPreview.module.scss";

// Fat first; water omitted. Labels are the design's standard forms, uppercased via CSS.
const MACRO_LABELS: Record<string, string> = {
  fat: "Fat",
  sugar: "Sugar",
  nonfatSolids: "Nonfat Solids",
  stabilizer: "Stabilizer",
  emulsifier: "Emulsifier",
  alcohol: "Alcohol",
};

const MACRO_COLORS: Record<string, string> = {
  fat: "var(--color-macro-fat)",
  sugar: "var(--color-macro-sugar)",
  nonfatSolids: "var(--color-macro-nonfat)",
  stabilizer: "var(--color-macro-stabilizer)",
  emulsifier: "var(--color-macro-emulsifier)",
  alcohol: "var(--color-macro-alcohol)",
};

const MACRO_ORDER = ["fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier", "alcohol"];

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
      <div className={styles.composition}>
        <SectionHeader role="composition" label="Composition" />
        <div className={styles.cupRow}>
          <PintCup ratios={ratios} width={240} />
        </div>

        <div className={styles.macroGrid}>
          {MACRO_ORDER.map((key) => {
            const pct = ratios[key as keyof typeof ratios] * 100;
            if (pct < 0.001) return null;
            return (
              <div key={key} className={styles.macroCell}>
                <span
                  className={styles.macroSwatch}
                  style={{ background: MACRO_COLORS[key] }}
                />
                <span className={styles.macroPct}>{formatPercent(pct)}%</span>
                <span className={styles.macroName}>{MACRO_LABELS[key]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {totalGrams > 0 && (
        <div className={styles.ingredientList}>
          <SectionHeader role="ingredients" label="Ingredients" />
          {ingredientRows.map((row) => (
            <div key={row.id} className={styles.ingredientRow}>
              <span className={styles.ingName}>{row.name}</span>
              <span className={styles.ingPct}>
                {formatPercent((row.grams / totalGrams) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
