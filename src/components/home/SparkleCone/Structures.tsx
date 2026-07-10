import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "./SparkleCone.module.scss";
import { SCOOP_X, SCOOP_Y, SPREAD_X, SPREAD_Y, gauss, domeZ, centerFade } from "./scatter";

// Peak per-diagram parallax travel at the dome apex, in px; scaled by each
// item's dome-z. The CSS `translate` property composes with the existing
// `scale` (sizing) and the structdrift keyframe on `transform`. The back plane
// swings opposite the front (and gentler) with an inverted size gradient, so
// the two planes read as one sphere's near and far faces.
const DEPTH_PX = 20;
const BACK_SWING = 0.7;
const SIZE_DEPTH = 0.4;

// Hand-plotted skeletal rings, textbook style: a pyranose hexagon, a furanose
// pentagon, and a two-ring disaccharide with a glycosidic-oxygen bridge. The
// top edges stop short of the vertex so the ring oxygen sits in the gap.
function Shape({ kind }: { kind: number }) {
  if (kind === 0) {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48">
        <path className={styles.structPath} d="M 17.9 7.5 L 6.7 14 L 6.7 34 L 24 44 L 41.3 34 L 41.3 14 L 30.1 7.5" />
        <text className={styles.structO} x="24" y="10">O</text>
      </svg>
    );
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 48 48" width="44" height="44">
        <path className={styles.structPath} d="M 18.7 13.9 L 8.8 21.1 L 14.6 38.9 L 33.4 38.9 L 39.2 21.1 L 29.3 13.9" />
        <text className={styles.structO} x="24" y="13">O</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 104 56" width="96" height="52">
      <path className={styles.structPath} d="M 19.1 18.8 L 10.1 22 L 10.1 38 L 24 46 L 37.9 38 L 37.9 22 L 28.9 18.8" />
      <text className={styles.structO} x="24" y="21">O</text>
      <path className={styles.structPath} d="M 37.9 22 L 47 17" />
      <path className={styles.structPath} d="M 57 17 L 64.7 27.7" />
      <text className={styles.structO} x="52" y="20">O</text>
      <path className={styles.structPath} d="M 64.7 27.7 L 69.8 43.3 L 86.2 43.3 L 91.3 27.7 L 78 18 Z" />
    </svg>
  );
}

type Item = {
  kind: number;
  left: number;
  top: number;
  z: number;
  scale: number;
  opacity: number;
  dur: number;
  delay: number;
};

// Faint structure diagrams bobbing and tilting around the cone. Layout is
// randomized in the state initializer — safe because this layer only mounts
// client-side (motion-gated), and the parent keys it by density so changes
// remount with a fresh spread.
export function Structures({
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
  const [items] = useState<Item[]>(() =>
    Array.from({ length: Math.round(5 * density) }, (_, i) => {
      // Leaning toward the scoop, clamped to keep diagrams inside the box.
      const left = Math.min(74, Math.max(0, gauss(SCOOP_X * 100 - 8, SPREAD_X * 100)));
      const top = Math.min(70, Math.max(0, gauss(SCOOP_Y * 100, SPREAD_Y * 100)));
      const z = domeZ(left / 100, top / 100);
      const near = back ? -z : z;
      return {
        kind: i % 3,
        left,
        top,
        z,
        // Near-face diagrams render larger than far-face ones, reinforcing depth.
        scale: (0.9 + Math.random() * 0.9) * (1 + SIZE_DEPTH * near),
        // Per-item jitter around the configured opacity level; the back plane
        // fades toward the scoop centre so it doesn't ghost through.
        opacity: (0.7 + Math.random() * 0.6) * (back ? centerFade(z) : 1),
        dur: 14 + Math.random() * 14,
        delay: -Math.random() * 28,
      };
    }),
  );

  const swing = back ? DEPTH_PX * BACK_SWING : -DEPTH_PX;

  return (
    <div className={styles.structs} style={{ color }}>
      {items.map((s, i) => (
        <span
          key={i}
          className={styles.struct}
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              translate: `calc(var(--fx-px, 0) * ${swing}px * ${s.z.toFixed(3)}) calc(var(--fx-py, 0) * ${swing}px * ${s.z.toFixed(3)})`,
              scale: String(s.scale),
              opacity: Math.min(1, s.opacity * opacity),
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            } as CSSProperties
          }
        >
          <Shape kind={s.kind} />
        </span>
      ))}
    </div>
  );
}
