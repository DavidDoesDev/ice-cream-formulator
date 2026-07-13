# Known issue: macro sliders lag in desktop Safari (#55)

Status: **RESOLVED (2026-07-13), pending #55 close.** Final architecture: a
drag runs zero main-thread work beyond direct DOM writes — the dragged fill/%
follow the pointer per event; the recipe solve runs in a Web Worker
(`MacrosPanel/preview.worker.ts`); replies build a sampled curve of the drag's
solve function which is interpolated (and slope-extrapolated at the leading
edge) AT THE POINTER VALUE every rAF frame to paint cup + sibling sliders;
React commits land on release only. Measured end state: ~350–390 input events
per drag vs ~20 before, smooth thumb, live cup/siblings/fill-colors. Residual:
Chromium remains somewhat smoother — it receives ~3× the input samples through
a pipeline without the stop-and-wait gate; that gap is upstream (a WebKit bug
report is warranted; none exists). The investigation also flushed out three
trace-dosing bugs, fixed in `live-workspace.ts` (alcohol as direct-dosed
choice; kind-matched trace sources; contribution-aware dosing) and page
auto-activate (capability-based carrier swap). See
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
| v17 | cup preview + commits hard-disabled until release (T1 test) | 34, solve 1 | amplifier acquitted — the preview itself was guilty |
| v18 | preview WITHOUT solve — O(1) approximation (T2 test) | **353** | **convicted: the ~12ms solve JS on the main thread** |
| v19–v21 | solve moved to a Web Worker; siblings re-enabled; per-frame easing | 342–389 | drag smooth; siblings stepped (bursty reply delivery) |
| v22–v24 | display = f(pointer): reply-calibrated line → sampled polyline | ~350 | wrong-way darts fixed by local bracketing interpolation |
| v25 | leading-edge slope extrapolation (anchored, capped) | ~350 | shipped |

Two lessons the ladder distilled: the 140ms quiet-commit debounce was an
**amplifier** (any event gap triggered a commit whose ~100ms blackout
guaranteed the next gap — v13/v15/v16 all show `solve` 7–10 mid-drag), and
the true suppressor was **any nontrivial main-thread JS during the gesture**,
regardless of scheduling (in-handler, setInterval, or rAF): it stretches the
stop-and-wait round trip that both event delivery and the native thumb ride.
Bursty worker-reply delivery (macrotasks are deferred mid-gesture too) was
then hidden by making the display a pure function of pointer position over a
sampled curve, rather than of reply arrival times.

## Current symptom (sharpened 2026-07-11)

- The **big-macro sliders** (fat, sugar, non-fat solids, alcohol) feel laggy;
  the **native thumb itself stutters** under the pointer.
- **Trace sliders feel fine** — their travel is tiny, so a 10Hz update is
  invisible there; the mechanism is the same.
- **macOS Safari only.** iOS Safari and Chromium are smooth.

## Instrumentation

Kept permanently:

- **PerfHud** (`src/components/shared/PerfHud`): `?perf=1` on the formula page.
  Readout: `fps · worst frame · nat (native input events, capture phase) ·
  in (React onChange) · solve (commits) · blur! (mid-drag blurs)`. Healthy
  Safari drag: nat/in in the hundreds over a few seconds, solve ≈ 1 per
  release, blur! 0. Click-to-copy (legacy execCommand fallback — Safari has no
  async clipboard on plain-http localhost).
- **`e2e/slider-drag.spec.ts`**: regression guard — drag moves/lands/holds,
  and siblings + cup update mid-drag via the worker preview.
- **`docs/research/slider-probe.html`** (moved out of `public/`): React-free
  sliders with toggles for every eliminated hypothesis; open via `file://`.

Removed at close: `?hide=…` and `?freeze=1` debug flags, the HUD version tag.
Local gitignored tools that existed during the hunt (`cache/`): a safaridriver
driver for REAL Safari (WARNING: never call WebDriver `window/fullscreen`, it
wedges Safari's session pairing until Safari restarts), a Playwright drag
smoke, a V8-vs-JSC solve benchmark, solver sweep/repro scripts.

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
