"use client";

import { useState, useCallback } from "react";
import type { StyleCategory, SmartMixKind, Recipe } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { getPresetsByKind } from "@/data/mix-presets";
import styles from "./ConfigPanel.module.scss";

const STYLE_OPTIONS: { value: StyleCategory; label: string }[] = [
  { value: "philadelphia", label: "Philadelphia" },
  { value: "custard", label: "French Custard" },
  { value: "gelato", label: "Gelato" },
  { value: "sorbet", label: "Sorbet" },
  { value: "sherbet", label: "Sherbet" },
  { value: "vegan", label: "Vegan" },
];

const MIX_CONFIG_KINDS: { kind: SmartMixKind; label: string; custardGelato?: boolean }[] = [
  { kind: "milk", label: "Milk base" },
  { kind: "sugar", label: "Sugar system" },
  { kind: "stabilizer", label: "Stabilizer system" },
  { kind: "eggs", label: "Egg mix", custardGelato: true },
  { kind: "alcohol", label: "Alcohol" },
];

interface ConfigPanelProps {
  formulaName: string;
  formulaStyle: string;
  recipe: Recipe;
  onNameChange: (name: string) => void;
  onStyleChange: (style: string) => void;
  onPresetChange: (kind: SmartMixKind, presetId: string) => void;
  onBack: () => void;
  onOpenIngredientSelector: (context: string, onAdd: (ingredient: Ingredient) => void) => void;
}

export function ConfigPanel({
  formulaName,
  formulaStyle,
  recipe,
  onNameChange,
  onStyleChange,
  onPresetChange,
  onBack,
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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={onBack}>
          ← Back
        </button>
        <h2 className={styles.title}>Settings</h2>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <label className={styles.fieldLabel} htmlFor="formula-name">Formula name</label>
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

        {MIX_CONFIG_KINDS.map(({ kind, label, custardGelato }) => {
          if (custardGelato && style !== "custard" && style !== "gelato") return null;
          if (kind === "alcohol" && !showAlcohol) return null;
          if (kind === "liquid") return null;

          const presets = getPresetsByKind(kind);
          if (presets.length === 0) return null;

          const activePresetId = currentPresetId(kind);

          return (
            <div key={kind} className={styles.section}>
              <label className={styles.fieldLabel} htmlFor={`mix-${kind}`}>{label}</label>
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
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
