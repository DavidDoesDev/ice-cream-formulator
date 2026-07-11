"use client";

import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Milk, GlassWater, Wine, Candy, Atom, Droplets, X } from "lucide-react";
import type { StyleCategory, SmartMixKind, Recipe, MixPreset, EquipmentProfile } from "@/data/types";
import { DEFAULT_EQUIPMENT } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { equipmentInfo, EQUIPMENT_ORDER } from "@/lib/equipment";
import { getPresetsByKind, getPresetById, buildCustomPreset, seedCustomItems, isDegenerateBlend, type CustomBlendItem } from "@/data/mix-presets";
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
  { kind: "sugar", label: "Sugar blend", icon: Candy },
  { kind: "stabilizer", label: "Stabilizer blend", icon: Atom },
  { kind: "eggs", label: "Egg base", icon: GlassWater, custardGelato: true },
  { kind: "alcohol", label: "Alcohol", icon: Wine },
  { kind: "emulsifier", label: "Emulsifier", icon: Droplets },
];

interface ConfigPanelProps {
  formulaName: string;
  formulaStyle: string;
  formulaEquipment: EquipmentProfile;
  recipe: Recipe;
  onNameChange: (name: string) => void;
  onStyleChange: (style: string) => void;
  onEquipmentChange: (equipment: EquipmentProfile) => void;
  onPresetChange: (kind: SmartMixKind, presetId: string) => void;
  onCustomPreset: (kind: SmartMixKind, preset: MixPreset) => void;
  onAddMilkIngredient: (ing: Ingredient) => void;
  onRemoveMilkIngredient: (presetId: string) => void;
  onOpenIngredientSelector: (context: string, onAdd: (ingredient: Ingredient) => void) => void;
}

