"use client";

import { useCallback } from "react";
import { useFormula } from "@/hooks/useFormula";
import { computeRatios, computeSliderBounds, type FormulaState, type MacroRatios } from "@/lib/formula-engine";
import styles from "./FormulaEdit.module.scss";

const SLIDERS: { key: keyof MacroRatios; label: string; color: string }[] = [
  { key: "fat", label: "Fat", color: "var(--color-macro-fat)" },
  { key: "sugar", label: "Sugar", color: "var(--color-macro-sugar)" },
  { key: "nonfatSolids", label: "Milk solids", color: "var(--color-macro-nonfat)" },
  { key: "stabilizer", label: "Stabilizer", color: "var(--color-macro-stabilizer)" },
  { key: "emulsifier", label: "Emulsifier", color: "var(--color-macro-emulsifier)" },
  { key: "alcohol", label: "Alcohol", color: "var(--color-macro-alcohol)" },
];

interface FormulaEditProps {
  initial: FormulaState;
  onDone: (state: FormulaState) => void;
  onCancel: () => void;
}

export function FormulaEdit({ initial, onDone, onCancel }: FormulaEditProps) {
  const local = useFormula(initial);
  const ratios = computeRatios(local.state);
  const baseRatios = computeRatios(initial);

  const handleSlider = useCallback(
    (key: keyof MacroRatios, rawValue: number) => {
      local.adjustRatio(key, rawValue / 100);
    },
    [local]
  );

  // Ingredients that are "specialty" — have more than one non-zero non-water macro
  const specialty = local.state.ingredients.filter((ing) => {
    const keys = Object.keys(ing.macros) as (keyof typeof ing.macros)[];
    const nonWaterNonZero = keys.filter((k) => k !== "water" && ing.macros[k] > 0);
    return nonWaterNonZero.length > 1;
  });

  return (
    <div className={styles.root}>
      <div className={styles.sliders}>
        {SLIDERS.map(({ key, label, color }) => {
          const [min, max] = computeSliderBounds(key, baseRatios[key]);
          const effectiveMin = min;
          const current = ratios[key];
          const currentPct = current * 100;

          return (
            <div key={key} className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>{label}</span>
                <span className={styles.sliderValue}>
                  {currentPct.toFixed(1)}%
                  {local.state.conflict && current < effectiveMin && (
                    <span className={styles.conflict}>!</span>
                  )}
                </span>
              </div>
              <div className={styles.sliderTrack} style={{ "--macro-color": color } as React.CSSProperties}>
                <input
                  type="range"
                  className={styles.slider}
                  min={effectiveMin * 100}
                  max={max * 100}
                  step={0.1}
                  value={currentPct}
                  onChange={(e) => handleSlider(key, parseFloat(e.target.value))}
                />
                <div
                  className={styles.sliderFill}
                  style={{
                    width: `${((currentPct - effectiveMin * 100) / ((max - effectiveMin) * 100)) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <div className={styles.sliderBounds}>
                <span>{(effectiveMin * 100).toFixed(0)}%</span>
                <span>{(max * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {local.state.conflict && (
        <div className={styles.conflictBanner}>
          <span className={styles.conflictMsg}>Formula is out of balance.</span>
          <button
            className={styles.rebalanceBtn}
            type="button"
            onClick={local.rebalance}
          >
            Rebalance
          </button>
        </div>
      )}

      {specialty.length > 0 && (
        <div className={styles.specialty}>
          <p className={styles.sectionLabel}>Specialty ingredients</p>
          {specialty.map((ing) => {
            const totalGrams = local.state.ingredients
              .filter((i) => i.state !== "excluded")
              .reduce((s, i) => s + i.grams, 0);
            const pct = totalGrams > 0 ? (ing.grams / totalGrams) * 100 : 0;
            return (
              <div key={ing.id} className={styles.specialtyRow}>
                <span className={styles.specialtyName}>{ing.name}</span>
                <span className={styles.specialtyPct}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.doneBtn}
          type="button"
          onClick={() => onDone(local.state)}
        >
          Done
        </button>
      </div>
    </div>
  );
}
