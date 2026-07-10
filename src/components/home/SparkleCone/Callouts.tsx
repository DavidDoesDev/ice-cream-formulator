import { useEffect, useRef, useState } from "react";
import styles from "./SparkleCone.module.scss";

// Seconds each callout is on stage (matches the SCSS animation durations),
// plus a beat of empty air between them.
const STAGE_S = 4.8;
const GAP_S = 0.6;

// The leader line starts this many px out from the marker's center so it
// meets the ring's edge with a little air instead of piercing it.
const RING_GAP = 10;

// The label hangs above its elbow (translateY(-100%)), so an elbow high in the
// scene can push the label right off the top of the page — worst on narrow
// widths, where a small elbow % is only a few px down. Keep the elbow at least
// this far down so the label always clears the top with a margin; the whole
// figure (leader line + underlined label) shifts down together. Sized to cover
// the label's own height (~20px) plus air, with headroom for the annotation
// plane's parallax lifting it up to ~5px more.
const MIN_ELBOW_PX = 52;

// Textbook figure labels. Coordinates are % of the scene box: `dot` marks the
// feature on the footage, `elbow` is where the leader line turns into the
// horizontal rule the label sits on. All labels trail left, into the paper
// margin between the title ink and the cone.
// Dots sit on the ice cream itself (never the waffle cone); elbows all live
// in the top paper band (y ≲ 12%) — measured across desktop widths, it's the
// only zone where a label extending ~150px left of its elbow clears the
// title ink (labels overhang the scene box, so HARD/SCIENCE can bite them
// lower down).
const ENTRIES = [
  { text: "18.5% sugar", dot: [31, 17], elbow: [10, 12] },
  { text: "14.0% butterfat", dot: [57, 8], elbow: [26, 3] },
  { text: "62.4% water", dot: [50, 30], elbow: [13, 9] },
  { text: "11.2% milk solids", dot: [63, 26], elbow: [17, 6] },
];

// One label at a time: the ring pops onto the subject, the leader line draws
// itself out to the rule, the label fades in, holds, and the whole figure
// fades before the next entry mounts (key remount restarts the animations).
// The line is computed in pixel space — a percent-based viewBox stretched
// with preserveAspectRatio="none" needs non-scaling-stroke, which breaks
// pathLength normalization in Chrome and turns the draw-on dash into a
// dotted line.
export function Callouts({ color }: { color: string }) {
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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

  const { text, dot, elbow } = ENTRIES[idx];
  const [dx, dy] = dot;
  const [ex, ey] = elbow;

  let points = "";
  // Falls back to the raw % until the box is measured; once measured we drive
  // the label off the clamped pixel elbow so it can't ride off the top.
  let labelTop = `${ey}%`;
  if (box) {
    const dpx = (dx / 100) * box.w;
    const dpy = (dy / 100) * box.h;
    const epx = (ex / 100) * box.w;
    const epy = Math.max((ey / 100) * box.h, MIN_ELBOW_PX);
    labelTop = `${epy.toFixed(1)}px`;
    const len = Math.hypot(epx - dpx, epy - dpy) || 1;
    // Start on the marker's edge and run to the elbow; the underline the
    // label carries (border-bottom, so it always spans exactly the text)
    // takes over from there.
    const sx = dpx + ((epx - dpx) / len) * RING_GAP;
    const sy = dpy + ((epy - dpy) / len) * RING_GAP;
    points = `${sx.toFixed(1)},${sy.toFixed(1)} ${epx.toFixed(1)},${epy.toFixed(1)}`;
  }

  return (
    <div ref={ref} className={styles.callouts} style={{ color }}>
      <div className={styles.calloutFig} key={idx}>
        {box && (
          <svg className={styles.calloutLines} viewBox={`0 0 ${box.w} ${box.h}`}>
            <polyline className={styles.calloutLine} points={points} pathLength={1} />
          </svg>
        )}
        <span className={styles.calloutDot} style={{ left: `${dx}%`, top: `${dy}%` }} />
        <span className={styles.calloutLabel} style={{ right: `${100 - ex}%`, top: labelTop }}>
          {text}
        </span>
      </div>
    </div>
  );
}
