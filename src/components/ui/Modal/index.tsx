"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Modal.module.scss";

export type ModalPlacement = "center" | "sheet";
export type ModalSize = "sm" | "md" | "lg" | "xl";

// Ref-counted body scroll lock, shared across stacked modals (Config → Pantry):
// only the first open captures the scroll position, only the last close restores
// it. Fixing the body freezes the page behind the scrim in place; padding-right
// backfills the vanished scrollbar so the frozen content doesn't shift.
let scrollLockCount = 0;
let lockedScrollY = 0;
function lockScroll() {
  if (scrollLockCount === 0) {
    lockedScrollY = window.scrollY;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const b = document.body;
    b.style.position = "fixed";
    b.style.top = `-${lockedScrollY}px`;
    b.style.left = "0";
    b.style.right = "0";
    b.style.width = "100%";
    if (gap > 0) b.style.paddingRight = `${gap}px`;
    // Recede the page shell behind the scrim (see .app-shell in globals).
    document.documentElement.setAttribute("data-modal-open", "");
  }
  scrollLockCount += 1;
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    const b = document.body;
    b.style.position = "";
    b.style.top = "";
    b.style.left = "";
    b.style.right = "";
    b.style.width = "";
    b.style.paddingRight = "";
    document.documentElement.removeAttribute("data-modal-open");
    window.scrollTo(0, lockedScrollY);
  }
}

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

  // Freeze the background scroll position while the modal is open.
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return unlockScroll;
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const showDefaultHead = !header && (title != null || dismissable);

  // Portal to <body> so the overlay sits outside .app-shell — otherwise the
  // shell's recede transform would scale the modal too (and break its fixed
  // positioning, since a transformed ancestor becomes the containing block).
  return createPortal(
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
                <X size={24} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
