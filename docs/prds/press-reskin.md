# Press Reskin — Ice Cream Lab

## Problem Statement

The app works, but it looks like a decade-old iPhone app: generic cards, a
view/edit split, a cramped single-column workspace. It doesn't feel like a
place you'd want to invent frozen formulas. The goal is a fundamental visual
and interaction rethink — an artsy, warm, "mad-scientist" identity worthy of a
2026 Webby — without disturbing the math engine that already works.

The reskin direction ("press") was explored in Claude Design and exported to
`docs/claude-design/reskin1/` as a React prototype. That prototype is **visual
reference only**: its math (`solveMacro`) and its ingredient catalog are
throwaway mocks and must not be ported. The real engine in this repo is the
source of truth.

## Solution

Reskin the app in the **press** aesthetic — risograph / letterpress poster:
warm paper ground, cool blue-violet ink, hard offset shadows, oversized Anton
poster headlines, Bricolage body, Space Mono numeric readouts, custom lab
glyphs, an SVG film-grain overlay, and a yellow caution-tape marquee.

Restructure the formula workspace into a single always-live screen: the recipe
(grams) on the left and the macros (composition) on the right, both editable at
all times, with no preview/edit modes and no "Done" commit. Editing grams moves
the macros; dragging a macro slider re-solves the grams — continuously, in real
time — while the batch yield stays fixed unless the user changes it. A layered
"core sample" pint cup is the hero object. Balance guidance is layered: a soft
"N in range" scorecard plus per-macro coaching for everyday steering, and the
existing hard `conflict → Rebalance` path for targets that are physically
unreachable.

The underlying formula engine, recipe solver, mix-preset system, and
persistence are unchanged.

## User Stories

1. As a formulator, I want the recipe (grams) and the macros (composition) side
   by side, so that I can see cause and effect at a glance.
2. As a formulator, I want both panels editable at all times, so that I never
   have to switch into an "edit mode" or commit a change to see its effect.
3. As a formulator, I want editing a gram value to immediately update the macro
   composition, so that the two views are always consistent.
4. As a formulator, I want dragging a macro slider to re-solve the grams behind
   it, so that I can design from either direction.
5. As a formulator, I want the macro sliders to update the grams continuously as
   I drag, so that the workspace feels alive and responsive.
6. As a formulator, I want the batch yield to stay constant when I drag a macro
   slider, so that changing a ratio never silently rescales my whole batch.
7. As a formulator, I want to change the yield explicitly when I choose to, so
   that I can scale the whole recipe up or down on purpose.
8. As a formulator, I want a slider for every macro (fat, sugar, milk solids,
   stabilizer, emulsifier, alcohol, water), so that I have full manual control.
9. As a formulator, I want each slider's range narrowed to a sensible window for
   that macro, so that even trace amounts like 0.3% stabilizer are easy to place.
10. As a formulator, I want to see each macro's healthy target window marked on
    its slider track, so that I know where "in range" is while I drag.
11. As a formulator, I want the target-window marker to stay visible over the
    slider fill and thumb, so that it is actually usable and not buried.
12. As a formulator, I want a gram field I can click to type or drag to scrub, so
    that I can adjust amounts precisely or quickly.
13. As a formulator, I want to add ingredients from a searchable, category-
    filtered pantry, so that I can extend a recipe easily.
14. As a formulator, I want to remove an ingredient in one action, so that I can
    prune a recipe.
15. As a formulator, I want a soft "N of 4 in range" scorecard, so that I can
    judge at a glance whether the batch is stylistically balanced.
16. As a formulator, I want per-macro coaching ("Lean — add cream for body"), so
    that I know how to fix an out-of-range macro.
17. As a formulator, I want a Rebalance action when a target is physically
    unreachable, so that I can auto-resolve an impossible state.
18. As a formulator, I want the balance readout to distinguish soft guidance
    (stylistic windows) from hard conflicts (unreachable targets), so that I
    understand which problems are advisory and which are blocking.
