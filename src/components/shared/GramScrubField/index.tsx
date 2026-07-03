"use client";

import { useRef, useCallback } from "react";
import styles from "./GramScrubField.module.scss";

const SCRUB_G_PER_PX = 2; // vertical drag sensitivity
const SCRUB_SNAP = 5;     // round scrubbed grams to nearest 5
const DRAG_THRESHOLD = 4; // px before a press becomes a scrub (vs a click-to-type)

interface GramScrubFieldProps {
  grams: number;
  onChange: (grams: number) => void;
  step?: number;
}

// A gram value you can drag vertically to change (up = more), or click to type.
export function GramScrubField({ grams, onChange, step = 10 }: GramScrubFieldProps) {
  const drag = useRef<{ startY: number; startGrams: number; moved: boolean } | null>(null);

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
    const raw = d.startGrams + dy * SCRUB_G_PER_PX;
    onChange(Math.max(0, Math.round(raw / SCRUB_SNAP) * SCRUB_SNAP));
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
        type="number"
        value={Math.round(grams)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(0, v));
        }}
        min={0}
        step={step}
      />
      <span className={styles.unit}>g</span>
    </div>
  );
}
