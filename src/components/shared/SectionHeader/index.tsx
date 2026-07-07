import styles from "./SectionHeader.module.scss";

// Section roles carry a candy dot color so every screen agrees on the coding.
const ROLE_COLOR = {
  composition: "var(--c-pink)",
  ingredients: "var(--c-sky)",
  specific: "var(--c-lilac)",
  yield: "var(--c-yellow)",
  notes: "var(--c-mint)",
  balance: "var(--c-mint)",
} as const;

export type SectionRole = keyof typeof ROLE_COLOR;

interface SectionHeaderProps {
  role: SectionRole;
  label: string;
}

// Press section divider: a colored dot, an uppercase mono label, and a rule.
export function SectionHeader({ role, label }: SectionHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.dot} style={{ background: ROLE_COLOR[role] }} aria-hidden />
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} aria-hidden />
    </div>
  );
}
