import type { ReactNode } from "react";
import styles from "./SectionHeader.module.scss";

export type SectionHeaderSize = "sm" | "md";

interface SectionHeaderProps {
  label: ReactNode;
  icon?: ReactNode; // optional leading icon
  size?: SectionHeaderSize;
  className?: string;
}

// Section divider: an optional leading icon + uppercase mono label + a rule.
// Standardizes the header treatment across every panel and modal.
export function SectionHeader({ label, icon, size = "md", className }: SectionHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(" ")} data-size={size}>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} aria-hidden />
    </div>
  );
}
