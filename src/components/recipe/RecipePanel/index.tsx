"use client";

import type { Recipe, SmartMix, SmartMixKind } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { GramScrubField } from "@/components/shared/GramScrubField";
import { IngredientNote } from "@/components/shared/IngredientNote";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Pill } from "@/components/shared/Pill";
import { Icon } from "@/components/shared/Icon";
import { formatGrams } from "@/lib/measure";
import styles from "./RecipePanel.module.scss";

// Sugar and stabilizer are fixed-proportion systems shown by their system label;
// every other mix shows the chosen preset's name.
const GROUPED_KINDS: SmartMixKind[] = ["sugar", "stabilizer"];
function mixLabel(mix: SmartMix): string {
  if (GROUPED_KINDS.includes(mix.kind)) return mix.label;
  return getPresetById(mix.presetId)?.name ?? mix.label;
}

interface RecipePanelProps {
  recipe: Recipe;
  yieldGrams: number;
  total: number;
  notes: string;
  onMixGrams: (presetId: string, grams: number) => void;
  onAdditionalGrams: (ingredientId: string, grams: number) => void;
  onMixNote: (presetId: string, note: string) => void;
  onAdditionalNote: (ingredientId: string, note: string) => void;
  onRemoveAdditional: (ingredientId: string) => void;
  onAddIngredient: () => void;
  onYield: (grams: number) => void;
  onNotes: (notes: string) => void;
}

// Left workspace panel: the recipe in grams, every amount editable, always live.
export function RecipePanel({
  recipe,
  yieldGrams,
  total,
  notes,
  onMixGrams,
  onAdditionalGrams,
  onMixNote,
  onAdditionalNote,
  onRemoveAdditional,
  onAddIngredient,
  onYield,
  onNotes,
}: RecipePanelProps) {
  const activeMixes = recipe.smartMixes.filter(
    (m) => (getPresetById(m.presetId)?.ingredients.length ?? 0) > 0,
  );
  const count = activeMixes.length + recipe.additionalIngredients.length;

  return (
    <section className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.kind}>Recipe</span>
        <span className={styles.eyebrow}>grams · drag or type</span>
      </div>

      <SectionHeader role="ingredients" label={`Ingredients — ${count}`} />

      {activeMixes.map((mix) => (
        <div key={mix.presetId} className={styles.row}>
          <div className={styles.main}>
            <span className={styles.name}>{mixLabel(mix)}</span>
            <IngredientNote value={mix.note ?? ""} onChange={(n) => onMixNote(mix.presetId, n)} />
          </div>
          <GramScrubField grams={mix.grams} onChange={(g) => onMixGrams(mix.presetId, g)} />
        </div>
      ))}

      {recipe.additionalIngredients.map((ai) => {
        const label = getIngredientById(ai.ingredientId)?.name ?? ai.ingredientId;
        return (
          <div key={ai.ingredientId} className={styles.row}>
            <div className={styles.main}>
              <span className={styles.name}>{label}</span>
              <IngredientNote value={ai.note ?? ""} onChange={(n) => onAdditionalNote(ai.ingredientId, n)} />
            </div>
            <GramScrubField grams={ai.grams} onChange={(g) => onAdditionalGrams(ai.ingredientId, g)} />
            <button
              className={styles.remove}
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => onRemoveAdditional(ai.ingredientId)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        );
      })}

      <div className={styles.addRow}>
        <Pill tone="accent" size="md" onClick={onAddIngredient}>
          <Icon name="plus" size={16} /> Add ingredient
        </Pill>
      </div>

      <SectionHeader role="yield" label="Batch yield" />
      <div className={styles.yieldRow}>
        <span className={styles.yieldNote}>Scale the whole recipe up or down — every gram moves together.</span>
        <GramScrubField grams={yieldGrams} onChange={onYield} step={50} />
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalKey}>Total mix</span>
        <span className={styles.totalVal}>{formatGrams(total)}</span>
      </div>

      <SectionHeader role="notes" label="Notes" />
      <textarea
        className={styles.notes}
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="Process notes, variations, tips…"
        rows={3}
      />
    </section>
  );
}
