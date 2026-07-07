import styles from "./SectionHeader.module.scss";

// Retained for semantic labelling of each section; the dot no longer varies by
// role — it's a solid ink dot everywhere to match the bold monochrome reskin.
export type SectionRole =
  | "composition"
  | "ingredients"
  | "specific"
  | "yield"
  | "notes"
  | "balance";

interface SectionHeaderProps {
  role: SectionRole;
  label: string;
}

// Press section divider: a solid ink dot, an uppercase mono label, and a rule.
export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} aria-hidden />
    </div>
  );
}
