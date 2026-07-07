/* =========================================================================
   Ice Cream Lab — reskin · domain data + helpers + shared UI atoms
   Everything is exported to window at the bottom for the other babel files.
   ========================================================================= */

/* ---- Macro model -------------------------------------------------------- */
// Weight fractions of a finished mix. water is the remainder / carrier.
// Order here = bottom→top stacking order in the PintCup "core sample".
const MACROS = [
  { key: "water",        label: "Water",       short: "H₂O", cvar: "--m-water" },
  { key: "nonfatSolids", label: "Milk solids", short: "MSNF", cvar: "--m-nonfat" },
  { key: "sugar",        label: "Sugar",       short: "SUG", cvar: "--m-sugar" },
  { key: "fat",          label: "Fat",         short: "FAT", cvar: "--m-fat" },
  { key: "stabilizer",   label: "Stabilizer",  short: "STB", cvar: "--m-stab" },
  { key: "emulsifier",   label: "Emulsifier",  short: "EMU", cvar: "--m-emul" },
  { key: "alcohol",      label: "Alcohol",     short: "ABV", cvar: "--m-alc" },
];
const MACRO_KEYS = MACROS.map((m) => m.key);
const ZERO = Object.fromEntries(MACRO_KEYS.map((k) => [k, 0]));

// "Solids" a churner cares about (everything that isn't water).
const SOLID_KEYS = ["fat", "sugar", "nonfatSolids", "stabilizer", "emulsifier"];

// Healthy target windows (fraction of mix), for the balance read-out.
const BANDS = {
  fat:          { lo: 0.10, hi: 0.20, sorbetOk: true },
  sugar:        { lo: 0.14, hi: 0.24 },
  nonfatSolids: { lo: 0.07, hi: 0.12, sorbetOk: true },
  totalSolids:  { lo: 0.34, hi: 0.44 },
};

/* ---- Ingredient catalog (subset of the real DS catalog) ----------------- */
const mk = (id, name, category, note, macros) => ({
  id, name, category, note,
  macros: { ...ZERO, ...macros },
});
const INGREDIENTS = [
  mk("whole-milk", "Whole Milk", "dairy", "The backbone. Water, a little fat, milk solids.",
     { fat: 0.036, sugar: 0.048, nonfatSolids: 0.039, water: 0.877 }),
  mk("heavy-cream", "Heavy Cream", "dairy", "High-fat cream — the primary fat source.",
     { fat: 0.35, sugar: 0.02, nonfatSolids: 0.02, water: 0.61 }),
  mk("skim-powder", "Skim Milk Powder", "dairy", "Pure milk solids. Boost MSNF without adding fat.",
     { fat: 0.01, sugar: 0.52, nonfatSolids: 0.43, water: 0.04 }),
  mk("egg-yolk", "Egg Yolk", "emulsifier", "The custard emulsifier. Silky, coating mouthfeel.",
     { fat: 0.27, nonfatSolids: 0.14, emulsifier: 0.02, water: 0.5 }),
  mk("sucrose", "Sucrose", "sweetener", "Plain table sugar. The baseline sweetener.",
     { sugar: 1 }),
  mk("dextrose", "Dextrose", "sweetener", "Less sweet, softer scoop, lowers freezing point.",
     { sugar: 1 }),
  mk("invert", "Invert Sugar", "sweetener", "Stays liquid, resists crystallization, smooth over time.",
     { sugar: 0.75, water: 0.25 }),
  mk("cocoa", "Dutch Cocoa", "inclusion", "Deep chocolate flavor with minimal fat.",
     { fat: 0.12, nonfatSolids: 0.76, water: 0.03 }),
  mk("dark-choc", "Dark Chocolate", "inclusion", "Melted-in. Adds fat and intense flavor.",
     { fat: 0.42, sugar: 0.28, nonfatSolids: 0.14, emulsifier: 0.01, water: 0.01 }),
  mk("pistachio", "Pistachio Paste", "inclusion", "Pure roasted paste. Savory, intensely green.",
     { fat: 0.62, sugar: 0.05, nonfatSolids: 0.24, water: 0.02 }),
  mk("vanilla-bean", "Vanilla Bean", "inclusion", "Scraped whole bean. Visible specks, floral.",
     { sugar: 0.1, nonfatSolids: 0.85, water: 0.05 }),
  mk("mango", "Mango Purée", "fruit", "Tropical, sweet. High water — account for dilution.",
     { sugar: 0.14, nonfatSolids: 0.005, water: 0.855 }),
  mk("raspberry", "Raspberry", "fruit", "Bright and tart. High water content.",
     { sugar: 0.07, nonfatSolids: 0.005, water: 0.925 }),
  mk("lbg", "Locust Bean Gum", "stabilizer", "Controls ice crystal size, improves body.",
     { stabilizer: 1 }),
  mk("lecithin", "Soy Lecithin", "emulsifier", "Plant emulsifier. Body without richness.",
     { fat: 0.95, emulsifier: 0.05 }),
  mk("raisins", "Rum Raisins", "inclusion", "Rum-soaked. High natural sugar; plump when frozen.",
     { sugar: 0.62, nonfatSolids: 0.04, alcohol: 0.05, water: 0.29 }),
  mk("vodka", "Vodka", "alcohol", "Neutral spirit. Softer, spoonable straight from the freezer.",
     { alcohol: 0.4, water: 0.6 }),
];
const ingById = (id) => INGREDIENTS.find((i) => i.id === id);

