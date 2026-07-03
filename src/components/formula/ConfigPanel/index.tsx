"use client";

import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Milk, GlassWater, Wine, MapPin, Waypoints, Droplets, X } from "lucide-react";
import type { StyleCategory, SmartMixKind, Recipe, MixPreset } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { getPresetsByKind, getPresetById, buildCustomPreset } from "@/data/mix-presets";
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
  onCustomPreset: (kind: SmartMixKind, preset: MixPreset) => void;
  onOpenIngredientSelector: (context: string, onAdd: (ingredient: Ingredient) => void) => void;
}

export function ConfigPanel({
  formulaName,
  formulaStyle,
  recipe,
  onNameChange,
  onStyleChange,
  onPresetChange,
  onCustomPreset,
  onOpenIngredientSelector,
}: ConfigPanelProps) {
  const [name, setName] = useState(formulaName);
  const [style, setStyle] = useState(formulaStyle);
  const [building, setBuilding] = useState<SmartMixKind | null>(null);
  const [customItems, setCustomItems] = useState<{ ingredientId: string; weight: number }[]>([]);

  const addCustomItem = useCallback((kind: SmartMixKind) => {
    onOpenIngredientSelector(`${kind}-custom`, (ing) => {
      setCustomItems((prev) =>
        prev.some((i) => i.ingredientId === ing.id)
          ? prev
          : [...prev, { ingredientId: ing.id, weight: 1 }],
      );
    });
  }, [onOpenIngredientSelector]);

  const saveCustom = useCallback((kind: SmartMixKind) => {
    if (customItems.length === 0) return;
    const preset = buildCustomPreset(
      kind,
      "Custom",
      customItems.map((i) => ({ ingredientId: i.ingredientId, proportion: i.weight })),
    );
    onCustomPreset(kind, preset);
    setBuilding(null);
    setCustomItems([]);
  }, [customItems, onCustomPreset]);

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
                        if (e.target.value === "custom") {
                          setBuilding(kind);
                          setCustomItems([]);
                        } else {
                          onPresetChange(kind, e.target.value);
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
                  {building === kind && (
                    <div className={styles.customBuilder}>
                      {customItems.map((item, idx) => {
                        const totalW = customItems.reduce((s, i) => s + i.weight, 0) || 1;
                        const pct = (item.weight / totalW) * 100;
                        return (
                          <div key={item.ingredientId} className={styles.customRow}>
                            <span className={styles.customName}>
                              {getIngredientById(item.ingredientId)?.name ?? item.ingredientId}
                            </span>
                            <input
                              className={styles.customWeight}
                              type="number"
                              min={0}
                              step={1}
                              value={item.weight}
                              onChange={(e) => {
                                const w = parseFloat(e.target.value);
                                setCustomItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx ? { ...it, weight: isNaN(w) ? 0 : Math.max(0, w) } : it,
                                  ),
                                );
                              }}
                            />
                            <span className={styles.customPct}>{formatPercent(pct)}%</span>
                            <button
                              className={styles.customRemove}
                              type="button"
                              aria-label="Remove"
                              onClick={() => setCustomItems((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <X size={14} strokeWidth={2} />
                            </button>
                          </div>
                        );
                      })}
                      <div className={styles.customActions}>
                        <button className={styles.customAdd} type="button" onClick={() => addCustomItem(kind)}>
                          + Ingredient
                        </button>
                        <button
                          className={styles.customSave}
                          type="button"
                          disabled={customItems.length === 0}
                          onClick={() => saveCustom(kind)}
                        >
                          Save system
                        </button>
                      </div>
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
