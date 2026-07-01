"use client";

import { PintCup } from "@/components/shared/PintCup";
import type { Archetype } from "@/data/types";
import styles from "./ArchetypeTile.module.scss";

interface ArchetypeTileProps {
  archetype: Archetype;
  onClick: (archetype: Archetype) => void;
}

export function ArchetypeTile({ archetype, onClick }: ArchetypeTileProps) {
  const fatPct = Math.round(archetype.ratios.fat * 100);
  const sugarPct = Math.round(archetype.ratios.sugar * 100);

  return (
    <button
      className={styles.tile}
      onClick={() => onClick(archetype)}
      type="button"
    >
      <div className={styles.cup}>
        <PintCup ratios={archetype.ratios} size="mini" />
      </div>
      <div className={styles.body}>
        <span className={styles.style}>{archetype.style}</span>
        <p className={styles.name}>{archetype.name}</p>
        <p className={styles.description}>{archetype.description}</p>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles.statValue}>{fatPct}%</span>
            <span className={styles.statLabel}>fat</span>
          </span>
          <span className={styles.stat}>
            <span className={styles.statValue}>{sugarPct}%</span>
            <span className={styles.statLabel}>sugar</span>
          </span>
        </div>
      </div>
    </button>
  );
}
