"use client";
import { useState } from "react";
import { devSeam } from "@/dev-seam";
import { DevPanel } from "../_shell/DevPanel";
import { Slider, Toggle } from "../_shell/controls";

// Tool: dial the atoms-cloud parallax. `depthShift` is a canvas/JS value read
// per-frame in Atoms.tsx's draw loop — not a CSS var — so it exercises the JS
// seam. Its effect is *motion*, invisible in a still frame, so the tool ships a
// perception aid (auto-orbit) that drives the pointer for you.

const DEFAULTS = { depthShift: 30 };
const KEY = "devtools:atoms-physics";

// Rehydrate a persisted overlay onto the seam once, before first render.
function hydrate(): number {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (typeof saved.depthShift === "number") {
      devSeam.atoms.depthShift = saved.depthShift;
    }
  } catch {
    // ignore bad storage
  }
  return devSeam.atoms.depthShift;
}

export function AtomsPhysicsTool() {
  const [depthShift, setDepthShift] = useState(hydrate);
  const [autoOrbit, setAutoOrbit] = useState(devSeam.atoms.autoOrbit);
  const [frozen, setFrozen] = useState(devSeam.atoms.frozen);

  const setShift = (v: number) => {
    devSeam.atoms.depthShift = v; // live overlay onto the app-owned seam
    localStorage.setItem(KEY, JSON.stringify({ depthShift: v }));
    setDepthShift(v);
  };

  const setOrbit = (v: boolean) => {
    devSeam.atoms.autoOrbit = v; // perception aid — never baked
    setAutoOrbit(v);
  };

  const setFreeze = (v: boolean) => {
    devSeam.atoms.frozen = v; // perception aid — pause to inspect; never baked
    setFrozen(v);
  };

  const onExport = () => {
    const changed =
      Math.abs(depthShift - DEFAULTS.depthShift) > 0.001
        ? `- DEPTH_SHIFT: ${DEFAULTS.depthShift} → ${depthShift}`
        : "(no changes from defaults)";
    const md = `## Tuned: atoms physics

### Changed values
${changed}

### Apply
Update \`DEPTH_SHIFT\` in \`src/components/home/SparkleCone/Atoms.tsx\` (baked default now lives in \`src/dev-seam.ts\`).`;
    navigator.clipboard.writeText(md);
  };

  return (
    <DevPanel title="atoms · physics" onExport={onExport}>
      <Slider
        label="depth shift"
        note="parallax swing at apex"
        unit="px"
        value={depthShift}
        min={0}
        max={80}
        step={1}
        onChange={setShift}
      />
      <Toggle
        label="auto-orbit"
        note="perception aid: shows the motion"
        checked={autoOrbit}
        onChange={setOrbit}
      />
      <Toggle
        label="freeze"
        note="perception aid: hold a still frame"
        checked={frozen}
        onChange={setFreeze}
      />
    </DevPanel>
  );
}
