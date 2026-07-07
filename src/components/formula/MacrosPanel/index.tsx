"use client";

import { type MacroRatios } from "@/lib/formula-engine";
import { sliderGeometry } from "@/lib/macro-bands";
import { formatPercent } from "@/lib/measure";
import { PintCup } from "@/components/shared/PintCup";
import { MacroDot, type MacroKey } from "@/components/shared/MacroDot";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Pill } from "@/components/shared/Pill";
import { Icon } from "@/components/shared/Icon";
import styles from "./MacrosPanel.module.scss";

const SLIDERS: { key: MacroKey; label: string }[] = [
  { key: "fat", label: "Fat" },
  { key: "sugar", label: "Sugar" },
  { key: "nonfatSolids", label: "Milk solids" },
  { key: "stabilizer", label: "Stabilizer" },
  { key: "emulsifier", label: "Emulsifier" },
  { key: "alcohol", label: "Alcohol" },
  { key: "water", label: "Water" },
];

// Candy fill color per macro; water reads as sky (it has no macro swatch).
function fillVar(key: MacroKey): string {
  if (key === "water") return "var(--c-sky)";
  const suffix = key === "nonfatSolids" ? "nonfat" : key;
  return `var(--color-macro-${suffix})`;
}

interface MacrosPanelProps {
  ratios: MacroRatios;
  baseRatios: MacroRatios;
  style: string;
  conflict: boolean;
  onMacroTarget: (macro: keyof MacroRatios, target: number) => void;
  onRebalance: () => void;
}

// Right workspace panel: the composition as a live cup + draggable macro sliders.
// Each track marks its healthy window with edge ticks (drawn over the fill) and
// flips its fill color when the value strays out of range. Dragging re-solves
// the recipe at fixed yield (handled by the parent) continuously.
export function MacrosPanel({
  ratios,
  baseRatios,
  style,
  conflict,
  onMacroTarget,
  onRebalance,
}: MacrosPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.kind}>Macros</span>
        <span className={styles.eyebrow}>live · drag to tune</span>
      </div>

      <div className={styles.cupStage}>
        <PintCup ratios={ratios} size="full" width={210} />
        <span className={styles.cupTag}>{style}</span>
      </div>

      <SectionHeader role="composition" label="Composition" />

      {SLIDERS.map(({ key, label }) => {
        const g = sliderGeometry(key, ratios[key], baseRatios[key]);
        return (
          <div key={key} className={styles.sliderRow}>
            <span className={styles.sliderKey}>
              <MacroDot macro={key} /> {label}
            </span>
            <span className={styles.sliderTrack}>
              <span
                className={`${styles.sliderFill} ${g.inRange ? "" : styles.fillOut}`}
                style={{ width: `${g.fillPct}%`, background: g.inRange ? fillVar(key) : undefined }}
              />
              <span className={styles.tick} style={{ left: `${g.bandLoPct}%` }} aria-hidden />
              <span className={styles.tick} style={{ left: `${g.bandHiPct}%` }} aria-hidden />
              <input
                type="range"
                className={styles.slider}
                min={g.min}
                max={g.max}
                step="any"
                value={g.value}
                aria-label={label}
                onChange={(e) => onMacroTarget(key, parseFloat(e.target.value))}
              />
            </span>
            <span className={`${styles.sliderVal} ${g.inRange ? "" : styles.valOut}`}>
              {formatPercent(ratios[key] * 100)}%
            </span>
          </div>
        );
      })}

      {conflict && (
        <div className={styles.conflict}>
          <span className={styles.conflictMsg}>
            <Icon name="bolt" size={16} /> Out of balance for a {style.toLowerCase()}.
          </span>
          <Pill tone="accent" size="sm" onClick={onRebalance}>
            Rebalance
          </Pill>
        </div>
      )}
    </section>
  );
}
