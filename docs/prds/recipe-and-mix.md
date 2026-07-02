## Problem Statement

The current Recipe view shows virtual macro blocks (`_base-fat`, `_base-sugar`, `_base-water`, etc.) — internal modeling constructs that have no meaning in a kitchen. A recipe should list the real ingredients a person actually buys and weighs: whole milk, heavy cream, sucrose, skim milk powder, carrageenan. The app currently conflates two distinct concepts:

- **Mix** — the macroingredient composition: fat %, sugar %, nonfat milk solids %, water %, stabilizer %, emulsifier %, alcohol %
- **Recipe** — the actual ingredient list that produces that composition when combined

Without a real Recipe layer, the app cannot generate a usable formula card, cannot let users substitute real ingredients, and cannot solve the core formulation problem: given a target macronutrient profile, which real-world ingredients in what quantities achieve it?

## Solution

Introduce a **Recipe** layer alongside the existing Mix layer. The two are linked bidirectionally:

- Editing the **Mix** (dragging a macro slider) triggers a solver that automatically adjusts Smart Mix gram amounts to hit the new targets.
- Editing the **Recipe** (changing ingredient grams directly) recomputes the Mix ratios as a derived summary of what the real ingredients actually produce.

The Recipe is organized around **Smart Mixes** — named ingredient groupings that are seeded automatically when an archetype is selected, are not removable, and are configurable by the user. Users can also add arbitrary **additional ingredients** on top of the Smart Mixes; these are treated as fixed constraints by the solver.

In **Recipe Edit** view, Smart Mixes are shown as single collapsed line items (e.g., "Sugar Mix — 160g") with a gram stepper. In **Recipe Preview** view, each mix expands to show its constituent sub-ingredients scaled to the current gram amount.

## User Stories

1. As a formulator, I want the Recipe view to show real ingredients (whole milk, heavy cream, sucrose, carrageenan), so that I can hand it to someone in a kitchen and have them make it.
2. As a formulator, I want the Recipe to be automatically generated when I select an archetype, so that I don't have to build it from scratch every time.
3. As a formulator, I want the Recipe to update automatically when I adjust Mix sliders, so that the two views stay in sync without manual work.
4. As a formulator, I want the Mix ratios to recompute automatically when I change ingredient grams in the Recipe, so that I always see an accurate macro summary.
5. As a formulator, I want Smart Mixes to be collapsed into a single line in Recipe Edit, so that I can think in terms of systems rather than individual sub-ingredients when adjusting.
6. As a formulator, I want Smart Mixes to expand into individual sub-ingredients in Recipe Preview, so that I know exactly what to weigh out in the kitchen.
7. As a formulator, I want to configure which Sugar Mix preset I'm using (sucrose only, dextrose blend, invert sugar, natural), so that the recipe reflects my actual sweetener system.
8. As a formulator, I want to configure which Stabilizer Mix preset I'm using (Modernist Cuisine, cornstarch, Cremodan, custom), so that the recipe reflects my actual stabilizer system.
9. As a formulator, I want to configure the Milk Mix (standard, MSNF-boosted, plant-based, custom), so that the dairy base matches my intended style.
10. As a formulator, I want the Egg Mix to be pre-configured for custard-style recipes with yolks by default, so that the recipe reflects the classic French custard base.
11. As a formulator, I want to choose whether eggs are yolks only, whites only, whole, or a split ratio, so that I can fine-tune the emulsification and richness.
12. As a formulator, I want the Alcohol slot to start empty for all recipes by default, so that I don't have to remove it from recipes where it's not relevant.
13. As a formulator, I want the app to auto-select a neutral alcohol ingredient when I move the alcohol slider from zero without having set one, so that the solver doesn't get stuck.
14. As a formulator, I want to add honey as an additional ingredient on top of my Sugar Mix, so that I can layer specialty sweeteners without disrupting the base sugar system.
15. As a formulator, I want the solver to treat additional ingredients as fixed constraints and solve the Smart Mixes around them, so that my explicit choices are always respected.
16. As a formulator, I want to add additional ingredients (cocoa powder, peanut butter, cream cheese, honey) to the Recipe on top of the seeded Smart Mixes, so that I can specialize a base formula with flavor components.
17. As a formulator, I want additional ingredients to be removable, so that I can experiment without permanently changing the formula.
18. As a formulator, I want sorbet recipes to seed a Liquid Mix (water) instead of a Milk Mix, so that the recipe reflects the actual base for a dairy-free frozen dessert.
19. As a formulator, I want sherbet recipes to seed both a small Milk Mix and a Liquid Mix, so that the recipe reflects the hybrid character of sherbet.
20. As a formulator, I want vegan recipes to seed a plant-based Milk Mix (coconut milk + coconut cream or similar), so that the dairy base is appropriate for the style.
21. As a formulator, I want to change the Stabilizer Mix preset without losing my other recipe settings, so that I can experiment with different stabilizer systems.
22. As a formulator, I want a custom preset option on Sugar Mix and Stabilizer Mix, so that I can define my own blend ratios if none of the presets match my system.
23. As a formulator, I want the Recipe Preview to show gram amounts for every individual sub-ingredient within each Smart Mix, so that I have a complete, unambiguous weigh-out list.
24. As a formulator, I want the yield stepper in Recipe Preview to scale all ingredient grams proportionally, so that I can adjust batch size without recalculating anything manually.

