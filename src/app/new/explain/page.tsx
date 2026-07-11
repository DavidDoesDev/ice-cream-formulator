"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PintCup } from "@/components/shared/PintCup";
import type { MatchResult } from "@/lib/template-matcher";
import { bootstrapFromArchetype, generateFormulaId } from "@/lib/bootstrap";
import { saveFormula, assignBatchNo } from "@/lib/persistence";
import styles from "./page.module.scss";

interface PendingMatch {
  results: MatchResult[];
  query: string;
}

export default function ExplainPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingMatch | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("icf:pending-match");
      if (raw) setPending(JSON.parse(raw) as PendingMatch);
    } catch {
      router.replace("/new");
    }
  }, [router]);

  const handleMakeIt = useCallback(() => {
    if (!pending) return;
    const archetype = pending.results[0].archetype;
    const id = generateFormulaId();
    const { state, recipe } = bootstrapFromArchetype(archetype);
    const now = Date.now();
    saveFormula({ id, name: archetype.name, style: archetype.style, batchNo: assignBatchNo(), createdAt: now, updatedAt: now, state, recipe });
    sessionStorage.removeItem("icf:pending-match");
    router.push(`/formula/${id}`);
  }, [pending, router]);

  if (!pending) {
    return (
      <main className={styles.main}>
        <p className={styles.loading}>Loading…</p>
      </main>
    );
  }

  const top = pending.results[0];
  const { archetype, metadata } = top;

  const confidenceLabel =
    metadata.confidence === "high"
      ? "Strong match"
      : metadata.confidence === "medium"
        ? "Likely match"
        : "Closest match";

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href={`/new?focus=search`} className={styles.back}>← Try again</Link>
        <span className={styles.confidence}>{confidenceLabel}</span>
      </header>

      <div className={styles.hero}>
        <div className={styles.cup}>
          <PintCup ratios={archetype.ratios} size="full" />
        </div>
        <div className={styles.heroBody}>
          <span className={styles.style}>{archetype.style}</span>
          <h1 className={styles.name}>{archetype.name}</h1>
          <p className={styles.prose}>{archetype.prose}</p>
        </div>
      </div>

      {metadata.matchedStyle || metadata.matchedInclusions.length > 0 || metadata.matchedTextures.length > 0 ? (
        <div className={styles.matchContext}>
          <p className={styles.matchLabel}>
            {metadata.matchedStyle && <>Your search matched the style. </>}
            {metadata.matchedInclusions.length > 0 && (
              <>Flavor hits: {metadata.matchedInclusions.join(", ")}. </>
            )}
            {metadata.matchedTextures.length > 0 && (
              <>Texture: {metadata.matchedTextures.join(", ")}.</>
            )}
          </p>
        </div>
      ) : null}

      <div className={styles.cards}>
        {archetype.decisionCards.map((card) => (
          <div key={card.label} className={styles.card}>
            <span className={styles.cardLabel}>{card.label}</span>
            <p className={styles.cardReason}>{card.reason}</p>
          </div>
        ))}
      </div>

      {pending.results.length > 1 && (
        <div className={styles.alternatives}>
          <p className={styles.altLabel}>Other options</p>
          <div className={styles.altRow}>
            {pending.results.slice(1, 4).map((r) => (
              <button
                key={r.archetype.id}
                className={styles.altChip}
                type="button"
                onClick={() => {
                  const updated = { ...pending, results: [r, ...pending.results.filter((x) => x !== r)] };
                  sessionStorage.setItem("icf:pending-match", JSON.stringify(updated));
                  setPending(updated);
                }}
              >
                {r.archetype.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Link href="/new?focus=search" className={styles.tryAgain}>
          Try again
        </Link>
        <button className={styles.makeIt} type="button" onClick={handleMakeIt}>
          Make it →
        </button>
      </div>
    </main>
  );
}
