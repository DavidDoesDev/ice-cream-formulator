"use client";

import { memo, useEffect, useId, useRef } from "react";
import styles from "./PintCup.module.scss";
import type { MacroRatios } from "@/lib/formula-engine";

interface PintCupProps {
  ratios: MacroRatios;
  size?: "full" | "mini";
  width?: number;
}

// Layer order bottom-to-top: water on the bottom, then the non-water macros in
// their usual size order — biggest just above the waterline, smallest at the top.
// Fixed (not per-formula): sugar ≥ fat ≥ milk solids ≥ stabilizer ≥ emulsifier ≥ alcohol.
// Each macro layer wears its OWN candy color from the press macro palette; water
// is a neutral panel tone so the "core sample" reads as its actual composition.
const LAYERS: { key: keyof MacroRatios; color: string }[] = [
  { key: "water", color: "var(--panel)" },
  { key: "sugar", color: "var(--color-macro-sugar)" },
  { key: "fat", color: "var(--color-macro-fat)" },
  { key: "nonfatSolids", color: "var(--color-macro-nonfat)" },
  { key: "stabilizer", color: "var(--color-macro-stabilizer)" },
  { key: "emulsifier", color: "var(--color-macro-emulsifier)" },
  { key: "alcohol", color: "var(--color-macro-alcohol)" },
];

// Cup geometry — based on a real 16oz pint container:
// nearly square body, very slight taper, chunky flat lid with overhang
const VW = 100;
const VH = 100;
const BASE_INSET = 5;    // barely tapered — sides nearly vertical
const CORNER_R = 2;      // bottom corner rounding radius
const LID_H = 16;
const LID_W = VW * 1.2;
const LID_X = (VW - LID_W) / 2;
const LID_GAP = 8;
// Natural aspect ratio of the viewBox: height / width
const ASPECT = (VH + LID_H + LID_GAP) / LID_W;

// Trapezoid path with rounded bottom corners, sharp top corners.
// The taper is so slight (5/100) that we approximate the bottom arcs as right-angle turns.
const CUP_PATH = [
  `M 0,0`,
  `L ${VW},0`,
  `L ${VW - BASE_INSET},${VH - CORNER_R}`,
  `A ${CORNER_R},${CORNER_R} 0 0,1 ${VW - BASE_INSET - CORNER_R},${VH}`,
  `L ${BASE_INSET + CORNER_R},${VH}`,
  `A ${CORNER_R},${CORNER_R} 0 0,1 ${BASE_INSET},${VH - CORNER_R}`,
  `Z`,
].join(" ");

// At height y (0=top, VH=bottom), compute the left x and width of the cup wall
function cupGeomAtY(y: number) {
  const t = y / VH;
  const leftX = BASE_INSET * t;
  const width = VW - 2 * leftX;
  return { leftX, width };
}

// --- Living waterline ---
// A single, smooth S: one sine wave whose wavelength ≈ the cup width, so the
// surface shows just one gentle crest and one trough. Rather than drifting at a
// constant rate, its phase *sways* (a sine of time) so the wave glides fastest
// mid-swing and eases to a near-stop at each turn — like liquid settling.
const WATER_MAX_AMP = 4;    // total vertical reach; drives the headroom band
const WAVELENGTH = 115;     // slightly wider than the cup → under one full wave, so
                            // exactly one crest + one trough show (a clean single S)
const AMP = 3;              // crest/trough height — defined but still shallow
const DRIFT_AMP = 1.8;      // how far the wave sways, in radians (eased)
const DRIFT_SPEED = 1.0;    // sway rate, rad/s
const BOB_AMP = 0.6;        // slow whole-surface rise/fall
const BOB_SPEED = 1.2;      // rad/s
const K = (2 * Math.PI) / WAVELENGTH;

function waterlineY(x: number, meanY: number, t: number): number {
  const phase = DRIFT_AMP * Math.sin(DRIFT_SPEED * t);
  const bob = BOB_AMP * Math.sin(BOB_SPEED * t);
  return meanY + bob + AMP * Math.sin(K * x + phase);
}

// Closed region between the waterline (top) and the cup floor — the water body.
function waterPath(meanY: number, t: number): string {
  const x0 = -2;
  const x1 = VW + 2;
  let d = `M ${x0},${VH} L ${x0},${waterlineY(x0, meanY, t).toFixed(3)}`;
  for (let x = x0 + 2; x <= x1; x += 2) {
    d += ` L ${x},${waterlineY(x, meanY, t).toFixed(3)}`;
  }
  return `${d} L ${x1},${VH} Z`;
}

