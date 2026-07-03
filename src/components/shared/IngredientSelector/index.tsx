"use client";

import { useState, useCallback, useEffect } from "react";
import { INGREDIENTS } from "@/data/ingredients";
import type { CatalogIngredient, IngredientCategory } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import styles from "./IngredientSelector.module.scss";

const MACRO_COLORS: Record<string, string> = {
  fat: "var(--color-macro-fat)",
  sugar: "var(--color-macro-sugar)",
  nonfatSolids: "var(--color-macro-nonfat)",
  stabilizer: "var(--color-macro-stabilizer)",
  emulsifier: "var(--color-macro-emulsifier)",
  alcohol: "var(--color-macro-alcohol)",
};

const CONTEXT_CATEGORIES: Record<string, IngredientCategory[]> = {
  "sugar-mix": ["sweetener"],
  "stabilizer-mix": ["stabilizer", "emulsifier"],
  // Custom-system builders only accept ingredients valid for that system.
  "sugar-custom": ["sweetener"],
  "stabilizer-custom": ["stabilizer"],
  "milk-custom": ["dairy", "vegan-dairy"],
  "eggs-custom": ["emulsifier"],
  "alcohol-custom": ["alcohol"],
  "emulsifier-custom": ["emulsifier"],
  general: ["dairy", "sweetener", "stabilizer", "emulsifier", "inclusion", "alcohol", "fruit", "vegan-dairy", "misc"],
};

interface IngredientSelectorProps {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
  onDismiss: () => void;
}

export function IngredientSelector({ context, onAdd, onDismiss }: IngredientSelectorProps) {
  const [query, setQuery] = useState("");
  const allowedCategories = CONTEXT_CATEGORIES[context] ?? CONTEXT_CATEGORIES.general;

  const filtered = INGREDIENTS.filter((ing) => {
    if (!allowedCategories.includes(ing.category)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return ing.name.toLowerCase().includes(q) || ing.description.toLowerCase().includes(q);
  });

  const handleAdd = useCallback(
    (catalog: CatalogIngredient) => {
      const ingredient: Ingredient = {
        id: catalog.id,
        name: catalog.name,
        state: "normal",
        grams: 50,
        macros: catalog.macros,
      };
      onAdd(ingredient);
      onDismiss();
    },
    [onAdd, onDismiss]
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onDismiss]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add ingredient</h2>
          <button className={styles.closeBtn} type="button" onClick={onDismiss} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search ingredients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>No ingredients match your search.</p>
          )}
          {filtered.map((ing) => {
            const macroKeys = Object.keys(ing.macros).filter(
              (k) => k !== "water" && ing.macros[k as keyof typeof ing.macros] > 0
            );
            return (
              <div key={ing.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <p className={styles.ingName}>{ing.name}</p>
                  <p className={styles.ingDesc}>{ing.description}</p>
                  <div className={styles.macros}>
                    {macroKeys.map((k) => (
                      <span
                        key={k}
                        className={styles.macroDot}
                        style={{ background: MACRO_COLORS[k] ?? "var(--color-border)" }}
                        title={`${k}: ${(ing.macros[k as keyof typeof ing.macros] * 100).toFixed(0)}%`}
                      />
                    ))}
                    <span className={styles.macroLabel}>
                      {macroKeys.map((k) => `${k.replace("nonfatSolids", "NFS")} ${(ing.macros[k as keyof typeof ing.macros] * 100).toFixed(0)}%`).join(" · ")}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.addBtn}
                  type="button"
                  onClick={() => handleAdd(ing)}
                >
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
