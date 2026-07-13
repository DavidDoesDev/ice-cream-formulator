// Off-main-thread solve for the mid-drag preview (#55). macOS WebKit delivers
// mouse events stop-and-wait — the next event ships only after the previous
// one's dispatch is acked — so main-thread JS during a slider gesture
// stretches the round trip and starves the gesture (measured: the ~12ms solve
// at ~12Hz cut event delivery from ~100Hz to ~10Hz, even scheduled via rAF).
// Out here it costs the gesture nothing; MacrosPanel paints replies from its
// rAF loop. See docs/research/webkit-range-slider-event-throttling.md.
import {
  setMacroTarget,
  setTraceMacro,
  workspaceRatios,
  type LiveWorkspace,
  type WorkspaceDeps,
} from "@/lib/live-workspace";
import type { MacroRatios } from "@/lib/formula-engine";
import { getPresetById, registerCustomPreset } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import type { MixPreset } from "@/data/types";

const deps: WorkspaceDeps = {
  getPreset: getPresetById,
  resolveIngredient: (id) => getIngredientById(id)?.macros,
};

// Mirrors TRACE_MACROS on the formula page: these are dosed directly, not
// routed through the whole-recipe solve (alcohol included — see page.tsx).
const TRACE = new Set<keyof MacroRatios>(["stabilizer", "emulsifier", "alcohol"]);

export interface PreviewRequest {
  seq: number;
  ws: LiveWorkspace;
  macro: keyof MacroRatios;
  target: number;
  customPresets?: MixPreset[];
}

export interface PreviewReply {
  seq: number;
  // Echo of the request, so the panel can calibrate its local linear model
  // ratios(target) — replies arrive bursty during a Safari gesture (worker
  // messages are macrotasks, deferred like all async work), so the display
  // interpolates on the pointer value instead of waiting on replies.
  macro: keyof MacroRatios;
  target: number;
  ratios: MacroRatios;
}

self.onmessage = (e: MessageEvent<PreviewRequest>) => {
  const { seq, ws, macro, target, customPresets } = e.data;
  // This worker has its own module registry — re-register the formula's
  // custom presets each request (cheap, and picks up live edits).
  for (const p of customPresets ?? []) registerCustomPreset(p);
  const next = TRACE.has(macro)
    ? setTraceMacro(ws, macro, target, deps)
    : setMacroTarget(ws, macro, target, deps);
  const reply: PreviewReply = { seq, macro, target, ratios: workspaceRatios(next, deps) };
  self.postMessage(reply);
};
