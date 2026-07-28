"use client";
import styles from "./DevPanel.module.scss";

// Hand-rolled controls (deliberately not Leva — framework-agnostic + fully our
// styling + clean seam). A control carries its label, unit, live value, and a
// one-line note on what it does.

export function Slider({
  label,
  note,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  note?: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.row}>
      <span className={styles.labels}>
        <span className={styles.label}>{label}</span>
        {note && <span className={styles.note}>{note}</span>}
      </span>
      <span className={styles.control}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <output className={styles.value}>
          {value}
          {unit}
        </output>
      </span>
    </label>
  );
}

export function Toggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <span className={styles.labels}>
        <span className={styles.label}>{label}</span>
        {note && <span className={styles.note}>{note}</span>}
      </span>
      <span className={styles.control}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </span>
    </label>
  );
}
