"use client";

import { useState } from "react";
import { SquarePen } from "lucide-react";
import { Input } from "../Input";
import styles from "./InlineNote.module.scss";

interface InlineNoteProps {
  value: string;
  onChange: (note: string) => void;
  placeholder?: string;
}

// A compact note affordance for any line item: a pencil toggle showing the note
// (or an "add a note" prompt) that expands into a textarea. Generalized from the
// old IngredientNote — not tied to ingredients.
export function InlineNote({ value, onChange, placeholder = "Add a note" }: InlineNoteProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Input
        multiline
        size="sm"
        value={value}
        autoFocus
        rows={2}
        placeholder={`${placeholder}…`}
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
      <span className={styles.text}>{value || placeholder}</span>
    </button>
  );
}
