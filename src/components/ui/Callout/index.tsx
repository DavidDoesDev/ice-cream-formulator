import type { ReactNode } from "react";
import styles from "./Callout.module.scss";

export type CalloutTone = "normal" | "critical" | "neutral" | "ok";
export type CalloutSize = "sm" | "md" | "lg";

interface CalloutProps {
  tone?: CalloutTone;
  size?: CalloutSize;
  title?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}

// Inline admonition / banner. Used for the Pantry context banner and inline hints.
export function Callout({ tone = "normal", size = "md", title, icon, children }: CalloutProps) {
  return (
    <div className={styles.callout} data-tone={tone} data-size={size} role="note">
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <div className={styles.content}>
        {title != null && <p className={styles.title}>{title}</p>}
        {children != null && <div className={styles.body}>{children}</div>}
      </div>
    </div>
  );
}
