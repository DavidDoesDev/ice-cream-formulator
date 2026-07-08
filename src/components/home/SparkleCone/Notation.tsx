import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "./SparkleCone.module.scss";
import { SCOOP_X, SCOOP_Y, SPREAD_X, SPREAD_Y, gauss } from "./scatter";

// Ice-cream chemistry: sucrose/lactose, glucose, water, glycerol, milk
// calcium, oleic acid.
const FORMULAS = ["C₁₂H₂₂O₁₁", "C₆H₁₂O₆", "H₂O", "C₃H₈O₃", "Ca²⁺", "C₁₈H₃₄O₂"];

type Note = {
  text: string;
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
  peak: number;
};

// Molecular formulas drifting up and fading, notebook-margin style. Placement
// is randomized in the state initializer — safe from hydration mismatch
// because this layer only ever mounts client-side (gated on the reduced-motion
// store, which is false in SSR). The parent keys this component by density, so
// a density change remounts with a fresh layout.
export function Notation({ density, opacity }: { density: number; opacity: number }) {
  const [notes] = useState<Note[]>(() =>
    Array.from({ length: Math.round(9 * density) }, (_, i) => ({
      text: FORMULAS[i % FORMULAS.length],
      // Leaning toward the scoop, clamped to keep labels inside the box.
      left: Math.min(80, Math.max(0, gauss(SCOOP_X * 100 - 6, SPREAD_X * 100))),
      top: Math.min(74, Math.max(0, gauss(SCOOP_Y * 100, SPREAD_Y * 100))),
      size: 11 + Math.random() * 6,
      dur: 9 + Math.random() * 7,
      // Negative delays desync the loops from the first paint.
      delay: -Math.random() * 16,
      // Per-note jitter around the configured opacity level.
      peak: 0.7 + Math.random() * 0.6,
    })),
  );

  return (
    <div className={styles.notes}>
      {notes.map((n, i) => (
        <span
          key={i}
          className={styles.note}
          style={
            {
              left: `${n.left}%`,
              top: `${n.top}%`,
              fontSize: n.size,
              animationDuration: `${n.dur}s`,
              animationDelay: `${n.delay}s`,
              "--peak": Math.min(1, n.peak * opacity),
            } as CSSProperties
          }
        >
          {n.text}
        </span>
      ))}
    </div>
  );
}
