"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ARCHETYPES } from "@/data/archetypes";
import type { Archetype } from "@/data/types";
import { ArchetypeTile } from "@/components/shared/ArchetypeTile";
import { SearchModule } from "@/components/shared/SearchModule";
import { Icon } from "@/components/shared/Icon";
import { matchTemplate, type MatchResult } from "@/lib/template-matcher";
import { bootstrapFromArchetype, generateFormulaId } from "@/lib/bootstrap";
import { saveFormula } from "@/lib/persistence";
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
      saveFormula({ id, name: archetype.name, style: archetype.style, createdAt: now, updatedAt: now, state, recipe });
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
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />
          Back
        </Link>
        <div className={styles.eyebrow}>
          <Icon name="flask" size={16} />
          <span>Start a batch</span>
        </div>
      </header>

      <h1 className={styles.title}>New Formula</h1>

      <div className={styles.search}>
        <p className={styles.searchLabel}>Describe a flavor — we&apos;ll match a base.</p>
        <SearchModule onSubmit={handleSearch} autoFocus={autoFocus} />
      </div>

      <div className={styles.pickHead}>
        <span className={styles.pickHeadDot} />
        <span className={styles.pickHeadLabel}>Or begin from an archetype</span>
        <span className={styles.pickHeadRule} />
      </div>

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
