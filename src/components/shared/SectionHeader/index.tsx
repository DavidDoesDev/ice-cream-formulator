import type { LucideIcon } from "lucide-react";
import {
  PieChart,
  ShoppingCart,
  ShoppingBag,
  Scale,
  SquarePen,
} from "lucide-react";
import styles from "./SectionHeader.module.scss";

// Canonical glyph per section role — chosen once here so every screen agrees.
export const SectionIcons = {
  composition: PieChart,
  ingredients: ShoppingCart,
  specific: ShoppingBag,
  yield: Scale,
  notes: SquarePen,
} as const;

export type SectionRole = keyof typeof SectionIcons;

interface SectionHeaderProps {
  role: SectionRole;
  label: string;
}

export function SectionHeader({ role, label }: SectionHeaderProps) {
  const Icon: LucideIcon = SectionIcons[role];
  return (
    <div className={styles.header}>
      <Icon className={styles.icon} size={15} strokeWidth={2} aria-hidden />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
