import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Pill.module.scss";

export type PillTone =
  | "surface"
  | "ghost"
  | "ink"
  | "accent"
  | "pink"
  | "mint"
  | "yellow"
  | "sky"
  | "peach"
  | "lilac";
export type PillSize = "sm" | "md" | "lg";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: PillTone;
  size?: PillSize;
  active?: boolean;
  children: ReactNode;
}

// The sticker button used across the press UI: pill shape, ink outline, jelly press.
export function Pill({
  tone = "surface",
  size = "md",
  active = false,
  className = "",
  children,
  ...rest
}: PillProps) {
  const cls = [
    styles.pill,
    styles[`tone_${tone}`],
    styles[`size_${size}`],
    active ? styles.active : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
