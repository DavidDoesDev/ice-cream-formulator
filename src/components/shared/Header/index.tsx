"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { Menu, Home, Plus, Moon, Sun } from "lucide-react";
import styles from "./Header.module.scss";

// The app's top header: a full-bleed sticky bar with a hamburger menu (Home +
// theme toggle), the "Ice Cream Lab" brand linking home, and an optional slot
// of page-specific actions (passed as children) pinned to the right. Owns the
// theme so every page's toggle behaves identically.
//
// revealOnScroll: start the bar off-screen (fixed, translated up) and slide it
// in only once the user scrolls past a small threshold — used on the homepage
// so it doesn't sit over the hero at the top.
const REVEAL_AT = 60;

export function Header({ children, revealOnScroll = false }: { children?: ReactNode; revealOnScroll?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [revealed, setRevealed] = useState(false);
  const menuWrap = useRef<HTMLDivElement>(null);

  // Reveal-on-scroll: track whether we're scrolled past the threshold.
  useEffect(() => {
    if (!revealOnScroll) return;
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AT);
    onScroll(); // sync initial state (e.g. loaded already scrolled)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealOnScroll]);

  // Close the menu on any click/tap outside it, or on Escape. A backdrop div
  // can't be used here: the header's backdrop-filter makes it the containing
  // block for position:fixed children, so a full-screen backdrop would only
  // cover the header bar, not the page below.
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

  // Reflect stored/system choice on mount, applying any explicit override.
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
      <div className={styles.menuWrap} ref={menuWrap}>
        <button
          className={styles.iconBtn}
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        {open && (
          <div className={styles.menu}>
            <Link href="/" className={styles.menuItem} onClick={() => setOpen(false)}>
              <Home size={16} strokeWidth={2} /> Home
            </Link>
            <Link href="/new" className={styles.menuItem} onClick={() => setOpen(false)}>
              <Plus size={16} strokeWidth={2} /> New formula
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
      <Link href="/" className={styles.brand}>Ice Cream Lab</Link>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