## Implementation Decisions

### Data Model

**Mix Preset** — a named blend with a fixed sub-ingredient composition:
- Has an ID, a display name, and a list of sub-ingredient entries (catalog ingredient ID + proportion as a fraction of the mix's total grams)
- Has an effective macro profile computed from sub-ingredient proportions and macros — this is what the solver uses
- Stored in a static preset library, not user-editable (except via the "custom" option)
- **Canonical base ingredients only**: presets may only contain canonical base ingredients for their category (whole milk, heavy cream, sucrose, skim milk powder, carrageenan, egg yolks, etc.). Specialty ingredients (honey, cream cheese, flavoring extracts, etc.) are not permitted inside any preset — they must be added as additional ingredients. This constraint eliminates deduplication complexity by design.

**Smart Mix** — an instance of a mix preset in a specific formula:
- Has a kind (`milk | liquid | sugar | stabilizer | eggs | alcohol`), a display label, an active preset, and a current gram amount
- The label for alcohol matches the selected ingredient name (e.g., "Bourbon"), not "Alcohol Mix"
- The gram amount is set by the solver; can also be directly adjusted by the user in Recipe Edit

**Recipe** — stored alongside FormulaState in SavedFormula:
- Contains: a list of Smart Mixes + a list of additional ingredients (with gram amounts)
- Smart Mixes cannot be removed; additional ingredients can be added or removed freely

### Smart Mix Seeding by Recipe Type

Each recipe type seeds a fixed set of Smart Mixes when an archetype is first bootstrapped:

| Type | Milk Mix | Liquid Mix | Egg Mix | Sugar Mix | Stabilizer Mix | Alcohol |
|---|---|---|---|---|---|---|
| Philadelphia | standard (milk + cream) | — | — | sucrose | Modernist | empty |
| Custard | standard (milk + cream) | — | yolks | sucrose | none | empty |
| Gelato | milk-heavy (more milk, less cream) | — | optional | sucrose | Modernist | empty |
| Sherbet | small cream | water | — | sucrose | Modernist | empty |
| Sorbet | — | water | — | sucrose | Modernist | empty |
| Vegan | coconut milk + coconut cream | — | — | sucrose | Modernist | empty |

### Recipe Solver

A pure function: given Mix macro targets, a yield in grams, additional ingredient assignments, and the active Smart Mixes with their effective macro profiles, return gram amounts for each Smart Mix.

Algorithm:
1. Compute the total gram contribution and macro contribution of all additional ingredients (fixed).
2. Subtract additional ingredient macro contributions from the Mix targets to get a "remaining" macro target vector.
3. Express the remaining target as a constrained linear system: each Smart Mix contributes its effective macros × grams.
4. Solve for Smart Mix grams (non-negative) that best satisfy the remaining targets (least-squares if over-constrained).
5. Return updated gram amounts for each Smart Mix.

The solver is a **deep module**: pure function, no side effects, testable in isolation with known inputs and outputs.

### Two-Way Sync

- **Mix → Recipe**: whenever a macro slider is committed (on release, not on every drag tick), run the solver and update Smart Mix grams.
- **Recipe → Mix**: whenever Smart Mix grams or additional ingredient grams change, recompute Mix ratios directly from all ingredient macros × grams.

### Config View Extensions

The existing Config panel gains mix configuration sections:
- **Milk Mix**: dropdown of presets (standard, MSNF-boosted, plant-based, custom)
- **Sugar Mix**: dropdown of presets (sucrose only, dextrose blend, invert sugar, natural, custom)
- **Stabilizer Mix**: dropdown of presets (Modernist Cuisine, cornstarch, Cremodan, custom)
- **Egg Mix**: shown only for custard/gelato; toggle for yolks / whites / whole / split with ratio input
- **Alcohol**: ingredient picker (opens ingredient selector filtered to alcohol category); shown only when alcohol Mix ratio > 0

### Recipe Edit View

- Lists Smart Mixes as single collapsed rows: label + gram stepper (±10g)
- Lists additional ingredients below with gram stepper + remove button
- "Add ingredient" button opens the ingredient selector (all categories)
- No expand/collapse toggle — Smart Mixes are always collapsed here

### Recipe Preview View

- Shows each Smart Mix expanded to its sub-ingredients, scaled to current gram total
- Shows additional ingredients as individual rows
- Yield stepper scales all grams proportionally

### Modules to Build or Modify

1. **Mix preset library** (`src/data/mix-presets.ts`) — static definitions for all Sugar, Stabilizer, Milk, Liquid, and Egg presets. Pure data, no logic.
2. **Recipe types** (additions to `src/data/types.ts`) — SmartMix, MixPreset, MixPresetIngredient, Recipe, SmartMixKind.
3. **Recipe seeder** (`src/lib/recipe-seeder.ts`) — pure function: StyleCategory → Recipe (with default Smart Mixes and empty additional ingredients). Testable.
4. **Recipe solver** (`src/lib/recipe-solver.ts`) — pure function: (MacroRatios, yieldGrams, additional ingredients, SmartMix[]) → SmartMix[] with updated grams. Testable.
5. **SavedFormula** (modify persistence layer) — add `recipe: Recipe` field alongside `state: FormulaState`.
6. **RecipeEdit** (rewrite) — render Smart Mixes as collapsed rows; additional ingredients with remove; Add button.
7. **RecipePreview** (rewrite) — render Smart Mixes expanded; yield stepper scales all grams.
8. **ConfigPanel** (extend) — add mix selection UI for each configurable mix kind.
9. **FormulaEdit** (extend) — on slider commit, run recipe solver and update saved recipe.
10. **Bootstrap** (modify) — seed a Recipe alongside FormulaState when launching from an archetype.

## Testing Decisions

Good tests verify observable behavior from the outside, not internal implementation details. A test should break if the behavior changes, not if the implementation is refactored.

**Recipe solver** — highest priority for testing. Pure function with clear inputs and outputs:
- Given a target with known additional ingredients, verify Smart Mix grams produce macros within tolerance of the target
- Verify non-negativity: solver never produces negative gram amounts
- Verify yield conservation: sum of all ingredient grams equals the target yield

**Recipe seeder** — test that each StyleCategory produces the expected set of SmartMixKinds and that effective macros are non-zero for the expected macro categories.

**Mix preset library** — verify that each preset's sub-ingredient proportions sum to 1.0, and that effective macro profiles sum to ≤ 1.0.

**Integration** — a Playwright test: select an archetype, open Recipe Preview, verify that sub-ingredients are visible and gram amounts sum to approximately the yield.

Prior art: `src/lib/formula-engine.test.ts` and `src/lib/template-matcher.test.ts` (Vitest, node environment).

## Out of Scope

- User-created custom presets stored persistently (custom mix ratios are per-formula only, not saved to a preset library)
- Nutrition label or allergen information derived from the recipe
- Cost-per-gram tracking
- Ingredient inventory management
- Exporting recipes to PDF or print view
- Multi-batch scaling beyond the yield stepper

## Further Notes

The virtual macro block ingredients (`_base-fat`, `_base-sugar`, etc.) that currently populate FormulaState will be retired as the Recipe layer matures. In the interim, they remain as the internal representation for the Mix view; the Recipe stores a parallel real-ingredient layer. A future cleanup pass can unify the two once the Recipe solver is stable.

The alcohol Smart Mix is unique: it is empty by default (no ingredient selected, zero grams) and only activates when the user moves the alcohol Mix slider above zero. At that point the app auto-selects a neutral default alcohol ingredient (to be determined during implementation — likely a neutral spirit or vodka) so the solver is never blocked. The user can then reconfigure in Config.
