# Known issue: macro sliders lag in desktop Safari (#55)

Status: **mechanism fully understood (research + v9); smooth-but-not-live fix
works (v11/v14); every attempt to add mid-drag liveness back has re-triggered
suppression (v10, v12, v13, v15, v16). Current deployed: v16.** See
`docs/research/webkit-range-slider-event-throttling.md` for the WebKit
internals (primary-sourced).

## The mechanism (research, confirmed in WebKit source)

macOS WebKit sends mouse events to the web process **stop-and-wait**: one
event in flight, the next ships only after the previous is ACKED
(`WebPageProxy::handleMouseEvent` → `mouseEventHandlingCompleted` →
`processNextQueuedMouseEvent`); newer moves replace the queued one. JS-visible
event rate = **1 / round-trip-time** — 10Hz means RTT ≈ 100ms. The native
thumb is moved BY the DOM event in the web process
(`SliderThumbElement::defaultEventHandler`), so it stutters at the same rate.
Rendering preempts async-IPC processing per runloop cycle, and layer-tree
commit backpressure (`waitingForBackingStoreSwap`) gates the next event. iOS
touch is pipelined/coalesced off-thread; Chromium aligns input to frames —
neither has the failure mode. No matching WebKit bug exists (worth filing).

## The version ladder (all measured in real Safari 18.3, `?perf=1` HUD)

| v | During-drag behavior | nat (events) | verdict |
|---|---|---|---|
| v6–v8 | uncontrolled inputs, rAF setDrag renders + 90ms-throttle commits | ~20 | jerky |
| v9 | `?freeze=1`: NOTHING (imperative fill only, solve on release) | **365** | smooth |
| v10 | imperative fill + 90ms-throttle commits (no per-frame renders) | 25 | jerky — event rate locks to commit rate; 1 commit ≈ 100ms blackout |
| v11 | imperative fill + commits ONLY on ≥140ms pause/release | **277** | smooth but nothing else updates mid-drag |
| v12 | v11 + solve+preview (siblings+cup) IN the input handler | 21 | jerky |
| v13 | v12's preview moved to a drag-scoped 80ms `setInterval` | 35 (7 mid-drag commits) | jerky |
| v15 | preview moved into a rAF loop (research-informed) | 38 (10 mid-drag commits) | jerky |
| v16 | rAF preview, CUP ONLY (no sibling `el.value` writes) | 17 (7 mid-drag commits) | jerky |

Key confound discovered in the ladder: **v13/v15/v16 all show mid-drag quiet
commits firing** (`solve` 7–10) — once any disturbance gaps events past the
140ms quiet window, a commit fires, its ~100ms blackout guarantees the next
gap, and the loop locks at commit cadence. The preview's own cost and the
commit amplifier have never been separated experimentally.

## Open theories (ranked) — next experiments

1. **Quiet-commit feedback amplifier (T1, primary).** The preview only needs
   to cause ONE ≥140ms event gap; the mid-drag commit it triggers guarantees
   the next. Predicts: cup preview with mid-drag commits DISABLED (commit on
   release only) recovers high `nat`. Cheapest, strongest-evidence experiment.
2. **The ~12ms solve JS itself (T2).** Even inside rAF it stretches the
   rendering update the ACK rides on; if the ack slips runloop cycles
   non-linearly this could dominate. Predicts: cup preview WITHOUT solve
   (e.g. geometric interpolation, or solve every 300ms+) recovers `nat`.
3. **SVG polygon invalidation class (T3).** Polygon `points` changes on 5–7
   clipped polygons may trigger a heavier repaint/commit than the wave's
   single path-`d` mutation (which is proven free at 60fps). Predicts:
   water-path-only preview is free; polygons alone suppress.
4. **Native form-control repaint (T4, weakened).** Was the rationale for v16
   (dropping sibling `el.value` writes) — v16 still suppressed, so siblings
   were not the (only) cost. Possibly a contributor.

## Current symptom (sharpened 2026-07-11)

- The **big-macro sliders** (fat, sugar, non-fat solids, alcohol) feel laggy;
  the **native thumb itself stutters** under the pointer.
- **Trace sliders feel fine** — their travel is tiny, so a 10Hz update is
  invisible there; the mechanism is the same.
- **macOS Safari only.** iOS Safari and Chromium are smooth.

## Instrumentation (all still in the tree; remove when closed)

