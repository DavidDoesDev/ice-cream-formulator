"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import styles from "./Toast.module.scss";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

// Transient confirmation pill pinned to the bottom-center; self-dismisses.
export function Toast({ message, onDismiss, duration = 2400 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className={styles.toast} role="status">
      <Check size={16} strokeWidth={2.4} aria-hidden />
      {message}
    </div>
  );
}
