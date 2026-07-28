"use client";

import { useState, type ReactNode } from "react";
import styles from "./Tabs.module.scss";

export type TabsSize = "sm" | "md" | "lg";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  value?: string; // controlled
  onChange?: (id: string) => void;
  size?: TabsSize;
}

// Underline tabs; content stacks below the active tab. Controlled via `value`
// or uncontrolled via `defaultTab`.
export function Tabs({ tabs, defaultTab, value, onChange, size = "md" }: TabsProps) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id);
  const active = value ?? internal;
  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={styles.tabs} data-size={size}>
      <div className={styles.list} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            className={styles.tab}
            data-active={t.id === active ? "" : undefined}
            type="button"
            onClick={() => select(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.panel} role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
