import type { CatalogIngredient } from "@/data/types";
import type { IngredientMacros } from "@/lib/formula-engine";
import { formatPercent } from "@/lib/measure";
import styles from "./PantryItem.module.scss";

// Order flows down two columns to match the mock: FAT / SUGAR / NFS on the left,
// STABILIZER / ALCOHOL on the right (grid-auto-flow: row, 2 cols).
const STAT_KEYS: { key: keyof IngredientMacros; label: string }[] = [
  { key: "fat", label: "Fat" },
  { key: "stabilizer", label: "Stabilizer" },
  { key: "sugar", label: "Sugar" },
  { key: "alcohol", label: "Alcohol" },
  { key: "nonfatSolids", label: "NFS" },
];

interface PantryItemProps {
  ingredient: CatalogIngredient;
  onClick: () => void;
}

// A pantry catalog card: name + description + a mono macro-stat grid. The whole
// card is the add affordance. Shared by the Config drill-down and the standalone
// Recipe-panel pantry.
export function PantryItem({ ingredient, onClick }: PantryItemProps) {
  return (
    <button type="button" className={styles.item} onClick={onClick}>
      <span className={styles.name}>{ingredient.name}</span>
      <span className={styles.desc}>{ingredient.description}</span>
      <span className={styles.stats}>
        {STAT_KEYS.map(({ key, label }) => (
          <span key={key} className={styles.stat}>
            <span className={styles.statVal}>{formatPercent(ingredient.macros[key] * 100)}%</span>
            <span className={styles.statLabel}>{label}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
