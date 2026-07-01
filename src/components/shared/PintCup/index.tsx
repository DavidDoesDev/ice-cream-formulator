"use client";

import { useId } from "react";
import styles from "./PintCup.module.scss";
import type { MacroRatios } from "@/lib/formula-engine";

interface PintCupProps {
  ratios: MacroRatios;
  size?: "full" | "mini";
}

// Layer order bottom-to-top in the cup
const LAYERS: { key: keyof MacroRatios; color: string }[] = [
  { key: "water", color: "var(--color-bg)" },
  { key: "nonfatSolids", color: "var(--color-macro-nonfat)" },
  { key: "sugar", color: "var(--color-macro-sugar)" },
  { key: "fat", color: "var(--color-macro-fat)" },
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

export function PintCup({ ratios, size = "full" }: PintCupProps) {
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

  return (
    <div className={`${styles.cup} ${size === "mini" ? styles.mini : styles.full}`}>
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
          {layers.map(({ key, color, points }) => (
            <polygon
              key={key}
              points={points}
              fill={color}
              className={styles.layer}
            />
          ))}
        </g>

        {/* Cup outline drawn on top */}
        <path
          d={CUP_PATH}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />

        {/* Lid — wider than the cup with a gap above the rim */}
        <rect
          x={LID_X}
          y={-(LID_H + LID_GAP)}
          width={LID_W}
          height={LID_H}
          rx={CORNER_R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
