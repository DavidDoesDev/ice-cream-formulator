import type { HTMLAttributes, ReactNode, MouseEvent } from "react";
import styles from "./Tag.module.scss";

export type TagTone = "normal" | "critical" | "neutral" | "ok";
export type TagSize = "sm" | "md" | "lg";
export type TagShape = "rounded" | "pill";

interface TagProps extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  tone?: TagTone;
  size?: TagSize;
  shape?: TagShape;
  icon?: ReactNode;
  selected?: boolean;
  removable?: boolean;
  onClick?: (e: MouseEvent) => void;
  onRemove?: () => void;
  children?: ReactNode;
}

// Absorbs pill / badge / chip. A plain label is a <span>; give it onClick or
// selected and it becomes an interactive <button> (filter/toggle chip).
export function Tag({
  tone = "normal",
  size = "md",
  shape = "rounded",
  icon,
  selected = false,
  removable = false,
  onClick,
  onRemove,
  className,
  children,
  ...rest
}: TagProps) {
  const interactive = typeof onClick === "function" || selected;
  const Tag = (interactive ? "button" : "span") as "button";
  return (
    <Tag
      className={[styles.tag, className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-size={size}
      data-shape={shape}
      data-selected={selected ? "" : undefined}
      data-interactive={interactive ? "" : undefined}
      type={interactive ? "button" : undefined}
      onClick={onClick}
      {...(rest as HTMLAttributes<HTMLButtonElement>)}
    >
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {removable && (
        <span
          className={styles.remove}
          role="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          ×
        </span>
      )}
    </Tag>
  );
}
