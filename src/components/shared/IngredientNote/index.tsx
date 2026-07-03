"use client";

import { useState } from "react";
import { SquarePen } from "lucide-react";
import styles from "./IngredientNote.module.scss";

interface IngredientNoteProps {
  value: string;
  onChange: (note: string) => void;
}

// A compact, reusable per-ingredient note: a pencil affordance that shows the
// note text (or an "add a note" prompt) and expands to a textarea on tap.
export function IngredientNote({ value, onChange }: IngredientNoteProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        className={styles.input}
        value={value}
        autoFocus
        rows={2}
        placeholder="Add a note…"
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
      />
    );
  }

  return (
    <button
      className={`${styles.toggle} ${value ? "" : styles.empty}`}
      type="button"
      onClick={() => setEditing(true)}
    >
      <SquarePen className={styles.icon} size={14} strokeWidth={2} aria-hidden />
      <span className={styles.text}>{value || "Add a note"}</span>
    </button>
  );
}
