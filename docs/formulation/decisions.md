# Formulation decisions log

Running record of *why* the formulation model is shaped the way it is. Newest first.
Evidence lives in [`style-targets.md`](./style-targets.md) footnotes and [`sources.md`](./sources.md).

---

## D8 — Equipment is a second axis: (style × equipment) → target windows
**Date:** 2026-07-09 · **Status:** decided

A recipe carries an **`equipment`** setting in addition to `style`. The two orthogonal settings
*define* the macro target windows — ingredients don't change; a recipe's macros sit in or out of
the windows per the two settings:
- **style** drives the composition windows (fat, MSNF, emulsifier);
- **equipment** shifts the **scoopability** windows (sugar/PAC, stabilizer), because it sets how
  cold/fast the mix freezes and how hard it serves.

**Default equipment = `home-dasher`** (a basic low-powered canister / frozen-bowl churn — the
most common home rig). Recipes are authored *for the default equipment*, so they sit inside the
home-dasher windows.

**Resolves the Cree-vs-Goff reconciliation.** Goff's composition figures are largely *commercial*.
The home-dasher windows are Goff **shifted to the home context** (warmer/slower freeze → sugar
window sits higher). Dana Cree's home recipes land inside the home windows because recipe and
window describe the same physical situation. So `style-targets.md` ranges are the **home-dasher
baseline**, not commercial. The work is "derive the home window from the equipment," not "bend the
window to fit the recipe."

**Scope now vs. later.** Add the `equipment` field now as a placeholder — enum `home-dasher`
(default) · `creami`/`pacojet` (spin-frozen-block family; tolerates harder/lower-PAC mixes →
sugar window *lower*) · `commercial-batch` (Carpigiani-class; coldest/fastest → lowest sugar +
stabilizer). Only **home-dasher windows are calibrated** in this migration; the others are stubs.
The picker UI, alternate-profile windows, and the **user-initiated recalibration nudge** are the
deferred "Adapt for user's equipment" feature (`docs/feature-ideas.md`), built on the derivation
module: equipment → target serving hardness (PAC) → scoopability windows. Per D4, changing
equipment never mutates the recipe; if macros fall out of the shifted windows, offer recalibration.

**Shipped (2026-07-10, issues #66–#69).** The feature is now built on the derivation module:
- `src/lib/equipment.ts` holds one **PAC-target offset** per profile (same units as PAC — a
  sucrose-equivalent fraction of the batch): `home-dasher 0` (baseline) · `creami`/`pacojet`
  **−0.02** (shared spin-frozen-block family) · `commercial-batch` **−0.04** (coldest). Tuning a
  machine is this one number — reasonable initial estimates, calibratable like the style bands.
- `macro-bands.ts` keys off **(style, equipment)**: the offset shifts the **sugar** window by the
  full amount and the **stabilizer** window by a small fraction (`STABILIZER_OFFSET_SCALE = 0.05`);
  composition macros are untouched. `home-dasher` reproduces the baseline windows exactly. The
  same offset shifts the PAC firm/soft judgement in `relationships.ts`.
- The **equipment picker** lives in Config beside the style selector; changing it re-scopes the
  windows live and persists, never touching grams (D4). When the sugar then sits outside the
  machine's window, `recalibrate()` (a Rebalance-style, user-tapped nudge) re-solves the sugar
  lever toward the shifted window at fixed yield — v1 uses the directional PAC estimate behind
  `computeFreezing()`; the full curve can drop in later with no caller changes.

---

## D7 — Two-layer schema: 7 macros + ingredient coefficients (fpd, pod, lactose)
**Date:** 2026-07-09 · **Status:** decided (closes the PAC/POD/MSNF handoff branches)

Resolves the open schema branches. The model is **two layers**:
1. **The 7-macro model** (fat, sugar, `nonfatSolids`, stabilizer, emulsifier, alcohol, water) —
   coarse composition for body, total solids, sliders, solver. **Unchanged.**
2. **Ingredient-level coefficients** — the fine chemistry the macro model can't hold, computed
   from the recipe's ingredients (never the `MacroRatios` snapshot):
   - `fpd?` → PAC (scoopability / freezing) — D6.
   - `pod?` → sweetening power. **Added now**, same catalog pass as `fpd` (cheap; avoids a
     second re-encode). Sweetness is a distinct axis: hold PAC, trade sucrose↔dextrose.
   - `lactose?` → true `dairyMSNF` (= Σ grams·lactose ÷ 0.545) + lactose's FPD.

**MSNF (branch C): do NOT split the macro.** The `nonfatSolids` scalar now lumps dairy MSNF
with cocoa/starch/egg/coffee solids (the 46-ingredient expansion). Rather than add an 8th macro
(heavy: touches bounds/solver/sliders + a migration wrinkle in the stored macro-block `state`),
mirror the PAC pattern: a per-ingredient `lactose` coefficient, derive `dairyMSNF` from the
recipe for the sandiness + lactose-FPD checks. Keep `nonfatSolids` as coarse "total non-fat
solids" and **rename its UI label "Milk solids" → "Non-fat solids"** (`formula-engine.ts:150`,
`balance.ts:19`). Fixes the D5 category error with zero macro-model churn.

