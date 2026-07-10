## Problem Statement

A recipe that scoops perfectly out of a commercial batch freezer comes out an icy brick from a
home canister churn — and one tuned for a home churn comes out soupy from a Ninja Creami. The
same formula behaves differently depending on **how it's frozen and served**, but the app judges
every formula against a single set of target windows (the home-dasher baseline). A user with a
different machine gets guidance that's quietly wrong for their equipment, with no way to say
"I'm using a Creami" and have the targets adjust.

## Solution

Make **equipment a second axis** the user sets per recipe, orthogonal to dessert style. Style
says *what kind of dessert* (fat, milk solids, egg or not); equipment says *how cold and fast it
freezes and how hard it serves*. Together they define the healthy target windows: style drives
the composition macros, equipment shifts the **scoopability** macros (sugar / freeze-point
depression, and stabilizer). Pick your machine and the green windows re-scope to it — a colder
machine wants less sugar to stay scoopable; a warmer one wants more.

Changing the equipment never rewrites the recipe. It re-scopes the guidance; if the formula then
falls outside the new windows, the app offers a one-tap **Recalibrate** that nudges the recipe
toward the new machine's target — the user stays in control. Builds directly on the
data-backed-formulation work (the derivation module already computes scoopability); this feature
adds the machine picker, the per-machine window shifts, and the recalibration action.

## User Stories

1. As a home ice-cream maker, I want to tell the app which machine I'm using, so that its targets
   match how my machine actually freezes.
2. As a maker with a Ninja Creami, I want the sugar window to sit lower, so that I'm not pushed to
   over-sweeten a mix my machine can serve much harder.
3. As a maker with a commercial batch freezer, I want lower sugar and stabilizer targets, so that
   my guidance reflects a colder, faster freeze.
4. As a maker, I want equipment set per recipe, so that a sorbet for the Creami and a custard for
   my home churn can each carry their own machine.
5. As a maker, I want changing the machine to re-scope the green slider windows immediately, so
   that I can see whether my current recipe still lands in range for that machine.
6. As a maker, I want changing the machine to never alter my ingredient grams, so that I never
   lose work by flipping a setting.
7. As a maker whose recipe falls out of range after switching machines, I want a one-tap
   Recalibrate that adjusts the sugar toward the new target, so that I can fix it without
   hand-tuning.
8. As a maker, I want the Recalibrate to hold the batch yield, so that the recipe size doesn't
   drift when I retune.
9. As a maker, I want Recalibrate to change nothing until I tap it, so that the suggestion is
   safe to ignore.
10. As a maker, I want the machine picker right next to the style selector in Config, so that both
    "what is this formula" settings live together.
11. As a maker, I want the composition windows (fat, milk solids) to stay put when I change
    machines, so that only the freeze-sensitive targets move.
12. As a maker, I want a new formula to default to the common home churn, so that most people get
    sensible targets with no setup.
13. As a maker, I want the scoopability readout (PAC) to reflect my machine's target, so that
    "firm / balanced / soft" means the right thing for my equipment.
14. As a maker, I want a saved recipe to remember its machine, so that reopening it shows the same
    guidance.
15. As a developer, I want each machine profile to carry a single freeze-target offset, so that
    adding or tuning a machine is one number, not a table of windows.
16. As a developer, I want the window logic to take (style, equipment), so that there's one place
    that composes both axes.
17. As a developer, I want the recalibration to reuse the existing yield-conserving solver, so
    that it behaves like the Rebalance the user already knows.
18. As a developer, I want the profile offsets unit-tested, so that a machine's window shift is
    verifiable in isolation.

## Implementation Decisions

### Equipment profiles module
- A small, deep module owns the machine catalog: for each `EquipmentProfile` (home-dasher,
  spin-frozen, commercial-batch) a single **PAC-target offset** relative to the home-dasher
  baseline (home-dasher = 0; colder/harder-serving machines are negative → less sugar needed),
  plus display metadata (name, blurb). One number per machine — adding or tuning a machine is a
  one-line change, not a per-style window table.
