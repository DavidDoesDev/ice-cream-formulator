import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./SparkleCone.module.scss";

// Seconds each callout is on stage (matches the SCSS animation durations),
// plus a beat of empty air between them.
const STAGE_S = 4.8;
const GAP_S = 0.6;

// The leader line starts this many px out from the marker's center so it
// meets the ring's edge with a little air instead of piercing it.
const RING_GAP = 10;

// The label hangs above its elbow (translateY(-100%)), so an elbow high in the
// scene can push the label right off the top of the page. Keep the elbow at
// least this far down so the label always clears the top with a margin.
const MIN_ELBOW_PX = 44;

// The placement zones each endpoint maps into, as [min, max] % of the scene box.
// The dot (start) and elbow/label (end) of every annotation are positioned
// within these ranges — tune them live in the ?dev panel (callouts drawer).
export interface CalloutZones {
  dotX: [number, number];
  dotY: [number, number];
  elbowX: [number, number];
  elbowY: [number, number];
}

// Textbook figure labels. `dot` marks the feature it points at, `elbow` is where
// the leader line turns into the label's underline. Both are stored NORMALIZED
// (0–1 within their zone) so the zones above can move/scale every annotation
// together; the defaults reproduce the original hand-tuned positions.
const ENTRIES = [
  { text: "18.5% sugar", dot: [0, 0.409], elbow: [0, 1] },
  { text: "14.0% butterfat", dot: [0.8125, 0], elbow: [1, 0] },
  { text: "62.4% water", dot: [0.594, 1], elbow: [0.1875, 0.667] },
  { text: "11.2% milk solids", dot: [1, 0.818], elbow: [0.4375, 0.333] },
];

// Map a normalized (0–1) coordinate into its [min, max] zone.
const lerp = (range: [number, number], t: number) => range[0] + t * (range[1] - range[0]);
const clampN = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

interface CalloutsProps {
  color: string;
  zones: CalloutZones;
  // Which way the label trails away from its elbow. Left is the main-layout
  // default (labels flow into the paper margin left of the cone), but it's a
  // config so other layouts (e.g. a right-hung cone) can flip it.
  trailRight: boolean;
  // Minimum margin (% of the scene box) kept between the box edges and any part
  // of the annotation — the label is width-measured and the elbow clamped so the
  // whole figure (leader line + label) stays inside with this much air.
  edgeMargin: number;
}

export function Callouts({ color, zones, trailRight, edgeMargin }: CalloutsProps) {
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [labelW, setLabelW] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ENTRIES.length), (STAGE_S + GAP_S) * 1000);
    return () => clearInterval(t);
  }, []);

  // Measure the current label so we can clamp it inside the edge margin. Layout
  // effect + measured width means the clamp is applied before paint (no jump).
  useLayoutEffect(() => {
    if (labelRef.current) setLabelW(labelRef.current.offsetWidth);
  }, [idx, box]);

  const { text, dot, elbow } = ENTRIES[idx];
  // Resolve the normalized entry into actual scene-box % via the placement zones,
  // then keep every endpoint inside the edge margin.
  const dx = clampN(lerp(zones.dotX, dot[0]), edgeMargin, 100 - edgeMargin);
  const dy = lerp(zones.dotY, dot[1]);
  const ey = lerp(zones.elbowY, elbow[1]);

  // The label trails from the elbow by its own width, so clamp the elbow so the
  // whole label clears the margin on the trailing side.
  const labelWpct = box && box.w ? (labelW / box.w) * 100 : 0;
  const ex = trailRight
    ? clampN(lerp(zones.elbowX, elbow[0]), edgeMargin, 100 - edgeMargin - labelWpct)
    : clampN(lerp(zones.elbowX, elbow[0]), edgeMargin + labelWpct, 100 - edgeMargin);

  let points = "";
  let labelTop = `${ey}%`;
  if (box) {
    const dpx = (dx / 100) * box.w;
    const dpy = (dy / 100) * box.h;
    const epx = (ex / 100) * box.w;
    const epy = Math.max((ey / 100) * box.h, MIN_ELBOW_PX);
    labelTop = `${epy.toFixed(1)}px`;
    const len = Math.hypot(epx - dpx, epy - dpy) || 1;
    const sx = dpx + ((epx - dpx) / len) * RING_GAP;
    const sy = dpy + ((epy - dpy) / len) * RING_GAP;
    points = `${sx.toFixed(1)},${sy.toFixed(1)} ${epx.toFixed(1)},${epy.toFixed(1)}`;
  }

  // Left-trail anchors the label's right edge at the elbow; right-trail its left.
  const labelPos = trailRight ? { left: `${ex}%` } : { right: `${100 - ex}%` };

  return (
    <div ref={ref} className={styles.callouts} style={{ color }}>
      <div className={styles.calloutFig} key={idx}>
        {box && (
          <svg className={styles.calloutLines} viewBox={`0 0 ${box.w} ${box.h}`}>
            <polyline className={styles.calloutLine} points={points} pathLength={1} />
          </svg>
        )}
        <span className={styles.calloutDot} style={{ left: `${dx}%`, top: `${dy}%` }} />
        <span
          ref={labelRef}
          className={styles.calloutLabel}
          data-dir={trailRight ? "right" : "left"}
          style={{ ...labelPos, top: labelTop }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
