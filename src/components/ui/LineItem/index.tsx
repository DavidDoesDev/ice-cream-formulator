import type { ReactNode } from "react";
import styles from "./LineItem.module.scss";

export type LineItemSize = "sm" | "md";

interface LineItemProps {
  label: ReactNode;
  sublabel?: ReactNode; // secondary line (e.g. "3.6% fat")
  note?: ReactNode; // an InlineNote or note preview
  trailing?: ReactNode; // right-side control: gram field / % / remove / number input
  indent?: boolean; // sub-ingredient rows (Sucrose, Glucose)
  size?: LineItemSize;
}

// The standardized recipe/config row: leading label (+ optional sub-label/note)
// on the left, a trailing slot on the right that each context fills. Replaces the
// four inline row variants across RecipePanel, Config, and the blend builders.
export function LineItem({ label, sublabel, note, trailing, indent = false, size = "md" }: LineItemProps) {
  return (
    <div className={styles.item} data-size={size} data-indent={indent ? "" : undefined}>
      <div className={styles.main}>
        <span className={styles.label}>{label}</span>
        {sublabel != null && <span className={styles.sublabel}>{sublabel}</span>}
        {note != null && <div className={styles.note}>{note}</div>}
      </div>
      {trailing != null && <div className={styles.trailing}>{trailing}</div>}
    </div>
  );
}
