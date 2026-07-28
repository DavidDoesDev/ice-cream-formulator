# Redesign — "Cold Hard Science" (Ice Cream Lab)

## Problem Statement

The app shipped the **press** identity (`press-reskin.md`): warm risograph paper,
blue-violet ink, Anton poster type, a caution-tape marquee. It works, but the new
mockups (`~/Desktop/icl`, to be moved into `docs/mockups/`) push a sharper,
cooler, instrument-grade "cold hard science" identity — and, more importantly,
they expose that the UI is only **~60% component-driven**: `Pill` is overloaded as
both button and toggle, sliders/modals/inputs/cards are inline one-offs, and each
screen re-implements the same rows and headers. This redesign is a **restyle plus
a real component foundation**, on the same untouched math engine.

## Relationship to prior PRDs

- **Supersedes `press-reskin.md`'s _identity_** (type, palette, the caution-tape
  marquee) while **preserving its _structure_ wholesale**: the always-live
  two-panel workspace, no "Done" commit, engine/solver/preset/persistence reuse,
  the six-candy macro system, film grain, the pint-cup hero, config-as-modal.
- **Preserves `ui-mockup-alignment.md`'s durable model**: individual-vs-grouped
  ingredients (milk/cream/eggs/water/alcohol/added = individual rows + own solver
  column; sugar/stabilizer = grouped), zone-based `measure` precision, per-
  ingredient inline notes, icon + uppercase section headers. **Retires** its
  rainbow-mask slider (the new mockups confirm per-macro solid colors) and its
  Config "creation vs settings" chrome (Config is settings-only; see below).
- **Adds** what neither had: a standardized primitive layer + a manifest/storybook
  registry, and a marketing/library page split.

## Domain vocabulary

Pinned in `CONTEXT.md`. The saved unit is a **Batch** (project) ⊃ **Formula**
(the design) ⊃ **Mix** (proportional formulation — macros + blends, set via the
Macros controls and Config) + **Recipe** (weighed ingredient list + yield + notes).
Nav says "My Batches" / "+ New Batch"; the editor button says "Edit Formula".
Internal renames (`SavedFormula` → Batch, route rename) are deferred — the model
lives in the types, not the identifiers.

## Solution

### Identity & tokens (Phase 0)

- **Type — full swap.** Drop Anton + Bricolage. **Space Grotesk** for hero + body
  (brutalist punch from weight + tight tracking + uppercase, not a condensed
  face); **Space Mono** for numbers, labels, and metadata rows.
- **Palette** (both themes ship; dark is the hero):
  - Backgrounds: dark `#0F1018` / raised `#1E202C`; light `#FCFBF9` / `#F1EFEB`.
  - Ink: `#F7EFDD` on dark, `#0F1018` on light (+ 50% muted).
  - Accent yellow `#F2C043` (+ 25% tint); secondary indigo `#525780`.
  - Six candy macros retuned to the mockup swatches: sugar `#F596AF`, alcohol
    `#F5A860`, fat `#F7C541`, stabilizer `#76DDAF`, non-fat solids `#6CC5EB`,
    emulsifier `#994CD5`. (Macro keys unchanged.)
- **Semantic layer** (new — decouples state color from the domain palette so it
  can diverge later): `--color-link: var(--accent)` (actions), `--color-alert:
  #D01244` (critical — its own crimson, *not* candy pink), `--color-ok:
  var(--c-mint)` (BALANCED), `--color-text` (neutral).
- **Grain kept** — retune `--grain` opacity for the cooler ground.
- **Marquee killed** — the caution-tape element is removed entirely; the static
  "COLD HARD SCIENCE" poster headline replaces it. No motif carryover.
- **SparkleCone unchanged** — it's theme-robust by design (multiply on the light
  paper, a black-cut video + screen on the dark ground). Bg move is dark→dark /
  light→light, so low-risk; only re-verify the light-theme multiply layers against
  the warmer→cooler paper and nudge its `palette.ts` tints if needed.

### Component system (Phase 1–2)

Mirror the conventions from `personal-productivity-scripting/site/src/components/ui`
(the reference), ported to **React + SCSS Modules**:

- **Options, not components.** Data-attribute variants off tokens
  (`.root[data-hierarchy="primary"][data-tone="critical"][data-size="sm"]`).
  Shared axes: `size: sm|md|lg`, `tone: normal|critical|neutral|ok`; `hierarchy`
  is Button-only. Merge look-alikes: Input absorbs textarea (`multiline`), Tag
  absorbs pill/badge/chip (`shape`/`selected`/`removable`), Card renders `<a>`
  via `href`.
