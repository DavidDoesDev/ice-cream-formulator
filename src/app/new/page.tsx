"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ARCHETYPES } from "@/data/archetypes";
import type { Archetype } from "@/data/types";
import { ArchetypeTile } from "@/components/shared/ArchetypeTile";
import { SearchModule } from "@/components/shared/SearchModule";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Header } from "@/components/shared/Header";
import { matchTemplate, type MatchResult } from "@/lib/template-matcher";
import { bootstrapFromArchetype, generateFormulaId } from "@/lib/bootstrap";
import { saveFormula, assignBatchNo } from "@/lib/persistence";
import styles from "./page.module.scss";

function NewFormulaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const autoFocus = params.get("focus") === "search";

  const launchArchetype = useCallback(
    (archetype: Archetype) => {
      const id = generateFormulaId();
      const { state, recipe } = bootstrapFromArchetype(archetype);
      const now = Date.now();
      saveFormula({ id, name: archetype.name, style: archetype.style, batchNo: assignBatchNo(), createdAt: now, updatedAt: now, state, recipe });
      router.push(`/formula/${id}`);
    },
    [router]
  );

  const handleSearch = useCallback(
    (query: string) => {
      const results: MatchResult[] = matchTemplate(query);
      sessionStorage.setItem("icf:pending-match", JSON.stringify({ results: results.slice(0, 5), query }));
      router.push("/new/explain");
    },
    [router]
  );

  return (
    <main className={styles.main}>
      <Header />

      <h1 className={styles.title}>New Batch</h1>

      <div className={styles.search}>
        <p className={styles.searchLabel}>Describe a flavor — we&apos;ll match a base.</p>
        <SearchModule onSubmit={handleSearch} autoFocus={autoFocus} />
      </div>

      <SectionHeader className={styles.pickHead} label="Or begin from an archetype" />

      <div className={styles.grid}>
        {ARCHETYPES.map((archetype) => (
          <ArchetypeTile
            key={archetype.id}
            archetype={archetype}
            onClick={launchArchetype}
          />
        ))}
      </div>
    </main>
  );
}

export default function NewFormula() {
  return (
    <Suspense>
      <NewFormulaInner />
    </Suspense>
  );
}
