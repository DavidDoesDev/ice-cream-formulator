# Why desktop Safari coalesces range-slider `input` events to ~10 Hz under load

Research notes, 2026-07-12. Primary sources: WebKit source at `main`
(commit `ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14`, 2026-07-12) and the Safari 18.3-era
release tag `WebKit-7620.2.4.111.6`; WebKit commit messages and bugs.webkit.org; webkit.org
and developer.chrome.com posts. All quotes are verbatim.

**TL;DR.** On macOS, WebKit delivers mouse events to the page over a *stop-and-wait* IPC
protocol: the UI process (Safari) keeps exactly one mouse event in flight and will not send
the next one until the web process replies `DidReceiveEvent` for the previous one. While an
event is in flight, newer `mousemove`s *replace* the queued one (they are folded into a
"coalesced events" list, not delivered separately). So the JS-visible `mousemove`/`input`
rate during a drag is `1 / round-trip-time`, not the hardware rate — and anything that
lengthens the round trip (main-thread tasks between events, rendering-update priority
mechanisms, layer-tree commit backpressure) divides the event rate without ever showing up
as a long rAF frame. The native thumb stalls too because on macOS the thumb is moved by
WebCore's DOM `mousemove` handler in the web process — there is no UI-process-side slider
gesture. iOS (streamed touch events, coalesced web-process-side) and Chromium (rAF-aligned
compositor-thread input queue) have pipelined designs with no per-event ack, which is why
they stay smooth. A custom `pointermove` slider rides the *same* transport (pointer events
are derived from the delivered mouse events in-process), so it cannot raise the delivery
rate by itself — the fix has to shorten/regularize the round trip and use
`getCoalescedEvents()` to recover lost samples.

---

## 1. CONFIRMED: the macOS mouse-event pipeline is serialized and ack-gated

### 1.1 UI process queues events; a newer `mousemove` replaces the queued one

`WebPageProxy::handleMouseEvent` — [Source/WebKit/UIProcess/WebPageProxy.cpp:4532-4551](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L4532-L4551):

```cpp
// If we receive multiple mousemove or mouseforcechanged events and the most recent mousemove or mouseforcechanged event
// (respectively) has not yet been sent to WebProcess for processing, remove the pending mouse event and insert the new
// event in the queue.
auto removedEvent = removeOldRedundantEvent(internals().mouseEventQueue, event.type(), { WebEventType::MouseMove, WebEventType::MouseForceChanged });
if (removedEvent && removedEvent->type() == WebEventType::MouseMove)
    internals().coalescedMouseEvents.append(CheckedRef { *removedEvent }.get());

internals().mouseEventQueue.append(event);
...
if (internals().mouseEventQueue.size() == 1) // Otherwise, called from DidReceiveEvent message handler.
    processNextQueuedMouseEvent();
```

The helper is careful never to touch the in-flight event
([WebPageProxy.cpp:4476-4489](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L4476-L4489)):

```cpp
// Must not remove the first event in the deque, since it is already being dispatched.
```

### 1.2 The next event is sent only after the web process acknowledges the previous one

`WebPageProxy::mouseEventHandlingCompleted` — invoked from the `DidReceiveEvent` IPC handler
([WebPageProxy.cpp:12910-12967](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L12910-L12967)):

```cpp
// Retire the last sent event now that WebProcess is done handling it.
auto event = internals().mouseEventQueue.takeFirst();
...
if (!internals().mouseEventQueue.isEmpty()) {
    LOG(MouseHandling, " UIProcess: handling a queued mouse event from mouseEventHandlingCompleted");
    processNextQueuedMouseEvent();
}
```

There is no timer and no rate constant anywhere in this loop: **the delivered event rate is
exactly one event per UI↔web round trip.** Your minimal-page measurement (15 ms busy-loop
per event → ~60 events/s) is this law observed directly: RTT ≈ 16 ms → ~60 Hz. Your app's
~10 Hz means RTT ≈ 100 ms during the gesture.

### 1.3 The dropped positions are folded into the next delivered event

`WebPageProxy::processNextQueuedMouseEvent`
([WebPageProxy.cpp:4610-4621](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L4610-L4621)):

```cpp
if (event->type() == WebEventType::MouseMove) {
    internals().coalescedMouseEvents.append(event);
    eventWithCoalescedEvents->setCoalescedEvents(internals().coalescedMouseEvents);
}
...
sendMouseEvent(targetFrame->frameID(), eventWithCoalescedEvents, WTF::move(sandboxExtensions));
internals().coalescedMouseEvents.clear();
```

