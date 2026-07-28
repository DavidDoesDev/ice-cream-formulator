import type { ReactNode } from "react";
import { Card } from "../Card";
import styles from "./FeatureCard.module.scss";

interface FeatureCardProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  href?: string;
  children?: ReactNode; // body
}

// Marketing feature tile: eyebrow + title + body, on a Card. The Home grid.
export function FeatureCard({ title, eyebrow, icon, href, children }: FeatureCardProps) {
  const inner = (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {eyebrow != null && <span className={styles.eyebrow}>{eyebrow}</span>}
      <h3 className={styles.title}>{title}</h3>
      {children != null && <div className={styles.body}>{children}</div>}
    </>
  );

  return href ? (
    <Card href={href} padding="lg" className={styles.card}>
      {inner}
    </Card>
  ) : (
    <Card padding="lg" className={styles.card}>
      {inner}
    </Card>
  );
}
