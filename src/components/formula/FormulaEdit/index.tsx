"use client";

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useFormula } from "@/hooks/useFormula";
import { computeRatios, computeSliderBounds, type FormulaState, type MacroRatios } from "@/lib/formula-engine";
import { solveRecipe } from "@/lib/recipe-solver";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatPercent } from "@/lib/measure";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Recipe, SmartMixKind } from "@/data/types";
import styles from "./FormulaEdit.module.scss";

const SLIDERS: { key: keyof MacroRatios; label: string }[] = [
  { key: "fat", label: "Fat" },
  { key: "sugar", label: "Sugar" },
  { key: "nonfatSolids", label: "Nonfat solids" },
  { key: "stabilizer", label: "Stabilizer" },
  { key: "emulsifier", label: "Emulsifier" },
  { key: "alcohol", label: "Alcohol" },
];

// Slider snap granularity, in percentage points. Micro-macros snap 10× finer so
// they're expressive across their narrow range rather than jumping by 0.1%.
const SLIDER_STEP: Record<string, number> = {
  fat: 0.1,
  sugar: 0.1,
  nonfatSolids: 0.1,
  alcohol: 0.1,
  stabilizer: 0.01,
  emulsifier: 0.01,
};

function snapPct(key: string, pct: number): number {
  const step = SLIDER_STEP[key] ?? 0.1;
  return Math.round(pct / step) * step;
}

// Macros whose recipe mix is empty by default and auto-activates a default
// ingredient when its slider first crosses above zero.
const AUTO_ACTIVATE: Partial<Record<keyof MacroRatios, { kind: SmartMixKind; label: string; empty: string; default: string }>> = {
  alcohol: { kind: "alcohol", label: "Alcohol", empty: "alcohol-empty", default: "alcohol-vodka" },
  emulsifier: { kind: "emulsifier", label: "Emulsifier", empty: "emulsifier-empty", default: "emulsifier-lecithin" },
};

interface FormulaEditProps {
  initial: FormulaState;
  recipe: Recipe;
  onDone: (state: FormulaState, recipe: Recipe) => void;
}

export interface FormulaEditHandle {
  commit: () => void;
}

