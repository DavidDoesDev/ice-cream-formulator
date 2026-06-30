"use client";

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
const VH = 100;          // square-ish body (height ≈ width)
const BASE_INSET = 5;    // barely tapered — sides nearly vertical
const LID_H = 16;        // lid ≈ 13% of total visual height
const LID_W = VW * 1.2;
const LID_X = (VW - LID_W) / 2;
const LID_GAP = 3;

// At height y (0=top, VH=bottom), compute the left x and width of the cup wall
function cupGeomAtY(y: number) {
  const t = y / VH; // 0 at top, 1 at bottom
  const leftX = BASE_INSET * t;
  const width = VW - 2 * leftX;
  return { leftX, width };
}

// Clip path corners: rim is full width at top, base is inset at bottom
const CUP_CLIP = `0,0 ${VW},0 ${VW - BASE_INSET},${VH} ${BASE_INSET},${VH}`;

export function PintCup({ ratios, size = "full" }: PintCupProps) {
  const total = Object.values(ratios).reduce((a, b) => a + b, 0);

  // Build layers bottom-to-top, accumulating yOffset from the bottom
  const layers: { key: string; color: string; points: string }[] = [];
  let yFloor = VH;

  for (const { key, color } of LAYERS) {
    const fraction = total > 0 ? ratios[key as keyof MacroRatios] / total : 0;
    const h = fraction * VH;
    if (h < 0.5) {
      continue;
    }
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
          <clipPath id="pint-cup-clip">
            <polygon points={CUP_CLIP} />
          </clipPath>
        </defs>

        <g clipPath="url(#pint-cup-clip)">
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
        <polygon
          points={CUP_CLIP}
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
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