/* ---- Math: grams → macro ratios ---------------------------------------- */
const sumGrams = (rows) => rows.reduce((s, r) => s + (r.grams || 0), 0);

function computeRatios(rows) {
  const total = sumGrams(rows);
  if (total <= 0) return { ...ZERO };
  const acc = { ...ZERO };
  for (const row of rows) {
    const ing = ingById(row.id);
    if (!ing) continue;
    const p = row.grams / total;
    for (const k of MACRO_KEYS) acc[k] += (ing.macros[k] || 0) * p;
  }
  return acc;
}
const totalSolids = (r) => SOLID_KEYS.reduce((s, k) => s + (r[k] || 0), 0);

/* formatting */
const pct = (x, d = 1) => (x * 100).toFixed(d).replace(/\.0$/, "");
const grams = (g) => (g >= 1000 ? (g / 1000).toFixed(g % 1000 ? 2 : 1) + "kg" : Math.round(g) + "g");

/* balance verdict for a macro key */
function verdict(key, r) {
  const band = BANDS[key];
  if (!band) return "ok";
  const v = key === "totalSolids" ? totalSolids(r) : r[key];
  if (v < band.lo) return "low";
  if (v > band.hi) return "high";
  return "ok";
}

/* ---- Two-way solve: nudge grams so a macro hits a target fraction ------- */
// Picks the purest present source for the macro and rescales just that
// ingredient's grams so the whole-mix fraction lands on `target`.
function macroSource(rows, key) {
  let idx = -1, purity = -1;
  rows.forEach((r, i) => { const ing = ingById(r.id); if (!ing) return; const p = ing.macros[key] || 0; if (p > purity) { purity = p; idx = i; } });
  return purity > 0 ? { idx, purity } : null;
}
function solveMacro(rows, key, target) {
  const src = macroSource(rows, key);
  if (!src) return rows;
  const i = src.idx, a = src.purity;
  let Cother = 0, Gother = 0;
  rows.forEach((r, j) => { if (j === i) return; const ing = ingById(r.id); const p = ing ? (ing.macros[key] || 0) : 0; Cother += p * (r.grams || 0); Gother += (r.grams || 0); });
  const denom = a - target;
  let gi = denom <= 0.0005 ? 4000 : (target * Gother - Cother) / denom;
  gi = Math.max(1, Math.min(5000, Math.round(gi)));
  return rows.map((r, j) => (j === i ? { ...r, grams: gi } : r));
}

/* ---- Saved-recipe store (localStorage) --------------------------------- */
const SAVE_KEY = "icl.recipes.v1";
const styleToSwatch = (s) => ({ "Philadelphia": "sky", "French Custard": "lilac", "Gelato": "mint", "Sorbet": "yellow" }[s] || "peach");
const slugify = (s) => ((s || "batch").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "batch");
function loadSaved() {
  try { const arr = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]"); return Array.isArray(arr) ? arr.sort((a, b) => (b.ts || 0) - (a.ts || 0)) : []; }
  catch (_) { return []; }
}
function persistSaved(arr) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); } catch (_) {} }
function saveRecipe(rec) {
  const arr = loadSaved().filter((r) => r.id !== rec.id);
  const entry = { ...rec, saved: true, ts: Date.now() };
  arr.unshift(entry); persistSaved(arr); return entry;
}
function deleteSaved(id) { persistSaved(loadSaved().filter((r) => r.id !== id)); }

