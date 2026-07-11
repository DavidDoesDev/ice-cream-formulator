"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type MacroRatios } from "@/lib/formula-engine";
import { sliderGeometry } from "@/lib/macro-bands";
import { balanceReport } from "@/lib/balance";
import { relationshipHints } from "@/lib/relationships";
import type { DerivedIndices } from "@/lib/derive";
import { DEFAULT_EQUIPMENT, type EquipmentProfile } from "@/data/types";
import { equipmentInfo } from "@/lib/equipment";
import { formatPercent } from "@/lib/measure";
import { PintCup } from "@/components/shared/PintCup";
import { MacroDot, type MacroKey } from "@/components/shared/MacroDot";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Pill } from "@/components/shared/Pill";
import { Icon } from "@/components/shared/Icon";
import styles from "./MacrosPanel.module.scss";

const SLIDER_SCALE = 1000;

const SLIDERS: { key: MacroKey; label: string }[] = [
  { key: "fat", label: "Fat" },
  { key: "sugar", label: "Sugar" },
  { key: "nonfatSolids", label: "Non-fat solids" },
  { key: "stabilizer", label: "Stabilizer" },
  { key: "emulsifier", label: "Emulsifier" },
  { key: "alcohol", label: "Alcohol" },
];

// Candy fill color per macro; water reads as sky (it has no macro swatch).
function fillVar(key: MacroKey): string {
  if (key === "water") return "var(--c-sky)";
  const suffix = key === "nonfatSolids" ? "nonfat" : key;
  return `var(--color-macro-${suffix})`;
}

interface MacrosPanelProps {
  ratios: MacroRatios;
  derived: DerivedIndices;
  style: string;
  equipment?: EquipmentProfile;
  conflict: boolean;
  onMacroTarget: (macro: keyof MacroRatios, target: number) => void;
  onRebalance: () => void;
  onRecalibrate?: () => void;
}