These reappear in JS via `PointerEvent.getCoalescedEvents()` (see §4.2).

### 1.4 Ack timing: immediate for drags, deferred to the rendering update for hover

`WebPage::mouseEvent` (web process) — [Source/WebKit/WebProcess/WebPage/WebPage.cpp:4000-4030](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/WebProcess/WebPage/WebPage.cpp#L4000-L4030):

```cpp
bool shouldDeferDidReceiveEvent = [&] {
    if (!drawingArea)
        return false;
    if (mouseEvent.type() != WebEventType::MouseMove)
        return false;
    if (mouseEvent.button() != WebMouseEventButton::None)   // <-- drags excluded
        return false;
    if (mouseEvent.force())
        return false;
    return true;
}();
...
if (shouldDeferDidReceiveEvent) {
    // For mousemove events where the user is only hovering (not clicking and dragging),
    // we defer sending the DidReceiveEvent() IPC message until the end of the rendering
    // update to throttle the rate of these events to the rendering update frequency.
    // This logic works in tandem with the mouse event queue in the UI process, which
    // coalesces mousemove events until the DidReceiveEvent() message is received after
    // the rendering update.
    m_deferredDidReceiveMouseEvent = { { mouseEvent.type(), handled } };
    protect(corePage())->scheduleRenderingUpdate({ });
    return;
}

send(Messages::WebPageProxy::DidReceiveEventIPC(mouseEvent.type(), handled, std::nullopt));
```

The deferred ack is flushed in `WebPage::finalizeRenderingUpdate`
([WebPage.cpp:5500](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/WebProcess/WebPage/WebPage.cpp#L5500)).
This mechanism shipped with Safari 17: commit
[`a10c4813fe` (266341@main)](https://github.com/WebKit/WebKit/commit/a10c4813fe62020d18ca2073c2e687a9f86279af),
[bug 259408](https://bugs.webkit.org/show_bug.cgi?id=259408) — "Throttle the mousemove
event dispatch rate to a maximum of 1 per rendering update, **if the user isn't clicking or
dragging**."

**Verified in the user's exact Safari version:** the Safari 18.3-era tag has byte-identical
deferral logic, including the `button() != WebMouseEventButton::None` drag exclusion —
[`WebKit-7620.2.4.111.6` Source/WebKit/WebProcess/WebPage/WebPage.cpp:3549-3574](https://github.com/WebKit/WebKit/blob/WebKit-7620.2.4.111.6/Source/WebKit/WebProcess/WebPage/WebPage.cpp#L3549-L3574).

So during a slider drag (`NSEventTypeLeftMouseDragged` → `MouseMove` with `button == Left`),
the ack is sent as soon as the DOM `mousemove` finishes. The 10 Hz you see is *not* this
hover throttle — it is the raw stop-and-wait RTT of §1.2.

### 1.5 The native thumb is moved by that same DOM `mousemove` — so it stutters too

`SliderThumbElement::defaultEventHandler` —
[Source/WebCore/html/shadow/SliderThumbElement.cpp:332-368](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/html/shadow/SliderThumbElement.cpp#L332-L368):

```cpp
} else if (eventType == eventNames().mousemoveEvent) {
    if (m_inDragMode)
        setPositionFromPoint(LayoutPoint(mouseEvent->absoluteLocation()));
    return;
}
```

`setPositionFromPoint` computes the value and calls `input->setValueFromRenderer(valueString)`
(which fires the `input` event) and `renderer->setNeedsLayout()`
([SliderThumbElement.cpp:234-311](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/html/shadow/SliderThumbElement.cpp#L234-L311)).
There is no out-of-band native gesture on macOS: if `mousemove` delivery is gated, the thumb,
the value, and the `input` events all stall together — exactly what you measured.

---

## 2. CONFIRMED: WebKit on macOS deliberately prioritizes rendering over input IPC and timers

This is the design stance that explains "rAF healthy while input starves" being a *possible*
state at all. Two 2020 commits by Antti Koivisto:

- [`8592808511a4` (220984@main)](https://github.com/WebKit/WebKit/commit/8592808511a4f841587028d519c42eacd5f7e8ff),
  [bug 207931](https://bugs.webkit.org/show_bug.cgi?id=207931) — "[macOS] Disable RunLoop
  function dispatch when there is a pending rendering update":

  > "Functions dispatched via RunLoop::dispatch() are executed before the rendering update
  > runloop observer. This can significantly delay rendering updates as asyncronous IPC is
  > handled via this mechanism. … This patch adds a mechanims for disabling function
  > dispatch temporarily while there is a pending rendering update."

- [`d9572e322739` (220883@main)](https://github.com/WebKit/WebKit/commit/d9572e32273967658359e343e5e7c7cbb998f9a7),
  [bug 207889](https://bugs.webkit.org/show_bug.cgi?id=207889) — "[macOS] Don't fire timers
  when there is a pending rendering update".

The mechanism, `WindowEventLoop::breakToAllowRenderingUpdate()` —
[Source/WebCore/dom/WindowEventLoop.cpp:314-323](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/dom/WindowEventLoop.cpp#L314-L323):

```cpp
void WindowEventLoop::breakToAllowRenderingUpdate()
{
    // On Mac/Gtk/WPE rendering updates happen in a runloop observer.
    // Avoid running timers and doing other work (like processing asyncronous IPC) until it is completed.
    threadGlobalDataSingleton().threadTimers().breakFireLoopForRenderingUpdate();
    RunLoop::mainSingleton().suspendFunctionDispatchForCurrentCycle();
}
```

`RunLoop::suspendFunctionDispatchForCurrentCycle()` makes `RunLoop::performWork()` skip *all*
queued dispatched functions — which includes incoming-IPC dispatch, i.e. `WebPage::MouseEvent`
— for that runloop cycle
([Source/WTF/wtf/RunLoop.cpp:125-155, 185-192](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WTF/wtf/RunLoop.cpp#L125-L155)).
Relatedly, WebCore caps each timer-firing burst:
[Source/WebCore/platform/ThreadTimers.h:54-55](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/platform/ThreadTimers.h#L54-L55):

```cpp
// Fire timers for this length of time, and then quit to let the run loop process user input events.
static constexpr auto maxDurationOfFiringTimers { 16_ms };
```

**Config caveat (important, checked):** in the 18.3 tag, `breakToAllowRenderingUpdate()` is
called from `TiledCoreAnimationDrawingArea::scheduleRenderingUpdateRunLoopObserver()`
(web-process compositing). Safari 18.3 on a ≥4-core Mac uses UI-side compositing
(`RemoteLayerTreeDrawingArea`) — selection logic at
[`WebKit-7620.2.4.111.6` Source/WebKit/UIProcess/mac/WebViewImpl.mm:1246-1267](https://github.com/WebKit/WebKit/blob/WebKit-7620.2.4.111.6/Source/WebKit/UIProcess/mac/WebViewImpl.mm#L1246-L1267)
(`ENABLE(REMOTE_LAYER_TREE_ON_MAC_BY_DEFAULT)`: `numberOfPhysicalProcessorCores() >= 4`) —
and the 18.3 `RemoteLayerTreeDrawingArea` drives updates with a plain 0-delay `Timer`, not
the runloop observer (a 2023 attempt to move it to an observer,
[`465af8bb6a56` (263269@main)](https://github.com/WebKit/WebKit/commit/465af8bb6a56), is not
present in the 18.3 file). So on 18.3 the *explicit* IPC-suspension likely isn't the active
path; it's cited here as the documented priority stance, and because the same starvation
shape arises anyway from the stop-and-wait protocol interleaving with per-frame work.

Also confirmed in the 18.3 UI-side-compositing path: rendering updates are backpressured on
the UI process — a new update is deferred while `m_waitingForBackingStoreSwap` (i.e. until
the UI process accepts the previous layer-tree commit),
[`WebKit-7620.2.4.111.6` RemoteLayerTreeDrawingArea.mm:440-462](https://github.com/WebKit/WebKit/blob/WebKit-7620.2.4.111.6/Source/WebKit/WebProcess/WebPage/RemoteLayerTree/RemoteLayerTreeDrawingArea.mm#L440-L462).
Heavy commits (a large React page) stretch this loop without necessarily stretching
rAF-to-rAF time.

Background on the event-loop model, from webkit.org ("Speedometer 3.0", Mar 2024,
[webkit.org/blog/15131](https://webkit.org/blog/15131/speedometer-3-0-the-best-way-yet-to-measure-browser-performance/)):

> "Thanks to HTML5's event loop processing model, browser engines update the rendering of
> web pages after all requestAnimationFrame are called before the next zero-delay timer fires."

---

## 3. CONFIRMED: why iOS and Chromium don't do this

### 3.1 iOS: touch events are streamed and coalesced web-process-side (pipelined, not stop-and-wait)

The iOS UI process sends every touch event as it arrives, with an async reply — it never
holds events back waiting for the previous ack. `WebPageProxy::handlePreventableTouchEvent` /
`sendPreventableTouchEvent` / `sendUnpreventableTouchEvent`
([WebPageProxy.cpp:5150-5299](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L5150-L5299)):
each calls `sendWithAsyncReplyToProcessContainingFrame(..., Messages::EventDispatcher::TouchEvent(...))`
directly; for passive-handler cases it even downgrades to fire-and-forget:

```cpp
if (touchEventsTrackingType == TrackingType::Asynchronous) {
    // ... We can use asynchronous dispatch and pretend to the client that the page does nothing with the events.
    event.setCanPreventNativeGestures(false);
    handleUnpreventableTouchEvent(event);
```

In the web process, touch events land on a dedicated background queue and are coalesced
*there*, so the main thread always drains the latest position in one hop —
`EventDispatcher::touchEvent`,
[Source/WebKit/WebProcess/WebPage/EventDispatcher.cpp:243-283](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/WebProcess/WebPage/EventDispatcher.cpp#L243-L283):

```cpp
m_queue(WorkQueue::create("com.apple.WebKit.EventDispatcher"_s, WorkQueue::QOS::UserInteractive))
...
// Coalesce touch move events.
if (touchEvent.type() == WebEventType::TouchMove && touchEventData.event.type() == WebEventType::TouchMove) {
```

Net: on iOS, a busy main thread degrades *latency* by at most one task-queue drain; on
macOS a busy main thread degrades *throughput* multiplicatively, because every event pays a
full round trip before the next may even be sent.

### 3.2 Chromium: continuous input is queued on the compositor thread and dispatched rAF-aligned

Chrome for Developers, "Aligned input events"
([developer.chrome.com/blog/aligning-input-events](https://developer.chrome.com/blog/aligning-input-events)):

> "Starting in Chrome 60, the input pipeline will delay dispatching continuous events
> (`wheel`, `mousewheel`, `touchmove`, `pointermove`, `mousemove`) and dispatch them right
> before the `requestAnimationFrame()` callback occurs."

Coalescing happens in the renderer's compositor-thread event queue; there is no per-event
browser↔renderer ack gate. Worst case under load is one frame of coalescing — event rate
tracks the frame rate (your Chromium observation), never collapses below it.

---

## 4. CONFIRMED: what a custom pointer-driven slider can and cannot do

### 4.1 `pointermove` is derived from the same delivered mouse event — same transport, same gating

On macOS, WebCore synthesizes pointer events *from the DOM mouse event* inside the web
process: `PointerCaptureController::pointerEventForMouseEvent`
([Source/WebCore/page/PointerCaptureController.cpp:394](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/page/PointerCaptureController.cpp#L394)).
One delivered `mousemove` → one `pointermove`. **Handling `pointermove` instead of the
native gesture does not increase delivery frequency** — your capture-phase measurement
(10 Hz at native capture, independent of React) already proved the gating is upstream of
DOM dispatch.

### 4.2 …but each delivered event carries the dropped samples: `getCoalescedEvents()`

`PointerEvent` builds its coalesced list from the mouse event's coalesced list —
[Source/WebCore/dom/PointerEvent.cpp:173-190](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/dom/PointerEvent.cpp#L173-L190):

```cpp
// Populated in accordance with the https://www.w3.org/TR/pointerevents3/#populating-and-maintaining-the-coalesced-and-predicted-events-lists spec.
for (Ref coalescedMouseEvent : mouseEvent.coalescedEvents()) {
    Ref pointerEvent = PointerEvent::create(type, button, coalescedMouseEvent.get(), pointerId, pointerType, ...);
```

Shipped in the user's Safari: WebKit blog, "WebKit Features in Safari 18.2"
([webkit.org/blog/16301](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/)):

> "The `getCoalescedEvents()` method returns a sequence of `PointerEvent` instances that
> were coalesced (merged) into a single `pointermove`."

So even at 10 Hz dispatch, the full ~100 Hz position history is recoverable per event.
(Note: coalesced events exist on `pointermove` only, not on the native `input` event — a
custom slider is required to exploit this.)

---

## 5. PLAUSIBLE BUT UNCONFIRMED

- **Why the RTT is ~100 ms specifically.** There is no 100 ms constant in the mouse path.
  (Red-herring alert: `fakeMouseMoveShortInterval = { 100_ms }` in
  [EventHandler.cpp:216](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebCore/page/EventHandler.cpp#L216)
  belongs to the *synthetic hover mousemove after scrolling* machinery, not to real event
  delivery.) The confirmed protocol makes rate = 1/RTT; the ~100 ms must be assembled from
  several per-cycle waits: IPC dispatch queued behind unaligned main-thread tasks
  (your setInterval repro), rendering-update work triggered *by* the event landing between
  arrival and ack, layer-tree commit encode/apply and the `waitingForBackingStoreSwap`
  backpressure (§2), and UI-process per-event work during drags (each dragged `mousemove`
  synchronously creates two Mach sandbox extensions for `com.apple.iconservices` —
  [WebPageProxy.cpp:4605-4608](https://github.com/WebKit/WebKit/blob/ac97ce8ceae40a5da3237ca72038ba2d4c9ebd14/Source/WebKit/UIProcess/WebPageProxy.cpp#L4605-L4608) —
  and calls `[NSWindow windowNumberAtPoint:]`, a window-server round trip, per event).
  Which of these dominates in our app is not established by any primary source.
- **AppKit/window-server coalescing as a second-order contributor.** If Safari's UI-process
  main thread is occupied applying large RemoteLayerTree commits from our page, AppKit's own
  mouse-dragged coalescing would thin the NSEvent stream before WebKit ever sees it. Not
  evidenced in WebKit source (it would live in AppKit); consistent with, but not required
  by, the measurements.
- **Why rAF-driven DOM writes don't suppress but setInterval-driven ones do.** Consistent
  with the confirmed architecture (rAF work happens *inside* the already-scheduled rendering
  update, so it adds no extra tasks or extra rendering updates between IPC arrival and ack;
  timer work fragments the runloop and schedules additional updates) and with WebKit's
  documented rendering-first priorities (§2) — but the specific 6x gap is our inference, not
  a sourced mechanism.
- **No open WebKit bug found for this exact symptom.** Searches on bugs.webkit.org
  (`mousemove coalesce`, `mousemove throttle`, `slider drag mousemove`) surfaced nothing
  matching "drag events collapse to ~10 Hz while main thread is 60 fps". Filing one with the
  minimal repro would be legitimate.

---

## 6. Implications for our fix

The evidence supports a two-pronged fix; neither prong alone is sufficient:

1. **Make the gesture cheap to ack — this is the actual lever on event rate.** Delivered
   rate is `1/RTT` (§1.2), and RTT is inflated by main-thread tasks and rendering updates
   scheduled *between* events. During the drag: no React commits (defer to gesture end),
   no setInterval/setTimeout-driven DOM work, all visual updates inside a single rAF loop
   (your own measurement shows the rAF loop does not suppress delivery). The minimal-page
   datum (15 ms/event → 60/s) is the ceiling to aim for: keep per-event work + per-frame
   work under one frame and delivery returns to ~60 Hz.
2. **Own the slider via pointer events, but for the right reason.** `pointerdown` +
   `setPointerCapture` + `pointermove` does **not** bypass the transport gate (§4.1) — it
   will arrive at the same rate as the native gesture. What it buys:
   - decoupling: we compute the value and update the thumb with a cheap transform/CSS write
     in rAF, instead of WebCore's `setNeedsLayout` per move (§1.5), and we choose when the
     expensive solve runs (once per rAF on the latest value, never per event);
   - `getCoalescedEvents()` (§4.2, Safari 18.2+) to recover the full pointer trace per
     delivery, so even a degraded 10–20 Hz dispatch yields smooth value interpolation;
   - freedom to commit React state only on `pointerup`/`lostpointercapture`.
3. **Don't chase per-event-type workarounds.** `mousemove`, `pointermove`, and the native
   range gesture are one pipeline on macOS; `touch-action`/passive-listener tricks are
   irrelevant here (that's the iOS/Chromium touch machinery). The only inputs that escape
   the main-thread mouse path in WebKit are wheel and (on iOS) touch, via `EventDispatcher`'s
   background queue (§3.1) — not usable for a mouse drag.

Diagnostic tip for verifying in the app: both sides of the protocol log to the
`MouseHandling` channel (`LOG_WITH_STREAM(MouseHandling, ...)` — "UIProcess: sent mouse
event … (queue size …, coalesced events size …)"), so a debug WebKit build (or enabling the
log channel) shows the queue depth and coalescing live.
