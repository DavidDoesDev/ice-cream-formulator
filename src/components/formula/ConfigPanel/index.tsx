"use client";

import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Milk, GlassWater, Wine, MapPin, Waypoints, Droplets } from "lucide-react";
import type { StyleCategory, SmartMixKind, Recipe } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { getPresetsByKind, getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatPercent } from "@/lib/measure";
import { SectionHeader } from "@/components/shared/SectionHeader";
import styles from "./ConfigPanel.module.scss";

const STYLE_OPTIONS: { value: StyleCategory; label: string }[] = [
  { value: "philadelphia", label: "Philadelphia" },
  { value: "custard", label: "French Custard" },
  { value: "gelato", label: "Gelato" },
  { value: "sorbet", label: "Sorbet" },
  { value: "sherbet", label: "Sherbet" },
  { value: "vegan", label: "Vegan" },
];

const MIX_CONFIG_KINDS: {
  kind: SmartMixKind;
  label: string;
  icon: LucideIcon;
  custardGelato?: boolean;
}[] = [
  { kind: "milk", label: "Milk base", icon: Milk },
  { kind: "sugar", label: "Sugar system", icon: MapPin },
  { kind: "stabilizer", label: "Stabilizer system", icon: Waypoints },
  { kind: "eggs", label: "Egg mix", icon: GlassWater, custardGelato: true },
  { kind: "alcohol", label: "Alcohol", icon: Wine },
  { kind: "emulsifier", label: "Emulsifier", icon: Droplets },
];

interface ConfigPanelProps {
  formulaName: string;
  formulaStyle: string;
  recipe: Recipe;
  onNameChange: (name: string) => void;
  onStyleChange: (style: string) => void;
  onPresetChange: (kind: SmartMixKind, presetId: string) => void;
  onOpenIngredientSelector: (context: string, onAdd: (ingredient: Ingredient) => void) => void;
}

export function ConfigPanel({
  formulaName,
  formulaStyle,
  recipe,
  onNameChange,
  onStyleChange,
  onPresetChange,
  onOpenIngredientSelector,
}: ConfigPanelProps) {
  const [name, setName] = useState(formulaName);
  const [style, setStyle] = useState(formulaStyle);

  const handleNameBlur = useCallback(() => {
    if (name.trim()) onNameChange(name.trim());
  }, [name, onNameChange]);

  const handleStyleChange = useCallback(
    (val: string) => {
      setStyle(val);
      onStyleChange(val);
    },
    [onStyleChange],
  );

  const currentPresetId = (kind: SmartMixKind): string => {
    const mix = recipe.smartMixes.find((m) => m.kind === kind);
    return mix?.presetId ?? "";
  };

  const showAlcohol = recipe.smartMixes.some(
    (m) => m.kind === "alcohol" && m.presetId !== "alcohol-empty",
  );
  const showEmulsifier = recipe.smartMixes.some(
    (m) => m.kind === "emulsifier" && m.presetId !== "emulsifier-empty",
  );

  const mixRows = MIX_CONFIG_KINDS.filter(({ kind, custardGelato }) => {
    if (custardGelato && style !== "custard" && style !== "gelato") return false;
    if (kind === "alcohol" && !showAlcohol) return false;
    if (kind === "emulsifier" && !showEmulsifier) return false;
    if (kind === "liquid") return false;
    return getPresetsByKind(kind).length > 0;
  });

  return (
    <div className={styles.root}>
      <div className={styles.sections}>
        <div className={styles.section}>
          <label className={styles.fieldLabel} htmlFor="formula-name">Name</label>
          <input
            id="formula-name"
            className={styles.textInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
          />
        </div>

        <div className={styles.section}>
          <p className={styles.fieldLabel}>Recipe type</p>
          <div className={styles.styleGrid}>
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.styleBtn} ${style === opt.value ? styles.styleBtnActive : ""}`}
                type="button"
                onClick={() => handleStyleChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <SectionHeader role="specific" label="Smart Ingredients" />
          <div className={styles.mixRows}>
            {mixRows.map(({ kind, label, icon: Icon }) => {
              const activePresetId = currentPresetId(kind);
              const activePreset = getPresetById(activePresetId);
              const breakdown = activePreset && activePreset.ingredients.length > 1
                ? activePreset.ingredients
                : [];
              return (
                <div key={kind} className={styles.mixEntry}>
                  <div className={styles.mixRow}>
                    <Icon className={styles.mixIcon} size={17} strokeWidth={2} aria-hidden />
                    <label className={styles.mixLabel} htmlFor={`mix-${kind}`}>{label}</label>
                    <select
                      id={`mix-${kind}`}
                      className={styles.select}
                      value={activePresetId}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          onPresetChange(kind, e.target.value);
                        } else {
                          onOpenIngredientSelector(`${kind}-mix`, () => {});
                        }
                      }}
                    >
                      {getPresetsByKind(kind).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="custom">Custom…</option>
                    </select>
                  </div>
                  {breakdown.length > 0 && (
                    <div className={styles.breakdown}>
                      {breakdown.map(({ ingredientId, proportion }) => (
                        <div key={ingredientId} className={styles.breakdownRow}>
                          <span className={styles.breakdownName}>
                            {getIngredientById(ingredientId)?.name ?? ingredientId}
                          </span>
                          <span className={styles.breakdownPct}>
                            {formatPercent(proportion * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
