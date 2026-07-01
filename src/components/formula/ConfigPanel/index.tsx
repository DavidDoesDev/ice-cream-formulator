"use client";

import { useState, useCallback } from "react";
import { useFormulaContext } from "@/context/FormulaContext";
import type { StyleCategory } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import styles from "./ConfigPanel.module.scss";

const STYLE_OPTIONS: { value: StyleCategory; label: string }[] = [
  { value: "philadelphia", label: "Philadelphia" },
  { value: "custard", label: "French Custard" },
  { value: "gelato", label: "Gelato" },
  { value: "sorbet", label: "Sorbet" },
  { value: "sherbet", label: "Sherbet" },
  { value: "vegan", label: "Vegan" },
];

const SUGAR_PRESETS = [
  { label: "Sucrose only", value: "sucrose" },
  { label: "Dextrose blend (softer scoop)", value: "blended" },
  { label: "Invert sugar (anti-crystallization)", value: "invert" },
  { label: "Natural (honey/maple)", value: "natural" },
  { label: "Custom…", value: "custom" },
];

const STABILIZER_PRESETS = [
  { label: "Carrageenan", value: "carrageenan" },
  { label: "Locust bean gum", value: "locust-bean-gum" },
  { label: "Guar gum", value: "guar-gum" },
  { label: "Tara gum", value: "tara-gum" },
  { label: "Custom…", value: "custom" },
];

interface ConfigPanelProps {
  formulaName: string;
  formulaStyle: string;
  onNameChange: (name: string) => void;
  onStyleChange: (style: string) => void;
  onBack: () => void;
  onOpenIngredientSelector: (context: string, onAdd: (ingredient: Ingredient) => void) => void;
}

export function ConfigPanel({
  formulaName,
  formulaStyle,
  onNameChange,
  onStyleChange,
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
    [onStyleChange]
  );

  const handleSugarPreset = useCallback(
    (val: string) => {
      if (val === "custom") {
        onOpenIngredientSelector("sugar-mix", () => {});
      }
    },
    [onOpenIngredientSelector]
  );

  const handleStabilizerPreset = useCallback(
    (val: string) => {
      if (val === "custom") {
        onOpenIngredientSelector("stabilizer-mix", () => {});
      }
    },
    [onOpenIngredientSelector]
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

        <div className={styles.section}>
          <label className={styles.fieldLabel} htmlFor="sugar-mix">Sugar system</label>
          <select
            id="sugar-mix"
            className={styles.select}
            defaultValue=""
            onChange={(e) => handleSugarPreset(e.target.value)}
          >
            <option value="" disabled>Choose a preset…</option>
            {SUGAR_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.section}>
          <label className={styles.fieldLabel} htmlFor="stabilizer-mix">Stabilizer system</label>
          <select
            id="stabilizer-mix"
            className={styles.select}
            defaultValue=""
            onChange={(e) => handleStabilizerPreset(e.target.value)}
          >
            <option value="" disabled>Choose a preset…</option>
            {STABILIZER_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
