## Problem Statement

The app's five screens (Formula Preview, Formula Edit, Recipe Preview, Recipe Edit, Config) have drifted from the reference mockups in `docs/mockups/`. The drift is both cosmetic and structural:

- **Cosmetic:** section headers, uppercase treatment, borderless preview lists, the slider fill's rainbow-mask, percentage/gram precision, the share glyph, and button casing all differ from the design.
- **Structural:** Recipe Edit renders each Smart Mix as one opaque card ("Milk Mix — 500g"), but a formulator needs to see and weigh *individual* ingredients (whole milk, heavy cream). The design also calls for per-ingredient recipe notes, a Specific Ingredients section on Formula Edit (currently read-only, should be editable), a scrubbable yield control, and a Config screen that doubles as a creation step.

The result: the app looks unfinished next to the mockups, and the Recipe Edit model can't express the ingredient-level control the mockups depict.

## Solution

Bring all five screens into alignment with the mockups, and make one structural change to the Recipe model that the design forces:

- **Individual vs grouped ingredients.** Milk, cream, egg components, water, alcohol, and user-added ingredients each become their own line item and their own solver column. Sugar System and Stabilizer System remain single grouped cards with fixed internal proportions (one solver column each). This makes the solver strictly more capable — it can trade whole-milk against heavy-cream to hit fat and nonfat targets independently — without breaking the existing column-based math.
- **Specific Ingredients on Formula Edit.** The Specific Ingredients section becomes editable: each specific ingredient gets a slider that behaves like a macro target (dragging it re-runs the solver), plus an inline note.
- **Per-ingredient recipe notes.** Any ingredient row — grouped or individual — can carry a note that is stored per-formula (not global to the ingredient catalog), edited inline.
- **Consistent presentation system.** Centered icon + uppercase section headers, a shared rainbow-mask slider fill drawn from the theme palette, zone-based precision for percentages and grams, uppercase treatment via CSS, borderless preview lists, a scrubbable yield hero, and creation-vs-settings chrome on Config.

## User Stories

### Formula Preview

1. As a formulator, I want a "COMPOSITION" section header with a pie-chart icon above the pint, so that the screen reads like the design.
2. As a formulator, I want the macro breakdown as a two-column typographic grid with the percentage to the left of an uppercase label and no color swatches, so that it matches the mockup's clean stat layout.
3. As a formulator, I want fat listed first in the macro breakdown, so that the ordering matches my mental model.
4. As a formulator, I want water omitted from the composition breakdown, so that the list shows only the six meaningful macros.
5. As a formulator, I want the ingredients list to be a borderless divided list under a centered cart-icon "INGREDIENTS" header, so that it matches the design.
6. As a formulator, I want ingredient names in the preview shown in their natural (Title) case, so that "Heavy Cream (40% Fat)" reads normally.

### Formula Edit

7. As a formulator, I want the composition sliders to use a single shared rainbow gradient drawn from the theme palette, so that the sliders look cohesive and on-brand.
8. As a formulator, I want the gradient painted across the full track and revealed as a mask up to the fill point (not stretched to fit the fill), so that the color under the thumb is stable as I drag.
9. As a formulator, I want slider min/max bound labels removed, so that the slider reads as cleanly as the mockup.
10. As a formulator, I want slider values formatted with zone-based precision, so that small values show meaningful digits and large ones stay tidy.
11. As a formulator, I want a "COMPOSITION" header with a pie icon above the sliders, so that Formula Edit matches Formula Preview and the design.
12. As a formulator, I want the "SPECIFIC INGREDIENTS" section present on Formula Edit, so that I can adjust specialty ingredients from the same screen as the macros.
13. As a formulator, I want each specific ingredient to have a slider that behaves like a macro target, so that dragging it re-solves the recipe around that proportion.
14. As a formulator, I want to attach an inline note to a specific ingredient, so that I can record why it's there or how to handle it.
15. As a formulator, I want the "out of balance / Rebalance" conflict banner to remain, so that I can recover when targets can't be met.
16. As a formulator, I want an "ADD INGREDIENT" call-to-action on Formula Edit, so that I can introduce a specialty ingredient without leaving the screen.

### Recipe Preview

17. As a formulator, I want the yield shown as a large hero number with an up/down affordance under a centered "YIELD" header, so that it matches the design (correctly spelled, not "YEILD").
18. As a formulator, I want to scrub the yield value by dragging vertically on it (up increases, down decreases), so that I can adjust batch size the way I would in a design tool.
19. As a formulator, I want the ± stepper buttons kept alongside the scrubber, so that I can make precise single-step changes.
20. As a formulator, I want the ingredients as a flat, borderless divided list under a cart-icon header, so that there are no mix sub-group labels cluttering the weigh-out list.
21. As a formulator, I want grams shown with zone-based precision, so that "305g" and "5g" read cleanly while tiny amounts keep a decimal.
22. As a formulator, I want notes under a centered pencil-icon "NOTES" header as borderless text, so that it matches the design.

