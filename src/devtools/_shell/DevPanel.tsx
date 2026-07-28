"use client";
import type { ReactNode } from "react";
import styles from "./DevPanel.module.scss";

// Shared panel chrome — every scaffolded tool renders through this, so they all
// look and behave the same. House styling lives in DevPanel.module.scss.
export function DevPanel({
  title,
  children,
  onExport,
}: {
  title: string;
  children: ReactNode;
  onExport?: () => void;
}) {
  return (
    <aside className={styles.panel} aria-label="Dev tools">
      <header className={styles.head}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.title}>{title}</span>
        <kbd className={styles.kbd}>Ctrl+`</kbd>
      </header>
      <div className={styles.body}>{children}</div>
      {onExport && (
        <button type="button" className={styles.export} onClick={onExport}>
          copy settings
        </button>
      )}
    </aside>
  );
}
