"use client";
import { useEffect, useState } from "react";

// Hidden dev-mode gate. Enter with ?dev=1 (persists in localStorage), leave
// with ?dev=0. Once enabled, Ctrl+` toggles the panel's visibility. Users never
// stumble in — there is no visible affordance.
const FLAG = "devtools:on";

export function useDevGate(): { visible: boolean } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") localStorage.setItem(FLAG, "1");
    if (params.get("dev") === "0") localStorage.removeItem(FLAG);

    const on = localStorage.getItem(FLAG) === "1";
    setVisible(on);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { visible };
}
