## Problem Statement

Creating a new formula from a default (e.g. Rum Raisin, Peanut Butter) produces a recipe whose
ingredient amounts and macro readouts don't make sense — every custard default loads as a pint
of essentially pure egg yolk (issue #52). More broadly, the app can't answer a basic question —
"what is actually in this formula, in grams?" — because defaults are stored as target macro
*ratios* and the recipe is solved on the fly. And its guidance ("in range" / "rebalance") isn't
grounded in real ice-cream science: it checks each macro against a window but says nothing about
the *relationships* that decide whether a mix makes a good scoop (drop both fat and sugar and you
get an icy brick, and nothing warns you).

The root cause of #52: the only emulsifier source in a custard is egg yolk (~2% emulsifier), so a
target of 2% emulsifier is only reachable by a 100%-egg-yolk mix; on load, a direct trace-dosing
step drives the source to the whole batch and zeroes everything else. This is a symptom of a
deeper modelling gap — the 7-macro model collapses distinct ingredients (sucrose vs. dextrose;
dairy milk-solids vs. cocoa/starch solids) into single numbers, discarding exactly the
information that determines freezing, sweetness, and sandiness.

## Solution

Move to a **data-backed formulation model**, from the user's perspective:

- **Defaults are real recipes.** Each archetype carries an explicit, hand-authored gram recipe
  (sourced from standard references). Creating a formula loads those exact ingredients; the macro
  readout is computed *from* the recipe, so what you see always equals what's in the cup. The
  nonsensical-defaults bug disappears because nothing is solved on load.
- **Guidance grounded in the dessert style.** Each slider's healthy window comes from the frozen-
  dessert style (Philadelphia, custard, gelato, sherbet, sorbet, vegan), sourced from published
  composition tables — not from the individual archetype.
- **The app understands the chemistry.** A two-layer model keeps the familiar macro sliders but
  adds ingredient-level coefficients so the app can compute real **scoopability** (freezing-point
  depression / PAC), **sweetness** (POD), and **true dairy milk-solids** — and coach on the
  relationships between macros (e.g. "lean and icy — with less fat, raise the sugar to keep it
  scoopable"). The sliders stay independent; the balance panel advises, never fights you.

The full formulation design, decisions, and citations live in `docs/formulation/` (decision log
D1–D7, per-style ranges, base recipes, relationship spec, sources). That directory is the
authoritative source for all numbers and rationale; this PRD captures the engineering shape.

## User Stories

1. As a home ice-cream maker, I want a new formula from a default to contain sensible, real
   ingredient amounts, so that I can trust and actually make it.
2. As a home ice-cream maker, I want the macro readout to match the ingredient list exactly, so
   that the numbers are believable.
3. As a home ice-cream maker, I want to see exactly what's in a default (whole milk, cream, sugar,
   egg yolks, in grams), so that the recipe is transparent rather than a black box.
4. As a formulator, I want each slider's "in range" window to reflect the dessert style, so that a
   sorbet and a custard are judged by different, appropriate standards.
5. As a formulator, I want the sliders to remain independently adjustable, so that I keep direct
   control over each macro.
6. As a formulator, I want the app to warn me when a *combination* of macros won't scoop well
   (e.g. low fat and low sugar), so that I avoid an icy result even though each macro looks fine
   alone.
7. As a formulator, I want to know how scoopable/soft a mix will be (freezing-point depression),
   so that I can tune hardness at serving temperature.
8. As a formulator, I want to know how sweet a mix is independently of how soft it is, so that I
   can hold scoopability steady while adjusting sweetness (e.g. trading sucrose for dextrose).
9. As a formulator, I want a warning when milk solids are too high for the water content, so that
   I avoid a "sandy" (lactose-crystallized) texture.
10. As a formulator, I want a warning when the mix is watery but under-stabilized, so that I add
    enough stabilizer to control ice crystals.
11. As a formulator, I want a warning when sugar plus alcohol will keep the mix from setting, so
    that I don't end up with soup.
12. As a formulator swapping one mix for another in config (e.g. heavy cream → light cream), I
    want the amounts re-solved to hold the same macros, so that the character is preserved.
13. As a formulator, I want changing a formula's style to only re-scope the guidance, not silently
    rewrite my ingredients, so that I never lose work to a dropdown.
14. As a formulator, I want a mix I've added to stay editable in config even if it's unusual for
    the style, so that nothing I put in becomes orphaned/uneditable.
15. As a formulator, when my recipe lacks something typical of its style (a custard with no egg
    yolks), I want a one-tap suggestion to add it, so that I'm guided without being overridden.
16. As a user, I want the "milk solids" slider labelled honestly ("Non-fat solids"), so that it
    isn't misleading for non-dairy or inclusion-heavy formulas.
17. As a developer, I want scoopability/sweetness/dairy-MSNF computed from the recipe's real
    ingredients, so that swapping which sugar is used actually changes the numbers.
18. As a developer, I want these indices exposed as a small, stable, well-tested module, so that
    the UI readouts, the balance hints, and (later) solver targets can all share one source of
    truth.
19. As a developer, I want the new coefficient fields to be catalog metadata that is never
    persisted, so that adding them requires no data migration of saved formulas.
20. As a developer, I want the freezing estimate behind a stable interface, so that I can start
    with a directional estimate and later swap in a full freezing curve without touching callers.
21. As a developer, I want a regression test proving a custard default no longer loads as pure egg
    yolk, so that issue #52 can't silently return.
22. As a maintainer, I want each formulation number traceable to a cited source, so that
    disputes ("this French vanilla vs. that one") are resolvable against the literature.

## Implementation Decisions

### Formulation data model (schema)
- Keep the existing 7-macro model (`fat, sugar, nonfatSolids, stabilizer, emulsifier, alcohol,
  water`) unchanged as the coarse composition layer for body, total solids, sliders, and the
  solver.
- Add three **optional** coefficient fields to the catalog ingredient type: a freezing-point-
  depression factor, a sweetening-power factor (both sucrose = 100), and a lactose mass fraction.
  Only sugars/alcohol/salt carry the first two; only dairy ingredients carry lactose. Values and
  rationale per `docs/formulation/relationships.md`.
- These fields are catalog metadata only. Persistence stores a formula's recipe (preset ids +
  grams) and a synthetic macro-block state — never ingredient-macro objects — so the additions
  require no migration of saved formulas.
