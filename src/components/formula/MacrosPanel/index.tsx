"use client";

import { computeSliderBounds, type MacroRatios } from "@/lib/formula-engine";
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
];

interface MacrosPanelProps {
  ratios: MacroRatios;
  baseRatios: MacroRatios;
  style: string;
  conflict: boolean;
  onMacroTarget: (macro: keyof MacroRatios, target: number) => void;
  onRebalance: () => void;
}

// Right workspace panel: the composition as a live cup + draggable macro sliders.
// Dragging a slider re-solves the recipe at fixed yield (handled by the parent).
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
        const [min, max] = computeSliderBounds(key, baseRatios[key]);
        const value = Math.max(min, Math.min(max, ratios[key]));
        const fillPct = max > min ? ((value - min) / (max - min)) * 100 : 0;
        return (
          <div key={key} className={styles.sliderRow}>
            <span className={styles.sliderKey}>
              <MacroDot macro={key} /> {label}
            </span>
            <span className={styles.sliderTrack}>
              <span className={styles.sliderFill} style={{ width: `${fillPct}%`, background: `var(--color-macro-${cssMacro(key)})` }} />
              <input
                type="range"
                className={styles.slider}
                min={min}
                max={max}
                step="any"
                value={value}
                aria-label={label}
                onChange={(e) => onMacroTarget(key, parseFloat(e.target.value))}
              />
            </span>
            <span className={styles.sliderVal}>{formatPercent(ratios[key] * 100)}%</span>
          </div>
        );
      })}

      <div className={styles.waterRow}>
        <span className={styles.sliderKey}>
          <MacroDot macro="water" /> Water
        </span>
        <span className={styles.waterVal}>{formatPercent(ratios.water * 100)}%</span>
      </div>

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

// Macro key → the css var suffix used in globals (nonfatSolids maps to "nonfat").
function cssMacro(key: MacroKey): string {
  return key === "nonfatSolids" ? "nonfat" : key;
}
