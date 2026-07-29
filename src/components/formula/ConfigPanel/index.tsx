"use client";

import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Milk, GlassWater, Wine, Candy, Atom, Droplets, IceCreamCone, IceCreamBowl, Snowflake, Factory } from "lucide-react";
import type { StyleCategory, SmartMixKind, Recipe, MixPreset, EquipmentProfile } from "@/data/types";
import { DEFAULT_EQUIPMENT } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { equipmentInfo, EQUIPMENT_ORDER } from "@/lib/equipment";
import { getPresetsByKind, getPresetById, buildCustomPreset, seedCustomItems, isDegenerateBlend, type CustomBlendItem } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { formatPercent } from "@/lib/measure";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Input } from "@/components/ui/Input";
import { SelectableTile } from "@/components/ui/SelectableTile";
import { SmartIngredientPanel, SmartRow } from "@/components/formula/SmartIngredientPanel";
import styles from "./ConfigPanel.module.scss";

const STYLE_OPTIONS: { value: StyleCategory; label: string; blurb: string }[] = [
  { value: "philadelphia", label: "Philadelphia", blurb: "Egg-free, milk-forward — clean and bright." },
  { value: "custard", label: "French custard", blurb: "Cooked egg-yolk base — rich and dense." },
  { value: "gelato", label: "Gelato", blurb: "Low fat, low overrun — intense flavor." },
  { value: "sorbet", label: "Sorbet", blurb: "Dairy-free — fruit, sugar, water." },
  { value: "sherbet", label: "Sherbet", blurb: "A touch of dairy in a fruit base." },
  { value: "vegan", label: "Vegan", blurb: "Plant milks — no dairy or eggs." },
];

const EQUIPMENT_ICON: Record<EquipmentProfile, LucideIcon> = {
  "home-dasher": IceCreamBowl,
  "spin-frozen": Snowflake,
  "commercial-batch": Factory,
};

