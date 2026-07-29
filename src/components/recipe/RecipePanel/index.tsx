"use client";

import { Plus, Sparkles } from "lucide-react";
import type { Recipe, SmartMix, SmartMixKind } from "@/data/types";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { GramScrubField } from "@/components/shared/GramScrubField";
import { InlineNote } from "@/components/ui/InlineNote";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LineItem } from "@/components/ui/LineItem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/shared/Icon";
import { formatGrams } from "@/lib/measure";
import styles from "./RecipePanel.module.scss";

// Sugar and stabilizer are shown by their canonical blend label (their internal
// proportions live in the read-only breakdown); every other mix shows the chosen
// preset's name.
const BLEND_LABEL: Partial<Record<SmartMixKind, string>> = {
  sugar: "Sugar blend",
  stabilizer: "Stabilizer blend",
};
function mixLabel(mix: SmartMix): string {
  return BLEND_LABEL[mix.kind] ?? getPresetById(mix.presetId)?.name ?? mix.label;
}

// Common flavor additions offered as one-tap chips (skipped once already added).
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

// The recipe in grams — every amount editable, always live.
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

  // Every ingredient the recipe actually contains — so we never recommend one
  // that's already in (#74).
  const present = new Set<string>(recipe.additionalIngredients.map((a) => a.ingredientId));
  for (const m of recipe.smartMixes) {
    getPresetById(m.presetId)?.ingredients.forEach((ing) => present.add(ing.ingredientId));
  }

  const needsEggs = style === "custard" && !recipe.smartMixes.some((m) => m.kind === "eggs");

  const recommendations: { key: string; label: string; onClick: () => void }[] = [];
  if (needsEggs) recommendations.push({ key: "eggs-system", label: "Yolks", onClick: onAddEggMix });
  for (const q of QUICK) {
    if (present.has(q.id)) continue;
    if (q.id === "egg-yolk" && needsEggs) continue; // superseded by the egg-system chip
    recommendations.push({ key: q.id, label: q.label, onClick: () => onQuickAdd(q.id) });
  }
  const shownRecs = recommendations.slice(0, 3);

  return (
    <section className={styles.panel}>
      <h2 className={styles.kind}>Recipe</h2>

      <SectionHeader label="Ingredients" />

      {activeMixes.map((mix) => {
        const subs = getPresetById(mix.presetId)?.ingredients ?? [];
        const breakdown = subs.length > 1 ? subs : [];
        return (
          <div key={mix.presetId}>
            <LineItem
              label={mixLabel(mix)}
              note={<InlineNote value={mix.note ?? ""} onChange={(n) => onMixNote(mix.presetId, n)} />}
              trailing={<GramScrubField grams={mix.grams} onChange={(g) => onMixGrams(mix.presetId, g)} />}
            />
            {breakdown.map((s) => (
              <LineItem
                key={s.ingredientId}
                indent
                size="sm"
                label={getIngredientById(s.ingredientId)?.name ?? s.ingredientId}
                trailing={
                  <span className={styles.subGrams}>
                    {formatGrams(mix.grams * s.proportion)}
                    <span className={styles.subUnit}> g</span>
                  </span>
                }
              />
            ))}
          </div>
        );
      })}

      {recipe.additionalIngredients.map((ai) => {
        const label = getIngredientById(ai.ingredientId)?.name ?? ai.ingredientId;
        return (
          <LineItem
            key={ai.ingredientId}
            label={label}
            note={<InlineNote value={ai.note ?? ""} onChange={(n) => onAdditionalNote(ai.ingredientId, n)} />}
            trailing={
              <>
                <GramScrubField grams={ai.grams} onChange={(g) => onAdditionalGrams(ai.ingredientId, g)} />
                <button
                  className={styles.remove}
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemoveAdditional(ai.ingredientId)}
                >
                  <Icon name="close" size={16} />
                </button>
              </>
            }
          />
        );
      })}

      {needsEggs && (
        <Callout tone="ok" icon={<Sparkles size={16} />}>
          Custards are built on egg yolks — add them for a silky, coating body.
        </Callout>
      )}

      <div className={styles.addRow}>
        {shownRecs.map((r) => (
          <Button key={r.key} hierarchy="tertiary" size="sm" icon={<Plus size={14} />} onClick={r.onClick}>
            {r.label}
          </Button>
        ))}
        <Button hierarchy="tertiary" size="sm" icon={<Plus size={14} />} onClick={onAddIngredient}>
          Something else…
        </Button>
      </div>

      <SectionHeader label="Batch yield" className={styles.sectionGap} />
      <div className={styles.yieldRow}>
        <span className={styles.yieldNote}>Scale the whole recipe up or down.</span>
        <GramScrubField grams={yieldGrams} onChange={onYield} />
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalKey}>Total mix</span>
        <span className={styles.totalVal}>
          {formatGrams(total)} <span className={styles.totalUnit}>g</span>
        </span>
      </div>

      <SectionHeader label="Notes" className={styles.sectionGap} />
      <Input
        multiline
        className={styles.notesField}
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="Process notes, variations, tips…"
        rows={4}
      />
    </section>
  );
}