- **PerfHud** (`src/components/shared/PerfHud`): `?perf=1` on the formula page.
  Readout: `vN fps · worst frame · nat (native input events, capture phase) ·
  in (React onChange) · solve (throttled commits) · blur! (mid-drag blurs)`.
  Click-to-copy (legacy execCommand fallback — Safari has no async clipboard on
  plain-http localhost).
- **`public/slider-probe.html`**: React-free sliders with toggles for every
  eliminated hypothesis (write-back modes, app CSS, grain, backdrop-blur, heavy
  handlers, pointermove listener, sibling writes, rAF churn).
- **Debug flags on the formula page**: `?hide=cup,recipe,grain,header`
  (cup/recipe in page.tsx; grain/header stripped by PerfHud via direct DOM),
  `?freeze=1` (drag does zero React work; solve on release).
- **`cache/`** (gitignored): `safari-drag-probe.mjs` (drives REAL Safari via
  safaridriver — WARNING: never call WebDriver `window/fullscreen`, it wedges
  Safari's session pairing until Safari restarts), `drag-smoke.mjs` (Playwright
  functional drag check), `solve-bench-entry.ts` (V8-vs-JSC solve benchmark).

## Fact table (measured in real Safari 18.3, trackpad, 2026-07-11/12)

| Experiment | Result |
|---|---|
| Bare `<input type=range>` on minimal page | **~100 ev/s** |
| + same-value write-back in handler | ~108/s |
| + async (100ms) stale write-back | ~98/s |
| + sync stale write-back (React-controlled-restore-alike) | ~103/s |
| + app's slider CSS replica | ~104/s |
| + grain overlay replica (mix-blend multiply) | ~104/s |
| + backdrop-filter header replica | ~108/s |
| + document pointermove capture listener | ~106/s |
| + write SIBLING slider per event | ~107/s |
| + 15ms busy work per event | **~60/s** (frame-coalesced, not 10) |
| App formula page, native capture-phase count | **~10 ev/s**, `nat == in` |
| App with `?hide=cup` / `recipe` / `cup,recipe` / `grain` / `grain,header` | still ~10/s each |
| App with solve throttle 90ms → 250ms (v7) | **~16 ev/s** — the only dial that moved it |
| Main thread during all of the above | 60fps, worst frame ≤28ms |
| Solve benchmark | JSC 11.9ms/solve vs V8 14.7ms — **JSC faster**; "Safari runs the solve slower" is refuted |

## Hypotheses eliminated (with the fix attempts that are now in the tree)

1. ~~Safari runs the solve slower~~ — JSC benches faster than V8.
2. ~~Main-thread saturation~~ — 60fps throughout; the 2026-07 fixes (throttle,
   thumb decouple, PintCup memo) stand but were not this bug.
3. ~~Mid-drag blur drops the drag lock~~ — `blur!` counter is always 0. (The
   pointer-held blur guard shipped anyway; it's correct.)
4. ~~React controlled-input restore writes stale values mid-gesture~~ — probe D
   is fine; sliders are now uncontrolled regardless (also correct to keep).
5. ~~Sibling-slider DOM writes re-latch the gesture~~ — probe H is fine; the
   sync-on-release-only effect shipped anyway.
6. ~~Compositing layers (grain multiply / backdrop-filter)~~ — replicas fine,
   AND removing the real layers from the app changed nothing.
7. ~~PintCup SVG / RecipePanel re-renders~~ — hiding them changed nothing.
8. ~~React event dispatch drops events~~ — `nat == in` always.

## Live hypothesis — RESOLVED

The v9 experiment confirmed it (see the version ladder above); the surviving
questions live in “Open theories” above.

## Fixes shipped along the way (all sound, none sufficient)

- Uncontrolled range inputs; idle-slider DOM sync only between drags.
- Drag lock in a ref (sync) + rAF-coalesced drag state for rendering.
- Blur guard while pointer held; lifetime window-level release listeners.
- PintCup waterline rAF parks during drags (`waveParked`).
- HUD + probe pages (above).

## Relevant code

- `src/components/formula/MacrosPanel/index.tsx` — sliders, drag path, flags.
- `src/components/shared/PerfHud/index.tsx` — HUD + layout-level hide flags.
- `src/app/formula/[id]/page.tsx` — `?hide=cup,recipe`, solve commit path.
- `public/slider-probe.html` — React-free hypothesis toggles.
