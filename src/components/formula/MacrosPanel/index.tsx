"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { type MacroRatios } from "@/lib/formula-engine";
import type { LiveWorkspace } from "@/lib/live-workspace";
import type { PreviewReply } from "./preview.worker";
import { sliderGeometry } from "@/lib/macro-bands";
import { balanceReport } from "@/lib/balance";
import { relationshipHints } from "@/lib/relationships";
import type { DerivedIndices } from "@/lib/derive";
import { DEFAULT_EQUIPMENT, type EquipmentProfile } from "@/data/types";
import { equipmentInfo } from "@/lib/equipment";
import { formatPercent } from "@/lib/measure";
import { PintCup, type PintCupHandle } from "@/components/shared/PintCup";
import { perfCount } from "@/components/shared/PerfHud";
import { MacroDot, type MacroKey } from "@/components/shared/MacroDot";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Pill } from "@/components/shared/Pill";
import { Icon } from "@/components/shared/Icon";
import styles from "./MacrosPanel.module.scss";

const SLIDER_SCALE = 1000;

const SLIDERS: { key: MacroKey; label: string }[] = [
  { key: "fat", label: "Fat" },
  { key: "sugar", label: "Sugar" },
  { key: "nonfatSolids", label: "Non-fat solids" },
  { key: "stabilizer", label: "Stabilizer" },
  { key: "emulsifier", label: "Emulsifier" },
  { key: "alcohol", label: "Alcohol" },
];

// Candy fill color per macro; water reads as sky (it has no macro swatch).
function fillVar(key: MacroKey): string {
  if (key === "water") return "var(--c-sky)";
  const suffix = key === "nonfatSolids" ? "nonfat" : key;
  return `var(--color-macro-${suffix})`;
}

interface MacrosPanelProps {
  ratios: MacroRatios;
  derived: DerivedIndices;
  style: string;
  equipment?: EquipmentProfile;
  conflict: boolean;
  onMacroTarget: (macro: keyof MacroRatios, target: number) => void;
  // The live workspace, for the worker-solved mid-drag preview (cup+siblings).
  ws?: LiveWorkspace;
  onRecalibrate?: () => void;
}

