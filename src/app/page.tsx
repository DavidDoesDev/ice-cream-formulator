"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listFormulas, deleteFormula, type SavedFormula } from "@/lib/persistence";
import { computeRatios } from "@/lib/formula-engine";
import { PintCup } from "@/components/shared/PintCup";
import { Icon } from "@/components/shared/Icon";
import styles from "./page.module.scss";

const MARQUEE_ITEMS = ["COLD", "HARD", "SCIENCE"];

export default function Home() {
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormulas(listFormulas());
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteFormula(id);
    setFormulas((prev) => prev?.filter((f) => f.id !== id) ?? null);
  }, []);

  const hasFormulas = formulas !== null && formulas.length > 0;

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          <Icon name="flask" size={16} />
          <span>Frozen formula studio</span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleRow}>Ice</span>
          <span className={`${styles.titleRow} ${styles.titleShift}`}>Cream</span>
          <span className={styles.titleRow}>
            <em className={styles.titleHollow}>Lab</em>
          </span>
        </h1>
        <p className={styles.lead}>
          Invent frozen formulas from the <b>macros up</b>. Steer fat, sugar and
          milk solids in real time and watch the core sample fill.
        </p>
        <div className={styles.cta}>
          <Link href="/new" className={styles.ctaPrimary}>
            <Icon name="plus" size={18} />
            New formula
          </Link>
        </div>
      </section>

      <div className={styles.marquee} aria-hidden>
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeRun}>
            {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((word, i) => (
              <span key={`a${i}`} className={styles.marqueeItem}>
                <span className={styles.marqueeText}>{word}</span>
                <Icon name="snow" size={26} />
              </span>
            ))}
          </div>
          <div className={styles.marqueeRun}>
            {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((word, i) => (
              <span key={`b${i}`} className={styles.marqueeItem}>
                <span className={styles.marqueeText}>{word}</span>
                <Icon name="snow" size={26} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className={styles.lib}>
        <div className={styles.libHead}>
          <h2 className={styles.libTitle}>Library</h2>
          <Link href="/new" className={styles.libLink}>
            Start a batch
            <Icon name="arrow" size={16} />
          </Link>
        </div>

        {!hasFormulas ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No formulas yet.</p>
            <Link href="/new" className={styles.emptyLink}>
              Start your first one
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {formulas.map((formula, idx) => {
              const ratios = computeRatios(formula.state);
              const fatPct = Math.round(ratios.fat * 100);
              const sugarPct = Math.round(ratios.sugar * 100);
              const no = String(idx + 1).padStart(3, "0");
              return (
                <div key={formula.id} className={styles.specimen}>
                  <button
                    className={styles.specimenDel}
                    type="button"
                    onClick={() => handleDelete(formula.id, formula.name)}
                    aria-label={`Delete ${formula.name}`}
                  >
                    <Icon name="close" size={16} />
                  </button>
                  <Link href={`/formula/${formula.id}`} className={styles.specimenLink}>
                    <div className={styles.specimenTop}>
                      <span className={styles.specimenNo}>№ {no}</span>
                      <span className={styles.specimenStyle}>{formula.style}</span>
                    </div>
                    <div className={styles.specimenCup}>
                      <PintCup width={120} ratios={ratios} />
                    </div>
                    <p className={styles.specimenName}>{formula.name}</p>
                    <div className={styles.specimenStats}>
                      <span className={styles.chip}>
                        <b>{fatPct}%</b> fat
                      </span>
                      <span className={styles.chip}>
                        <b>{sugarPct}%</b> sugar
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