**Migration-safe:** these are catalog metadata, re-read fresh; persistence stores only
`recipe` (preset-ids + grams) and synthetic macro-block `state`, never ingredient-macro objects.

**Sequencing (agreed):** ship PAC/POD/dairyMSNF as **readouts first** (targets/solver rows come
later for free — all linear in grams); **directional freezing estimate first**, full curve
behind `computeFreezing()` later; **freeze the ingredient library until the schema lands** so
the 86 ingredients aren't re-encoded twice.

---

## D6 — Balance layer monitors macro *relationships*; adds an FPD/PAC ingredient field
**Date:** 2026-07-09 · **Status:** decided (spec in [relationships.md](./relationships.md))

Sliders stay independent. The balance layer additionally watches **relationships** between
macros and emits advisory hints (e.g. low fat + low sugar → "lean and icy, raise the sugar").
Each relationship is a derived index + target band; hints never constrain a slider.

Tier-1 indices (total solids, MSNF-in-serum sandiness, fat/MSNF, stabilizer-vs-water) compute
from the existing 7 macros. **Scoopability** requires **freezing-point depression (PAC)**,
which is **not derivable** from the aggregate `sugar` macro (sucrose vs dextrose differ ~2×).
So: **add an optional `fpd` field to `CatalogIngredient`** (sucrose = 100; only sugars/alcohol/
salt get a value), and compute PAC from the **recipe's ingredients**, not the `MacroRatios`
snapshot. FPD bands are calibrated per style from the authored bases, not invented as absolutes.

---

## D5 — Vegan is one range (re-derived from recipes), not two
**Date:** 2026-07-09 · **Status:** decided

The vegan range was the only one *inferred* (no [G&H] table). Re-derived from real recipes —
the app's 3 vegan archetypes (fat 5→12%) plus [S&S]'s coconut base (verified fat 16.4%, sugar
33.3%). New range: fat 3–16, sugar 14–24, plant-solids 0–5, stabilizer 0.2–0.6.

**One range, not two.** The lean (oat, ~5% fat) vs. rich (coconut, ~16% fat) spread is a
fat-*source* choice — swap the milk preset — not a separate dessert style. Splitting `vegan`
into two `StyleCategory` values would encode an ingredient axis as a style, and by the same
logic we'd split philadelphia into premium/superpremium (we don't). The archetype's authored
recipe pins where it sits within the one range. Caveat logged: "plant solids" reuses the MSNF
axis, a category error for vegan — revisit if a plant-solids concept is added. See
[style-targets.md](./style-targets.md) `[^veg]`.

---

## D4 — Live-editing behavior: macro-preserving swaps; style is descriptive
**Date:** 2026-07-09 · **Status:** decided

**Preset swaps (config) stay macro-preserving.** Changing a smart mix's preset (sucrose →
invert, heavy → light cream) re-solves grams to hold the *current* recipe's macros
(`handlePresetChange` → `resolveSolve`). This is safe — unlike #52, the solve targets macros
the recipe already achieves, warm-started from current grams. "Change the ingredient, keep
the character."