19. As a formulator, I want the pint cup to show my macros as stacked layers, so
    that I can read the composition as a physical "core sample."
20. As a formulator, I want the cup's top surface to ripple gently, so that the
    hero object feels alive — while respecting reduced-motion preferences.
21. As a formulator, I want a confirmation toast when I save, so that I know my
    batch was stored.
22. As a formulator, I want to configure the base systems (milk, sugar,
    stabilizer, eggs, alcohol, emulsifier) in a modal over the dimmed workspace,
    so that I can adjust presets without losing sight of the recipe.
23. As a formulator, I want the config modal built from the same visual patterns
    as the rest of the app, so that it feels native, not bolted on.
24. As a returning user, I want my saved formulas in a library on the home page,
    so that I can reopen past work.
25. As a returning user, I want to delete a saved formula, so that I can keep my
    library tidy.
26. As a new user, I want to start a formula from a style archetype, so that I
    begin from a sensible base rather than a blank page.
27. As a user, I want to name and rename a formula inline, so that titling feels
    lightweight.
28. As a user, I want a light/dark theme toggle, so that I can use the app in my
    preferred appearance.
29. As a user, I want the app's identity to feel like a warm, artsy print studio
    — poster type, paper ground, ink outlines, a caution-tape marquee — so that
    it feels designed, not templated.
30. As a user, I want the marquee to read like lab caution tape, so that the
    "lab" theme is playful without being hokey.
31. As a user on reduced-motion, I want animations (marquee, cup ripple, grain)
    stilled, so that the app respects my accessibility settings.
32. As a user, I want text to stay legible against the paper and ink in both
    themes, so that the aesthetic never costs me readability.
33. As a formulator, I want quick-add suggestions for common ingredients, so that
    I can extend a recipe without opening the full pantry.
34. As a formulator, I want to reset a formula to its starting point, so that I
    can abandon an exploration.

## Implementation Decisions

### Engine reuse (no change)

- The formula engine (macro ratios, ingredient state, `adjustRatio`, `conflict`,
  `rebalance`), the recipe solver (yield-conserving NNLS over smart-mix presets),
  the mix-preset / base-system model, the ingredient catalog, and persistence
  are **reused as-is**. The reskin consumes them; it does not modify their logic.
- The prototype's `solveMacro` and mock catalog are discarded.

### Workspace restructure

- Replace the `{formula, recipe} × {preview, edit}` matrix and the "Done" commit
  flow with a single always-live two-panel workspace: recipe/grams left,
  macros/composition right, both continuously editable.
- Retire the preview components and the mode/view toggle state.
- The macro panel is relabeled **Macros** (formerly "Formula").
- Bidirectional binding: gram edits derive ratios via the existing
  `computeRatios`; macro-slider edits re-solve grams via the existing
  yield-conserving solve path. The "when to solve" trigger is isolated in one
  place so continuous re-solve can be swapped for commit-on-release with a
  one-line change. Continuous re-solve warm-starts from current grams and is
  tuned for smooth per-frame updates.

### Sliders

- All seven macros are sliders. Each slider's range comes from the existing
  `computeSliderBounds` (archetype target ± per-macro tolerance, clamped to
  bounds), so trace macros get a proportionally usable track.
- Each track marks its healthy target window as edge ticks / notches rendered
  **on top of** the fill and thumb (not a fill underneath), plus an in-range vs
  out-of-range color treatment on the fill itself.

### Balance system

- Keep the hard `conflict → Rebalance` path for unreachable targets.
- Add a soft balance layer adopted from the prototype: a "N of 4 in range"
  scorecard against the per-style healthy windows, and per-macro coaching text
  for low/high verdicts. Soft guidance and hard conflict are visually distinct.

### Config

- The base-system builder becomes a lighter modal centered over a dimmed
  workspace (workspace stays visible behind it), replacing the full-surface
  takeover. Content is functionally unchanged — restyled only.
