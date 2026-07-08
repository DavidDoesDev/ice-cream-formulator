import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "./SparkleCone.module.scss";

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
export function Notation({ density }: { density: number }) {
  const [notes] = useState<Note[]>(() =>
    Array.from({ length: Math.round(9 * density) }, (_, i) => ({
      text: FORMULAS[i % FORMULAS.length],
      left: 2 + Math.random() * 82,
      top: 4 + Math.random() * 78,
      size: 11 + Math.random() * 6,
      dur: 9 + Math.random() * 7,
      // Negative delays desync the loops from the first paint.
      delay: -Math.random() * 16,
      peak: 0.3 + Math.random() * 0.35,
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
              "--peak": n.peak,
            } as CSSProperties
          }
        >
          {n.text}
        </span>
      ))}
    </div>
  );
}
