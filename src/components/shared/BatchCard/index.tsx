import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/Button";
import styles from "./BatchCard.module.scss";

const STYLE_ABBR: Record<string, string> = { philadelphia: "Phila" };
const styleLabel = (s: string) => (STYLE_ABBR[s] ?? s).toUpperCase();

interface BatchCardProps {
  id: string;
  no: string; // "002"
  style: string;
  equipment: string;
  name: string;
  ingredients: string;
  onDelete: () => void;
}

// A saved batch in the library: mono metadata row + flavor name + ingredient
// summary + Edit Formula. Border-on-base.
export function BatchCard({ id, no, style, equipment, name, ingredients, onDelete }: BatchCardProps) {
  return (
    <div className={styles.card}>
      <button
        className={styles.del}
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
      >
        <Icon name="close" size={16} />
      </button>

      <div className={styles.meta}>
        <span className={styles.no}>№&nbsp;{no}</span>
        <span className={styles.dot} aria-hidden>·</span>
        <span>{styleLabel(style)}</span>
        <span className={styles.dot} aria-hidden>·</span>
        <span className={styles.rig}>{equipment}</span>
      </div>

      <h3 className={styles.name}>{name}</h3>
      {ingredients && <p className={styles.ingredients}>{ingredients}</p>}

      <div className={styles.action}>
        <Button hierarchy="secondary" size="sm" href={`/formula/${id}`}>
          Edit formula
        </Button>
      </div>
    </div>
  );
}
