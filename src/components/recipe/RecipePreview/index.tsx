"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import type { Recipe } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatGrams } from "@/lib/measure";
import { SectionHeader } from "@/components/shared/SectionHeader";
import styles from "./RecipePreview.module.scss";

const YIELD_MIN = 100;
const YIELD_STEP = 100;
const SCRUB_G_PER_PX = 5;   // vertical drag sensitivity
const SCRUB_SNAP = 5;       // round scrubbed value to nearest 5g

interface RecipePreviewProps {
  recipe: Recipe;
  notes: string;
}

export function RecipePreview({ recipe, notes }: RecipePreviewProps) {
  const originalYield = useMemo(() => {
    const smartTotal = recipe.smartMixes.reduce((s, m) => s + m.grams, 0);
    const addTotal = recipe.additionalIngredients.reduce((s, a) => s + a.grams, 0);
    return Math.round((smartTotal + addTotal) / 10) * 10 || 1000;
  }, [recipe]);

  const [displayYield, setDisplayYield] = useState(originalYield);
  const scale = displayYield / (originalYield || 1);

  const adjustYield = useCallback(
    (delta: number) => setDisplayYield((prev) => Math.max(YIELD_MIN, prev + delta)),
    [],
  );

  // Vertical scrub: drag up to increase, down to decrease.
  const drag = useRef<{ startY: number; startYield: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startYield: displayYield };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Suppress text selection across the page for the duration of the scrub.
    document.body.style.userSelect = "none";
  }, [displayYield]);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = drag.current.startY - e.clientY; // up is positive
    const raw = drag.current.startYield + dy * SCRUB_G_PER_PX;
    setDisplayYield(Math.max(YIELD_MIN, Math.round(raw / SCRUB_SNAP) * SCRUB_SNAP));
  }, []);
  const endDrag = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    document.body.style.userSelect = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Safety: if unmounted mid-drag, restore selection.
  useEffect(() => () => { document.body.style.userSelect = ""; }, []);

  // Flatten every mix + addition to individual ingredients, merged and scaled.
  const rows = useMemo(() => {
    const acc: { id: string; name: string; grams: number }[] = [];
    const add = (id: string, grams: number) => {
      if (grams <= 0) return;
      const existing = acc.find((r) => r.id === id);
      if (existing) existing.grams += grams;
      else acc.push({ id, name: getIngredientById(id)?.name ?? id, grams });
    };
    for (const mix of recipe.smartMixes) {
      const preset = getPresetById(mix.presetId);
      if (!preset) continue;
      for (const { ingredientId, proportion } of preset.ingredients) {
        add(ingredientId, proportion * mix.grams);
      }
    }
    for (const ai of recipe.additionalIngredients) add(ai.ingredientId, ai.grams);
    return acc;
  }, [recipe]);

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <SectionHeader role="yield" label="Yield" />
        <div className={styles.yield}>
          <button
            className={styles.stepBtn}
            type="button"
            onClick={() => adjustYield(-YIELD_STEP)}
            aria-label="Decrease yield"
          >
            −
          </button>
          <span
            className={styles.yieldValue}
            role="slider"
            aria-label="Yield in grams — drag up or down to change"
            aria-valuenow={displayYield}
            aria-valuemin={YIELD_MIN}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <ChevronsUpDown className={styles.yieldIcon} size={22} strokeWidth={2} aria-hidden />
            {formatGrams(displayYield)}g
          </span>
          <button
            className={styles.stepBtn}
            type="button"
            onClick={() => adjustYield(YIELD_STEP)}
            aria-label="Increase yield"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeader role="ingredients" label="Ingredients" />
        <div className={styles.ingredientList}>
          {rows.map((row) => (
            <div key={row.id} className={styles.ingredientRow}>
              <span className={styles.ingName}>{row.name}</span>
              <span className={styles.ingGrams}>{formatGrams(row.grams * scale)}g</span>
            </div>
          ))}
        </div>
      </div>

      {notes && (
        <div className={styles.section}>
          <SectionHeader role="notes" label="Notes" />
          <p className={styles.notesText}>{notes}</p>
        </div>
      )}
    </div>
  );
}
