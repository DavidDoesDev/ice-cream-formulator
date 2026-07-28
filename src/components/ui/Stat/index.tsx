import type { ReactNode } from "react";
import styles from "./Stat.module.scss";

export type StatTone = "normal" | "critical" | "neutral" | "ok";
export type StatSize = "sm" | "md" | "lg";
export type StatDirection = "up" | "down" | "flat";

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  direction?: StatDirection;
  tone?: StatTone;
  size?: StatSize;
}

// Labelled metric tile: caption + big value (+ optional delta). Used for the
// balance readouts (Scoopability, Sweetness).
export function Stat({ label, value, delta, direction = "flat", tone = "normal", size = "md" }: StatProps) {
  return (
    <div className={styles.stat} data-tone={tone} data-size={size}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {delta != null && (
          <span className={styles.delta} data-direction={direction}>
            {delta}
          </span>
        )}
      </span>
    </div>
  );
}
