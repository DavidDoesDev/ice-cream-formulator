"use client";

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useFormula } from "@/hooks/useFormula";
import { computeRatios, computeSliderBounds, type FormulaState, type MacroRatios } from "@/lib/formula-engine";
import { solveRecipe } from "@/lib/recipe-solver";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatPercent } from "@/lib/measure";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { IngredientNote } from "@/components/shared/IngredientNote";
import type { Ingredient } from "@/lib/formula-engine";
import type { Recipe, SmartMixKind, AdditionalIngredient } from "@/data/types";
import styles from "./FormulaEdit.module.scss";

const SPECIFIC_MAX_PCT = 50; // slider ceiling for a specific ingredient's share

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
  onOpenIngredientSelector: (onAdd: (ingredient: Ingredient) => void) => void;
}

export interface FormulaEditHandle {
  commit: () => void;
}

export const FormulaEdit = forwardRef<FormulaEditHandle, FormulaEditProps>(
  function FormulaEdit({ initial, recipe, onDone, onOpenIngredientSelector }, ref) {
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

    // --- Specific (additional) ingredients ---
    // Each slider sets the ingredient's share of the yield; on release the solver
    // re-balances the smart mixes around it while holding the macro targets.
    const setSpecificProportion = useCallback((ingredientId: string, pct: number) => {
      const grams = Math.max(0, (pct / 100) * local.state.yieldGrams);
      setLocalRecipe((prev) => ({
        ...prev,
        additionalIngredients: prev.additionalIngredients.map((a) =>
          a.ingredientId === ingredientId ? { ...a, grams } : a,
        ),
      }));
    }, [local.state.yieldGrams]);

    const commitSpecific = useCallback((ingredientId: string, pct: number) => {
      const yieldG = local.state.yieldGrams;
      const grams = Math.max(0, (pct / 100) * yieldG);
      const targets = computeRatios(local.state);
      setLocalRecipe((prev) => {
        const additionals = prev.additionalIngredients.map((a) =>
          a.ingredientId === ingredientId ? { ...a, grams } : a,
        );
        const solved = solveRecipe(
          targets, yieldG, additionals, prev.smartMixes,
          getPresetById, (id) => getIngredientById(id)?.macros,
        );
        return { ...prev, smartMixes: solved, additionalIngredients: additionals };
      });
    }, [local.state]);

    const setSpecificNote = useCallback((ingredientId: string, note: string) => {
      setLocalRecipe((prev) => ({
        ...prev,
        additionalIngredients: prev.additionalIngredients.map((a) =>
          a.ingredientId === ingredientId ? { ...a, note } : a,
        ),
      }));
    }, []);

    const handleAddSpecific = useCallback(() => {
      onOpenIngredientSelector((ing: Ingredient) => {
        const yieldG = local.state.yieldGrams;
        const targets = computeRatios(local.state);
        setLocalRecipe((prev) => {
          const item: AdditionalIngredient = { ingredientId: ing.id, grams: ing.grams };
          const additionals = [
            ...prev.additionalIngredients.filter((a) => a.ingredientId !== ing.id),
            item,
          ];
          const solved = solveRecipe(
            targets, yieldG, additionals, prev.smartMixes,
            getPresetById, (id) => getIngredientById(id)?.macros,
          );
          return { ...prev, smartMixes: solved, additionalIngredients: additionals };
        });
      });
    }, [onOpenIngredientSelector, local.state]);

    const specifics = localRecipe.additionalIngredients;

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

        <div className={styles.specific}>
          <SectionHeader role="specific" label="Specific Ingredients" />
          {specifics.map((ai) => {
            const ing = getIngredientById(ai.ingredientId);
            const yieldG = local.state.yieldGrams || 1;
            const pct = Math.min(SPECIFIC_MAX_PCT, (ai.grams / yieldG) * 100);
            const fillPct = Math.max(0, Math.min(100, (pct / SPECIFIC_MAX_PCT) * 100));
            return (
              <div key={ai.ingredientId} className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>{ing?.name ?? ai.ingredientId}</span>
                  <span className={styles.sliderValue}>{formatPercent(pct)}%</span>
                </div>
                <div className={styles.sliderTrack}>
                  <div className={styles.sliderFillGlow} style={{ width: `${fillPct}%` }} />
                  <input
                    type="range"
                    className={styles.slider}
                    min={0}
                    max={SPECIFIC_MAX_PCT}
                    step="any"
                    value={pct}
                    onChange={(e) => setSpecificProportion(ai.ingredientId, parseFloat(e.target.value))}
                    onPointerUp={(e) => commitSpecific(ai.ingredientId, parseFloat(e.currentTarget.value))}
                  />
                  <div className={styles.sliderFillWrap}>
                    <div className={styles.sliderFill} style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }} />
                  </div>
                </div>
                <IngredientNote
                  value={ai.note ?? ""}
                  onChange={(n) => setSpecificNote(ai.ingredientId, n)}
                />
              </div>
            );
          })}
          <button className={styles.addBtn} type="button" onClick={handleAddSpecific}>
            Add ingredient
          </button>
        </div>
      </div>
    );
  }
);
