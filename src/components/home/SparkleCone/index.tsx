"use client";

import { useEffect, useRef } from "react";
import styles from "./SparkleCone.module.scss";

// Sprite-sheet geometry: 90 frames at 30fps in an 8×12 grid (last row holds
// only 2 frames, so playback steps by frame index — a pure-CSS steps()
// animation would walk through the 6 empty cells).
const COLS = 8;
const ROWS = 12;
const FRAMES = 90;
const FPS = 30;

// Max parallax displacement in px; the sparkle plane sits nearer the viewer
// than the cone, so it drifts further.
const CONE_SHIFT = 10;
const SPARK_SHIFT = 22;

// Layered hero visual: the cone photo (multiply-blended so its white
// background melts into the paper) with a sparkle sprite plane in front, both
// drifting subtly against the mouse at depth-scaled rates. Purely decorative —
// it takes no pointer events and hides itself on narrow viewports. Sizing and
// placement ride on --sparkle-cone-h / --sparkle-cone-bleed so they can be
// tuned from devtools; the parent section must be position: relative.
export function SparkleCone() {
  const coneRef = useRef<HTMLImageElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cone = coneRef.current;
    const spark = sparkRef.current;
    if (!cone || !spark) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let frame = -1;
    // Parallax target (from the pointer) and current (lerped) offsets, each
    // normalized to -0.5..0.5.
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };

    // One rAF loop drives both the sprite clock and the parallax lerp; rAF
    // stops in background tabs, so no explicit visibility handling is needed.
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const f = Math.floor(now / (1000 / FPS)) % FRAMES;
      if (f !== frame) {
        frame = f;
        // With background-size at grid-size × 100%, offset k/(n-1) × 100%
        // lands exactly on cell k.
        const x = ((f % COLS) / (COLS - 1)) * 100;
        const y = (Math.floor(f / COLS) / (ROWS - 1)) * 100;
        spark.style.backgroundPosition = `${x}% ${y}%`;
      }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      cone.style.transform = `translate3d(${(-cx * CONE_SHIFT).toFixed(2)}px, ${(-cy * CONE_SHIFT).toFixed(2)}px, 0)`;
      spark.style.transform = `translate3d(${(-cx * SPARK_SHIFT).toFixed(2)}px, ${(-cy * SPARK_SHIFT).toFixed(2)}px, 0)`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={styles.scene} aria-hidden>
      {/* Plain <img>: the asset is already sized/WebP'd, and next/image's
          wrapper semantics don't play well with mix-blend-mode layering. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={coneRef} className={styles.cone} src="/home/sparkle-cone.webp" alt="" />
      <div ref={sparkRef} className={styles.sparkles} />
    </div>
  );
}
