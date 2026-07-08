import styles from "./SparkleCone.module.scss";

export type FxConfig = {
  sparkles: boolean;
  atoms: boolean;
  notation: boolean;
  structures: boolean;
  callouts: boolean;
  density: number;
};

export const defaultFx: FxConfig = {
  sparkles: true,
  atoms: false,
  notation: false,
  structures: false,
  callouts: false,
  density: 1,
};

// Tiny external store (for useSyncExternalStore) so the config loads from and
// persists to localStorage without any setState-in-effect. Server snapshot is
// always the defaults; the saved mix re-renders in right after hydration.
const FX_KEY = "sparkle-cone-fx-v1";
const listeners = new Set<() => void>();
let cache: FxConfig = defaultFx;
let loaded = false;

export function getFx(): FxConfig {
  if (!loaded) {
    loaded = true;
    try {
      const saved = localStorage.getItem(FX_KEY);
      if (saved) cache = { ...defaultFx, ...JSON.parse(saved) };
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

const LAYERS = ["sparkles", "atoms", "notation", "structures", "callouts"] as const;

// Dev-only tuning panel for auditioning the effect layers; state persists to
// localStorage so reloads keep the mix under review.
export function FxPanel({ value, onChange }: { value: FxConfig; onChange: (v: FxConfig) => void }) {
  return (
    <div className={styles.panel}>
      <span className={styles.panelTitle}>cone fx</span>
      {LAYERS.map((k) => (
        <label key={k} className={styles.panelRow}>
          <input
            type="checkbox"
            className={styles.panelCheck}
            checked={value[k]}
            onChange={(e) => onChange({ ...value, [k]: e.target.checked })}
          />
          {k}
        </label>
      ))}
      <label className={styles.panelRow}>
        <input
          type="range"
          className={styles.panelRange}
          min={0.5}
          max={2}
          step={0.25}
          value={value.density}
          onChange={(e) => onChange({ ...value, density: Number(e.target.value) })}
        />
        density
      </label>
    </div>
  );
}