- The modal is built from the app's analogous overlay patterns (sheet + scrim,
  popover) rather than new modal chrome.

### Identity & tokens

- Design tokens live as CSS custom properties in the global stylesheet; every
  component uses a sibling SCSS module with flat, class-targeted rules and no
  Tailwind.
- Type: Anton (poster headlines), Bricolage Grotesque (body/display), Space Mono
  (numeric readouts). Anton must be added to the bundled fonts.
- Palette: warm paper ground, `#4b39f2` blue-violet ink as the accent (headings,
  outlines, links), the six-candy macro palette mapped to the existing macro
  keys. Press treatment: hard offset shadows, thick ink outlines, rounded
  corners, an SVG film-grain overlay.
- Baked defaults (formerly prototype tweak knobs): headline = Anton, density =
  roomy, marquee on at 14s, theme default = light. Each is a single token/const,
  cheap to retune. Roomy density may drop to regular in the dense workspace if it
  reads bloated — a build-time call.
- The pint cup is the hero: a squat carton filled bottom-to-top with macro layers
  as tapered trapezoids, thin ink separators, a reduced-motion-aware rippling top
  surface, screenprint sheen. Driven directly by the real macro ratios.
- The home marquee is styled as yellow caution tape ("COLD · HARD · SCIENCE" for
  now — copy to be workshopped later).
- Adopt the prototype's custom lab glyph icons (flask, bolt, snowflake, etc.);
  add any missing ones. A save toast confirms persistence. Section headers use a
  colored-dot + rule divider treatment.

### Dropped

- The prototype's Tweaks panel (live accent/headline/copy editor — a Claude
  Design edit-mode tool), the PRESS/SPEC direction toggle, and the density knob
  are not shipped. The light/dark theme toggle is retained.

## Testing Decisions

Good tests here verify observable behavior through public interfaces, not
implementation details, and use independent expected values (known-good
literals, worked examples) rather than restating the code's own computation.

Recommended test targets:

- **Always-live workspace binding** — dragging a macro slider changes the target
  ratio while total yield stays constant; editing a gram value updates the
  derived ratios. These assert the two-way loop's contract, independent of how
  the panels render.
- **Balance scorecard (pure)** — given a set of ratios and a style, the "N in
  range" count and each macro's low/ok/high verdict match hand-worked expected
  values from the healthy windows.
- **Slider target-window geometry (pure)** — given a macro's computed bounds and
  current value, the target-window tick positions and the in/out-of-range state
  are correct at known inputs (edges, midpoint, out-of-range).
- **Legibility** — ink-on-paper text meets a WCAG contrast threshold in both
  light and dark themes. Prior art: the abandoned charm branch's contrast tests
  (relative-luminance / contrast-ratio helpers) are a good template.

The reused engine and solver already have tests (`formula-engine.test.ts`,
`recipe-solver.test.ts`, `mix-presets.test.ts`, `recipe-seeder.test.ts`) and are
not re-tested here. Presentational pieces (pint cup, marquee, grain, config
modal chrome) are verified visually, not unit-tested.

## Out of Scope

- Any change to the formula math, solver, preset model, or persistence.
- The "specimen" (night-lab) alternate direction — press only.
- Shipping the design-exploration knobs (accent/font/density/copy tweak panel).
- New ingredients or preset systems beyond what the catalog already has.
- Final marquee and hero copy — placeholder for now, workshopped later.
- Mobile-specific redesign beyond the responsive behavior the layout naturally
  provides.

## Further Notes

- Branch: `feat/reskin` (off current `main`, recent work intact).
- Reference artifact: `docs/claude-design/reskin1/` — visual source only.
- The design-sync pipeline (`.design-sync/`) is committed and can round-trip
  updated components back to Claude Design if the design system keeps evolving.
- Continuous re-solve is deliberately the starting choice because downgrading to
  commit-on-release later is trivial, whereas the reverse would require doing the
  per-frame performance work after the fact.