- Archetypes gain an explicit `recipe` (smart mixes + additional ingredients, in grams) and drop
  target ratios as an input; ratios become a derived readout.
- Add one standard sugar preset representing the sucrose+glucose blend used by the base recipes.
- Add a per-recipe `equipment` setting (enum, default `home-dasher`) as a placeholder second axis
  (see D8). Only the home-dasher profile is calibrated in this migration; the picker and alternate
  profiles are the deferred equipment feature.

### Derivation module (deep, extracted)
- A standalone module computes, from a `Recipe`: total solids, PAC (freezing-point depression),
  POD (sweetness), true dairy-MSNF, and lactose — by walking each smart mix's preset to its
  ingredients and their grams (plus additional ingredients by id). It must **not** read the
  aggregate macro snapshot, which has already collapsed ingredient identity.
- Simple, stable interface (`recipe → indices`); indices are linear in grams. Freezing is exposed
  behind a `computeFreezing()`-style function so a directional estimate can be replaced by a full
  iterative freezing curve later without changing callers.
- Chosen as its own module (not folded into the balance layer) because three consumers depend on
  it — balance hints, UI readouts, and later solver constraint rows — and coupling it to the
  coaching layer would invert the solver's dependencies.

### Balance & relationships layer
- Extends the existing advisory balance report. Keeps per-macro band checks and total solids;
  adds **relationship checks** as advisory hints only (sliders stay independent, never
  constrained): fat↔sugar (scoopability), sandiness via dairy-MSNF-in-water, fat↔dairy-MSNF
  (richness), stabilizer↔water, and PAC/POD out-of-band. Consumes the derivation module.
- Style-dependent bands (total solids, PAC) are calibrated from the authored base recipes rather
  than invented as absolutes.