/* ---- Recipes (grams) — saved formulas for the library ------------------- */
// grams chosen so computed ratios land in real ice-cream territory.
const recipe = (rows) => rows.map(([id, g]) => ({ id, grams: g, name: ingById(id)?.name }));

const RECIPES = [
  {
    id: "philly-vanilla", name: "House Vanilla", style: "Philadelphia",
    kicker: "No. 001", blurb: "The control sample. Eggless, clean, unbothered.",
    swatch: "sky", notes: "Age the base overnight for a rounder mouthfeel. Churn cold.",
    rows: recipe([["whole-milk", 480], ["heavy-cream", 300], ["sucrose", 150], ["skim-powder", 45], ["vanilla-bean", 22], ["lbg", 3]]),
  },
  {
    id: "custard-choc", name: "Blackout Custard", style: "French Custard",
    kicker: "No. 002", blurb: "Egg yolks + Dutch cocoa. Serious about the dark.",
    swatch: "lilac", notes: "Cook the custard to 82°C, strain, chill hard before spinning.",
    rows: recipe([["whole-milk", 440], ["heavy-cream", 260], ["sucrose", 150], ["egg-yolk", 110], ["cocoa", 55], ["dark-choc", 60], ["lbg", 3]]),
  },
  {
    id: "gelato-pistachio", name: "Green Room", style: "Gelato",
    kicker: "No. 003", blurb: "Low fat, dense churn. All pistachio, no hiding.",
    swatch: "mint", notes: "Slow churn for low overrun. Salt sharpens the nut.",
    rows: recipe([["whole-milk", 560], ["heavy-cream", 120], ["sucrose", 140], ["dextrose", 35], ["pistachio", 120], ["skim-powder", 30], ["lbg", 4]]),
  },
  {
    id: "sorbet-mango", name: "Full Sun", style: "Sorbet",
    kicker: "No. 004", blurb: "No dairy. Just fruit, sugar, and restraint.",
    swatch: "yellow", notes: "Ripe Alphonso carries the sugar — taste before you spin.",
    rows: recipe([["mango", 620], ["sucrose", 150], ["dextrose", 40], ["invert", 45], ["lbg", 5]]),
  },
  {
    id: "custard-rumraisin", name: "Last Call", style: "French Custard",
    kicker: "No. 005", blurb: "Rum raisins + a shot of vodka for the soft scoop.",
    swatch: "peach", notes: "Soak the raisins 24h. The alcohol keeps it spoonable at −18°C.",
    rows: recipe([["whole-milk", 430], ["heavy-cream", 250], ["sucrose", 135], ["egg-yolk", 90], ["raisins", 90], ["vodka", 25], ["lbg", 3]]),
  },
  {
    id: "philly-raspberry", name: "Loud Pink", style: "Philadelphia",
    kicker: "No. 006", blurb: "Cream base swung bright with fresh raspberry.",
    swatch: "pink", notes: "Fold half the purée as a ripple after churning.",
    rows: recipe([["whole-milk", 440], ["heavy-cream", 300], ["sucrose", 160], ["raspberry", 180], ["skim-powder", 40], ["lbg", 4]]),
  },
];

/* ---- Archetypes (starting bases for a new formula) ---------------------- */
const ARCHETYPES = [
  { id: "philadelphia", name: "Philadelphia", tag: "No egg", swatch: "sky",
    blurb: "Cream, milk, sugar. Fast, clean, and the easiest to steer.",
    rows: recipe([["whole-milk", 500], ["heavy-cream", 300], ["sucrose", 150], ["skim-powder", 45], ["lbg", 3]]) },
  { id: "custard", name: "French Custard", tag: "Egg yolk", swatch: "lilac",
    blurb: "Egg-yolk base. Rich, silky, and built for deep flavors.",
    rows: recipe([["whole-milk", 460], ["heavy-cream", 260], ["sucrose", 150], ["egg-yolk", 110], ["skim-powder", 20], ["lbg", 3]]) },
  { id: "gelato", name: "Gelato", tag: "Low fat", swatch: "mint",
    blurb: "Less fat, less air, more density. Flavor turned all the way up.",
    rows: recipe([["whole-milk", 600], ["heavy-cream", 120], ["sucrose", 140], ["dextrose", 35], ["skim-powder", 40], ["lbg", 4]]) },
  { id: "sorbet", name: "Sorbet", tag: "No dairy", swatch: "yellow",
    blurb: "Fruit, water, sugar. Vegan by default and endlessly bright.",
    rows: recipe([["mango", 600], ["sucrose", 160], ["dextrose", 40], ["invert", 45], ["lbg", 5]]) },
];