### Recipe Edit

23. As a formulator, I want a single "INGREDIENTS" section instead of a "Smart Mixes" / "Additional Ingredients" split, so that the screen matches the mockup's one unified list.
24. As a formulator, I want milk, cream, egg components, water, alcohol, and added ingredients shown as individual rows I can weigh, so that the recipe is a real kitchen list.
25. As a formulator, I want Sugar System and Stabilizer System shown as single grouped cards with a total gram amount, so that their fixed internal proportions stay intact.
26. As a formulator, I want a gram value on every row with ± stepping, so that I can adjust quantities directly.
27. As a formulator, I want an inline note icon on any ingredient row (grouped or individual), so that I can record a recipe-specific note for that ingredient.
28. As a formulator, I want the CTA labeled "ADD INGREDIENT", so that it reads the way I prefer.
29. As a formulator, I want ingredient names shown in uppercase on the edit cards, so that they match the mockup's edit styling.
30. As a formulator, I want notes under a pencil-icon "NOTES" header, so that Recipe Edit matches Recipe Preview.

### Config

31. As a formulator creating a new formula from a custom option, I want the Config screen titled "New Formula" with a "CREATE" button, so that I can tinker before entering the workspace.
32. As a formulator editing an existing formula, I want the Config screen titled "Settings" with no "CREATE" button, so that changes save on back-out without a redundant create action.
33. As a formulator, I want section headers and rows styled with icons and uppercase labels consistent with the other screens.

### Cross-cutting

34. As a formulator, I want the formula name shown uppercase in screen headers, so that it matches the design's title treatment.
35. As a formulator, I want the share control to use the standard branching share glyph, so that it reads as "share" rather than an up-arrow.
36. As a formulator, I want percentages and grams formatted by one shared rule everywhere they appear, so that precision is consistent across screens.
37. As a formulator, I want section headers, glyphs, and icons rendered as crisp inline SVG line icons rather than emoji, so that the UI looks intentional across platforms.

## Implementation Decisions

### Precision (deep module: measure formatter)

A pure formatting module with two functions, used everywhere a percentage or gram value is displayed:

- **Percentage:** value ≥ 5 → 1 decimal; 2 ≤ value < 5 → 2 decimals; value < 2 → 3 decimals.
- **Grams:** value < 5 → 2 decimals; 5 ≤ value < 10 → 1 decimal; value ≥ 10 → 0 decimals.

Breakpoints are constants that may be tuned later. This is the highest-value new deep module: pure input→output, trivially testable.

### Ingredient granularity and the solver (deep module: recipe solver, extended)

The Recipe becomes a list of **components**, each of one of two kinds:

- **Grouped** — a fixed-proportion preset (Sugar System, Stabilizer System). One solver column using the preset's effective macros. Rendered as a single card. Internal proportions never change from the edit screens.
- **Single** — one catalog ingredient (whole milk, heavy cream, egg yolk, water, alcohol, or any user-added ingredient). One solver column using that ingredient's own macros. Rendered as its own card.

The solver's math is unchanged in character — it is already column-based over anything with a macro vector. The changes:

- Columns are built from components: grouped → preset effective macros; single → ingredient macros.
- The solver accepts optional **per-component proportion targets**. A Specific Ingredient slider on Formula Edit sets a target proportion for that component's column; the solver honors it while solving the remaining columns for the macro targets. Absent a target, a component solves freely as today.
- Non-negativity and yield conservation guarantees are preserved.

Recipe → Mix sync (recompute macro ratios from current grams) extends to iterate components uniformly.

### Recipe notes

A per-formula, per-component optional note (`note?: string`) stored on the recipe component. Notes are edited inline: tapping a row's note icon expands a textarea beneath that row. Notes are never written back to the global ingredient catalog. Any component — grouped or single — may carry a note.

### Slider rainbow mask (Formula Edit)

One shared gradient, identical on every composition slider, built from the six theme macro colors in a cool-to-warm left-to-right sweep. The gradient is painted at the full track width and clipped/masked to the current fill width; the thumb rides the clip edge. The revealed portion is always the same left slice of the same fixed gradient — it does not stretch to fill. Specific Ingredient sliders share the same fill treatment.

### Yield scrubber (deep-ish module: scrub interaction)

A pointer-drag interaction on the yield hero number: vertical drag, up increases and down decreases, at a sensitivity near 5 grams per pixel (tunable). The existing ± stepper buttons remain for precise single steps. Scrubbing is scoped to the yield control for this pass; scrubbing arbitrary gram fields is out of scope.

### Section headers and icons

A shared section-header treatment: centered inline-SVG line icon + uppercase label. Icons needed: pie (composition), cart (ingredients), scale (yield), pencil (notes), bag (specific ingredients), plus header glyphs for menu, share (branching glyph), chevron, and up/down. All are inline SVG line icons, not emoji. Preview screens use borderless divided lists (hairline dividers, no card border); the composition block keeps its soft section background.

