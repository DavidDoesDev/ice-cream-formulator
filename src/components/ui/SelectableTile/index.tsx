import type { ReactNode } from "react";
import styles from "./SelectableTile.module.scss";

interface SelectableTileProps {
  name: ReactNode;
  blurb?: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

// A pickable card: icon + name + blurb with a selected state. Shared by the
// Config recipe-type and equipment grids. Renders a button (card selected-state
// styling) for keyboard + toggle semantics.
export function SelectableTile({
  name,
  blurb,
  icon,
  selected = false,
  disabled = false,
  onClick,
  className,
}: SelectableTileProps) {
  return (
    <button
      type="button"
      className={[styles.tile, className].filter(Boolean).join(" ")}
      data-selected={selected ? "" : undefined}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.name}>{name}</span>
      {blurb != null && <span className={styles.blurb}>{blurb}</span>}
    </button>
  );
}