// Memoized: during a slider drag the parent panel re-renders on every input
// event (to move the thumb), but the cup only needs to redraw when the macro
// ratios actually change — once per coalesced solve frame. Without this the SVG
// (and its per-frame ripple repaint) rebuilds on every event, which WebKit paints
// far more slowly than Chromium — the bulk of the Safari drag lag.
function PintCupImpl({ ratios, size = "full", width }: PintCupProps) {
  const uid = useId().replace(/:/g, "-");
  const clipId = `pint-cup-clip${uid}`;
  const total = Object.values(ratios).reduce((a, b) => a + b, 0);

  const layers: { key: string; color: string; points: string }[] = [];
  let yFloor = VH;

  for (const { key, color } of LAYERS) {
    const fraction = total > 0 ? ratios[key as keyof MacroRatios] / total : 0;
    const h = fraction * VH;
    if (h < 0.5) continue;
    const yCeil = yFloor - h;
    const bottom = cupGeomAtY(yFloor);
    const top = cupGeomAtY(yCeil);

    const points = [
      `${top.leftX},${yCeil}`,
      `${top.leftX + top.width},${yCeil}`,
      `${bottom.leftX + bottom.width},${yFloor}`,
      `${bottom.leftX},${yFloor}`,
    ].join(" ");

    layers.push({ key, color, points });
    yFloor = yCeil;
  }

  // The waterline animates only when there is a water band with a layer above it
  // and enough room to bob without clipping the rim or the floor.
  const waterFraction = total > 0 ? ratios.water / total : 0;
  const waterMeanY = VH - waterFraction * VH;
  const waterIdx = layers.findIndex((l) => l.key === "water");
  const aboveColor = waterIdx >= 0 ? layers[waterIdx + 1]?.color : undefined;
  const waterColor = waterIdx >= 0 ? layers[waterIdx].color : undefined;
  const hasWave =
    waterIdx >= 0 &&
    !!aboveColor &&
    waterMeanY > WATER_MAX_AMP &&
    waterMeanY < VH - WATER_MAX_AMP;

  const waterRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = waterRef.current;
    if (!hasWave || !el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.setAttribute("d", waterPath(waterMeanY, 0));
      return;
    }

    let raf = 0;
    const tick = () => {
      el.setAttribute("d", waterPath(waterMeanY, performance.now() / 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasWave, waterMeanY]);

  const sizeStyle = width
    ? { width: `${width}px`, height: `${Math.round(width * ASPECT)}px` }
    : undefined;

  return (
    <div
      className={`${styles.cup} ${width ? "" : size === "mini" ? styles.mini : styles.full}`}
      style={sizeStyle}
    >
      <svg
        viewBox={`${LID_X} ${-(LID_H + LID_GAP)} ${LID_W} ${VH + LID_H + LID_GAP}`}
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-label="Formula macro composition"
        role="img"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={CUP_PATH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {layers.map(({ key, color, points }) =>
            // With a wave, the water body (and its separator line) is drawn by
            // the animated path below, so skip its static flat-topped polygon —
            // otherwise its top stroke leaves a flat line the fill slides under.
            key === "water" && hasWave ? null : (
              <polygon
                key={key}
                points={points}
                fill={color}
                stroke="var(--ink)"
                strokeWidth="0.6"
                strokeOpacity="0.35"
                className={styles.layer}
              />
            ),
          )}

          {hasWave && (
            <>
              {/* Repaint the above-layer's band around the waterline so (a) the
                  waterline can dip into it without revealing a gap and (b) its
                  flat bottom stroke is covered — the animated path's stroke below
                  is the separator now, so it must sway with the fill. */}
              <rect
                x={-2}
                y={waterMeanY - 1}
                width={VW + 4}
                height={WATER_MAX_AMP + 1}
                fill={aboveColor}
              />
              <path
                ref={waterRef}
                d={waterPath(waterMeanY, 0)}
                fill={waterColor}
                stroke="var(--ink)"
                strokeWidth="0.6"
                strokeOpacity="0.35"
                strokeLinejoin="round"
              />
            </>
          )}
        </g>

        {/* Cup outline drawn on top — press ink stroke */}
        <path
          d={CUP_PATH}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Lid — wider than the cup with a gap above the rim */}
        <rect
          x={LID_X}
          y={-(LID_H + LID_GAP)}
          width={LID_W}
          height={LID_H}
          rx={CORNER_R}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export const PintCup = memo(PintCupImpl);
