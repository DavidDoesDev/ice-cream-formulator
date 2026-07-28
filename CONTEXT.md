# Ice Cream Lab

The domain language for the formulator. The saved unit is a **Batch** — a project
the user keeps in their library. A Batch contains a **Formula** (and, later, things
like labeling). A Formula is made of a **Mix** (the proportional design — macro
targets and the blends that fill each slot) and a **Recipe** (the weighed-out
ingredient list, yield, and notes). This glossary pins the words we show the user
so they stop drifting.

## Language

### Core hierarchy

**Batch**:
The saved unit — a project the user keeps in their library ("My Batches") and
creates with "+ New Batch". Contains one Formula today; designed to grow to hold
labeling, costing, and other project-level artifacts. The top-level noun in nav.
_Avoid_: calling the saved unit a "formula" or "recipe".

**Formula**:
The design inside a Batch — its Mix plus its Recipe. The thing you open and edit
("Edit Formula"). Today a Batch holds exactly one Formula.
_Avoid_: treating Formula as the saved unit (that's the Batch).

**Mix**:
The proportional, weight-independent formulation — the macro targets (the Macros
controls) and the Blends filling each slot (set in Config). "How it's composed,"
in proportions, before it's weighed out. Spans the Macros panel and the Config
panel.
_Avoid_: confusing with **Smart Mix** (one internal slot, below) — a Mix is the
whole formulation, not a single slot.

**Recipe**:
The concrete instantiation of the Mix — the weighed ingredient list with gram
weights at a chosen batch yield, plus procedure notes. "What you actually weigh
out." Shown in the Recipe panel.
_Avoid_: the old broader sense of Recipe as the entire composition object; that
sense is now split into Mix + Recipe.

### Smart mixes & blends

**Smart Mix**:
One of a Mix's composable component slots — milk base, sugar, stabilizer, eggs,
alcohol, emulsifier. Internal/code term (`SmartMix`, `SmartMixKind`); the user
sees the slot by its label (e.g. "Sugar blend"), never the word "mix".
_Avoid_: mix (user-facing — reserved for the whole formulation), system.

**Blend**:
The specific formulation filling a Smart Mix slot — e.g. a sugar blend of sucrose
+ dextrose, or a stabilizer blend of guar + LBG + an emulsifier. The canonical
user-facing word for these across the whole app.
_Avoid_: system, mix.

**Preset**:
A built-in, named, reusable Blend definition (e.g. "Sucrose", "Natural (honey)").
Internal term — surfaced to the user only by its name, never as "preset".
_Avoid_: exposing "preset" in the UI.

**Custom blend**:
A Blend the user builds themselves in the Config panel rather than choosing a
Preset. Seeded from the outgoing preset's ingredients; edits apply live to the
recipe, like any other Blend.
