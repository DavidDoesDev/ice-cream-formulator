# WebKit bug report draft (file at https://bugs.webkit.org)

Suggested component: **WebKit → UI Events** (or Forms, secondary).
Platform: macOS. Version: Safari 18.3 (`WebKit-7620.2.4.111.6`); behavior
verified present in `main` @ `ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14`.

Everything below the line is the proposed report body. Companion evidence in
this repo: `docs/research/webkit-range-slider-event-throttling.md` (full
source-level analysis), `docs/research/slider-probe.html` (probe page).

**BEFORE FILING:** run the inline `repro.html` once in real Safari and drag
slider A with the checkbox on. Our 10Hz measurements came from the full app
(React commits + solve); the minimal timer-work repro is derived from the
mechanism but hasn't itself been measured. If the collapse is milder than
~10Hz, update the "Actual results" numbers to what the repro shows and keep
the app-page measurement as the motivating real-world case.

---

## Title

macOS: mouse-drag event delivery is ack-serialized, so `<input type=range>`
drags degrade to ~10Hz — thumb visibly stutters — when the page does
main-thread work between events, despite 60fps rAF cadence

## Summary

On macOS, mouse events are delivered to the web process one-at-a-time: the UI
process holds the next event until `DidReceiveEvent` acknowledges the previous
one, and newer `mousemove`s replace the queued one
(`WebPageProxy::handleMouseEvent`, `mouseEventHandlingCompleted`,
`processNextQueuedMouseEvent`). The JS-visible event rate during a drag is
therefore `1 ÷ round-trip-time` — there is no rate floor. Any main-thread work
that runs between deliveries (framework commits, timers — scheduling doesn't
matter) lengthens the round trip and divides the event rate, without ever
producing a long rAF frame that profiling would surface.

Because on macOS the range thumb is moved by the DOM `mousemove` handler in
the web process (`SliderThumbElement::defaultEventHandler` →
`setPositionFromPoint`; there is no UI-side gesture), the **native control
itself stutters** at the same rate. On a moderately busy real-world page we
measured drags at ~10 events/second (round trip ≈ 100ms) with the main thread
idle at 60fps and worst rAF frame ≤ 25ms.

iOS is unaffected (touch events are streamed per-event with async replies and
coalesced web-process-side on the EventDispatcher queue); Chromium is
unaffected (continuous input is rAF-aligned from the compositor queue — worst
case one frame of coalescing). The same page is smooth on both.

Note the asymmetry with hover: `WebPage::mouseEvent` intentionally defers the
ack for button-less mousemoves to the end of the rendering update ("to
throttle the rate of these events to the rendering update frequency"), but
**drags are explicitly excluded** (`button != None`), so drag delivery has no
frame alignment at all — it is purely ack-gated, and behaves *worse* than
hover on a busy page.

## Steps to reproduce

1. On macOS, open the attached `repro.html` (inline below) in Safari.
2. Drag slider A back and forth for ~3 seconds with a mouse or trackpad.
   Note the events/second readout (~100/s) and the smooth thumb.
3. Check the "main-thread work between events" box (a `setTimeout` loop
   burning ~12ms every 50ms — simulating framework work during a drag).
4. Drag slider A again for ~3 seconds.

```html
<!doctype html>
<meta charset="utf-8">
<title>range drag event starvation (macOS)</title>
<body style="font: 14px ui-monospace, monospace; padding: 2em">
<p>A: <input type="range" id="a" min="0" max="1000" step="any" style="width: 420px">
   <span id="rate">–</span></p>
<label><input type="checkbox" id="work"> main-thread work between events (~12ms per 50ms)</label>
<p id="fps"></p>
<script>
  // events/sec over a rolling 3s window
  let times = [];
  a.addEventListener("input", () => {
    const t = performance.now();
    times.push(t);
    times = times.filter((x) => t - x < 3000);
    const span = (t - times[0]) / 1000;
    rate.textContent = `${times.length} ev · ${span > 0.2 ? (times.length / span).toFixed(1) : "–"}/s`;
  });
  // periodic main-thread work, timer-scheduled (like framework commits)
  let on = false;
  work.addEventListener("change", (e) => { on = e.target.checked; });
  (function tick() {
    if (on) { const t0 = performance.now(); while (performance.now() - t0 < 12) {} }
    setTimeout(tick, 50);
  })();
  // show that rAF cadence stays healthy throughout
  let last = performance.now(), worst = 0, frames = 0, t0 = last;
  (function loop(t) {
    worst = Math.max(worst, t - last); last = t; frames++;
    if (t - t0 > 1000) { fps.textContent = `${frames}fps, worst frame ${worst.toFixed(0)}ms`; frames = 0; worst = 0; t0 = t; }
    requestAnimationFrame(loop);
  })(performance.now());
</script>
```

## Expected results

Event delivery (and the native thumb) stay near the hover path's behavior —
roughly one event per rendering update (~60/s) — since the main thread is
demonstrably keeping 60fps with headroom.

## Actual results

Events/second collapse toward `1 ÷ (ack round trip)` — with enough interleaved
work, ~10–20/s — and the native thumb visibly stutters under the pointer,
while the fps readout stays at 60fps with modest worst-frames. On a real
application page (React commits + a ~12ms computation per drag event) we
measured a sustained 10Hz lock: each delivery triggered work whose round-trip
cost gated the next delivery.

## Analysis (WebKit source)

- UI process keeps one mouse event in flight; newer moves replace the queued
  one: `WebPageProxy::handleMouseEvent`,
  `Source/WebKit/UIProcess/WebPageProxy.cpp` ("If we receive multiple
  mousemove … remove the pending mouse event and insert the new event in the
  queue").
- Next event ships only from the ack: `WebPageProxy::mouseEventHandlingCompleted`
  ("Retire the last sent event now that WebProcess is done handling it") →
  `processNextQueuedMouseEvent()`.
- Drags are excluded from the hover-path rendering-update deferral:
  `WebPage::mouseEvent` (`mouseEvent.button() != WebMouseEventButton::None`
  returns false from `shouldDeferDidReceiveEvent`).
- The macOS range thumb is DOM-event-driven:
  `SliderThumbElement::defaultEventHandler` → `setPositionFromPoint` →
  `setValueFromRenderer` — so delivery rate is thumb rate.
- Dropped samples are preserved (`internals().coalescedMouseEvents` →
  `PointerEvent.getCoalescedEvents()`), which helps JS reconstruct the path
  but does not help the native thumb or event cadence.

## Why this matters

Real pages do work in response to drag events — that is the point of dragging
a slider. Under this design, the work's cost is charged against the *event
rate* rather than the frame rate, so the degradation is invisible to rAF-based
profiling and to developers testing on iOS or Chromium. Authors who discover
it have no direct recourse: pointer events ride the same delivery, so even a
custom slider cannot raise its own input rate.

## Possible directions

- Extend the hover-path rendering-update alignment to button-down mousemoves,
  so drag delivery is frame-aligned rather than ack-gated (matching Chromium's
  model and WebKit's own hover behavior).
- Or pipeline mouse deliveries like iOS touch (async replies, web-process-side
  coalescing on the EventDispatcher queue).
- Independent quick win: move the macOS slider thumb from the DOM event
  handler to a UI-process-side gesture so the native control tracks the
  pointer regardless of page load (as it effectively does on iOS).
