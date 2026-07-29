import type { Viewport } from "next";
import type { ReactNode } from "react";

// TEMPORARY (home variant): zoom the mobile viewport out ~10% so the cone's
// callouts have room to sit on-screen instead of trailing off the edge.
// initial-scale is honoured on touch/mobile browsers and ignored on desktop.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.9,
};

export default function HomeVariant1Layout({ children }: { children: ReactNode }) {
  return children;
}