### Uppercase treatment

Applied via CSS `text-transform`, never by mutating stored data:

- Screen header title (formula name): uppercase on all screens.
- Section header labels: uppercase.
- Composition macro labels (preview grid and edit sliders): uppercase.
- Ingredient names on **edit** cards (Formula Edit specific ingredients, Recipe Edit rows): uppercase.
- Ingredient names on **preview** lists: natural Title case (unchanged).

Macro label wording is corrected to the design's plural/standard forms where they diverge (e.g. "Milk solids" → "NONFAT SOLIDS"), with fat-first ordering retained per preference.

### Config creation-vs-settings chrome

Config gains a mode flag:

- **Creation mode** — header title "New Formula", bottom "CREATE" pill.
- **Settings mode** (existing formula) — header title "Settings", no CREATE; back-out saves as today.

The actual "custom option → open Config first" entry route is not wired in this pass; only the conditional chrome is built so the route can attach later. The recipe-type picker and the per-kind smart-ingredient selects are kept as they are for now. A UNITS section is deferred (it implies a metric/imperial conversion system beyond presentation).

### Modules to build or modify

1. **Measure formatter** (new) — pure percentage/gram precision. Tested.
2. **Recipe component model** (types) — grouped vs single components; optional per-component note.
3. **Recipe solver** (extend) — build columns from components; honor optional per-component proportion targets. Tested.
4. **Recipe seeder** (modify) — seed components at the correct granularity (milk/cream/eggs/water/alcohol as singles; sugar/stabilizer as groups).
5. **Section header** (new shared component) — centered icon + uppercase label.
6. **Icon set** (new) — inline SVG line icons.
7. **Scrub interaction** (new hook) — pointer-drag value editing for yield.
8. **FormulaPreview** (rewrite) — composition grid, borderless ingredients, precision.
9. **FormulaEdit** (rewrite) — rainbow-mask sliders, Specific Ingredients with sliders + notes, precision, header, remove bounds, keep conflict banner, ADD INGREDIENT CTA.
10. **RecipePreview** (rewrite) — yield hero + scrubber, borderless lists, precision, section headers.
11. **RecipeEdit** (rewrite) — single INGREDIENTS list of components, per-row grams + inline notes, ADD INGREDIENT, uppercase names.
12. **ConfigPanel + workspace header** (extend) — creation-vs-settings chrome, icons, section headers.

## Testing Decisions

Good tests verify observable behavior through public interfaces, not implementation details — a test should survive a refactor and break only when behavior changes. Expected values come from independent sources (worked examples, known-good literals), never recomputed the way the code computes them.

**Tested deep modules:**

- **Measure formatter** — table-driven cases across each precision zone and at the exact breakpoints (e.g. 4.999% vs 5%, 1.999% vs 2%; grams at 4.9/5/9.9/10). Assert exact formatted strings from hand-worked expectations.
- **Recipe solver (extended)** — given macro targets plus a per-component proportion target on a single ingredient, verify: the targeted component lands at (approximately) its requested proportion; resulting macros stay within tolerance of the macro targets; all grams are non-negative; total grams conserve the yield. Also verify a grouped component's internal proportions are unchanged after a solve.
- **Recipe seeder** — verify each style seeds components at the expected granularity (milk/cream/eggs/water as singles, sugar/stabilizer as groups) and that expected macro categories are non-zero.

**Not unit-tested** (presentation/interaction, verified by eye or light e2e): section headers, rainbow-mask fill, yield scrub, inline note expansion, Config chrome.

Prior art: `src/lib/formula-engine.test.ts`, `src/data/mix-presets.test.ts`, and existing recipe-solver tests (Vitest, node environment). A Playwright pass can confirm Recipe Edit shows individual ingredients whose grams sum to the yield.

## Out of Scope

- UNITS section and any metric/imperial conversion system.
- Wiring the "custom option → open Config as a creation step" entry route (only the conditional chrome is built).
- Scrubbing arbitrary gram fields (yield only).
- The dated mobile swipe-to-delete interaction from the Recipe Edit mockup (punted).
- Persisted user-created presets, nutrition/allergen derivation, cost tracking, PDF export (already out of scope per `recipe-and-mix.md`).

## Further Notes

This PRD updates several Recipe Edit / Recipe Preview / Config UI decisions from `docs/prds/recipe-and-mix.md`, chiefly: Recipe Edit no longer shows Smart Mixes as opaque collapsed cards — milk/cream/eggs/water/alcohol are individual rows while sugar/stabilizer remain grouped. The two-way Mix↔Recipe sync and the solver's core algorithm from that PRD are retained and extended, not replaced.

The mockups' misspelling ("YEILD") is intentional-looking but not intended; use "YIELD".

The Specific Ingredients row in the Formula Edit mockup shows two mini glyphs and a text line; the text line is the ingredient's note preview and the pencil glyph opens the inline note. A macro/pie glyph on that row is optional and may be deferred.
