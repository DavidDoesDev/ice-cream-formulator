// Canonical palette. Source of truth for the color tokens mirrored into
// globals.scss as CSS custom properties. Kept here (typed, importable) so
// legibility is guarded by tests; globals.scss must use these same values.

// Six-candy macro palette (shared across themes) — tuned to the redesign swatches.
export const CANDY = {
  pink: "#F596AF", // sugar
  mint: "#76DDAF", // stabilizer (+ the "ok" state)
  yellow: "#F7C541", // fat
  sky: "#6CC5EB", // non-fat solids
  peach: "#F5A860", // alcohol
  lilac: "#C1ADFF",
} as const;

// Two accents. The action color (links, primary buttons, highlights) is the
// INDIGO in light mode and the YELLOW in dark mode — see globals.scss --accent.
// The yellow is also the fixed brand color (the logo badge) in both modes.
export const ACCENT = "#F2C043";
export const ACCENT_INDIGO = "#525780";
// Critical / danger — its own crimson, distinct from candy pink.
export const ALERT = "#D01244";

// Cold Hard Science · light: cool near-white ground, near-black ink.
export const pressLight = {
  paper: "#FCFBF9",
  paper2: "#F1EFEB",
  panel: "#F1EFEB",
  ink: "#0F1018",
  text: "#0F1018",
} as const;

// Cold Hard Science · dark: cool near-black field, warm cream ink.
export const pressDark = {
  paper: "#0F1018",
  paper2: "#1E202C",
  panel: "#1E202C",
  ink: "#F7EFDD",
  text: "#F7EFDD",
} as const;
