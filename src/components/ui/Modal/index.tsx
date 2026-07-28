"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.scss";

export type ModalPlacement = "center" | "sheet";
export type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  placement?: ModalPlacement;
  size?: ModalSize;
  title?: ReactNode;
  // Custom header — replaces the default title/close row. Used for the Config →
  // Pantry drill-down (a back button + constraint banner) instead of a title.
  header?: ReactNode;
  footer?: ReactNode;
  dismissable?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
}

// Blocking overlay (scrim + sheet). `placement="sheet"` slides in from the side
// for drawers (Pantry); `center` is a dialog (Config). Body is a column, so
// content stacks on mobile.
export function Modal({
  open,
  onClose,
  placement = "center",
  size = "md",
  title,
  header,
  footer,
  dismissable = true,
  ariaLabel,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;
  const showDefaultHead = !header && (title != null || dismissable);

  return (
    <div
      className={styles.root}
      data-placement={placement}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className={styles.scrim} onClick={dismissable ? onClose : undefined} />
      <div className={styles.sheet} data-size={size}>
        {header && <div className={styles.head}>{header}</div>}
        {showDefaultHead && (
          <div className={styles.head}>
            {title != null ? <span className={styles.title}>{title}</span> : <span />}
            {dismissable && (
              <button className={styles.close} type="button" aria-label="Close" onClick={onClose}>
                <X size={20} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
