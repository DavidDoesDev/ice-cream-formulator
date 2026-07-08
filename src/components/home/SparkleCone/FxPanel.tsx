import { useState } from "react";
import styles from "./SparkleCone.module.scss";
import { PRESETS, ramp } from "./palette";

// Per-layer tint: off → theme ink; on → ramp(t) off the shared colour ramp.
export type LayerColor = { on: boolean; t: number };

export type FxConfig = {
  sparkles: { on: boolean };
  atoms: { on: boolean; density: number; size: number; opacity: number; color: LayerColor };
  notation: { on: boolean; density: number; opacity: number; color: LayerColor };
  structures: { on: boolean; density: number; opacity: number; color: LayerColor };
  callouts: { on: boolean; color: LayerColor };
};

type LayerKey = keyof FxConfig;

// Opacity values are the actual target level (each layer jitters ±30% around
// it per element), so the slider reading is meaningful on its own.
export const defaultFx: FxConfig = {
  sparkles: { on: true },
  atoms: { on: false, density: 1, size: 1, opacity: 0.6, color: { on: false, t: 0.67 } },
  notation: { on: false, density: 1, opacity: 0.5, color: { on: false, t: 0.67 } },
  structures: { on: false, density: 1, opacity: 0.2, color: { on: false, t: 0.67 } },
  callouts: { on: true, color: { on: false, t: 0.67 } },
};

// Layers that expose a colour picker (sparkles is a sprite sheet — no tint).
const COLORABLE: LayerKey[] = ["atoms", "notation", "structures", "callouts"];

// Tiny external store (for useSyncExternalStore) so the config loads from and
// persists to localStorage without any setState-in-effect. Server snapshot is
// always the defaults; the saved mix re-renders in right after hydration.
const FX_KEY = "sparkle-cone-fx-v2";
const listeners = new Set<() => void>();
let cache: FxConfig = defaultFx;
let loaded = false;

export function getFx(): FxConfig {
  if (!loaded) {
    loaded = true;
    try {
      const saved = localStorage.getItem(FX_KEY);
      if (saved) {
        // Per-layer merge so configs saved before a field existed still pick
        // up its default.
        const parsed = JSON.parse(saved) as Partial<Record<LayerKey, object>>;
        cache = Object.fromEntries(
          Object.entries(defaultFx).map(([k, v]) => [k, { ...v, ...parsed[k as LayerKey] }]),
        ) as FxConfig;
      }
    } catch {
      // Bad/unavailable storage; defaults stand.
    }
  }
  return cache;
}

export function getServerFx(): FxConfig {
  return defaultFx;
}

export function setFx(next: FxConfig) {
  cache = next;
  try {
    localStorage.setItem(FX_KEY, JSON.stringify(next));
  } catch {
    // Storage full/blocked — the panel still works for this session.
  }
  listeners.forEach((l) => l());
}

export function subscribeFx(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const LAYERS: LayerKey[] = ["sparkles", "atoms", "notation", "structures", "callouts"];

type SliderDef = { key: "density" | "size" | "opacity"; min: number; max: number; step: number };

const DENSITY: SliderDef = { key: "density", min: 0.5, max: 2, step: 0.25 };
const OPACITY: SliderDef = { key: "opacity", min: 0.05, max: 1, step: 0.05 };

const DRAWERS: Partial<Record<LayerKey, SliderDef[]>> = {
  atoms: [DENSITY, { key: "size", min: 0.5, max: 3, step: 0.25 }, OPACITY],
  notation: [DENSITY, OPACITY],
  structures: [DENSITY, OPACITY],
};

// One layer's colour control: an ink swatch (theme default), the named preset
// swatches, and a continuous slider across the full ramp with a live readout.
function ColorPicker({ color, onPatch }: { color: LayerColor; onPatch: (p: Partial<LayerColor>) => void }) {
  return (
    <div className={styles.panelColor}>
      <div className={styles.panelSwatches}>
        <button
          type="button"
          className={`${styles.panelSwatch} ${!color.on ? styles.panelSwatchOn : ""}`}
          style={{ background: "var(--ink)" }}
          title="ink"
          onClick={() => onPatch({ on: false })}
        />
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`${styles.panelSwatch} ${color.on && color.t === p.t ? styles.panelSwatchOn : ""}`}
            style={{ background: ramp(p.t) }}
            title={p.label}
            onClick={() => onPatch({ on: true, t: p.t })}
          />
        ))}
      </div>
      <label className={styles.panelRow}>
        <input
          type="range"
          className={styles.panelRange}
          min={0}
          max={1}
          step={0.01}
          value={color.t}
          onChange={(e) => onPatch({ on: true, t: Number(e.target.value) })}
        />
        <span className={styles.panelSwatch} style={{ background: color.on ? ramp(color.t) : "var(--ink)" }} />
        <span className={styles.panelVal}>{color.t.toFixed(2)}</span>
      </label>
    </div>
  );
}

// Dev-only tuning panel for auditioning the effect layers. Each layer with
// specifics gets a drawer: sliders (with live readouts) and, for the
// annotation layers, its own colour picker.
export function FxPanel({ value, onChange }: { value: FxConfig; onChange: (v: FxConfig) => void }) {
  const [open, setOpen] = useState<LayerKey | null>(null);

  const setLayer = (k: LayerKey, patch: Record<string, number | boolean>) =>
    onChange({ ...value, [k]: { ...value[k], ...patch } } as FxConfig);

  const setColor = (k: LayerKey, patch: Partial<LayerColor>) =>
    onChange({
      ...value,
      [k]: { ...value[k], color: { ...(value[k] as { color: LayerColor }).color, ...patch } },
    } as FxConfig);

  return (
    <div className={styles.panel}>
      <span className={styles.panelTitle}>cone fx</span>
      {LAYERS.map((k) => {
        const sliders = DRAWERS[k];
        const colorable = COLORABLE.includes(k);
        const hasDrawer = !!sliders || colorable;
        return (
          <div key={k} className={styles.panelGroup}>
            <div className={styles.panelRow}>
              <label className={styles.panelName}>
                <input
                  type="checkbox"
                  className={styles.panelCheck}
                  checked={value[k].on}
                  onChange={(e) => setLayer(k, { on: e.target.checked })}
                />
                {k}
              </label>
              {hasDrawer && (
                <button
                  type="button"
                  className={styles.panelCaret}
                  onClick={() => setOpen(open === k ? null : k)}
                >
                  {open === k ? "▾" : "▸"}
                </button>
              )}
            </div>
            {hasDrawer && open === k && (
              <div className={styles.panelDrawer}>
                {sliders?.map((s) => {
                  const v = (value[k] as unknown as Record<string, number>)[s.key];
                  return (
                    <label key={s.key} className={styles.panelRow}>
                      <input
                        type="range"
                        className={styles.panelRange}
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        value={v}
                        onChange={(e) => setLayer(k, { [s.key]: Number(e.target.value) })}
                      />
                      {s.key}
                      <span className={styles.panelVal}>{v}</span>
                    </label>
                  );
                })}
                {colorable && (
                  <ColorPicker
                    color={(value[k] as { color: LayerColor }).color}
                    onPatch={(p) => setColor(k, p)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
