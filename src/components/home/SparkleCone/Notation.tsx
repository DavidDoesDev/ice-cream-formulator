import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "./SparkleCone.module.scss";
import { SCOOP_X, SCOOP_Y, SPREAD_X, SPREAD_Y, gauss, domeZ, centerFade } from "./scatter";

// Ice-cream chemistry: sucrose/lactose, glucose, water, glycerol, milk
// calcium, oleic acid.
const FORMULAS = ["C₁₂H₂₂O₁₁", "C₆H₁₂O₆", "H₂O", "C₃H₈O₃", "Ca²⁺", "C₁₈H₃₄O₂"];

// Peak per-note parallax travel at the dome apex, in px; scaled by each note's
// dome-z so crown notes drift further against the pointer than rim ones. The
// CSS `translate` property composes with the notefloat keyframe on `transform`.
// The back plane swings opposite the front (and gentler), and its size
// gradient inverts, so the two planes read as one sphere's near and far faces.
const DEPTH_PX = 20;
const BACK_SWING = 0.7;
const SIZE_DEPTH = 0.4;

type Note = {
  text: string;
  left: number;
  top: number;
  z: number;
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
export function Notation({
  density,
  opacity,
  color,
  back = false,
}: {
  density: number;
  opacity: number;
  color: string;
  back?: boolean;
}) {
  const [notes] = useState<Note[]>(() =>
    Array.from({ length: Math.round(9 * density) }, (_, i) => {
      // Leaning toward the scoop, clamped to keep labels inside the box.
      const left = Math.min(80, Math.max(0, gauss(SCOOP_X * 100 - 6, SPREAD_X * 100)));
      const top = Math.min(74, Math.max(0, gauss(SCOOP_Y * 100, SPREAD_Y * 100)));
      const z = domeZ(left / 100, top / 100);
      const near = back ? -z : z;
      return {
        text: FORMULAS[i % FORMULAS.length],
        left,
        top,
        z,
        // Near-face notes render larger than far-face ones, reinforcing depth.
        size: (11 + Math.random() * 6) * (1 + SIZE_DEPTH * near),
        dur: 9 + Math.random() * 7,
        // Negative delays desync the loops from the first paint.
        delay: -Math.random() * 16,
        // Per-note jitter around the configured opacity level; the back plane
        // fades toward the scoop centre so it doesn't ghost through.
        peak: (0.7 + Math.random() * 0.6) * (back ? centerFade(z) : 1),
      };
    }),
  );

  const swing = back ? DEPTH_PX * BACK_SWING : -DEPTH_PX;

  return (
    <div className={styles.notes} style={{ color }}>
      {notes.map((n, i) => (
        <span
          key={i}
          className={styles.note}
          style={
            {
              left: `${n.left}%`,
              top: `${n.top}%`,
              translate: `calc(var(--fx-px, 0) * ${swing}px * ${n.z.toFixed(3)}) calc(var(--fx-py, 0) * ${swing}px * ${n.z.toFixed(3)})`,
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
