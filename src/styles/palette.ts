// Canonical press palette. Source of truth for the color tokens mirrored into
// globals.scss as CSS custom properties. Kept here (typed, importable) so
// legibility is guarded by tests; globals.scss must use these same values.

// Six-candy macro palette (shared across themes).
export const CANDY = {
  pink: "#FF9BB4",
  mint: "#79E4B4",
  yellow: "#FFCF43",
  sky: "#6FCBF2",
  peach: "#FFAD63",
  lilac: "#C1ADFF",
} as const;

// Blue-violet ink — the accent that carries headings, outlines, and links.
// EXPERIMENT: OKLCh chroma ×0.15, perceptual lightness ×0.3 (muted + much darker). Was #4b39f2.
export const ACCENT = "#07091b";

// Press · light: warm paper ground, ink drawn in the accent.
export const pressLight = {
  paper: "#F0E6D3",
  paper2: "#FBF5E9",
  panel: "#ECE0CB",
  ink: ACCENT,
  text: ACCENT,
} as const;

// Press · dark: indigo field, paper-tone ink.
export const pressDark = {
  paper: ACCENT,
  paper2: "#0a0c1d", // EXPERIMENT: OKLCh chroma ×0.15, L ×0.3. Was #5b4bf4.
  panel: "#050615", // EXPERIMENT: OKLCh chroma ×0.15, L ×0.3. Was #3f2fc9.
  ink: "#F7EFDD",
  text: "#F7EFDD",
} as const;
