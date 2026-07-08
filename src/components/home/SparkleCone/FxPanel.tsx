import { useState } from "react";
import styles from "./SparkleCone.module.scss";

export type FxConfig = {
  sparkles: { on: boolean };
  atoms: { on: boolean; density: number; size: number; opacity: number };
  notation: { on: boolean; density: number; opacity: number };
  structures: { on: boolean; density: number; opacity: number };
  callouts: { on: boolean };
};

type LayerKey = keyof FxConfig;

// Opacity values are the actual target level (each layer jitters ±30% around
// it per element), so the slider reading is meaningful on its own.
export const defaultFx: FxConfig = {
  sparkles: { on: true },
  atoms: { on: false, density: 1, size: 1, opacity: 0.6 },
  notation: { on: false, density: 1, opacity: 0.5 },
  structures: { on: false, density: 1, opacity: 0.2 },
  callouts: { on: false },
};

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

// Dev-only tuning panel for auditioning the effect layers. Layers with
// specifics get a drawer of sliders, each with a live value readout so a
// preferred setting can be read off and reported.
export function FxPanel({ value, onChange }: { value: FxConfig; onChange: (v: FxConfig) => void }) {
  const [open, setOpen] = useState<LayerKey | null>(null);

  const setLayer = (k: LayerKey, patch: Record<string, number | boolean>) =>
    onChange({ ...value, [k]: { ...value[k], ...patch } } as FxConfig);

  return (
    <div className={styles.panel}>
      <span className={styles.panelTitle}>cone fx</span>
      {LAYERS.map((k) => {
        const sliders = DRAWERS[k];
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
              {sliders && (
                <button
                  type="button"
                  className={styles.panelCaret}
                  onClick={() => setOpen(open === k ? null : k)}
                >
                  {open === k ? "▾" : "▸"}
                </button>
              )}
            </div>
            {sliders && open === k && (
              <div className={styles.panelDrawer}>
                {sliders.map((s) => {
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