export function ConfigPanel({
  formulaName,
  formulaStyle,
  formulaEquipment,
  recipe,
  onNameChange,
  onStyleChange,
  onEquipmentChange,
  onPresetChange,
  onCustomPreset,
  onAddMilkIngredient,
  onRemoveMilkIngredient,
  onOpenIngredientSelector,
}: ConfigPanelProps) {
  const [name, setName] = useState(formulaName);
  const [style, setStyle] = useState(formulaStyle);
  const [equipment, setEquipment] = useState<EquipmentProfile>(formulaEquipment ?? DEFAULT_EQUIPMENT);
  // Per-kind edit buffer for custom blends. A key is present while that slot is
  // custom; its rows are the source of truth for the builder (the applied preset
  // only stores normalized proportions, so we can't round-trip weights from it).
  const [drafts, setDrafts] = useState<Record<string, CustomBlendItem[]>>({});

  // Live-apply like every other blend: a valid custom blend re-solves the recipe
  // immediately on each edit. While degenerate (empty / all-zero) we hold the last
  // applied blend and apply nothing.
  const applyCustom = useCallback((kind: SmartMixKind, items: CustomBlendItem[]) => {
    if (isDegenerateBlend(items)) return;
    const preset = buildCustomPreset(
      kind,
      "Custom",
      items.map((i) => ({ ingredientId: i.ingredientId, proportion: i.weight })),
    );
    onCustomPreset(kind, preset);
  }, [onCustomPreset]);

  const setDraft = useCallback((kind: SmartMixKind, items: CustomBlendItem[]) => {
    setDrafts((prev) => ({ ...prev, [kind]: items }));
    applyCustom(kind, items);
  }, [applyCustom]);

  const addCustomItem = useCallback((kind: SmartMixKind, rows: CustomBlendItem[]) => {
    // The builder sits behind the selector modal, so rows can't change between
    // opening it and the pick — capturing them here is safe.
    onOpenIngredientSelector(`${kind}-custom`, (ing) => {
      if (rows.some((i) => i.ingredientId === ing.id)) return;
      setDraft(kind, [...rows, { ingredientId: ing.id, weight: 1 }]);
    });
  }, [onOpenIngredientSelector, setDraft]);

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

  const handleEquipmentChange = useCallback(
    (val: EquipmentProfile) => {
      setEquipment(val);
      onEquipmentChange(val);
    },
    [onEquipmentChange],
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

  // A mix that's actually present in the recipe is always editable, even if it's
  // unusual for the current style (D4: changing style never orphans a mix). Only
  // hide a style-specific row when its mix is absent.
  const present = (kind: SmartMixKind) => recipe.smartMixes.some((m) => m.kind === kind);
  const mixRows = MIX_CONFIG_KINDS.filter(({ kind, custardGelato }) => {
    if (custardGelato && style !== "custard" && style !== "gelato" && !present(kind)) return false;
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
          <p className={styles.fieldLabel}>Equipment</p>
          <div className={styles.equipGrid}>
            {EQUIPMENT_ORDER.map((profile) => {
              const info = equipmentInfo(profile);
              return (
                <button
                  key={profile}
                  className={`${styles.equipBtn} ${equipment === profile ? styles.equipBtnActive : ""}`}
                  type="button"
                  onClick={() => handleEquipmentChange(profile)}
                >
                  <span className={styles.equipName}>{info.label}</span>
                  <span className={styles.equipBlurb}>{info.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <SectionHeader role="specific" label="Smart Ingredients" />
          <div className={styles.mixRows}>
            {mixRows.map(({ kind, label, icon: Icon }) => {
              const activePresetId = currentPresetId(kind);
              const activePreset = getPresetById(activePresetId);
              // A slot is custom when its active preset isn't one of the built-ins.
              const isCustom =
                !!activePreset && !getPresetsByKind(kind).some((p) => p.id === activePresetId);
              // In custom mode = the applied blend is custom, OR a draft is in
              // progress (covers converting from an empty preset like "None", whose
              // blank blend can't apply yet).
              const inCustom = isCustom || drafts[kind] !== undefined;
              // Custom slots show an editable builder (rows from the draft buffer,
              // seeded from the applied blend the first time); named presets show a
              // read-only breakdown.
              const rows = drafts[kind] ?? (isCustom && activePreset ? seedCustomItems(activePreset) : []);
              const breakdown = !inCustom && activePreset && activePreset.ingredients.length > 1
                ? activePreset.ingredients
                : [];

              // Milk base has no ratios — it's a set of included ingredients.
              if (kind === "milk") {
                const milkMixes = recipe.smartMixes.filter((m) => m.kind === "milk");
                return (
                  <div key={kind} className={styles.mixEntry}>
                    <div className={styles.mixRow}>
                      <Icon className={styles.mixIcon} size={17} strokeWidth={2} aria-hidden />
                      <label className={styles.mixLabel}>{label}</label>
                    </div>
                    <div className={styles.includeList}>
                      {milkMixes.map((m) => (
                        <div key={m.presetId} className={styles.includeRow}>
                          <span className={styles.includeName}>
                            {getPresetById(m.presetId)?.name ?? m.label}
                          </span>
                          <button
                            className={styles.includeRemove}
                            type="button"
                            aria-label="Remove"
                            onClick={() => onRemoveMilkIngredient(m.presetId)}
                          >
                            <X size={14} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.customAdd}
                        type="button"
                        onClick={() => onOpenIngredientSelector("milk-custom", onAddMilkIngredient)}
                      >
                        + Add milk ingredient
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={kind} className={styles.mixEntry}>
                  <div className={styles.mixRow}>
                    <Icon className={styles.mixIcon} size={17} strokeWidth={2} aria-hidden />
                    <label className={styles.mixLabel} htmlFor={`mix-${kind}`}>{label}</label>
                    <select
                      id={`mix-${kind}`}
                      className={styles.select}
                      value={inCustom ? "custom" : activePresetId}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          // Convert to a custom blend seeded from the current one, and
                          // apply immediately (same proportions → no gram change).
                          setDraft(kind, activePreset ? seedCustomItems(activePreset) : []);
                        } else {
                          setDrafts((prev) => {
                            const next = { ...prev };
                            delete next[kind];
                            return next;
                          });
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
                  {!inCustom && breakdown.length > 0 && (
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
                  {inCustom && (
                    <div className={styles.customBuilder}>
                      {rows.map((item, idx) => {
                        const totalW = rows.reduce((s, i) => s + i.weight, 0) || 1;
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
                                const val = isNaN(w) ? 0 : Math.max(0, w);
                                setDrafts((prev) => ({
                                  ...prev,
                                  [kind]: (prev[kind] ?? rows).map((it, i) =>
                                    i === idx ? { ...it, weight: val } : it,
                                  ),
                                }));
                              }}
                              // Re-solve once the edit settles, not on every keystroke.
                              onBlur={() => applyCustom(kind, drafts[kind] ?? rows)}
                            />
                            <span className={styles.customPct}>{formatPercent(pct)}%</span>
                            <button
                              className={styles.customRemove}
                              type="button"
                              aria-label="Remove"
                              onClick={() => setDraft(kind, rows.filter((_, i) => i !== idx))}
                            >
                              <X size={14} strokeWidth={2} />
                            </button>
                          </div>
                        );
                      })}
                      {isDegenerateBlend(rows) && (
                        <p className={styles.customHint}>
                          {rows.length === 0
                            ? "Add an ingredient to build this blend."
                            : "Give an ingredient some weight to apply the blend."}
                        </p>
                      )}
                      <div className={styles.customActions}>
                        <button className={styles.customAdd} type="button" onClick={() => addCustomItem(kind, rows)}>
                          + Ingredient
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
