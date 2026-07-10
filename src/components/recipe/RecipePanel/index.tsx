"use client";

import { useState } from "react";
import { Egg } from "lucide-react";
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

// Common flavor additions offered as one-tap pills (skipped once already added).
const QUICK: { id: string; label: string }[] = [
  { id: "egg-yolk", label: "Yolk" },
  { id: "cocoa-powder", label: "Cocoa" },
  { id: "dark-chocolate", label: "Dark choc" },
  { id: "peanut-butter", label: "Peanut" },
];

interface RecipePanelProps {
  recipe: Recipe;
  style: string;
  yieldGrams: number;
  total: number;
  notes: string;
  onMixGrams: (presetId: string, grams: number) => void;
  onAdditionalGrams: (ingredientId: string, grams: number) => void;
  onMixNote: (presetId: string, note: string) => void;
  onAdditionalNote: (ingredientId: string, note: string) => void;
  onRemoveAdditional: (ingredientId: string) => void;
  onAddIngredient: () => void;
  onAddEggMix: () => void;
  onQuickAdd: (ingredientId: string) => void;
  onYield: (grams: number) => void;
  onNotes: (notes: string) => void;
}

// Left workspace panel: the recipe in grams, every amount editable, always live.
export function RecipePanel({
  recipe,
  style,
  yieldGrams,
  total,
  notes,
  onMixGrams,
  onAdditionalGrams,
  onMixNote,
  onAdditionalNote,
  onRemoveAdditional,
  onAddIngredient,
  onAddEggMix,
  onQuickAdd,
  onYield,
  onNotes,
}: RecipePanelProps) {
  const activeMixes = recipe.smartMixes.filter(
    (m) => (getPresetById(m.presetId)?.ingredients.length ?? 0) > 0,
  );
  const [eggBannerDismissed, setEggBannerDismissed] = useState(false);
  const present = new Set(recipe.additionalIngredients.map((a) => a.ingredientId));

  // A custard is defined by egg yolks — if the mix has none, surface it (a banner
  // below, and a one-tap "Try" recommendation). Non-destructive until tapped (D4).
  const needsEggs = style === "custard" && !recipe.smartMixes.some((m) => m.kind === "eggs");

  // "Try" recommendations. For a custard missing eggs, the yolks recommendation
  // adds the proper egg *system* (addSmartMix) rather than a raw-yolk inclusion.
  const recommendations: { key: string; label: string; onClick: () => void }[] = [];
  if (needsEggs) recommendations.push({ key: "eggs-system", label: "Egg yolks", onClick: onAddEggMix });
  for (const q of QUICK) {
    if (present.has(q.id)) continue;
    if (q.id === "egg-yolk" && needsEggs) continue; // superseded by the egg-system pill
    recommendations.push({ key: q.id, label: q.label, onClick: () => onQuickAdd(q.id) });
  }
  const shownRecs = recommendations.slice(0, 3);

  return (
    <section className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.kind}>Recipe</span>
        <span className={styles.eyebrow}>grams · drag or type</span>
      </div>

      <SectionHeader role="ingredients" label="Ingredients" />

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
        {shownRecs.length > 0 && <span className={styles.tryLabel}>Try</span>}
        {shownRecs.map((r) => (
          <Pill key={r.key} tone="ghost" size="md" onClick={r.onClick}>
            + {r.label}
          </Pill>
        ))}
      </div>

      {needsEggs && !eggBannerDismissed && (
        <div className={styles.eggBanner}>
          <Egg className={styles.eggIcon} size={17} strokeWidth={2} aria-hidden />
          <span className={styles.eggBannerText}>
            Custards are built on egg yolks — add them for a silky, coating body.
          </span>
          <button
            className={styles.eggDismiss}
            type="button"
            aria-label="Dismiss"
            onClick={() => setEggBannerDismissed(true)}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <SectionHeader role="yield" label="Batch yield" />
      <div className={styles.yieldRow}>
        <span className={styles.yieldNote}>Scale the whole recipe up or down — every gram moves together.</span>
        <GramScrubField grams={yieldGrams} onChange={onYield} />
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
