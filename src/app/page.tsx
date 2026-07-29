"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { listFormulas, deleteFormula, backfillBatchNumbers, type SavedFormula } from "@/lib/persistence";
import { equipmentInfo, normalizeEquipment } from "@/lib/equipment";
import { Icon } from "@/components/shared/Icon";
import { Pill } from "@/components/shared/Pill";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Header } from "@/components/shared/Header";
import { SparkleCone } from "@/components/home/SparkleCone";
import styles from "./page.module.scss";

const FEATURES = [
  { eyebrow: "The Lab", title: "Six sliders, one live recipe", body: "Drag fat, sugar, and milk solids and the grams re-solve underneath in real time." },
  { eyebrow: "Stocked Pantry", title: "Every ingredient, weighed", body: "Build a base from a searchable, category-filtered pantry of dairy, sugars, and stabilizers." },
  { eyebrow: "Equipment Optimized", title: "Tuned to your machine", body: "Targets shift for a home churn, a Creami, or a compressor — so it scoops the way you expect." },
  { eyebrow: "Batch Scaling", title: "Scale to any yield", body: "Set a batch size and every ingredient moves together, to the gram." },
  { eyebrow: "Recipe Library", title: "Start from an archetype", body: "Philadelphia, custard, gelato, sorbet — begin from a sensible base, not a blank page." },
  { eyebrow: "Balance Check", title: "Know before you churn", body: "Scoopability and sweetness readouts flag an out-of-range mix before it hits the freezer." },
  { eyebrow: "Label Maker", title: "Print the pint", body: "Generate a press-styled label with the batch number, macros, and process notes." },
];

// Sentence case for filter labels: "philadelphia" -> "Philadelphia".
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Coarse relative time for the batch card's "updated …" line.
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
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);

  useEffect(() => {
    backfillBatchNumbers();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormulas(listFormulas());
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
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            <span className={styles.titleRow}>Cold</span>
            <span className={styles.titleRow}>Hard</span>
            <span className={`${styles.titleRow} ${styles.sci}`}>Science</span>
          </h1>
          <p className={styles.lead}>
            Ice Cream Lab is a recipe designer for frozen desserts. Set how rich,
            how sweet, and how firm you want a batch to be, and it works out the
            exact ingredients — to the gram — and shows you how it&apos;ll scoop
            before you churn a thing.
          </p>
          <div className={styles.cta}>
            <Button hierarchy="primary" size="lg" icon={<Plus size={18} />} href="/new">
              New batch
            </Button>
          </div>
        </div>
        <SparkleCone />
      </section>

      <section className={styles.features}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.eyebrow} eyebrow={f.eyebrow} title={f.title}>
            <p>{f.body}</p>
          </FeatureCard>
        ))}
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
            <p className={styles.emptyText}>No batches yet.</p>
            <Link href="/new" className={styles.emptyLink}>
              Start your first one
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No batches match.</p>
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
    </main>
  );
}
