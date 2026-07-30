"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { listFormulas, deleteFormula, backfillBatchNumbers, type SavedFormula } from "@/lib/persistence";
import { equipmentInfo, normalizeEquipment } from "@/lib/equipment";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { Header } from "@/components/shared/Header";
import { BatchCard } from "@/components/shared/BatchCard";
import { Icon } from "@/components/shared/Icon";
import styles from "./page.module.scss";

// A readable ingredient summary for the card — every distinct ingredient across
// the recipe's blends and additions, in order.
function ingredientSummary(f: SavedFormula): string {
  const recipe = f.recipe;
  if (!recipe) return "";
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    const n = getIngredientById(id)?.name;
    if (n && !seen.has(n)) {
      seen.add(n);
      names.push(n);
    }
  };
  for (const m of recipe.smartMixes) getPresetById(m.presetId)?.ingredients.forEach((i) => add(i.ingredientId));
  for (const a of recipe.additionalIngredients) add(a.ingredientId);
  return names.join(", ");
}

export default function Batches() {
  const [formulas, setFormulas] = useState<SavedFormula[] | null>(null);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    if (!formulas) return [];
    const q = query.trim().toLowerCase();
    return formulas.filter((f) => !q || `${f.name} ${f.style}`.toLowerCase().includes(q));
  }, [formulas, query]);

  return (
    <main className={styles.main}>
      <Header />

      <div className={styles.head}>
        <h1 className={styles.title}>My Batches</h1>
        {hasFormulas && (
          <div className={styles.tools}>
            <div className={styles.searchbar}>
              <Search size={18} strokeWidth={2} />
              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search batches…"
                aria-label="Search batches"
              />
            </div>
            <Button hierarchy="primary" size="md" icon={<Plus size={18} />} href="/new">
              New batch
            </Button>
          </div>
        )}
      </div>

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
          {filtered.map((f, idx) => (
            <BatchCard
              key={f.id}
              id={f.id}
              no={String(f.batchNo ?? idx + 1).padStart(3, "0")}
              style={f.style}
              equipment={equipmentInfo(normalizeEquipment(f.equipment)).label}
              name={f.name}
              ingredients={ingredientSummary(f)}
              onDelete={() => handleDelete(f.id, f.name)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
