# design-sync notes — ice-cream-formulator

This repo is a **Next.js app**, not a published component library. There is no
`dist/`; the design system is `src/components/**` (12 components, CSS-module
SCSS). The converter can't bundle `.module.scss` (esbuild has no SCSS/CSS-modules
loader, and `lib/bundle.mjs` is off-limits to fork), so a **pre-build step**
produces a plain-JS entry the converter consumes.

## Build pipeline (`cfg.buildCmd` = `node .design-sync/build-dist.mjs`)

`.design-sync/build-dist.mjs` produces, from `src/`:

- **`dist/index.js`** — esbuild bundles a barrel of the 12 components + the
  `FormulaProvider`. A plugin compiles each `*.module.scss` via `sass` and hands
  the CSS to esbuild's `local-css` loader (scopes class names, emits the class
  map, collects CSS). `react`/`react-dom` stay external (the converter
  externalizes them); `lucide-react` is bundled in so icons ship. → the
  converter's `--entry`.
- **`dist/index.css`** — the scoped component CSS, prepended with the compiled
  `globals.scss` token layer + a `--font-bricolage` definition. → `cfg.cssEntry`.
- **`dist/types/`** — a real `.d.ts` tree emitted by `tsc`
  (`.design-sync/tsconfig.dts.json`), with `@/…` path-alias imports rewritten to
  **relative** paths. This is required: the converter extracts each
  `<Name>Props` from the shipped `.d.ts` tree, and its ts-morph project has **no
  `paths` config**, so only on-disk relative imports resolve. `findTypesRoot`
  picks up `dist/types/` automatically. Without this, every prop body degrades to
  `[key: string]: unknown`.

`componentSrcMap` pins all 12 to their `src/.../index.tsx` (discovery + grouping
by dir: formula / recipe / shared).

## Fonts

The app loads **Bricolage Grotesque** at runtime via `next/font` (sets
`--font-bricolage`). That var is undefined in a static bundle, which made
`--font-display`'s `var()` invalid → **everything fell back to serif**. Fixed by:
(1) defining `--font-bricolage: "Bricolage Grotesque"` in the token layer
(build-dist), and (2) shipping the real face via `cfg.extraFonts`
(`.design-sync/fonts/bricolage.css` + 3 variable woff2 subsets downloaded from
Google Fonts, weight 400–700). Font files are committed under `.design-sync/fonts/`.

## Previews

Previews import components from `"ice-cream-formulator"` (shimmed to
`window.IceCreamDS`) and pull realistic data from repo modules via `@/` aliases
(`@/data/archetypes` `ARCHETYPES`, `@/lib/bootstrap` `bootstrapFromArchetype`) —
these resolve through the tsconfig-paths plugin and bundle into the preview.

- **FormulaPreview** reads `FormulaContext`, so its preview wraps it in
  `FormulaProvider` — **both imported from the bundle** so they share the one
  context instance (a provider from `@/context/FormulaContext` would be a
  different module and throw).
- **IngredientSelector** is a `position: fixed` full-screen modal. Its preview
  frames it in a `transform: translateZ(0)` box so the fixed overlay resolves
  against the frame and renders in-card. Override: `{cardMode: single,
  primaryStory: AllIngredients}` (a fixed/portal overlay trips `[GRID_OVERFLOW]`
  in the multi-cell grid; `single` is the exempt mode — `column` does NOT clear
  an `escape`-type overflow).

## Known render warns

- **`[RENDER_THIN]` on PintCup** — benign. PintCup is an SVG-only component (no
  text nodes), so the "no text, paints nothing" heuristic trips even though the
  layered cup clearly renders. Confirmed in the screenshots. Not a failure.

## Re-sync risks (watch-list for the next sync)

- **Prop-body fidelity depends on `dist/types/`.** If `build-dist.mjs`'s tsc step
  or the `@/`→relative rewrite breaks (e.g. a new alias shape, a TS error in a
  component), props silently degrade to `[key: string]: unknown` — validate
  still passes. After a re-sync, spot-check one `<Name>.d.ts` has real props.
- **Named domain types are not expanded.** Props like `recipe: Recipe`,
  `ratios: MacroRatios` reference the domain interface by name; the emitted
  `.d.ts` does not inline the shape (validate tolerates it — parses cleanly).
  Acceptable, but a design agent sees the name, not the fields. If richer
  contracts are wanted, add `cfg.dtsPropsFor` entries.
- **Bricolage Grotesque is vendored from Google Fonts** (v9, downloaded
  2026-07). If the app upgrades the font or the axes change, re-download.
- **Preview data is tied to repo modules** (`ARCHETYPES` ids, `bootstrapFromArchetype`).
  If archetype ids change or bootstrap's shape changes, previews may fail to
  compile → those components drop to the floor card. Ids used: philly-vanilla,
  philly-chocolate/…, custard-vanilla, custard-chocolate, custard-rum-raisin,
  gelato-pistachio, sorbet-mango.
- **`react`/`ts-morph`/`esbuild`/`sass` were installed into the repo's root
  `node_modules`** (npm walked up from `.ds-sync`), not `.ds-sync/node_modules`.
  A fresh `npm ci` wipes the extras (esbuild, ts-morph, @types/react); re-run the
  `.ds-sync` install before a re-sync. `sass` is a real repo dep so it survives.
