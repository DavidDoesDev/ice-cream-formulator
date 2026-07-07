"use client";

import { useState, useCallback, useEffect } from "react";
import { INGREDIENTS } from "@/data/ingredients";
import type { CatalogIngredient, IngredientCategory } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { Pill } from "@/components/shared/Pill";
import { Icon } from "@/components/shared/Icon";
import { MacroDot, type MacroKey } from "@/components/shared/MacroDot";
import styles from "./IngredientSelector.module.scss";

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

const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  dairy: "Dairy",
  sweetener: "Sweeteners",
  stabilizer: "Stabilizers",
  emulsifier: "Emulsifiers",
  inclusion: "Inclusions",
  alcohol: "Alcohol",
  fruit: "Fruit",
  "vegan-dairy": "Vegan dairy",
  misc: "Misc",
};

interface IngredientSelectorProps {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
  onDismiss: () => void;
}

export function IngredientSelector({ context, onAdd, onDismiss }: IngredientSelectorProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IngredientCategory | "all">("all");
  const allowedCategories = CONTEXT_CATEGORIES[context] ?? CONTEXT_CATEGORIES.general;

  const filtered = INGREDIENTS.filter((ing) => {
    if (!allowedCategories.includes(ing.category)) return false;
    if (category !== "all" && ing.category !== category) return false;
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
    <div className={styles.drawer}>
      <div className={styles.scrim} onClick={onDismiss} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Pantry</h2>
          <button className={styles.closeBtn} type="button" onClick={onDismiss} aria-label="Close">
            <Icon name="close" size={20} />
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

        {allowedCategories.length > 1 && (
          <div className={styles.filters}>
            <Pill
              size="sm"
              tone={category === "all" ? "ink" : "ghost"}
              active={category === "all"}
              onClick={() => setCategory("all")}
            >
              All
            </Pill>
            {allowedCategories.map((cat) => (
              <Pill
                key={cat}
                size="sm"
                tone={category === cat ? "ink" : "ghost"}
                active={category === cat}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_LABEL[cat]}
              </Pill>
            ))}
          </div>
        )}

        <div className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>No ingredients match your search.</p>
          )}
          {filtered.map((ing) => {
            const macroKeys = Object.keys(ing.macros).filter(
              (k) => k !== "water" && ing.macros[k as keyof typeof ing.macros] > 0
            ) as MacroKey[];
            return (
              <button
                key={ing.id}
                className={styles.card}
                type="button"
                onClick={() => handleAdd(ing)}
              >
                <div className={styles.cardBody}>
                  <p className={styles.ingName}>{ing.name}</p>
                  <p className={styles.ingCat}>{CATEGORY_LABEL[ing.category]}</p>
                  <p className={styles.ingDesc}>{ing.description}</p>
                  <div className={styles.macros}>
                    {macroKeys.map((k) => (
                      <MacroDot key={k} macro={k} size={9} />
                    ))}
                  </div>
                </div>
                <span className={styles.addBtn} aria-hidden>
                  <Icon name="plus" size={18} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