// Right workspace panel: the composition as a live cup + draggable macro sliders.
// Each track marks its healthy window with edge ticks (drawn over the fill) and
// flips its fill color when the value strays out of range. Dragging re-solves
// the recipe at fixed yield (handled by the parent) continuously.
export function MacrosPanel({
  ratios,
  derived,
  style,
  equipment = DEFAULT_EQUIPMENT,
  conflict,
  onMacroTarget,
  ws,
  onRecalibrate,
}: MacrosPanelProps) {
  // #55 ROOT CAUSE: ANY React commit while desktop Safari's slider gesture is
  // active suppresses its input-event delivery (~100Hz → ~10Hz measured) and
  // stutters the native thumb — raw DOM writes do not. So a drag renders
  // NOTHING: the dragged slider's fill + % readout move via direct DOM per
  // event, and only the throttled solve below commits React work (its renders
  // briefly dent the event rate, which no longer matters — no visual rides the
  // events, and the solve only needs a fresh-enough target).
  const dragLatestRef = useRef<{ key: MacroKey; pos: number; value: number } | null>(null);

  // The range inputs are UNCONTROLLED (defaultValue + refs). Rendering them
  // controlled was the residual #55 lag: when an input event's handler doesn't
  // synchronously commit new state (ours defers to rAF + a throttle), React
  // restores the DOM value to the last rendered prop — a stale write inside the
  // event dispatch. Desktop Safari re-latches its slider gesture after any such
  // mid-drag write, gating input events to ~10Hz (measured: bare inputs deliver
  // ~100Hz; the app's controlled inputs got ~10). Uncontrolled means React
  // never writes a thumb; idle sliders are synced imperatively below and the
  // dragged one belongs to the pointer until release.
  const inputRefs = useRef(new Map<MacroKey, HTMLInputElement>());
  const fillRefs = useRef(new Map<MacroKey, HTMLSpanElement>());
  const valRefs = useRef(new Map<MacroKey, HTMLSpanElement>());

  // The drag lock, set SYNCHRONOUSLY in the input handler (before the
  // leading-edge solve commits) and cleared on genuine release/blur.
  const dragKeyRef = useRef<MacroKey | null>(null);

  // Direct-DOM writers for the drag visuals and the between-drags slider sync.
  // Both carry the in/out-of-range fill color: drags don't render, so the
  // color flip must ride the imperative path too.
  const applyFillColor = useCallback((fill: HTMLSpanElement, key: MacroKey, inRange: boolean) => {
    fill.style.background = inRange ? fillVar(key) : "";
    fill.classList.toggle(styles.fillOut, !inRange);
  }, []);
  const applyDragVisual = useCallback(
    (d: { key: MacroKey; pos: number; value: number }) => {
      const g = sliderGeometry(style, d.key, d.value, equipment);
      const fill = fillRefs.current.get(d.key);
      if (fill) {
        fill.style.width = `${(d.pos / SLIDER_SCALE) * 100}%`;
        applyFillColor(fill, d.key, g.inRange);
      }
      const val = valRefs.current.get(d.key);
      if (val) val.textContent = `${formatPercent(d.value * 100)}%`;
    },
    [style, equipment, applyFillColor],
  );
  // Land one slider's thumb/fill/readout on the given ratios, DOM-only.
  const applySliderDom = useCallback(
    (key: MacroKey, r: MacroRatios) => {
      const g = sliderGeometry(style, key, r[key], equipment);
      const span = g.max - g.min;
      const pos = span > 0 ? ((g.value - g.min) / span) * SLIDER_SCALE : 0;
      const el = inputRefs.current.get(key);
      if (el && Math.abs(parseFloat(el.value) - pos) > 1e-6) el.value = String(pos);
      const fill = fillRefs.current.get(key);
      if (fill) {
        fill.style.width = `${g.fillPct}%`;
        applyFillColor(fill, key, g.inRange);
      }
      const val = valRefs.current.get(key);
      if (val) val.textContent = `${formatPercent(g.value * 100)}%`;
    },
    [style, equipment, applyFillColor],
  );
  // Read ratios through a ref here: the release path runs from window-level
  // listeners whose closures can predate the latest commit (effects re-attach
  // after paint), and syncing from a stale closure snapped a released slider
  // back to its pre-drag position when a solve landed right before pointerup.
  const ratiosRef = useRef(ratios);
  const syncIdleSliders = useCallback(() => {
    for (const { key } of SLIDERS) {
      if (dragKeyRef.current === key) continue;
      applySliderDom(key, ratiosRef.current);
    }
  }, [applySliderDom]);

  // Mid-drag live preview: run the solve MATH (no commit) and paint the
  // sibling sliders + cup imperatively — from a drag-scoped rAF loop, time-
  // gated to ~12Hz. The scheduling is the whole point (see
  // docs/research/webkit-range-slider-event-throttling.md): macOS WebKit sends
  // mouse events stop-and-wait — the next event ships only after the previous
  // one is ACKED, so JS-visible event rate = 1/round-trip — and it defers
  // async IPC while a rendering update is in flight. Timer/microtask-driven
  // work (a setInterval preview, a React commit) therefore inflates the round
  // trip and starves the gesture (v12 in-handler: ~10Hz; v13 interval: ~35
  // events), while the same work INSIDE rAF rides a rendering update the
  // process was doing anyway (v9's per-frame wave never suppressed).
  // Solve requests are paced purely by in-flight-one (the worker's ~12ms round
  // trip → ~50-80Hz); painting runs EVERY frame, easing the displayed ratios
  // toward the latest reply so sibling thumbs/fills and the cup glide instead
  // of stepping at reply cadence. Per-frame DOM writes are the one work class
  // measured safe during a Safari gesture (v9 wave, v18-v20 ladder).
  const EASE_ALPHA = 0.3; // per-frame convergence → ~80ms settle at 60fps
  const previewRafRef = useRef<number | null>(null);
  const lastPreviewedRef = useRef<{ key: MacroKey; pos: number } | null>(null);
  const interpRef = useRef<MacroRatios | null>(null);
  const cupRef = useRef<PintCupHandle>(null);

  // The exact solve runs in a Web Worker: v17/v18 proved the ~12ms solve on
  // the MAIN thread during the gesture is what stretches the mouse-event
  // round trip (even from rAF), while DOM writes are free. Requests carry the
  // last committed workspace (constant during a drag — commits wait for
  // release), replies land in a ref, and the rAF loop below paints them.
  const wsRef = useRef(ws);
  const workerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const replyRef = useRef<PreviewReply | null>(null);
  // Piecewise-linear cache of the drag's solve function: every reply is a
  // (draggedValue → ratios) sample, kept sorted by value. Each frame the
  // display interpolates between the two samples BRACKETING the pointer, so
  // it is a pure function of pointer position (bursty reply timing can't
  // show as motion), and kinks in the true function (NNLS active-set flips)
  // are honored locally instead of being smeared by a global line fit —
  // which is what made siblings dart the wrong way and reverse (v22/v23).
  const samplesRef = useRef<{ macro: MacroKey | null; pts: { v: number; r: MacroRatios }[] }>({ macro: null, pts: [] });
  // Outstanding request, for in-flight-one pacing: {seq, t} or null. The
  // timestamp guards against a dead worker wedging the preview forever.
  const inFlightRef = useRef<{ seq: number; t: number } | null>(null);
  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const w = new Worker(new URL("./preview.worker.ts", import.meta.url));
    w.onmessage = (e: MessageEvent<PreviewReply>) => {
      const reply = e.data;
      replyRef.current = reply;
      if (inFlightRef.current && reply.seq >= inFlightRef.current.seq) inFlightRef.current = null;
      // Insert the sample sorted by dragged value (replace near-duplicates).
      const s = samplesRef.current;
      if (s.macro !== reply.macro) {
        s.macro = reply.macro as MacroKey;
        s.pts = [];
      }
      const pts = s.pts;
      let lo = 0;
      let hi = pts.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].v < reply.target) lo = mid + 1;
        else hi = mid;
      }
      if (pts[lo] && Math.abs(pts[lo].v - reply.target) < 1e-9) {
        pts[lo] = { v: reply.target, r: reply.ratios };
      } else {
        pts.splice(lo, 0, { v: reply.target, r: reply.ratios });
      }
    };
    workerRef.current = w;
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  const previewTick = useCallback(() => {
    const d = dragLatestRef.current;
    if (!d) return;
    // 1. Evaluate the sample cache AT THE CURRENT POINTER VALUE: interpolate
    //    between the bracketing samples; past either end — the leading edge of
    //    a fast sweep, where samples trail the pointer by a worker round trip —
    //    extrapolate along the end segment's slope so siblings keep moving at
    //    hand speed instead of holding and catching up. The slope anchor must
    //    span ≥5% of the sampled range (two near-identical samples give a
    //    noise slope), and the extrapolation distance is capped at 2× that
    //    span so a reply stall can't fling the display. Then ease lightly and
    //    paint cup + siblings. All DOM writes stay inside this rAF tick.
    const s = samplesRef.current;
    let target: MacroRatios | null = null;
    if (s.macro === d.key && s.pts.length > 0) {
      const pts = s.pts;
      const last = pts.length - 1;
      const extrapolate = (endIdx: number, inward: 1 | -1): MacroRatios => {
        const end = pts[endIdx];
        const range = Math.abs(pts[last].v - pts[0].v);
        const minSpan = Math.max(1e-6, range * 0.05);
        let a: { v: number; r: MacroRatios } | null = null;
        for (let i = endIdx + inward; i >= 0 && i <= last; i += inward) {
          if (Math.abs(end.v - pts[i].v) >= minSpan) {
            a = pts[i];
            break;
          }
        }
        if (!a) return end.r;
        const span = end.v - a.v;
        const dist = d.value - end.v;
        const capped = Math.max(-2 * Math.abs(span), Math.min(2 * Math.abs(span), dist));
        const t = capped / span;
        const r = {} as MacroRatios;
        for (const k of Object.keys(end.r) as (keyof MacroRatios)[]) {
          r[k] = Math.max(0, end.r[k] + (end.r[k] - a.r[k]) * t);
        }
        return r;
      };
      if (d.value <= pts[0].v) target = extrapolate(0, 1);
      else if (d.value >= pts[last].v) target = extrapolate(last, -1);
      else {
        let lo = 0;
        let hi = last;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (pts[mid].v <= d.value) lo = mid;
          else hi = mid;
        }
        const a = pts[lo];
        const b = pts[hi];
        const t = (d.value - a.v) / (b.v - a.v);
        const r = {} as MacroRatios;
        for (const k of Object.keys(a.r) as (keyof MacroRatios)[]) {
          r[k] = a.r[k] + (b.r[k] - a.r[k]) * t;
        }
        target = r;
      }
    }
    if (target) {
      const cur = interpRef.current ?? ratiosRef.current;
      const next = {} as MacroRatios;
      for (const k of Object.keys(target) as (keyof MacroRatios)[]) {
        next[k] = cur[k] + (target[k] - cur[k]) * EASE_ALPHA;
      }
      interpRef.current = next;
      cupRef.current?.preview(next);
      for (const s of SLIDERS) {
        if (s.key !== d.key) applySliderDom(s.key, next);
      }
    }
    // 2. Request the next solve for the latest pointer position — at most one
    //    in flight (stale-guard: a reply overdue >300ms unblocks the lane).
    const now = performance.now();
    const inFlight = inFlightRef.current;
    if (inFlight && now - inFlight.t < 300) return;
    const lp = lastPreviewedRef.current;
    if (lp && lp.key === d.key && Math.abs(lp.pos - d.pos) < 1e-6) return; // pointer still
    lastPreviewedRef.current = { key: d.key, pos: d.pos };
    const w = workerRef.current;
    const base = wsRef.current;
    if (w && base) {
      const seq = ++seqRef.current;
      inFlightRef.current = { seq, t: now };
      w.postMessage({
        seq,
        ws: base,
        macro: d.key,
        target: d.value,
        customPresets: base.recipe.customPresets,
      });
    } else {
      // No worker (old browser / SSR edge): cheap O(1) cup-only approximation —
      // dragged macro takes its target, water absorbs the difference.
      const r0 = ratiosRef.current;
      const delta = d.value - r0[d.key];
      const r: MacroRatios = { ...r0, [d.key]: d.value, water: Math.max(0, r0.water - delta) };
      cupRef.current?.preview(r);
    }
  }, [applySliderDom]);
  // The interval must survive re-renders without capturing stale callbacks.
  const previewTickRef = useRef(previewTick);
  useLayoutEffect(() => {
    previewTickRef.current = previewTick;
  }, [previewTick]);
  const startPreviewLoop = useCallback(() => {
    if (previewRafRef.current !== null) return;
    const loop = () => {
      previewRafRef.current = requestAnimationFrame(loop);
      previewTickRef.current();
    };
    previewRafRef.current = requestAnimationFrame(loop);
  }, []);
  const stopPreviewLoop = useCallback(() => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    lastPreviewedRef.current = null;
    interpRef.current = null; // next drag re-seeds from committed ratios
    replyRef.current = null;
    samplesRef.current = { macro: null, pts: [] };
  }, []);
  useEffect(() => stopPreviewLoop, [stopPreviewLoop]);

  // Whether a pointer/touch is physically down anywhere. Desktop Safari can
  // blur a range input mid-drag (a sibling of its pointercancel quirk, below):
  // if that blur cleared the drag lock, the thumb would fall back to the ~11Hz
  // solved ratio and rubber-band behind the pointer for the rest of the drag.
  // Blur only ends the drag once no pointer is held; keyboard adjustments
  // (no pointer down) still clear on blur as before.
  const pointerHeldRef = useRef(false);
  useEffect(() => {
    const down = () => { pointerHeldRef.current = true; };
    const up = () => { pointerHeldRef.current = false; };
    window.addEventListener("pointerdown", down);
    window.addEventListener("touchstart", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("touchstart", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  // Solve only when the pointer goes QUIET (trailing debounce), never during
  // motion. Measured (#55): one solve commit — a React render — blacks out
  // desktop Safari's input-event delivery for ~100ms during a slider gesture,
  // so any fixed-cadence commit locks the event rate to the solve rate and the
  // drag turns jerky (v10: 90ms throttle → 10Hz events; v9: zero commits →
  // ~100Hz). While events stream, the drag stays pure direct-DOM; the moment
  // they pause for SOLVE_QUIET_MS — the user slowing down to look — the solve
  // commits and the cup/grams catch up, with the blackout landing while the
  // pointer is stationary, where it can't be felt. Release flushes immediately.
  const SOLVE_QUIET_MS = 140;
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<{ macro: keyof MacroRatios; target: number } | null>(null);

  const runPending = useCallback(() => {
    timerRef.current = null;
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) {
      perfCount("commits");
      onMacroTarget(p.macro, p.target);
    }
  }, [onMacroTarget]);

  const scheduleSolve = useCallback(
    (macro: keyof MacroRatios, target: number) => {
      pendingRef.current = { macro, target };
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      // T1 (#55): NEVER commit while a pointer-drag is live. The quiet window
      // can't tell "pointer paused" from "events suppressed", and one mid-drag
      // commit's ~100ms event blackout guarantees the next ≥140ms gap — the
      // amplifier that locked v13/v15/v16 at commit cadence (`solve` was 7–10
      // during drags; it should have been 0). Pointer drags land their solve
      // at release (clearDrag → flushSolve); the trailing debounce now only
      // serves keyboard edits, where there is no gesture to starve.
      if (dragKeyRef.current !== null && pointerHeldRef.current) return;
      timerRef.current = window.setTimeout(runPending, SOLVE_QUIET_MS);
    },
    [runPending],
  );

  // Run any queued solve immediately (on release/blur) so the final target lands
  // before the drag lock clears — otherwise the thumb would settle on a stale ratio.
  const flushSolve = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) runPending();
  }, [runPending]);

  // End the drag: clear the lock, land the final solve, and let every slider
  // settle on its solved value. Used by the window-level release listeners and
  // by genuine blur. The manual sync covers the no-pending-solve case; when a
  // solve does flush, its commit re-syncs again with the fresh ratios via the
  // layout effect below.
  const clearDrag = useCallback(() => {
    stopPreviewLoop();
    dragLatestRef.current = null;
    dragKeyRef.current = null;
    flushSolve();
    syncIdleSliders();
  }, [stopPreviewLoop, flushSolve, syncIdleSliders]);

  // Release the drag lock on a real pointer release, watched at the window level.
  // The input's own `pointercancel`/`pointerup` are unreliable for this: Safari
  // fires `pointercancel` on a native range input the moment its slider gesture
  // claims the pointer — i.e. mid-drag — which would clear the lock and make the
  // controlled thumb snap back and fight the pointer every frame. Window-level
  // `pointerup`/`mouseup`/`touchend` fire only on the genuine release, in every
  // engine, so the lock holds for the whole drag and then clears cleanly.
  // Attached for the panel's whole life (not only while dragging) so a release
  // that lands before React commits the first drag frame still clears the lock.
  useEffect(() => {
    const release = () => clearDrag();
    window.addEventListener("pointerup", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
  }, [clearDrag]);

  // After every commit, before paint: re-apply the dragged slider's imperative
  // visuals on top of whatever this render wrote (solve commits render the
  // fill/readout from solved ratios, which trail the pointer), and — between
  // drags — land each idle slider's uncontrolled DOM value on its solved ratio.
  useLayoutEffect(() => {
    ratiosRef.current = ratios;
    wsRef.current = ws;
    const d = dragLatestRef.current;
    if (d && dragKeyRef.current === d.key) applyDragVisual(d);
    if (dragKeyRef.current === null) syncIdleSliders();
  });

  // Drop any queued solve on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const report = balanceReport(ratios, style, equipment);
  const offChecks = report.checks.filter((c) => c.verdict !== "ok");
  // Relationship hints, de-duped against the window checks: the scoopability
  // (firm/soft) hint restates the Sugar check when sugar is the cause, so drop it
  // when Sugar is already flagged (keeps it for the sugar-in-range/alcohol case).
  const sugarFlagged = offChecks.some((c) => c.key === "sugar");
  const hints = relationshipHints(ratios, derived, style, equipment).filter(
    (h) => !(sugarFlagged && (h.key === "firm" || h.key === "soft")),
  );
  // Only reliably-fixable issues block Balanced: the window checks and ice control
  // (Rebalance guarantees both). Sandiness and scoopability (sugar type / alcohol)
  // can't always be cleared without changing the recipe's intent, so they're
  // always-shown NOTES — surfaced even when Balanced, never faked into a fail.
  const blockerHints = hints.filter((h) => h.key === "ice-control");
  const noteHints = hints.filter((h) => h.key === "sandiness" || h.key === "firm" || h.key === "soft");
  const balanced = report.balanced && blockerHints.length === 0;
  const adviceRows: { key: string; label: string; text: string }[] = [];
  if (!balanced) {
    offChecks.forEach((c) => adviceRows.push({ key: c.key, label: c.label, text: c.advice ?? "" }));
    blockerHints.forEach((h) => adviceRows.push({ key: h.key, label: h.label, text: h.message }));
  }
  noteHints.forEach((h) => adviceRows.push({ key: h.key, label: h.label, text: h.message }));
  return (
    <section className={styles.panel}>
      <div className={styles.bar}>
        <span className={styles.kind}>Macros</span>
        {/* The (style × equipment) that define every target window (D8). */}
        <span className={styles.eyebrow}>
          {style} · <Icon name="snow" size={11} className={styles.eyebrowIcon} /> {equipmentInfo(equipment).label}
        </span>
      </div>

      <div className={styles.cupStage}>
        <PintCup ref={cupRef} ratios={ratios} size="full" width={210} />
      </div>

      <SectionHeader role="composition" label="Composition" />

      {SLIDERS.map(({ key, label }) => {
        // Render always shows solved ratios; during a drag the layout effect
        // above immediately re-applies the pointer's fill/readout on top.
        const shown = ratios[key];
        const g = sliderGeometry(style, key, shown, equipment);
        // Run the native input on a 0–1000 scale and map to the macro's range —
        // the browser mishandles very small float ranges (e.g. stabilizer 0–0.008),
        // silently dropping input events. This keeps every slider responsive.
        const span = g.max - g.min;
        const toPos = (v: number) => (span > 0 ? ((v - g.min) / span) * SLIDER_SCALE : 0);
        const fromPos = (p: number) => g.min + (p / SLIDER_SCALE) * span;
        return (
          <div key={key} className={styles.sliderRow}>
            <span className={styles.sliderKey}>
              <MacroDot macro={key} /> {label}
            </span>
            <span className={styles.sliderTrack}>
              <span
                ref={(el) => {
                  if (el) fillRefs.current.set(key, el);
                  else fillRefs.current.delete(key);
                }}
                className={`${styles.sliderFill} ${g.inRange ? "" : styles.fillOut}`}
                style={{ width: `${g.fillPct}%`, background: g.inRange ? fillVar(key) : undefined }}
              />
              <span className={styles.tick} style={{ left: `${g.bandLoPct}%` }} aria-hidden />
              <span className={styles.tick} style={{ left: `${g.bandHiPct}%` }} aria-hidden />
              <input
                type="range"
                ref={(el) => {
                  if (el) inputRefs.current.set(key, el);
                  else inputRefs.current.delete(key);
                }}
                className={styles.slider}
                min={0}
                max={SLIDER_SCALE}
                step="any"
                defaultValue={toPos(g.value)}
                aria-label={label}
                onChange={(e) => {
                  const pos = parseFloat(e.target.value);
                  const raw = fromPos(pos);
                  perfCount("inputs");
                  applyDragVisual({ key, pos, value: raw }); // direct DOM — a drag must not render
                  // Engage the drag machinery only while a pointer is truly
                  // held: range inputs fire a trailing native `change` AFTER
                  // pointerup (post-clearDrag), which would re-arm the lock and
                  // the preview loop with no release left to clear them.
                  // Keyboard edits land here too: visual + debounced solve only.
                  if (pointerHeldRef.current) {
                    dragKeyRef.current = key; // sync lock, before any commit
                    dragLatestRef.current = { key, pos, value: raw };
                    startPreviewLoop(); // siblings + cup update OFF-dispatch (see above)
                  }
                  scheduleSolve(key, raw);
                }}
                onBlur={() => {
                  // Desktop Safari blurs the input mid-drag; ignore blur while a
                  // pointer is still physically down (see pointerHeldRef above).
                  if (pointerHeldRef.current) {
                    perfCount("blurMidDrag");
                    return;
                  }
                  clearDrag();
                }}
              />
            </span>
            <span
              ref={(el) => {
                if (el) valRefs.current.set(key, el);
                else valRefs.current.delete(key);
              }}
              className={styles.sliderVal}
            >{formatPercent(shown * 100)}%</span>
          </div>
        );
      })}

      <SectionHeader role="balance" label="Balance check" />
      <p className={styles.scoreNote}>
        Each macro checked against its window for a {style.toLowerCase()} on a{" "}
        {equipmentInfo(equipment).label.toLowerCase()}
      </p>
      {conflict ? (
        <div className={styles.statusOff}>
          <span className={styles.statusMsg}>
            <Icon name="bolt" size={16} /> Can&apos;t hit that target with these ingredients.
          </span>
          {onRecalibrate && (
            <Pill tone="accent" size="sm" onClick={onRecalibrate}>Rebalance</Pill>
          )}
        </div>
      ) : balanced ? (
        <div className={styles.statusOk}>
          <Icon name="check" size={15} /> Balanced
        </div>
      ) : (
        <div className={styles.statusOff}>
          <span className={styles.statusMsg}>Out of range</span>
          {onRecalibrate && (
            <Pill tone="accent" size="sm" onClick={onRecalibrate}>Rebalance</Pill>
          )}
        </div>
      )}

      <div className={styles.readoutRow}>
        <span className={styles.readout}>Scoopability <b>{Math.round(derived.pac * 100)}</b></span>
        <span className={styles.readout}>Sweetness <b>{Math.round(derived.pod * 100)}</b></span>
      </div>

      {adviceRows.length > 0 && (
        <div className={styles.advice}>
          {adviceRows.map((a) => (
            <div key={a.key} className={styles.adviceRow}>
              <b>{a.label}</b> — {a.text}
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
