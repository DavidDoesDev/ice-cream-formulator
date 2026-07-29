"use client";

import type { ReactNode } from "react";
import { Plus, ChevronsUpDown, X } from "lucide-react";
import styles from "./SmartIngredientPanel.module.scss";

export interface PresetOption {
  value: string;
  label: string;
}

interface SmartIngredientPanelProps {
  icon: ReactNode;
  name: string;
  // Preset dropdown (ratio blends: sugar, stabilizer, …). Omit for ingredient-set
  // panels (milk base), which have no ratios — just an add/remove list.
  preset?: {
    value: string;
    options: PresetOption[];
    onChange: (value: string) => void;
  };
  // Uppercase noun for the add button, e.g. "SUGAR" → "+ SUGAR".
  addLabel: string;
  onAdd: () => void;
  children?: ReactNode;
}

// A smart-ingredient card: icon + name, an optional preset selector, a list of
// ingredient rows (SmartRow), and a "+ …" add button. Two shapes off one shell:
// ratio blends pass `preset` (dropdown + %-rows); ingredient sets omit it.
export function SmartIngredientPanel({
  icon,
  name,
  preset,
  addLabel,
  onAdd,
  children,
}: SmartIngredientPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
          {name}
        </span>
        {preset && (
          <span className={styles.preset}>
            <select
              className={styles.presetSelect}
              value={preset.value}
              onChange={(e) => preset.onChange(e.target.value)}
              aria-label={`${name} preset`}
            >
              {preset.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronsUpDown className={styles.presetChevron} size={15} strokeWidth={2} aria-hidden />
          </span>
        )}
      </div>
      <div className={styles.rows}>{children}</div>
      <button className={styles.add} type="button" onClick={onAdd}>
        <Plus size={14} strokeWidth={2.5} aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

interface SmartRowProps {
  name: ReactNode;
  // Read-only right-hand value (e.g. "75%"). Omit for a plain set row.
  value?: ReactNode;
  // Editable proportion — renders a number input; presence switches the row to
  // custom-blend mode. `onCommit` fires on blur (re-solve once the edit settles).
  weight?: {
    value: number;
    onChange: (value: number) => void;
    onCommit?: () => void;
  };
  onRemove?: () => void;
}

// One ingredient line inside a panel. Set rows are name + X; breakdown rows are
// name + %; custom rows are name + weight input + % + X.
export function SmartRow({ name, value, weight, onRemove }: SmartRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.rowName}>{name}</span>
      {weight && (
        <input
          className={styles.rowWeight}
          type="number"
          min={0}
          step={1}
          value={weight.value}
          onChange={(e) => {
            const w = parseFloat(e.target.value);
            weight.onChange(isNaN(w) ? 0 : Math.max(0, w));
          }}
          onBlur={weight.onCommit}
        />
      )}
      {value != null && <span className={styles.rowValue}>{value}</span>}
      {onRemove && (
        <button className={styles.rowRemove} type="button" aria-label="Remove" onClick={onRemove}>
          <X size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
