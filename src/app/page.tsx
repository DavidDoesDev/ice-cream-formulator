"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { listFormulas, deleteFormula, saveFormula, assignBatchNo, backfillBatchNumbers, type SavedFormula } from "@/lib/persistence";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype, generateFormulaId } from "@/lib/bootstrap";
import { equipmentInfo, normalizeEquipment } from "@/lib/equipment";
import { Icon } from "@/components/shared/Icon";
import { Pill } from "@/components/shared/Pill";
import { Header } from "@/components/shared/Header";
import { Logo } from "@/components/shared/Logo";
import { SparkleCone } from "@/components/home/SparkleCone";
import { ScienceSection } from "@/components/home/ScienceSection";
import styles from "./page.module.scss";

// Sentence case for filter labels: "philadelphia" -> "Philadelphia".
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Coarse relative time for the batch card's "updated …" line. Client-only (the
// grid renders after mount), so a live Date.now() is safe — no hydration skew.
function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)} min ago`;
  if (diff < day) return `${Math.floor(diff / hr)} hr ago`;
  const days = Math.floor(diff / day);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Home() {
  const router = useRouter();
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    backfillBatchNumbers(); // give any pre-existing formulas a stable number
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
    saveFormula({ id, name: archetype.name, style: archetype.style, batchNo: assignBatchNo(), createdAt: now, updatedAt: now, state, recipe });
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
          <Logo className={styles.brandMark} />
          <span className={styles.brandWord}>Ice Cream Lab</span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleRow}>Cold</span>
          <span className={`${styles.titleRow} ${styles.titleShift}`}>Hard</span>
          <span className={`${styles.titleRow} ${styles.titleShift2}`}>
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
              const no = String(formula.batchNo ?? idx + 1).padStart(3, "0");
              const rig = equipmentInfo(normalizeEquipment(formula.equipment)).label;
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
                    <div className={styles.specimenMeta}>
                      <span className={styles.specimenNo}>№ {no}</span>
                      <span className={styles.metaDot} aria-hidden>·</span>
                      <span className={styles.specimenStyle}>{formula.style}</span>
                      <span className={styles.metaDot} aria-hidden>·</span>
                      <span className={styles.specimenRig}>{rig}</span>
                    </div>
                    <p className={styles.specimenName}>{formula.name}</p>
                    <p className={styles.specimenWhen}>updated {relTime(formula.updatedAt)}</p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ScienceSection />
    </main>
  );
}