// Right workspace panel: the composition as a live cup + draggable macro sliders.
// Each track marks its healthy window with edge ticks (drawn over the fill) and
// flips its fill color when the value strays out of range. Dragging re-solves
// the recipe at fixed yield (handled by the parent) continuously.
export function MacrosPanel({
  ratios,
  derived,
  style,
  equipment = DEFAULT_EQUIPMENT,
  conflict,
  onMacroTarget,
  onRebalance,
  onRecalibrate,
}: MacrosPanelProps) {
  // While a slider is actively dragged, its thumb follows the pointer's target
  // value rather than the solved ratio — so it can't fight the continuous solve.
  // Other sliders still reflect the live solved ratios. Cleared on release.
  const [drag, setDrag] = useState<{ key: MacroKey; value: number } | null>(null);

  // Throttle the re-solve to ~11/sec during a drag. The thumb follows the pointer
  // instantly via `drag` (a cheap local update), but the whole-recipe solve — which
  // drives the cup and recipe grams and spikes to ~30–50ms in Safari's JS engine —
  // does not need to run every frame. Solving on every input event backs up a queue
  // that lags further behind the pointer (the "on delay") and commits stale values
  // that yank the thumb backward (the "snap back"); even one solve per animation
  // frame caps Safari at ~28fps. At a ~90ms cadence the cup stays visibly live while
  // the main thread keeps a smooth 60fps thumb. It runs off the latest pending
  // target (leading + trailing), so the drag never lags and always ends solved.
  const SOLVE_THROTTLE_MS = 90;
  const timerRef = useRef<number | null>(null);
  const lastSolveRef = useRef(0);
  const pendingRef = useRef<{ macro: keyof MacroRatios; target: number } | null>(null);

  const runPending = useCallback(() => {
    timerRef.current = null;
    lastSolveRef.current = performance.now();
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) onMacroTarget(p.macro, p.target);
  }, [onMacroTarget]);

  const scheduleSolve = useCallback(
    (macro: keyof MacroRatios, target: number) => {
      pendingRef.current = { macro, target };
      const elapsed = performance.now() - lastSolveRef.current;
      if (elapsed >= SOLVE_THROTTLE_MS) {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        runPending();
      } else if (timerRef.current === null) {
        timerRef.current = window.setTimeout(runPending, SOLVE_THROTTLE_MS - elapsed);
      }
    },
    [runPending],
  );

  // Run any queued solve immediately (on release/blur) so the final target lands
  // before the drag lock clears — otherwise the thumb would settle on a stale ratio.
  const flushSolve = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) runPending();
  }, [runPending]);

  // Release the drag lock on a real pointer release, watched at the window level.
  // The input's own `pointercancel`/`pointerup` are unreliable for this: Safari
  // fires `pointercancel` on a native range input the moment its slider gesture
  // claims the pointer — i.e. mid-drag — which would clear the lock and make the
  // controlled thumb snap back and fight the pointer every frame. Window-level
  // `pointerup`/`mouseup`/`touchend` fire only on the genuine release, in every
  // engine, so the lock holds for the whole drag and then clears cleanly.
  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    const release = () => {
      flushSolve();
      setDrag(null);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
  }, [isDragging, flushSolve]);

  // Drop any queued solve on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const report = balanceReport(ratios, style, equipment);
  const offChecks = report.checks.filter((c) => c.verdict !== "ok");
  // Relationship hints, de-duped against the window checks: the scoopability
  // (firm/soft) hint restates the Sugar check when sugar is the cause, so drop it
  // when Sugar is already flagged (keeps it for the sugar-in-range/alcohol case).
  const sugarFlagged = offChecks.some((c) => c.key === "sugar");
  const hints = relationshipHints(ratios, derived, style, equipment).filter(
    (h) => !(sugarFlagged && (h.key === "firm" || h.key === "soft")),
  );
  // Fixable hints (sandiness, ice control) block Balanced — Rebalance clears them.
  // Scoopability (firm/soft) is a choice-driven note (sugar type / alcohol): shown
  // always, but it doesn't fail the balance nor get a Rebalance that can't fix it.
  const fixableHints = hints.filter((h) => h.key === "sandiness" || h.key === "ice-control");
  const noteHints = hints.filter((h) => h.key === "firm" || h.key === "soft");
  const balanced = report.balanced && fixableHints.length === 0;
  // Advice: window checks + fixable hints only when out of range (Rebalance clears
  // them); the scoopability notes show even when balanced (a heads-up, never hidden).
  const adviceRows: { key: string; label: string; text: string }[] = [];
  if (!balanced) {
    offChecks.forEach((c) => adviceRows.push({ key: c.key, label: c.label, text: c.advice ?? "" }));
    fixableHints.forEach((h) => adviceRows.push({ key: h.key, label: h.label, text: h.message }));
  }
  noteHints.forEach((h) => adviceRows.push({ key: h.key, label: h.label, text: h.message }));
  return (
    <section className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.kind}>Macros</span>
        {/* The (style × equipment) that define every target window (D8). */}
        <span className={styles.eyebrow}>
          {style} · <Icon name="snow" size={11} className={styles.eyebrowIcon} /> {equipmentInfo(equipment).label}
        </span>
      </div>

      <div className={styles.cupStage}>
        <PintCup ratios={ratios} size="full" width={210} />
      </div>

      <SectionHeader role="composition" label="Composition" />

      {SLIDERS.map(({ key, label }) => {
        const dragging = drag?.key === key;
        // The dragged slider shows the pointer's target; others show solved ratios.
        const shown = dragging ? drag!.value : ratios[key];
        const g = sliderGeometry(style, key, shown, equipment);
        // Run the native input on a 0–1000 scale and map to the macro's range —
        // the browser mishandles very small float ranges (e.g. stabilizer 0–0.008),
        // silently dropping input events. This keeps every slider responsive.
        const span = g.max - g.min;
        const toPos = (v: number) => (span > 0 ? ((v - g.min) / span) * SLIDER_SCALE : 0);
        const fromPos = (p: number) => g.min + (p / SLIDER_SCALE) * span;
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
                min={0}
                max={SLIDER_SCALE}
                step="any"
                value={toPos(g.value)}
                aria-label={label}
                onChange={(e) => {
                  const raw = fromPos(parseFloat(e.target.value));
                  setDrag({ key, value: raw });
                  scheduleSolve(key, raw);
                }}
                onBlur={() => {
                  flushSolve();
                  setDrag(null);
                }}
              />
            </span>
            <span className={styles.sliderVal}>{formatPercent(shown * 100)}%</span>
          </div>
        );
      })}

      <SectionHeader role="balance" label="Balance check" />
      <p className={styles.scoreNote}>
        Each macro checked against its window for a {style.toLowerCase()} on a{" "}
        {equipmentInfo(equipment).label.toLowerCase()}
      </p>
      {conflict ? (
        <div className={styles.statusOff}>
          <span className={styles.statusMsg}>
            <Icon name="bolt" size={16} /> Can&apos;t hit that target with these ingredients.
          </span>
          <Pill tone="accent" size="sm" onClick={onRebalance}>Rebalance</Pill>
        </div>
      ) : balanced ? (
        <div className={styles.statusOk}>
          <Icon name="check" size={15} /> Balanced
        </div>
      ) : (
        <div className={styles.statusOff}>
          <span className={styles.statusMsg}>Out of range</span>
          {onRecalibrate && (
            <Pill tone="accent" size="sm" onClick={onRecalibrate}>Rebalance</Pill>
          )}
        </div>
      )}

      <div className={styles.readoutRow}>
        <span className={styles.readout}>Scoopability <b>{Math.round(derived.pac * 100)}</b></span>
        <span className={styles.readout}>Sweetness <b>{Math.round(derived.pod * 100)}</b></span>
      </div>

      {adviceRows.length > 0 && (
        <div className={styles.advice}>
          {adviceRows.map((a) => (
            <div key={a.key} className={styles.adviceRow}>
              <b>{a.label}</b> — {a.text}
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
