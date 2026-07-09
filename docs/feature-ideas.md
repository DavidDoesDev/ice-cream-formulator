# Feature ideas

A running list of things we might build. Unprioritized; capture first, sort later.

## Ice cream label maker

Let the user print a physical label for a finished batch — the kind you'd stick
on a pint before it goes in the freezer.

- Generates a printable label from a saved formula: name, style, batch date,
  yield, and the key macros (fat / sugar / milk solids / total solids).
- Press-styled to match the app — poster name, the core-sample pint cup, a small
  macro readout, maybe a batch number ("№ 007").
- Optional: process notes, churn/serve reminders, an allergen line derived from
  the ingredients.
- Output: print-friendly (a clean print stylesheet / dedicated print view) and/or
  export to PDF or PNG. Sized for common label stock or a pint lid.
- Nice-to-have: a couple of layout templates (minimal vs. full spec sheet) and a
  QR code linking back to the formula.

## Ice cream science lesson

An in-app lesson explaining the science behind the numbers the formulator
already computes — why the macros matter, not just what they are.

- Covers the fundamentals: what fat, sugar, milk solids, and total solids each
  do for texture; freezing point depression; overrun; why styles have the
  target ranges they do.
- Ties back to the app: each concept links to the live sliders/readouts it
  explains, so reading the lesson makes the formulator legible.
- Could be one page or a short sequence of sections; press-styled like the rest
  of the app.

## Share a recipe

Send a saved formula to someone else — email, social, or just a link.

## Print a recipe

A clean print view for a saved formula: ingredients, amounts, macros, process
notes. (Overlaps with the label maker's print stylesheet work.)

## Link to my site

Link from the app back to my personal site.

## Save logic

Revisit how and when formulas get saved.

## Individual measurements for ingredient mixes

Show/edit the component measurements inside an ingredient mix, not just the
mix as a single line.

## Add more ingredients

Grow the ingredient library.

## Refine ingredient mix logic

Improve how ingredient mixes are computed and behave.

## Refine behavior when changing recipe types

Smooth out what happens to a formula when its recipe type/style changes.

## Refine AI-generated recipes

Improve the quality of AI-generated recipes.

## Don't repeat batch numbers

Batch numbers should be unique — never reissue one that's been used.

## Custom ingredients

Let the user define their own ingredients beyond the built-in library.

## Ingredient images

Images for ingredients in the picker and/or formula view.

## Variegate options

Support variegates (ripples, swirls, ribbons) as a distinct part of a formula.

## Save dead recipe

"Bring me your dead": paste in a failed recipe — from a book, a blog, an LLM —
and the app diagnoses why it failed (icy, rock-hard, greasy) and rebalances it
to hit the style's target ranges. The macro readouts and style ranges become
the explanation surface for the fix.

## Adapt for user's equipment

Machine-aware formulation: a Ninja Creami recipe and a compressor-machine
recipe need different targets. Let the user set their machine and adapt
formulas to it — "guaranteed to work on your machine."

## Nutrition info

Compute nutrition facts (calories, macros per serving) for a formula. Feeds
the label maker too — a printable nutrition panel on the batch label.

## Clones of popular flavors

Phony versions of well-known pints (B&J's, Jeni's, etc.) as starter content —
a new user doesn't have a formula in mind, but they have a favorite pint.

- Reverse-engineer macro targets from published nutrition panels + ingredient
  lists; recipes aren't copyrightable, so the formulations are safe to ship.
- Trademark-safe naming: descriptive with a wink ("chocolate with marshmallow
  & caramel swirls and fudge fish"), never the brand's flavor names.
- Doubles as proof the formulator works: if the clone scoops like the real
  pint, that's the credibility demo.
- Generalizes into clone-from-label: point the app at any pint's nutrition
  panel + ingredient list and it backs out the formulation targets.

## Other units than grams

Display and edit ingredient amounts in units besides grams — ounces, cups,
tablespoons — for users who don't cook by weight.

## Affiliate sales

Get paid when a user buys an ingredient or equipment the app pointed them to —
Cremodan and other stabilizers, dry milk powder, machines, label stock.
Natural placements: the ingredient picker, a formula's shopping list, the
equipment profile.