- The offset is defined for scoopability only: it shifts the **sugar** window (and, secondarily,
  the **stabilizer** window). Composition macros (fat, MSNF, emulsifier) are untouched by equipment.

### Macro bands (windows)
- The band/slider logic is extended to key off **(style, equipment)** instead of style alone.
  The style supplies the home-dasher baseline window; the equipment profile's offset is applied
  to the sugar and stabilizer windows. When equipment is home-dasher (the default and the current
  behavior), the windows are identical to today — this is a strict superset.
- The balance scorecard, slider ticks, and PAC "firm/soft" judgement all consume the
  equipment-adjusted windows so they agree.

### Recalibration action
- Lives with the live-workspace actions (beside Rebalance). Given a recipe and its (new)
  equipment, if scoopability-sensitive macros fall outside the equipment-adjusted windows, it
  re-solves toward the new machine's PAC target — adjusting the sugar lever at fixed yield — and
  returns the updated recipe. It is pure and user-invoked; the UI calls it only on tap.
- Changing equipment itself only updates the setting + re-scopes windows; it never calls the
  recalibration. The nudge surfaces when a mismatch exists.

### Schema / persistence
- The per-recipe `equipment` field already exists (placeholder from the prior migration, default
  `home-dasher`) and persists with the formula. This feature makes it user-editable and
  meaningful. No new persisted shape; existing saves default to home-dasher.

### UI
- An equipment picker in the Config modal, adjacent to the Style selector, listing the profiles
  with short descriptions. Selecting one updates the recipe's equipment and re-scopes the windows
  live.
- A recalibration nudge (Rebalance-style: message + one-tap action) appears when the current
  recipe is out of range for the selected machine.

## Testing Decisions

Good tests assert external behavior — a (style, equipment) in, the expected window or recalibrated
recipe out — not internal call shapes. Prior art: `macro-bands.test`, `style-calibration.test`,
`balance.test`, and the live-workspace solver tests from the data-backed-formulation work.

- **Equipment profiles module** — each profile's offset; that colder machines shift the sugar
  window down relative to home-dasher and home-dasher is the zero baseline.
- **Windows by equipment** — for a fixed style, changing equipment shifts the sugar (and
  stabilizer) windows in the expected direction while fat/MSNF/emulsifier windows stay identical;
  home-dasher reproduces today's windows exactly.
- **Recalibration** — a recipe that's in range for home-dasher but out of range for a colder
  machine becomes in range after Recalibrate, with yield conserved and only scoopability macros
  moved; a recipe already in range is left unchanged.

## Out of Scope

- **A per-user "my machine" default** that new recipes inherit — a fast-follow; v1 is per-recipe
  with a fixed home-dasher default.
- **The full iterative freezing curve** (tracked as a separate issue). v1 maps equipment → PAC
  target using the existing directional estimate behind `computeFreezing()`; the curve drops in
  later with no caller changes.
- **Overrun / aeration modeling.** Equipment also changes how much air is whipped in, but that's
  not in the 7-macro model and isn't addressed here.
- **Machine-specific recipe authoring** — no new archetypes or alternate authored recipes per
  machine; the authored recipes stay home-dasher and Recalibrate handles the rest.
- **Auto-switching equipment or mutating the recipe on equipment change** — always user-invoked.

## Further Notes

- Design rationale is in `docs/formulation/decisions.md` D8 and the "Adapt for user's equipment"
  entry in `docs/feature-ideas.md`. This PRD builds on `docs/prds/data-backed-formulation.md`.
- The profile list (home-dasher, spin-frozen, commercial-batch) matches the `EquipmentProfile`
  enum. `spin-frozen` is the frozen-block spinner family (Ninja Creami, Pacojet) — merged into
  one profile since they share PAC behavior; the example machines live in the profile's blurb.
- The initial PAC-target offsets are a small, tunable table — like the style bands, they can be
  calibrated against real machine behavior over time without touching the mechanism.
- Next step: slice into executable issues via prd-to-issues.
