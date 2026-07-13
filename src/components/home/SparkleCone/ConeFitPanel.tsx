import { useState, type CSSProperties } from "react";
import styles from "./SparkleCone.module.scss";

// Dev-only tuner for the dark-theme cone. The dark cut is the original
// landscape footage masked into the portrait slot; these knobs dial in its
// crop/alignment/scale/blend. The image layer is an independent reference
// overlay (default: the LIGHT cone) so the dark video can be aligned to where
// light-mode sits — the two layers move separately, which is the whole point
// of an alignment tool. "copy" puts a paste-ready CSS block for the video
// layer (plus raw JSON) on the clipboard to hand back for baking.

// One movable layer (video or reference image).
export type Layer = {
  fit: string; // object-fit
  posX: number; // object-position x, %
  posY: number; // object-position y, %
  scale: number; // css `scale` (composes with the parallax transform)
  nudgeX: number; // css `translate` x, px
  nudgeY: number; // css `translate` y, px
  opacity: number; // 0..1
};

export type ConeFit = {
  blend: string; // video mix-blend-mode
  video: Layer;
  imgSrc: "light" | "dark"; // which placeholder the reference overlay shows
  image: Layer;
  border: boolean; // outline the component bounds
};

export const defaultConeFit: ConeFit = {
  // Baked from hand-tuning against the light-mode reference.
  blend: "plus-lighter",
  video: { fit: "cover", posX: 50, posY: 50, scale: 1, nudgeX: -9, nudgeY: -12, opacity: 1 },
  imgSrc: "light",
  // cover (not fill) so a reference whose aspect differs from the slot isn't
  // stretched. The light ref is already 720×1280, so cover == an exact fit.
  image: { fit: "cover", posX: 50, posY: 50, scale: 1, nudgeX: 0, nudgeY: 0, opacity: 0 },
  border: false,
};

// Tiny external store (mirrors FxPanel). v3: bumped so the fixed image default
// (cover, not the stretched fill) replaces any stale saved config.
const FIT_KEY = "sparkle-cone-fit-v3";
const listeners = new Set<() => void>();
let cache: ConeFit = defaultConeFit;
let loaded = false;

export function getConeFit(): ConeFit {
  if (!loaded) {
    loaded = true;
    try {
      const saved = localStorage.getItem(FIT_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Partial<ConeFit>;
        cache = {
          ...defaultConeFit,
          ...p,
          video: { ...defaultConeFit.video, ...p.video },
          image: { ...defaultConeFit.image, ...p.image },
        };
      }
    } catch {
      // bad/unavailable storage; defaults stand
    }
  }
  return cache;
}

export function getServerConeFit(): ConeFit {
  return defaultConeFit;
}

