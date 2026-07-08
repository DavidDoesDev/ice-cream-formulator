"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./SparkleCone.module.scss";
import { Atoms } from "./Atoms";
import { Callouts } from "./Callouts";
import { Notation } from "./Notation";
import { Structures } from "./Structures";
import { FxPanel, getFx, getServerFx, setFx, subscribeFx } from "./FxPanel";
import { ramp } from "./palette";

// Sprite-sheet geometry: 180 frames at 30fps in an 8×23 grid (last row holds
// only 4 frames, so playback steps by frame index — a pure-CSS steps()
// animation would walk through the 4 empty cells).
const COLS = 8;
const ROWS = 23;
const FRAMES = 180;
const FPS = 30;

// Depth model, far to near: back plane < cone (with its callouts pinned to
// it) < front plane. Shifts are max parallax displacement in px; zooms scale
// with vertical mouse position (up = out, down = in), stronger for nearer
// planes so the stack stretches like a real dolly move; tilts bank each plane
// into its horizontal sway, again more for nearer planes.
const BACK_SHIFT = 4;
const CONE_SHIFT = 10;
const FRONT_SHIFT = 20;
const BACK_ZOOM = 0.015;
const CONE_ZOOM = 0.03;
const FRONT_ZOOM = 0.045;
const BACK_TILT = 1;
const CONE_TILT = 2;
const FRONT_TILT = 3.5;

// Zoom rides on how close the pointer is to the cone's box: far away it
// rests zoomed out, and it swells as you approach. REACH is the falloff
// radius as a fraction of viewport width; the pow curve back-loads the
// response so most of the swell happens right near the ice cream.
const ZOOM_REACH = 0.45;
const ZOOM_CURVE = 2;