**Style change is descriptive, never a recipe mutation.** Changing an existing formula's
style only (a) re-scopes the slider target ranges (D3) and (b) shows/hides controls. It does
**not** auto-add or remove ingredients — no silently injecting egg yolks on → custard, no
stripping them on → Philly. Where the recipe lacks something typical of the style (e.g. eggs
for custard), surface a **non-destructive nudge** ("Custards are built on egg yolks — add
~10%?") that the user confirms. The user owns the grams.

**Never orphan a present mix.** Today, switching custard → Philly hides the egg config row
while any egg yolks remain in the recipe (in the macros, uneditable). Fix: a mix that is
*present* stays editable in config regardless of style. Hide a control only when its mix is
absent.

---

## D3 — Slider target ranges are defined per style, not per archetype
**Date:** 2026-07-09 · **Status:** ranges drafted, awaiting sign-off

The archetype declares a `style` (philadelphia, custard, gelato, sherbet, sorbet,
vegan); the **style** supplies each macro's slider target window. This replaces the old
model that centered each slider on the archetype's own `ratios ± MACRO_TOLERANCE`.
Ratios become a *derived readout* (computed from the recipe), never an input.

Ranges and citations: [`style-targets.md`](./style-targets.md). Primary source is
[G&H] Table 1.7 (composition by class) and Table 2.4 (suggested mixes), corroborated by
[Clarke] and [Migoya]. Two rows (gelato MSNF, all of vegan) are practice-based and marked
`†` pending a better source.

---

## D2 — Archetypes carry explicit ingredient + gram recipes (design "B")
**Date:** 2026-07-09 · **Status:** decided; recipes not yet authored (step 2)

New formulas load a **hand-authored recipe** (concrete ingredients + grams) rather than
solving grams from target ratios on the fly. Rationale: the ratio-solve pipeline is what
let a single bad data value (see D1) cascade into a nonsensical whole-batch recipe, and it
made "what exactly is in this default?" unanswerable. Explicit recipes are inspectable and
stable; the macro readout is computed from them (`computeRatiosFromRecipe`).

Consequence: the `setTraceMacro`-on-load calls in `formula/[id]/page.tsx` (which dosed
stabilizer/emulsifier to hit a target) go away — nothing needs dosing when grams are
authored. The solver stays only for live slider edits.

Base-formula authority weighted to [Cree] (percentage base system, artisan scale) over
[Migoya] (PacoJet/pro-kitchen). Flavor-specific disputes (e.g. competing "French vanilla"
formulas) deferred to a per-archetype review pass.

---

## D1 — Emulsifier target corrected from 0.02 to ~0.1–0.4% (custard)  ·  issue #52
**Date:** 2026-07-09 · **Status:** root-caused; fix lands with D2/D3

All six custard archetypes set `emulsifier: 0.02` (= 2% by weight). Egg yolk — the only
emulsifier source in the custard seed — is itself only ~2% emulsifier, so a 2%-emulsifier
base is mathematically ~100% egg yolk. On formula load, `setTraceMacro(…, "emulsifier",
0.02)` hit the `f <= target ? Y` branch and set egg yolks to the entire 1000 g batch,
zeroing milk, cream, sugar, and inclusions. Every custard default (not just peanut butter
/ rum raisin) loaded as a pint of pure egg yolk.

Correct figure: commercial emulsifier doses at **0.10–0.15%** ([G&H] Table 2.4); custard's
egg-yolk contribution lands the style range at **0.1–0.4%**. See
[`style-targets.md`](./style-targets.md) footnote `[^cust-emul]`.

Two underlying faults, both addressed by D2/D3:
1. **Data:** the `0.02` value (10× the neighboring `stabilizer: 0.002`) was unreachable.
2. **Logic:** `setTraceMacro`'s unreachable-target fallback dumps the whole batch into one
   trace source instead of a clamped best-effort — a footgun removed when D2 drops the
   on-load dosing.
