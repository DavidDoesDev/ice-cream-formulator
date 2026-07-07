# Known issue: stabilizer / emulsifier sliders feel unresponsive

Status: **root-caused & fixed** — the Safari-specific lag was a main-thread
saturation problem, reproduced and measured in WebKit (see "Root cause", below).
Pending final user confirmation in real Safari.

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
- **Drag-lock release moved off the input's own pointer events.** The slider held
  a per-drag lock (thumb follows the pointer, not the re-solved ratio) and cleared
  it on the input's `pointercancel`/`pointerup`. Safari fires `pointercancel` on a
  native range input the moment its slider gesture claims the pointer — mid-drag —
  which cleared the lock, so the controlled thumb snapped back to the solved ratio
  each frame and fought the pointer. Release is now watched at the window level
  (`pointerup`/`mouseup`/`touchend`), which fires only on genuine release in every
  engine. Kept, but was not the main cause (below).
- **Auto-save debounced.** The formula auto-saved in a `useEffect` keyed on `ws`,
  which changes on *every* drag frame, so `saveFormula` (a synchronous
  `localStorage.setItem` of the whole formula) ran per frame. A real per-frame
  cost — now debounced ~400ms with a flush-on-unmount — but not the dominant one
  (below). (`src/app/formula/[id]/page.tsx`)

## Root cause (measured in WebKit)

Reproduced with a Playwright driver dragging the Fat slider fast in **WebKit
(Safari's engine) vs Chromium**, capturing frame cadence + cup re-renders:

- Before: **WebKit ~21fps, 477/502 frames dropped, worst frames 80–94ms**;
  Chromium ~59fps, 26 dropped. Same code, ~3× worse in Safari.

The continuous re-solve ran **once per input event**. Each solve (a whole-recipe
NNLS re-derivation) spikes to ~30–50ms, and the `PintCup` — an SVG with a
per-frame `requestAnimationFrame` ripple — re-rendered on every event too.
WebKit's JS engine runs the solve slower than V8 *and* repaints SVG far more
slowly, so the main thread saturated: pointer moves themselves queued up, which is
exactly the user's "on delay", and the controlled thumb committing stale solved
values a frame late is the "snap back". Chromium's faster engine hid the same
inefficiency.

## Fix (three layers, `MacrosPanel` + `PintCup`)

1. **Thumb decoupled from the solve.** During a drag the thumb follows the pointer
   via cheap local `drag` state; the solve is separate.
2. **Solve throttled to ~11/sec** (`SOLVE_THROTTLE_MS`, leading + trailing, flushed
   on release). The cup/recipe stay visibly live; the main thread stays free for a
   60fps thumb. (Per-frame coalescing alone still capped Safari at ~28fps — a
   time throttle was needed.)
3. **`PintCup` memoized** so it only repaints when ratios actually change, not on
   every input event.
4. **Drag-lock release** moved off the input's Safari-hijacked `pointercancel` to
   window-level pointer/mouse/touch events (kept; minor).

After: **WebKit ~59fps, 14 dropped frames, cup re-renders 3240 → 156**, and the
drag completes promptly instead of the main thread backing up.

## If the user still reports trace-slider trouble specifically

The above fixed the general Safari lag. If stabilizer/emulsifier still feel dead
in isolation, the remaining hypotheses are perceptual (0–0.8% travel is tiny) or
range-too-tight (`computeSliderBounds` for a 0-target emulsifier is
`[0, tolerance]`) — consider a numeric stepper alongside the slider.

## Relevant code

- `src/components/formula/MacrosPanel/index.tsx` — slider rendering, drag tracking.
- `src/lib/live-workspace.ts` — `setTraceMacro`.
- `src/app/formula/[id]/page.tsx` — `onMacroTarget`, `AUTO_ACTIVATE`, `TRACE_MACROS`.
- `src/lib/macro-bands.ts` — `computeSliderBounds` (via `sliderGeometry`).
