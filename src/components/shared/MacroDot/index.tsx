import styles from "./MacroDot.module.scss";

export type MacroKey =
  | "fat"
  | "sugar"
  | "nonfatSolids"
  | "stabilizer"
  | "emulsifier"
  | "alcohol"
  | "water";

const MACRO_VAR: Record<MacroKey, string> = {
  fat: "--color-macro-fat",
  sugar: "--color-macro-sugar",
  nonfatSolids: "--color-macro-nonfat",
  stabilizer: "--color-macro-stabilizer",
  emulsifier: "--color-macro-emulsifier",
  alcohol: "--color-macro-alcohol",
  water: "--panel",
};

const MACRO_LABEL: Record<MacroKey, string> = {
  fat: "Fat",
  sugar: "Sugar",
  nonfatSolids: "Non-fat solids",
  stabilizer: "Stabilizer",
  emulsifier: "Emulsifier",
  alcohol: "Alcohol",
  water: "Water",
};

interface MacroDotProps {
  macro: MacroKey;
  size?: number;
}

// A colored dot keyed to a macro's candy color — used inline beside macro labels.
export function MacroDot({ macro, size = 12 }: MacroDotProps) {
  return (
    <span
      className={styles.dot}
      style={{ width: size, height: size, background: `var(${MACRO_VAR[macro]})` }}
      title={MACRO_LABEL[macro]}
    />
  );
}