export const FormulaEdit = forwardRef<FormulaEditHandle, FormulaEditProps>(
  function FormulaEdit({ initial, recipe, onDone }, ref) {
    const local = useFormula(initial);
    const [localRecipe, setLocalRecipe] = useState(recipe);
    // Raw drag position for the active slider — drives smooth thumb and fill motion.
    // Cleared on pointer-up; fill then springs from raw → committed via CSS.
    const [dragVisual, setDragVisual] = useState<{ key: string; pct: number } | null>(null);
    // Which slider is mid-spring (just released). Spring transition is enabled only here;
    // all other fills update instantly so they stay in contact with their thumb.
    const [springKey, setSpringKey] = useState<string | null>(null);
    const springTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ratios = computeRatios(local.state);
    const baseRatios = computeRatios(initial);

    useImperativeHandle(ref, () => ({
      commit: () => onDone(local.state, localRecipe),
    }), [local.state, localRecipe, onDone]);

    const handleSlider = useCallback(
      (key: keyof MacroRatios, rawValue: number) => {
        local.adjustRatio(key, rawValue / 100);
      },
      [local],
    );

    // Run solver when a slider is committed (pointer released).
    // finalPct is the slider's value at release (percentage × 100).
    // We override the committed key in the current ratios so the solver
    // reflects the committed value even if React state is 1 tick stale.
    const handleSliderCommit = useCallback(
      (key: keyof MacroRatios, finalPct: number) => {
        const baseRatiosNow = computeRatios(local.state);
        const committed: MacroRatios = { ...baseRatiosNow, [key]: finalPct / 100 };

        // Auto-activate a default ingredient when an empty-by-default mix's slider
        // first crosses above zero (alcohol → vodka, emulsifier → soy lecithin).
        // Appends the mix if the recipe predates it (older saved formulas).
        const auto = AUTO_ACTIVATE[key];
        let mixesToSolve = localRecipe.smartMixes;
        if (auto && finalPct > 0) {
          if (mixesToSolve.some((m) => m.kind === auto.kind)) {
            mixesToSolve = mixesToSolve.map((m) =>
              m.kind === auto.kind && m.presetId === auto.empty
                ? { ...m, presetId: auto.default }
                : m,
            );
          } else {
            mixesToSolve = [
              ...mixesToSolve,
              { kind: auto.kind, label: auto.label, presetId: auto.default, grams: 0 },
            ];
          }
        }

        const solved = solveRecipe(
          committed,
          local.state.yieldGrams,
          localRecipe.additionalIngredients,
          mixesToSolve,
          getPresetById,
          (id) => getIngredientById(id)?.macros,
        );
        setLocalRecipe((prev) => ({ ...prev, smartMixes: solved }));
      },
      [local.state, localRecipe],
    );

    const specialty = local.state.ingredients.filter((ing) => {
      const keys = Object.keys(ing.macros) as (keyof typeof ing.macros)[];
      const nonWaterNonZero = keys.filter((k) => k !== "water" && ing.macros[k] > 0);
      return nonWaterNonZero.length > 1;
    });

    return (
      <div className={styles.root}>
        <SectionHeader role="composition" label="Composition" />
        <div className={styles.sliders}>
          {SLIDERS.map(({ key, label }) => {
            const [min, max] = computeSliderBounds(key, baseRatios[key]);
            const effectiveMin = min;
            const current = ratios[key];
            const currentPct = current * 100;

            const clampedPct = Math.min(currentPct, max * 100);

            // During drag: show raw pointer position (smooth thumb + fill).
            // After release: revert to committed value so fill springs to snapped position.
            const isDraggingThis = dragVisual?.key === key;
            const displayPct = isDraggingThis ? dragVisual!.pct : clampedPct;

            const fillPct = max > effectiveMin
              ? Math.max(0, Math.min(100, ((displayPct - effectiveMin * 100) / ((max - effectiveMin) * 100)) * 100))
              : 0;

            return (
              <div key={key} className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>{label}</span>
                  <span className={styles.sliderValue}>
                    {formatPercent(currentPct)}%
                    {local.state.conflict && current < effectiveMin && (
                      <span className={styles.conflict}>!</span>
                    )}
                  </span>
                </div>
                <div className={styles.sliderTrack}>
                  <div
                    className={styles.sliderFillGlow}
                    style={{
                      width: `${fillPct}%`,
                      transition: (!isDraggingThis && springKey === key)
                        ? "width 0.35s var(--ease-jelly)"
                        : "none",
                    }}
                  />
                  <input
                    type="range"
                    className={styles.slider}
                    min={effectiveMin * 100}
                    max={max * 100}
                    step="any"
                    value={displayPct}
                    onPointerDown={() => setDragVisual({ key, pct: clampedPct })}
                    onChange={(e) => {
                      const raw = parseFloat(e.target.value);
                      setDragVisual({ key, pct: raw });
                      handleSlider(key, snapPct(key, raw));
                    }}
                    onPointerUp={(e) => {
                      const raw = parseFloat(e.currentTarget.value);
                      setDragVisual(null);
                      setSpringKey(key);
                      if (springTimerRef.current) clearTimeout(springTimerRef.current);
                      springTimerRef.current = setTimeout(() => setSpringKey(null), 350);
                      handleSliderCommit(key, snapPct(key, raw));
                    }}
                  />
                  <div className={styles.sliderFillWrap}>
                    <div
                      className={styles.sliderFill}
                      style={{
                        clipPath: `inset(0 ${100 - fillPct}% 0 0)`,
                        transition: (!isDraggingThis && springKey === key)
                          ? "clip-path 0.35s var(--ease-jelly)"
                          : "none",
                      }}
                    />
                  </div>
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
      </div>
    );
  }
);
