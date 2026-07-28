"use client";
import { useDevGate } from "./_shell/gate";
import { AtomsPhysicsTool } from "./atoms-physics/AtomsPhysicsTool";

// The single mount point. Gated: renders nothing unless dev mode is on and the
// panel is toggled visible. Add more tools here as siblings (one tabbed panel
// is the eventual home; for the spike, one tool).
export function DevTools() {
  const { visible } = useDevGate();
  if (!visible) return null;
  return <AtomsPhysicsTool />;
}