### Per-style target ranges
- Replace the archetype-ratio-centered slider bounds with a range lookup. Windows are defined by
  (style × equipment): style drives composition macros, equipment shifts scoopability macros
  (sugar/PAC, stabilizer). This migration ships the **home-dasher baseline** only. Ranges and
  citations per `docs/formulation/style-targets.md` (dairy sugar windows shifted up to the home
  context, marked ‡). Vegan is a single wide range (a fat-source choice, not two styles).

### Archetype corpus & bootstrap
- Author explicit recipes for all archetypes (base-per-style + flavor inclusions, batched to
  1000 g). Base recipes per `docs/formulation/archetype-recipes.md`.
- Simplify archetype bootstrap to: clone the authored recipe, derive its ratios for the macro
  state. Remove the on-load trace-dosing step entirely (the #52 mechanism).

### Load path & live-edit semantics
- Formula load reads the explicit recipe directly; no solving, no trace-dosing.
- Config preset swaps stay macro-preserving (re-solve grams to hold current macros).
- Changing a formula's style only re-scopes ranges and shows/hides controls; it never mutates the
  recipe. A present mix is always editable in config regardless of style (never orphaned). When
  the recipe lacks a style-typical component, surface a non-destructive one-tap nudge.

### UI labels
- Rename the `nonfatSolids` slider/scorecard label from "Milk solids" to "Non-fat solids".

### Sequencing / rollout
- Ship PAC/POD/dairy-MSNF as **readouts and hints first**; solver targets come later (linear in
  grams, so no rework). Start with a directional freezing estimate. Do not expand the ingredient
  library until the schema lands, to avoid re-encoding coefficients twice.

## Testing Decisions

Good tests exercise external behavior, not implementation details: a recipe in, expected indices
or hints out — not internal call shapes. Prior art: the existing vitest suites over
`formula-engine`, `recipe-solver`, `live-workspace`, `mix-presets`, and `balance` (all green).

Modules to test (all four):
1. **Derivation module** — known recipes → known total solids / PAC / POD / dairy-MSNF / lactose;
   in particular a recipe with sucrose vs. one with dextrose must yield different PAC, proving
   ingredient identity is preserved.
2. **Balance/relationships evaluator** — index vectors → expected hints, including the low-fat +
   low-sugar "icy" case, the sandiness case, and PAC/POD out-of-band cases.
3. **Archetype bootstrap** — each archetype → a sensible recipe with derived ratios in range; a
   dedicated **#52 regression**: a custard default does not load as ~1000 g egg yolk.
4. **Per-style ranges** — style → expected slider bounds; each authored base recipe lands inside
   its own style's ranges.

## Out of Scope

- Solver *targeting* of PAC/POD/dairy-MSNF (constraint rows). Shipped later; readouts first.
- A full iterative freezing curve (water concentrating as it freezes, salt effects). A directional
  estimate ships first behind a stable interface.
- Expanding the ingredient catalog further (frozen until the schema lands).
- The equipment feature itself — a machine picker, calibrated windows for profiles beyond
  home-dasher, and the recalibration nudge. Only the `equipment` field + the home-dasher baseline
  ship now (D8); the rest is a separate feature built on the derivation module.
- A separate "frozen yogurt" style (captured as reference only).
- Splitting `nonfatSolids` into two macros; the dairy-MSNF distinction is handled by the derived
  layer, not a new macro dimension.
- Reworking the pint-cup visualization or other unrelated UI.

## Further Notes

- The design, every number, and its citation live in `docs/formulation/` (D1–D7). Treat that as
  the source of truth; this PRD is the engineering shape and should not duplicate the numbers.
- A few citations remain to firm up (exact Migoya POD figures; Arbuckle's ⅙-of-water sandiness
  page; pinning `glucose-syrup` to 42 DE) — tracked in the formulation docs, not blockers.
- Two flagged data reconciliations are deliberately deferred to a per-archetype review: the gelato
  base is derived-to-range, and Dana Cree's bases run sweeter than Goff's premium band.
- Next step: slice this PRD into executable issues (prd-to-issues).
