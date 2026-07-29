"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import styles from "./Header.module.scss";

// The app's top header: logo + wordmark linking home on the left, primary nav
// (My Batches, Pricing) + a "···" overflow menu on the right. The inline nav
// collapses into the menu on narrow screens. Owns the theme toggle so every
// page behaves identically. Optional `children` render as a right-side action
// slot; `revealOnScroll` slides the bar in past a threshold (homepage hero).
const REVEAL_AT = 60;

export function Header({ children, revealOnScroll = false }: { children?: ReactNode; revealOnScroll?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [revealed, setRevealed] = useState(false);
  const menuWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!revealOnScroll) return;
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealOnScroll]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (menuWrap.current && !menuWrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const next =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", next);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync theme from storage/system on mount
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  const className = [
    styles.topbar,
    revealOnScroll && styles.reveal,
    revealOnScroll && !revealed && styles.hidden,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className}>
      <Link href="/" className={styles.brand}>
        <Logo className={styles.logo} />
        <span className={styles.word}>Ice Cream Lab</span>
      </Link>

      <nav className={styles.nav}>
        <Link href="/batches" className={styles.navLink}>
          My Batches
        </Link>
        <Link href="/pricing" className={styles.navLink}>
          Pricing
        </Link>
        {children && <div className={styles.actions}>{children}</div>}
        <div className={styles.menuWrap} ref={menuWrap}>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
          {open && (
            <div className={styles.menu}>
              {/* Splayable links — only appear here once they no longer fit inline. */}
              <Link href="/batches" className={`${styles.menuItem} ${styles.overflowItem}`} onClick={() => setOpen(false)}>
                My batches
              </Link>
              <Link href="/pricing" className={`${styles.menuItem} ${styles.overflowItem}`} onClick={() => setOpen(false)}>
                Pricing
              </Link>
              {/* Always in the menu — never splayed out. */}
              <Link href="/new" className={styles.menuItem} onClick={() => setOpen(false)}>
                <Plus size={16} strokeWidth={2} /> New batch
              </Link>
              <button
                className={styles.menuItem}
                type="button"
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
              >
                {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