- **Manifest/storybook registry** (scope B). Every component ships a
  `*.manifest.ts` (`ComponentManifest`: tier / props / axes / preview); a gallery
  route renders the variant matrix so the catalog can't drift from the contract.

**Primitives:** `Button` (hierarchy primary|secondary|tertiary|inverse · tone ·
size · icon · iconPosition none|only|before|after · href · disabled · loading),
`Card`, `Input`, `Tag` (was `Pill`), `Modal`/`Sheet`, `Tabs` (new), `Stat`,
`Callout`, `Slider` (**restyle only — zero change to the drag loop / worker
orchestration**), plus existing `Icon`, `MacroDot`, `Toast`, `Divider`.

**Molecules:** `FeatureCard`, `SelectableTile` (recipe-type + equipment grids;
reuses Card's selected state), `LineItem` (standardized row: leading label +
optional note/sub-label, **trailing slot** for a `GramScrubField` / `%` / number
input / remove — kills four inline row variants), `InlineNote`, `SectionHeader`.

**Domain:** `Header` + `EditorToolbar` (**split** — Header is site chrome only;
EditorToolbar is breadcrumb + editable title + `Config`, **no Done**, History
ticketed), `BatchCard`, `RecipePanel`, `MacrosPanel`, `SmartIngredientPanel`
(**one component** parameterized by capability: `selectable` presets and/or
`configurable` ratios; milk = ratios off, ingredient-set on), `PantryItem`,
`PintCup`, `GramScrubField`, `CompositionSlider`, `BalanceCheck`.

### Screens (Phase 3)

- **Home (`/`, always shown)** — marketing: SparkleCone hero + static "COLD HARD
  SCIENCE" headline + a 7-card feature grid (The Lab, Stocked Pantry, Equipment
  Optimized, Batch Scaling, Recipe Library, Balance Check, Label Maker). The grid
  **absorbs the ScienceSection** "how it works" content. Marketing decoration —
  not per-card navigation.
- **My Batches (`/batches`, new route)** — 2-col `BatchCard` grid + search. A
  returning user reaches it via nav (no auto-forward; `/` stays Home).
- **New Batch (`/new`, unchanged flow)** — archetype picker + fake-chatbot,
  restyled only. (Nondescript "plain base" starter option is ticketed for later.)
- **Editor (`/formula/[id]`, route unchanged)** — EditorToolbar + two cards
  (Recipe, Macros) side by side on desktop; **one combined card with `Recipe |
  Macros` tabs on mobile**, content stacked within each tab.
- **Config modal** — plain "Config" settings modal (recipe type, equipment,
  `SmartIngredientPanel`s). Settings-only; never creates a batch.
- **Pantry modal** — a **drill-down from Config** with a contextual `< Config`
  back button and a *sometimes*-shown constraint banner ("Select ingredients for
  your milk base"); opened **standalone** from the Recipe panel, both the back
  button and banner are absent. Modal content stacks on mobile.

## Reused / unchanged (no touch)

Formula engine, recipe solver (yield-conserving, individual + grouped columns),
mix-preset model, persistence, the `measure` formatter and zone precision, the
always-live two-way Mix↔Recipe binding, the no-Done philosophy, per-ingredient
notes, the PintCup composition math.

## Phasing

0. **Tokens & type** — palette + Space Grotesk + semantic layer + grain retune +
   kill marquee; verify SparkleCone on new grounds.
1. **Primitives + manifest/storybook** — Button, Card, Input, Tag, Modal/Sheet,
   Tabs, Stat, Callout; restyle Slider; gallery route.
2. **Molecules** — FeatureCard, SelectableTile, LineItem, InlineNote, SectionHeader.
3. **Screens** — Editor first (closest to done) → Config + Pantry → My Batches →
   Home (biggest structural change, touches SparkleCone layout) last.

## Out of scope / deferred (ticketed)

- Any change to formula math, solver, preset model, or persistence.
- **Route rename** `/formula/[id]` → `/batch/[id]/formula` — punted (6 callsites,
  localStorage-keyed id, no external links; an afternoon whenever sharing or the
  label maker forces it).
- **History** action — future feature; see `feature-ideas.md` "Save logic".
- **Nondescript "plain base" starter** + optional auto-open-Config — see
  `feature-ideas.md`.
- Label maker, real AI recipes, nutrition/costing, sharing, non-gram units.

## Further Notes

- Branch: `theme/redesign`.
- Mockups: `~/Desktop/icl` — to be committed under `docs/mockups/` (dark/light
  color sheets, components/type sheet, home, my-batches, edit-formula
  (desktop + mobile), config-modal, pantry-modal).
- Reference component conventions: `personal-productivity-scripting/site/
  src/components/ui` (contract only, not style).
