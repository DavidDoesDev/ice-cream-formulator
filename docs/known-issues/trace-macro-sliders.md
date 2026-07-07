# Known issue: stabilizer / emulsifier sliders feel unresponsive

Status: **open** — user still reports problems; not root-caused. Revisit after the
reskin slices land.

## Symptom

Dragging the **stabilizer** or **emulsifier** sliders in the macros panel appears
to do "nothing" for the user. The big-macro sliders (fat, sugar, milk-solids,
alcohol) feel fine.

## What we know

- The **math is correct in isolation.** `setTraceMacro` (unit-tested) doses the
  source ingredient to hit the target exactly and holds yield. Confirmed:
  stabilizer 1.47% → 0.60%, emulsifier 0% → 0.40% via a direct module call.
- Both sliders **do respond in Chromium** when scrolled into view. A Playwright
  drag moved stabilizer 375→875 and emulsifier 0→875 (on the 0–1000 input scale),
  and emulsifier auto-activated its default (soy lecithin).
- **Emulsifier auto-activate works**: raising it from 0 swaps `emulsifier-empty`
  → `emulsifier-lecithin` (page `onMacroTarget`, `AUTO_ACTIVATE`).
- Earlier "it's stuck" test results were **false negatives**: the trace sliders
  sit below the fold in the default headless viewport, so synthetic mouse events
  missed them (`elementFromPoint` returned `null` at their coordinates). Always
  `scrollIntoViewIfNeeded()` before driving them in a test.

## What we've changed (did not fully resolve for the user)

- Slider inputs now run on a fixed **0–1000 scale** mapped to each macro's range
  (`SLIDER_SCALE` in `MacrosPanel`), to defend against browsers that mishandle
  very small float ranges (stabilizer is 0–0.008). Chromium worked without this,
  but other engines may not.
- Soy lecithin modeled as a **pure emulsifier** (no fat) so the emulsifier lever
  is clean.
- Trace macros dosed directly (`setTraceMacro`), held out of the big-macro solve,
  and normalized to the style target on workspace load.

## Leading hypotheses (untested)

1. **Browser-specific** tiny-range handling (Safari/Firefox) — the 0–1000 scale
   may already fix this; needs testing in the user's actual browser.
2. **Perception, not function**: trace amounts are tiny (0–0.8%), so the thumb
   moves a little and the cup / other sliders barely react — reads as "nothing."
3. **Continuous-drag churn**: `setTraceMacro` rescales every other mix each frame;
   verify this doesn't visually fight the dragged thumb or reset it.
4. **Range too tight to feel**: `computeSliderBounds` for a 0-target emulsifier is
   `[0, tolerance]`; the usable travel may be too small to be satisfying.

## What to try next

- Get the user's **browser + OS**; reproduce there specifically.
- Add a temporary on-screen readout of the raw slider value while dragging.
- Consider widening the trace sliders' perceptible response (e.g. a coarser
  visual scale, or a numeric stepper alongside the slider).
- Confirm the emulsifier keeps its activated preset across a full continuous drag
  (not just the first frame).

## Relevant code

- `src/components/formula/MacrosPanel/index.tsx` — slider rendering, drag tracking.
- `src/lib/live-workspace.ts` — `setTraceMacro`.
- `src/app/formula/[id]/page.tsx` — `onMacroTarget`, `AUTO_ACTIVATE`, `TRACE_MACROS`.
- `src/lib/macro-bands.ts` — `computeSliderBounds` (via `sliderGeometry`).
