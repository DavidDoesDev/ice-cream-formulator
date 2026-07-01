"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./SearchModule.module.scss";

const SUGGESTIONS = [
  "a silky pistachio gelato",
  "a rich brown butter caramel",
  "a lean high protein treat",
  "a tangy lemon sorbet",
  "a vegan coconut base",
  "a dark chocolate custard",
  "a tropical passion fruit sorbet",
];

interface SearchModuleProps {
  onSubmit: (query: string) => void;
  autoFocus?: boolean;
}

export function SearchModule({ onSubmit, autoFocus = false }: SearchModuleProps) {
  const [open, setOpen] = useState(autoFocus);
  const [value, setValue] = useState("");
  const [chipOffset, setChipOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Rotate chips every 4 seconds while open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setChipOffset((o) => (o + 1) % SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [open]);

  const visibleSuggestions = [
    SUGGESTIONS[chipOffset % SUGGESTIONS.length],
    SUGGESTIONS[(chipOffset + 1) % SUGGESTIONS.length],
    SUGGESTIONS[(chipOffset + 2) % SUGGESTIONS.length],
  ];

  const handleSubmit = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      onSubmit(query.trim());
    },
    [onSubmit]
  );

  const handleChip = useCallback(
    (suggestion: string) => {
      setValue(suggestion);
      handleSubmit(suggestion);
    },
    [handleSubmit]
  );

  return (
    <div className={`${styles.module} ${open ? styles.expanded : ""}`}>
      <div className={styles.bar}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Describe your flavor…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit(value);
          }}
          aria-label="Describe your ice cream flavor"
        />
        <button
          className={styles.submit}
          type="button"
          onClick={() => handleSubmit(value)}
          aria-label="Search"
        >
          →
        </button>
      </div>

      {open && (
        <div className={styles.chips}>
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              className={styles.chip}
              type="button"
              onClick={() => handleChip(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