// Reduced-motion as an external store: false during SSR/hydration (so the
// animated layers never appear in server markup), live afterwards.
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const m = window.matchMedia(MOTION_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getMotionOK = () => !window.matchMedia(MOTION_QUERY).matches;
const getServerMotionOK = () => false;

// The dev tuning panel is opt-in via a ?dev query param (any environment), so
// it never ships to real visitors but can be summoned on the deployed site.
// Read through an external store — false on the server, actual after hydration.
function subscribeDev() {
  return () => {};
}
const getDevPanel = () => new URLSearchParams(window.location.search).has("dev");
const getServerDevPanel = () => false;

// Layered hero visual: the cone video (multiply-blended so its white
// background melts into the paper) sandwiched between two planes of effect
// layers — behind-the-cone particles read through the blend like they're in
// the scene — plus an annotation plane for textbook callouts. Everything
// drifts and zooms subtly against the mouse at depth-scaled rates. Purely
// decorative: no pointer events, hidden on narrow viewports. In dev, a fixed
// panel toggles the effect layers; the mix persists in localStorage. Sizing
// and placement ride on --sparkle-cone-w / --sparkle-cone-top; the parent
// section must be position: relative.
export function SparkleCone() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const coneRef = useRef<HTMLVideoElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const annoRef = useRef<HTMLDivElement>(null);
  // Live lerped pointer offset (-0.5..0.5), shared with the canvas layers so
  // each atom can add its own dome-depth parallax on top of the plane drift.
  const pointerRef = useRef({ x: 0, y: 0 });
  const fx = useSyncExternalStore(subscribeFx, getFx, getServerFx);
  const motionOK = useSyncExternalStore(subscribeMotion, getMotionOK, getServerMotionOK);
  const devPanel = useSyncExternalStore(subscribeDev, getDevPanel, getServerDevPanel);

  useEffect(() => {
    const cone = coneRef.current;
    if (!cone) return;
    if (window.matchMedia(MOTION_QUERY).matches) {
      cone.pause();
      return;
    }

    let raf = 0;
    let frame = -1;
    // Parallax target (from the pointer) and current (lerped) offsets,
    // normalized to -0.5..0.5; the zoom channel runs 0 (pointer far, rest)
    // to 1 (pointer on the cone).
    let tx = 0;
    let ty = 0;
    let tz = 0;
    let cx = 0;
    let cy = 0;
    let cz = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      const scene = sceneRef.current;
      if (scene) {
        // Distance from the pointer to the nearest edge of the cone's box
        // (zero anywhere over it), scaled into 0..1 proximity by REACH.
        const r = scene.getBoundingClientRect();
        const nx = Math.min(Math.max(e.clientX, r.left), r.right);
        const ny = Math.min(Math.max(e.clientY, r.top), r.bottom);
        const dist = Math.hypot(e.clientX - nx, e.clientY - ny);
        const prox = Math.max(0, 1 - dist / (window.innerWidth * ZOOM_REACH));
        tz = Math.pow(prox, ZOOM_CURVE);
      }
    };

    const layer = (el: HTMLElement | null, shift: number, zoom: number, tilt: number) => {
      if (!el) return;
      el.style.transform = `translate3d(${(-cx * shift).toFixed(2)}px, ${(-cy * shift).toFixed(2)}px, 0) rotate(${(-cx * tilt).toFixed(2)}deg) scale(${(1 + (cz - 0.5) * zoom).toFixed(4)})`;
    };

    // One rAF loop drives both the sprite clock and the parallax lerp; rAF
    // stops in background tabs, so no explicit visibility handling is needed.
    // Layer refs are read per-frame because the panel mounts/unmounts them.
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const spark = sparkRef.current;
      if (spark) {
        const f = Math.floor(now / (1000 / FPS)) % FRAMES;
        if (f !== frame) {
          frame = f;
          // With background-size at grid-size × 100%, offset k/(n-1) × 100%
          // lands exactly on cell k.
          const x = ((f % COLS) / (COLS - 1)) * 100;
          const y = (Math.floor(f / COLS) / (ROWS - 1)) * 100;
          spark.style.backgroundPosition = `${x}% ${y}%`;
        }
      }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      cz += (tz - cz) * 0.08;
      // Publish the offset for the depth layers: the canvas reads pointerRef
      // directly; the DOM layers read the CSS vars to scale their own travel.
      pointerRef.current.x = cx;
      pointerRef.current.y = cy;
      const scene = sceneRef.current;
      if (scene) {
        scene.style.setProperty("--fx-px", cx.toFixed(4));
        scene.style.setProperty("--fx-py", cy.toFixed(4));
      }
      layer(coneRef.current, CONE_SHIFT, CONE_ZOOM, CONE_TILT);
      // Callouts share the cone's exact transform so markers stay pinned.
      layer(annoRef.current, CONE_SHIFT, CONE_ZOOM, CONE_TILT);
      layer(backRef.current, BACK_SHIFT, BACK_ZOOM, BACK_TILT);
      layer(frontRef.current, FRONT_SHIFT, FRONT_ZOOM, FRONT_TILT);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // The chemistry layers split across both planes, lighter behind the cone
  // (back 0.5× / front 0.75× of the configured density). Notation and
  // structures are keyed by density so a slider change deals a fresh layout.
  const { atoms, notation, structures } = fx;

  // Per-layer tint: each annotation layer resolves to its chosen colour or
  // the theme ink. The canvas takes null and resolves --ink itself; the DOM
  // layers take a concrete CSS colour applied inline (their SCSS uses
  // currentColor).
  const atomsColor = atoms.color.on ? ramp(atoms.color.t) : "var(--ink)";
  const notationColor = notation.color.on ? ramp(notation.color.t) : "var(--ink)";
  const structuresColor = structures.color.on ? ramp(structures.color.t) : "var(--ink)";
  const calloutsColor = fx.callouts.color.on ? ramp(fx.callouts.color.t) : "var(--ink)";

  return (
    <div ref={sceneRef} className={styles.scene} aria-hidden>
      <div ref={backRef} className={styles.fxPlane}>
        {motionOK && atoms.on && (
          <Atoms density={atoms.density * 0.5} size={atoms.size} opacity={atoms.opacity} pointer={pointerRef} color={atomsColor} back />
        )}
        {motionOK && notation.on && (
          <Notation key={`nb${notation.density}`} density={notation.density * 0.5} opacity={notation.opacity} color={notationColor} back />
        )}
        {motionOK && structures.on && (
          <Structures key={`sb${structures.density}`} density={structures.density * 0.5} opacity={structures.opacity} color={structuresColor} back />
        )}
      </div>
      {/* 9.5s loop with the seam crossfaded away at export time; muted +
          playsInline are required for autoplay to be allowed at all. */}
      <video
        ref={coneRef}
        className={styles.cone}
        src="/home/sparkle-cone.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div ref={frontRef} className={styles.fxPlane}>
        {fx.sparkles.on && <div ref={sparkRef} className={styles.sparkles} />}
        {motionOK && atoms.on && (
          <Atoms density={atoms.density * 0.75} size={atoms.size} opacity={atoms.opacity} pointer={pointerRef} color={atomsColor} />
        )}
        {motionOK && notation.on && (
          <Notation key={`nf${notation.density}`} density={notation.density * 0.75} opacity={notation.opacity} color={notationColor} />
        )}
        {motionOK && structures.on && (
          <Structures key={`sf${structures.density}`} density={structures.density * 0.75} opacity={structures.opacity} color={structuresColor} />
        )}
      </div>
      <div ref={annoRef} className={styles.annoPlane}>
        {motionOK && fx.callouts.on && <Callouts color={calloutsColor} />}
      </div>
      {devPanel && <FxPanel value={fx} onChange={setFx} />}
    </div>
  );
}
