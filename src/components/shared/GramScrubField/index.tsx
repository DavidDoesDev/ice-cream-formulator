"use client";

import { useRef, useState, useCallback } from "react";
import styles from "./GramScrubField.module.scss";

const DRAG_THRESHOLD = 4; // px before a press becomes a scrub (vs a click-to-type)

// Snap + drag sensitivity scale with magnitude, so trace amounts (stabilizer,
// emulsifier, alcohol — often < 5 g and fractional) stay adjustable while big
// amounts step in coarse, sensible increments.
function gramStep(grams: number): number {
  if (grams < 5) return 0.1;
  if (grams < 20) return 0.5;
  if (grams < 100) return 1;
  return 5;
}

const round2 = (g: number) => Math.round(g * 100) / 100;

interface GramScrubFieldProps {
  grams: number;
  onChange: (grams: number) => void;
}

// A gram value you can drag vertically to change (up = more), or click to type.
// Precision follows the amount: small amounts allow decimals, large ones don't.
export function GramScrubField({ grams, onChange }: GramScrubFieldProps) {
  const drag = useRef<{ startY: number; startGrams: number; moved: boolean } | null>(null);
  // Raw text while the field is focused, so partial decimals (e.g. "2.") can be typed.
  const [text, setText] = useState<string | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startGrams: grams, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [grams]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY; // up is positive
    if (!d.moved) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      document.body.classList.add("scrubbing");
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    const step = gramStep(d.startGrams);
    const raw = d.startGrams + dy * step * 0.5; // ~2 px per step
    onChange(Math.max(0, round2(Math.round(raw / step) * step)));
  }, [onChange]);

  const endScrub = useCallback((e: React.PointerEvent) => {
    if (drag.current?.moved) document.body.classList.remove("scrubbing");
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      className={styles.field}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endScrub}
      onPointerCancel={endScrub}
    >
      <input
        className={styles.input}
        type="text"
        inputMode="decimal"
        value={text ?? String(round2(grams))}
        onFocus={(e) => {
          setText(String(round2(grams)));
          e.target.select();
        }}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, "");
          setText(t);
          const v = parseFloat(t);
          if (!isNaN(v)) onChange(Math.max(0, v));
        }}
        onBlur={() => setText(null)}
      />
      <span className={styles.unit}>g</span>
    </div>
  );
}