/* ======================================================================== */
/*  Shared UI atoms                                                          */
/* ======================================================================== */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* Icons — deliberately simple flat geometry (lab / candy glyphs) */
function Icon({ name, size = 24, style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2.1, strokeLinecap: "round", strokeLinejoin: "round",
    style, "aria-hidden": true };
  switch (name) {
    case "flask":  return <svg {...p}><path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-3.5L14 9V3"/><path d="M7.5 15h9" fill="none"/></svg>;
    case "bolt":   return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/></svg>;
    case "snow":   return <svg {...p}><path d="M12 2v20M4 6l16 12M20 6 4 18"/></svg>;
    case "diamond":return <svg {...p}><path d="M12 2 4 9l8 13 8-13z" fill="currentColor" stroke="none"/></svg>;
    case "plus":   return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
    case "arrow":  return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "back":   return <svg {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case "close":  return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "dice":   return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>;
    case "spoon":  return <svg {...p}><ellipse cx="12" cy="6" rx="4" ry="5"/><path d="M12 11v10"/></svg>;
    case "check":  return <svg {...p}><path d="M4 12.5 9 18 20 5"/></svg>;
    case "minus":  return <svg {...p}><path d="M5 12h14"/></svg>;
    case "grip":   return <svg {...p}><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>;
    case "lock":   return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "info":   return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.7" r="0.95" fill="currentColor" stroke="none"/></svg>;
    default: return null;
  }
}

/* Pill — the sticker button used everywhere */
function Pill({ children, tone = "surface", size = "md", active, as = "button", className = "", ...rest }) {
  const Tag = as;
  return (
    <Tag className={`pill pill--${tone} pill--${size} ${active ? "is-active" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* Highlighter marker behind inline text */
function Mark({ children, color = "mint" }) {
  return <span className="mark" data-color={color}>{children}</span>;
}

/* Marquee — a rotated scrolling band. words: array of {text, icon?} */
function Marquee({ words, tone = "pink", speed = 26, tilt = -2, on = true, reverse = false }) {
  if (!on) return null;
  const run = (
    <div className="marq__run" aria-hidden={reverse ? true : undefined}>
      {words.map((w, i) => (
        <span className="marq__item" key={i}>
          <span className="marq__text">{w.text}</span>
          {w.icon && <Icon name={w.icon} size={30} />}
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marq marq--${tone}`} style={{ "--marq-tilt": tilt + "deg" }}>
      <div className="marq__track" style={{ "--marq-speed": speed + "s", animationDirection: reverse ? "reverse" : "normal" }}>
        {run}
        {React.cloneElement(run, { key: "dup", "aria-hidden": true })}
      </div>
    </div>
  );
}

/* Macro chip — a colored dot + short label */
function MacroDot({ mkey, size = 12 }) {
  const meta = MACROS.find((m) => m.key === mkey);
  return <span className="mdot" style={{ width: size, height: size, background: `var(${meta.cvar})` }} title={meta.label} />;
}

/* swatch var helper */
const SWATCH = { pink: "--c-pink", mint: "--c-mint", yellow: "--c-yellow", sky: "--c-sky", peach: "--c-peach", lilac: "--c-lilac" };
const swatchVar = (name) => `var(${SWATCH[name] || "--c-sky"})`;

Object.assign(window, {
  MACROS, MACRO_KEYS, ZERO, SOLID_KEYS, BANDS,
  INGREDIENTS, ingById, computeRatios, sumGrams, totalSolids, verdict,
  pct, grams, RECIPES, ARCHETYPES,
  solveMacro, macroSource, styleToSwatch, slugify, loadSaved, saveRecipe, deleteSaved,
  Icon, Pill, Mark, Marquee, MacroDot, swatchVar, SWATCH,
  useState, useEffect, useRef, useCallback, useMemo,
});
