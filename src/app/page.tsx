"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { listFormulas, deleteFormula, saveFormula, type SavedFormula } from "@/lib/persistence";
import { computeRatios } from "@/lib/formula-engine";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype, generateFormulaId } from "@/lib/bootstrap";
import { PintCup } from "@/components/shared/PintCup";
import { Icon } from "@/components/shared/Icon";
import { Pill } from "@/components/shared/Pill";
import { Header } from "@/components/shared/Header";
import { SparkleCone } from "@/components/home/SparkleCone";
import styles from "./page.module.scss";

const MARQUEE_ITEMS = ["TEST BATCH", "IN PROGRESS"];
// One run's worth of items: the phrases repeated enough to overflow wide
// viewports, so the two-run -50% loop never exposes a gap on reset. Both runs
// render this same list, which is what keeps the loop seamless.
const MARQUEE_RUN = Array.from({ length: 4 }, () => MARQUEE_ITEMS).flat();

// Sentence case for filter labels: "philadelphia" -> "Philadelphia".
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function Home() {
  const router = useRouter();
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormulas(listFormulas());
  }, []);

  // Surprise me: generate a fresh formula from a random archetype and drop into
  // it. Always available — no saved batches required (same bootstrap path as /new).
  const surpriseMe = useCallback(() => {
    const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    const id = generateFormulaId();
    const { state, recipe } = bootstrapFromArchetype(archetype);
    const now = Date.now();
    saveFormula({ id, name: archetype.name, style: archetype.style, createdAt: now, updatedAt: now, state, recipe });
    router.push(`/formula/${id}`);
  }, [router]);

  const scrollToBatches = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("batches")?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      <Header revealOnScroll />
      <section className={styles.hero}>
        <div className={styles.brandLockup}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Ice Cream Lab logo" className={styles.brandMark} />
          <span className={styles.brandWord}>Ice Cream Lab</span>
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
          milk solids in real time and design the scoop you can&apos;t buy anywhere.
        </p>
        <div className={styles.cta}>
          <a href="#batches" className={styles.ctaGhost} onClick={scrollToBatches}>
            <Icon name="pint" size={18} />
            See my batches
          </a>
          <Link href="/new" className={styles.ctaPrimary}>
            <Icon name="plus" size={18} />
            New formula
          </Link>
          <button
            className={styles.dice}
            type="button"
            onClick={surpriseMe}
            title="Surprise me — random archetype"
            aria-label="Generate a formula from a random archetype"
          >
            <Icon name="dice" size={22} />
          </button>
        </div>
        <SparkleCone />
      </section>

      <div className={styles.marquee} aria-hidden>
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeRun}>
            {MARQUEE_RUN.map((word, i) => (
              <span key={`a${i}`} className={styles.marqueeItem}>
                <span className={styles.marqueeText}>{word}</span>
                <Icon name="snow" size={26} />
              </span>
            ))}
          </div>
          <div className={styles.marqueeRun}>
            {MARQUEE_RUN.map((word, i) => (
              <span key={`b${i}`} className={styles.marqueeItem}>
                <span className={styles.marqueeText}>{word}</span>
                <Icon name="snow" size={26} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className={styles.lib} id="batches">
        <div className={styles.libHead}>
          <h2 className={styles.libTitle}>My batches</h2>
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
