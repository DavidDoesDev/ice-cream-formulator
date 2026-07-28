import type { ReactNode } from "react";
import styles from "./SectionHeader.module.scss";

export type SectionHeaderSize = "sm" | "md";

interface SectionHeaderProps {
  label: ReactNode;
  icon?: ReactNode; // defaults to a solid ink dot
  actions?: ReactNode; // right-aligned slot (buttons)
  size?: SectionHeaderSize;
}

// Section divider: a marker (dot or icon) + uppercase mono label + a rule, with
// an optional actions slot. Standardizes the header treatment across every panel
// and modal.
export function SectionHeader({ label, icon, actions, size = "md" }: SectionHeaderProps) {
  return (
    <div className={styles.header} data-size={size}>
      {icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : (
        <span className={styles.dot} aria-hidden />
      )}
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} aria-hidden />
      {actions && <span className={styles.actions}>{actions}</span>}
    </div>
  );
}
