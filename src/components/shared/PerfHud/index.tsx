"use client";

import { useEffect, useRef } from "react";

// Debug-only HUD for the Safari slider investigation (#55). Mounted
// unconditionally but inert (hidden, no rAF loop) unless the page is loaded
// with `?perf=1` — checked here, not by the parent, so enabling never touches
// React state (the flag isn't part of the route, and reading it must not force
// a hydration mismatch). Shows live frame cadence plus the slider counters
// below, so a human check reports numbers, not vibes.
//
// Counters (window.__icPerf, bumped via perfCount from event handlers):
//   inputs      — range-input `input` events seen (trackpad event rate)
//   commits     — throttled solve dispatches (~11/s expected during a drag)
//   blurMidDrag — the input blurred while a pointer was still down: desktop
//                 Safari's mid-drag blur (sibling of its pointercancel quirk).
//                 Any nonzero value here confirms hypothesis #1 of issue #55.

type Counters = { inputs?: number; commits?: number; blurMidDrag?: number; native?: number };

declare global {
  interface Window {
    __icPerf?: Counters;
  }
}

// Bump a counter. Safe to call from any client event handler; near-zero cost,
// and a no-op observer-wise unless the HUD is mounted to read it.
export function perfCount(key: keyof Counters): void {
  if (typeof window === "undefined") return;
  const c = (window.__icPerf ??= {});
  c[key] = (c[key] ?? 0) + 1;
}

export function PerfHud() {
  const ref = useRef<HTMLDivElement>(null);
  // Copy feedback appended to the readout until `until` (see tick).
  const flashRef = useRef({ until: 0, label: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // #55 bisection: strip compositing-heavy GLOBAL layers by direct DOM.
    // (`?hide=cup,recipe` are handled by the page; these two live in layout.)
    const hide = new Set((params.get("hide") ?? "").split(","));
    if (hide.has("grain")) document.querySelector(".grain")?.remove();
    if (hide.has("header")) {
      const h = document.querySelector("header");
      if (h) h.style.display = "none";
    }
    if (!params.has("perf") || !ref.current) return;
    ref.current.style.display = "block";
    // Count NATIVE input events from range sliders at the capture phase —
    // before React's event system sees them. `nat` vs `in` splits "Safari
    // starves events on this page" from "React drops dispatches".
    const onNativeInput = (e: Event) => {
      if ((e.target as HTMLInputElement | null)?.type === "range") perfCount("native");
    };
    window.addEventListener("input", onNativeInput, true);
    let raf = 0;
    let last = performance.now();
    let gaps: number[] = [];
    let lastText = 0;
    const tick = (t: number) => {
      gaps.push(t - last);
      last = t;
      // Keep a rolling ~1s window.
      let sum = 0;
      let i = gaps.length;
      while (i > 0 && sum < 1000) sum += gaps[--i];
      gaps = gaps.slice(i);
      // Rewrite the readout at 4Hz — cheap, and doesn't disturb the measurement.
      if (t - lastText > 250 && ref.current) {
        lastText = t;
        const fps = sum > 0 ? Math.round((gaps.length / sum) * 1000) : 0;
        const worst = Math.round(Math.max(0, ...gaps));
        const c = window.__icPerf ?? {};
        const flash = t < flashRef.current.until ? ` · ${flashRef.current.label}` : "";
        // HUD_TAG: bump when iterating on #55 so a pasted readout identifies its bundle.
        ref.current.textContent =
          `v16 ${fps}fps worst ${worst}ms · nat ${c.native ?? 0} · in ${c.inputs ?? 0} · solve ${c.commits ?? 0} · blur! ${c.blurMidDrag ?? 0}${flash}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("input", onNativeInput, true);
    };
  }, []);

  // Click to copy the current readout. The async clipboard API needs a
  // trustworthy origin, and real Safari doesn't extend that to plain-http
  // localhost — there `navigator.clipboard` is missing (or the write rejects),
  // so fall back to the legacy textarea + execCommand path, which only needs
  // the click gesture. Never silent: the readout flashes the outcome either way.
  const onClick = () => {
    const text = ref.current?.textContent?.replace(/ · (copied ✓|copy failed)$/, "");
    if (!text) return;
    const flash = (ok: boolean) => {
      flashRef.current = { until: performance.now() + 1200, label: ok ? "copied ✓" : "copy failed" };
    };
    const legacyCopy = (): boolean => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        /* fall through to feedback */
      }
      ta.remove();
      return ok;
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => flash(true),
        () => flash(legacyCopy()),
      );
    } else {
      flash(legacyCopy());
    }
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      title="Click to copy"
      style={{
        display: "none",
        position: "fixed",
        left: 8,
        bottom: 8,
        zIndex: 9999,
        padding: "4px 8px",
        font: "11px/1.4 ui-monospace, monospace",
        color: "#fff",
        background: "rgba(0,0,0,0.75)",
        borderRadius: 4,
        cursor: "copy",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    />
  );
}
