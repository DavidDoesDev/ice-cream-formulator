"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listFormulas, deleteFormula, type SavedFormula } from "@/lib/persistence";
import { computeRatios } from "@/lib/formula-engine";
import { PintCup } from "@/components/shared/PintCup";
import styles from "./page.module.scss";

export default function Home() {
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    setFormulas(listFormulas());
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteFormula(id);
    setFormulas((prev) => prev?.filter((f) => f.id !== id) ?? null);
  }, []);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ice Cream Lab</h1>
        <Link href="/new" className={styles.newBtn}>
          New formula
        </Link>
      </header>

      {formulas === null || formulas.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No formulas yet.</p>
          <Link href="/new" className={styles.emptyLink}>
            Start your first one
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {formulas.map((formula) => {
            const ratios = computeRatios(formula.state);
            const fatPct = Math.round(ratios.fat * 100);
            const sugarPct = Math.round(ratios.sugar * 100);
            return (
              <div key={formula.id} className={styles.cardWrap}>
                <Link href={`/formula/${formula.id}`} className={styles.card}>
                  <div className={styles.cardCup}>
                    <PintCup size="mini" ratios={ratios} />
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardName}>{formula.name}</p>
                    <p className={styles.cardStyle}>{formula.style}</p>
                    <div className={styles.cardStats}>
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
                </Link>
                <button
                  className={styles.deleteBtn}
                  type="button"
                  onClick={() => handleDelete(formula.id, formula.name)}
                  aria-label={`Delete ${formula.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
