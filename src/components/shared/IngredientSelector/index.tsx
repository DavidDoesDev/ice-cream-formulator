"use client";

import { useState } from "react";
import { Search, ChevronLeft, Milk, X } from "lucide-react";
import { INGREDIENTS } from "@/data/ingredients";
import type { CatalogIngredient, IngredientCategory } from "@/data/types";
import type { Ingredient } from "@/lib/formula-engine";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PantryItem } from "@/components/shared/PantryItem";
import styles from "./IngredientSelector.module.scss";

const CONTEXT_CATEGORIES: Record<string, IngredientCategory[]> = {
  "sugar-mix": ["sweetener"],
  "stabilizer-mix": ["stabilizer", "emulsifier"],
  // Custom-blend builders only accept ingredients valid for that blend. Stabilizer
  // blends may include an emulsifier, matching the built-in stabilizer presets.
  "sugar-custom": ["sweetener"],
  "stabilizer-custom": ["stabilizer", "emulsifier"],
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

// The mono section-header label above the grid, derived from context/filter.
const CONTEXT_TITLE: Record<string, string> = {
  "milk-custom": "Milk ingredients",
  "sugar-custom": "Sweeteners",
  "sugar-mix": "Sweeteners",
  "stabilizer-custom": "Stabilizers",
  "stabilizer-mix": "Stabilizers",
  "eggs-custom": "Emulsifiers",
  "emulsifier-custom": "Emulsifiers",
  "alcohol-custom": "Alcohol",
  general: "All ingredients",
};

interface IngredientSelectorProps {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
  onDismiss: () => void;
  // When opened as a drill-down from Config, shows a "< Config" back control.
  onBack?: () => void;
  // Optional constraint banner (e.g. "Select ingredients for your milk base").
  banner?: string;
}

export function IngredientSelector({ context, onAdd, onDismiss, onBack, banner }: IngredientSelectorProps) {
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

  const handleAdd = (catalog: CatalogIngredient) => {
    onAdd({
      id: catalog.id,
      name: catalog.name,
      state: "normal",
      grams: 50,
      macros: catalog.macros,
    });
    onDismiss();
  };

  const sectionTitle =
    category !== "all" ? CATEGORY_LABEL[category] + " ingredients" : CONTEXT_TITLE[context] ?? "Ingredients";

  const header = (
    <div className={styles.bar}>
      <span className={styles.barStart}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
            Config
          </button>
        )}
      </span>
      {banner && (
        <span className={styles.banner}>
          <Milk size={15} strokeWidth={2} aria-hidden />
          {banner}
        </span>
      )}
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Close">
        <X size={24} strokeWidth={1.75} />
      </button>
    </div>
  );

  return (
    <Modal open onClose={onDismiss} placement="center" size="xl" ariaLabel="Pantry" header={header}>
      <div className={styles.head}>
        <h2 className={styles.title}>Pantry</h2>
        <span className={styles.searchWrap}>
          <Input
            type="text"
            placeholder="Search ingredients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search size={16} strokeWidth={2} />}
            autoFocus
          />
        </span>
      </div>

      {allowedCategories.length > 1 && (
        <div className={styles.filters}>
          <Tag size="sm" selected={category === "all"} onClick={() => setCategory("all")}>
            All
          </Tag>
          {allowedCategories.map((cat) => (
            <Tag key={cat} size="sm" selected={category === cat} onClick={() => setCategory(cat)}>
              {CATEGORY_LABEL[cat]}
            </Tag>
          ))}
        </div>
      )}

      <SectionHeader label={sectionTitle} />

      {filtered.length === 0 ? (
        <p className={styles.empty}>No ingredients match your search.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((ing) => (
            <PantryItem key={ing.id} ingredient={ing} onClick={() => handleAdd(ing)} />
          ))}
        </div>
      )}
    </Modal>
  );
}
