"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Menu, Home, Moon, Sun } from "lucide-react";
import styles from "./SiteMenu.module.scss";

// Inline hamburger menu (Home + theme toggle) for pages without the workspace
// topbar. Left-aligned, same look as the workspace's menu. Owns the theme.
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  return (
    <div className={styles.menuWrap}>
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
        <>
          <div className={styles.menuBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.menu}>
            <Link href="/" className={styles.menuItem} onClick={() => setOpen(false)}>
              <Home size={16} strokeWidth={2} />
              Home
            </Link>
            <button className={styles.menuItem} type="button" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
