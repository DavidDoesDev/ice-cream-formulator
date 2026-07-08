"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { listFormulas, deleteFormula, type SavedFormula } from "@/lib/persistence";
import { computeRatios } from "@/lib/formula-engine";
import { PintCup } from "@/components/shared/PintCup";
import { Icon } from "@/components/shared/Icon";
import { Pill } from "@/components/shared/Pill";
import { Header } from "@/components/shared/Header";
import styles from "./page.module.scss";

const MARQUEE_ITEMS = ["TEST BATCH", "IN PROGRESS"];

// Sentence case for filter labels: "philadelphia" -> "Philadelphia".
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function Home() {
  const router = useRouter();
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormulas(listFormulas());
  }, []);

  const surpriseMe = useCallback(() => {
    if (!formulas || formulas.length === 0) return;
    const pick = formulas[Math.floor(Math.random() * formulas.length)];
    router.push(`/formula/${pick.id}`);
  }, [formulas, router]);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteFormula(id);
    setFormulas((prev) => prev?.filter((f) => f.id !== id) ?? null);
  }, []);

  const hasFormulas = formulas !== null && formulas.length > 0;

  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("All");

  const styleOptions = useMemo(
    () => ["All", ...Array.from(new Set((formulas ?? []).map((f) => f.style)))],
    [formulas],
  );

  const filtered = useMemo(() => {
    if (!formulas) return [];
    const q = query.trim().toLowerCase();
    return formulas.filter((f) => {
      if (styleFilter !== "All" && f.style !== styleFilter) return false;
      if (!q) return true;
      return `${f.name} ${f.style}`.toLowerCase().includes(q);
    });
  }, [formulas, query, styleFilter]);

  return (
    <main className={styles.main}>
      <Header />
      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          <Icon name="flask" size={16} />
          <span>Frozen formula studio</span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleRow}>Cold</span>
          <span className={`${styles.titleRow} ${styles.titleShift}`}>Hard</span>
          <span className={styles.titleRow}>
            <em className={styles.titleHollow}>Science</em>
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
          <a href="#vault" className={styles.ctaGhost}>
            Open the vault
            <Icon name="arrow" size={16} />
          </a>
          <button
            className={styles.dice}
            type="button"
            onClick={surpriseMe}
            disabled={!hasFormulas}
            title="Surprise me"
            aria-label="Open a random formula"
          >
            <Icon name="dice" size={22} />
          </button>
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

      <section className={styles.lib} id="vault">
        <div className={styles.libHead}>
          <h2 className={styles.libTitle}>The vault</h2>
          {hasFormulas && (
            <div className={styles.searchbar}>
              <Search size={18} strokeWidth={2} />
              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search formulas…"
                aria-label="Search formulas"
              />
            </div>
          )}
        </div>

        {hasFormulas && styleOptions.length > 2 && (
          <div className={styles.filterRow}>
            {styleOptions.map((s) => (
              <Pill
                key={s}
                tone={styleFilter === s ? "ink" : "ghost"}
                size="sm"
                active={styleFilter === s}
                onClick={() => setStyleFilter(s)}
              >
                {sentenceCase(s)}
              </Pill>
            ))}
          </div>
        )}

        {!hasFormulas ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No formulas yet.</p>
            <Link href="/new" className={styles.emptyLink}>
              Start your first one
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No formulas match.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((formula, idx) => {
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