export function setConeFit(next: ConeFit) {
  cache = next;
  try {
    localStorage.setItem(FIT_KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — still works for this session
  }
  listeners.forEach((l) => l());
}

export function subscribeConeFit(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// A layer's inline style. `blend` is only passed for the video; the image
// overlays with normal blend so its silhouette reads as a plain reference.
export function layerStyle(l: Layer, blend?: string): CSSProperties {
  return {
    objectFit: l.fit as CSSProperties["objectFit"],
    objectPosition: `${l.posX}% ${l.posY}%`,
    scale: String(l.scale),
    translate: `${l.nudgeX}px ${l.nudgeY}px`,
    opacity: l.opacity,
    ...(blend ? { mixBlendMode: blend as CSSProperties["mixBlendMode"] } : {}),
  };
}

const BLENDS = [
  "normal",
  "screen",
  "lighten",
  "plus-lighter",
  "multiply",
  "overlay",
  "hard-light",
  "color-dodge",
  "difference",
  "exclusion",
];
const FITS = ["cover", "contain", "fill", "none", "scale-down"];

type LKey = "posX" | "posY" | "scale" | "nudgeX" | "nudgeY" | "opacity";
type Slider = { key: LKey; label: string; min: number; max: number; step: number };
// "crop" = object-position (pans the crop; only bites on an axis the fit
// overflows). "move" = translate (always shifts the layer, both axes). The
// distinction matters: a landscape cover cut has no vertical crop room, so
// vertical alignment is done with "move y", not "crop y".
const LAYER_SLIDERS: Slider[] = [
  { key: "posX", label: "crop x %", min: 0, max: 100, step: 1 },
  { key: "posY", label: "crop y %", min: 0, max: 100, step: 1 },
  { key: "scale", label: "scale", min: 0.5, max: 2.5, step: 0.01 },
  { key: "nudgeX", label: "move x", min: -600, max: 600, step: 1 },
  { key: "nudgeY", label: "move y", min: -800, max: 800, step: 1 },
  { key: "opacity", label: "opacity", min: 0, max: 1, step: 0.05 },
];

export function ConeFitPanel({ value, onChange }: { value: ConeFit; onChange: (v: ConeFit) => void }) {
  const [copied, setCopied] = useState(false);

  const patchLayer = (which: "video" | "image", patch: Partial<Layer>) =>
    onChange({ ...value, [which]: { ...value[which], ...patch } });

  const copy = () => {
    const v = value.video;
    const css = [
      `mix-blend-mode: ${value.blend};`,
      `object-fit: ${v.fit};`,
      `object-position: ${v.posX}% ${v.posY}%;`,
      `scale: ${v.scale};`,
      `translate: ${v.nudgeX}px ${v.nudgeY}px;`,
    ].join("\n");
    const text = `/* cone fit (video) */\n${css}\n/* json */ ${JSON.stringify(value)}`;

    const flash = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    };
    // execCommand fallback for non-secure-context origins (e.g. viewing over a
    // LAN IP), where navigator.clipboard is unavailable.
    const legacy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) flash();
      } catch {
        // nothing more we can do; leave the label unchanged
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(flash, legacy);
    } else {
      legacy();
    }
  };

  const layerGroup = (which: "video" | "image") => {
    const l = value[which];
    return (
      <div className={styles.panelGroup}>
        <span className={styles.panelSub}>{which}</span>
        <label className={styles.panelRow}>
          fit
          <select
            className={styles.panelSelect}
            value={l.fit}
            onChange={(e) => patchLayer(which, { fit: e.target.value })}
          >
            {FITS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        {LAYER_SLIDERS.map((s) => (
          <div key={s.key} className={styles.panelRow}>
            <input
              type="range"
              className={styles.panelRange}
              min={s.min}
              max={s.max}
              step={s.step}
              value={l[s.key]}
              onChange={(e) => patchLayer(which, { [s.key]: Number(e.target.value) } as Partial<Layer>)}
            />
            {s.label}
            <input
              type="number"
              className={styles.panelNum}
              // No min/max clamp on typed entry so values can be pushed past
              // the slider range when needed; the slider still honours min/max.
              step={s.step}
              value={l[s.key]}
              onChange={(e) => patchLayer(which, { [s.key]: Number(e.target.value) } as Partial<Layer>)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.panel} ${styles.conePanel}`}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>cone fit</span>
        <div className={styles.panelBtnRow}>
          <button type="button" className={styles.panelBtn} onClick={copy}>
            {copied ? "copied ✓" : "copy"}
          </button>
          <button type="button" className={styles.panelBtn} onClick={() => onChange(defaultConeFit)}>
            reset
          </button>
        </div>
      </div>

      <label className={styles.panelRow}>
        blend
        <select className={styles.panelSelect} value={value.blend} onChange={(e) => onChange({ ...value, blend: e.target.value })}>
          {BLENDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.panelRow}>
        ref img
        <select
          className={styles.panelSelect}
          value={value.imgSrc}
          onChange={(e) => onChange({ ...value, imgSrc: e.target.value as ConeFit["imgSrc"] })}
        >
          <option value="light">light cone</option>
          <option value="dark">dark cone</option>
        </select>
      </label>

      <label className={styles.panelRow}>
        <input
          type="checkbox"
          className={styles.panelCheck}
          checked={value.border}
          onChange={(e) => onChange({ ...value, border: e.target.checked })}
        />
        border
      </label>

      {layerGroup("video")}
      {layerGroup("image")}
    </div>
  );
}
