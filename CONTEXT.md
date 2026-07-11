# Ice Cream Lab

The domain language for the formulator. A **recipe** is composed from a fixed set
of component slots (a milk base, a sugar blend, a stabilizer blend, and so on);
each slot is filled by a **blend** the user picks or builds. This glossary pins
the words we show the user so they stop drifting.

## Language

### Smart mixes & blends

**Smart Mix**:
One of a recipe's composable component slots — milk base, sugar, stabilizer,
eggs, alcohol, emulsifier. Internal/code term (`SmartMix`, `SmartMixKind`); the
user sees the slot by its label (e.g. "Sugar blend"), never the word "mix".
_Avoid_: mix (user-facing), system.

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
Preset. Seeded from the outgoing preset's ingredients; saved as its own Blend.