const MIX_CONFIG_KINDS: {
  kind: SmartMixKind;
  label: string;
  // Uppercase noun for the panel's "+ …" add button.
  addLabel: string;
  icon: LucideIcon;
  custardGelato?: boolean;
}[] = [
  { kind: "milk", label: "Milk base", addLabel: "Milk ingredient", icon: Milk },
  { kind: "sugar", label: "Sugar blend", addLabel: "Sugar", icon: Candy },
  { kind: "stabilizer", label: "Stabilizer blend", addLabel: "Stabilizer", icon: Atom },
  { kind: "eggs", label: "Egg base", addLabel: "Egg", icon: GlassWater, custardGelato: true },
  { kind: "alcohol", label: "Alcohol", addLabel: "Alcohol", icon: Wine },
  { kind: "emulsifier", label: "Emulsifier", addLabel: "Emulsifier", icon: Droplets },
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
      <div className={styles.section}>
        <label className={styles.fieldLabel} htmlFor="formula-name">Name</label>
        <Input
          id="formula-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
      </div>

      <div className={styles.section}>
        <SectionHeader label="Recipe type" />
        <p className={styles.sectionNote}>Select a recipe type to set the target composition.</p>
        <div className={styles.tileGrid}>
          {STYLE_OPTIONS.map((opt) => (
            <SelectableTile
              key={opt.value}
              name={opt.label}
              blurb={opt.blurb}
              icon={<IceCreamCone size={22} strokeWidth={2} />}
              selected={style === opt.value}
              onClick={() => handleStyleChange(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeader label="Equipment" />
        <p className={styles.sectionNote}>Select your equipment to further refine the target composition.</p>
        <div className={styles.tileGrid}>
          {EQUIPMENT_ORDER.map((profile) => {
            const info = equipmentInfo(profile);
            const Icon = EQUIPMENT_ICON[profile];
            return (
              <SelectableTile
                key={profile}
                name={info.label}
                blurb={info.blurb}
                icon={<Icon size={22} strokeWidth={2} />}
                selected={equipment === profile}
                onClick={() => handleEquipmentChange(profile)}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <SectionHeader label="Smart Ingredients" />
        <p className={styles.sectionNote}>Smart ingredients will adjust automatically to achieve the target composition.</p>
        <div className={styles.mixGrid}>
          {mixRows.map(({ kind, label, addLabel, icon: Icon }) => {
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
            const iconEl = <Icon size={18} strokeWidth={2} aria-hidden />;

            // Milk base has no ratios — it's a set of included ingredients.
            if (kind === "milk") {
              const milkMixes = recipe.smartMixes.filter((m) => m.kind === "milk");
              return (
                <SmartIngredientPanel
                  key={kind}
                  icon={iconEl}
                  name={label}
                  addLabel={addLabel}
                  onAdd={() => onOpenIngredientSelector("milk-custom", onAddMilkIngredient)}
                >
                  {milkMixes.map((m) => (
                    <SmartRow
                      key={m.presetId}
                      name={getPresetById(m.presetId)?.name ?? m.label}
                      onRemove={() => onRemoveMilkIngredient(m.presetId)}
                    />
                  ))}
                </SmartIngredientPanel>
              );
            }

            // Ratio blend: preset dropdown + %-rows (read-only for a named preset,
            // editable in custom mode). The add button converts the current preset
            // to a custom blend (same ingredients) and opens the picker to add one.
            const seededRows = inCustom ? rows : activePreset ? seedCustomItems(activePreset) : [];
            const totalW = rows.reduce((s, i) => s + i.weight, 0) || 1;
            const presetIngredients = !inCustom && activePreset ? activePreset.ingredients : [];
            const showPct = presetIngredients.length > 1;

            return (
              <SmartIngredientPanel
                key={kind}
                icon={iconEl}
                name={label}
                addLabel={addLabel}
                onAdd={() => addCustomItem(kind, seededRows)}
                preset={{
                  value: inCustom ? "custom" : activePresetId,
                  options: [
                    ...getPresetsByKind(kind).map((p) => ({ value: p.id, label: p.name })),
                    { value: "custom", label: "Custom…" },
                  ],
                  onChange: (val) => {
                    if (val === "custom") {
                      // Convert to a custom blend seeded from the current one, and
                      // apply immediately (same proportions → no gram change).
                      setDraft(kind, activePreset ? seedCustomItems(activePreset) : []);
                    } else {
                      setDrafts((prev) => {
                        const next = { ...prev };
                        delete next[kind];
                        return next;
                      });
                      onPresetChange(kind, val);
                    }
                  },
                }}
              >
                {inCustom
                  ? rows.map((item, idx) => (
                      <SmartRow
                        key={item.ingredientId}
                        name={getIngredientById(item.ingredientId)?.name ?? item.ingredientId}
                        value={`${formatPercent((item.weight / totalW) * 100)}%`}
                        weight={{
                          value: item.weight,
                          onChange: (val) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [kind]: (prev[kind] ?? rows).map((it, i) =>
                                i === idx ? { ...it, weight: val } : it,
                              ),
                            })),
                          // Re-solve once the edit settles, not on every keystroke.
                          onCommit: () => applyCustom(kind, drafts[kind] ?? rows),
                        }}
                        onRemove={() => setDraft(kind, rows.filter((_, i) => i !== idx))}
                      />
                    ))
                  : presetIngredients.map(({ ingredientId, proportion }) => (
                      <SmartRow
                        key={ingredientId}
                        name={getIngredientById(ingredientId)?.name ?? ingredientId}
                        value={showPct ? `${formatPercent(proportion * 100)}%` : undefined}
                      />
                    ))}
                {inCustom && isDegenerateBlend(rows) && (
                  <p className={styles.mixHint}>
                    {rows.length === 0
                      ? "Add an ingredient to build this blend."
                      : "Give an ingredient some weight to apply the blend."}
                  </p>
                )}
              </SmartIngredientPanel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
