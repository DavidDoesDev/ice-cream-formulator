# Per-style target ranges

> **Doc ↔ code reconciliation.** This table is in **Goff sourcing convention** (sweetener
> figures exclude milk lactose), and is the *sourced starting point*. The **live bands in code**
> (`src/lib/macro-bands.ts` `STYLE_TARGETS`) are the source of truth for the app and use **app
> convention** — the catalog models dairy lactose inside the `sugar` macro and protein+minerals
> in `nonfatSolids`, so the code reads ~**+3% sugar** and ~**−5% MSNF** vs. the numbers here, and
> is calibrated to what the authored recipes actually compute (the calibration test enforces it).
> When the two disagree, the code bands are correct for the app; these are the human-readable
> derivation. Don't hand-sync them — treat this as the *why*, `macro-bands.ts` as the *what*.

Slider target windows are defined by **(style × equipment)** (not per-archetype) — see D8.
Style drives the composition macros (fat, MSNF, emulsifier); **equipment** shifts the
scoopability macros (sugar/PAC, stabilizer). The table below is the **home-dasher baseline**
(default equipment — a basic canister/frozen-bowl churn); other equipment profiles shift the
sugar/stabilizer windows off this baseline via a per-machine PAC-target offset (now in
`src/lib/equipment.ts` — D8). Values
are **% by weight**; the code stores them as 0–1 fractions. Water is the remainder, so it's
derived rather than given a slider target.

Because Goff's figures are largely *commercial*, the dairy **sugar** windows here are shifted
up to the home context (‡) so the home-authored (Dana Cree) bases sit in-band — a warmer/slower
home freeze needs more sugar to stay scoopable. Citation keys resolve in [`sources.md`](./sources.md).
`†` marks a value extrapolated from practice; `‡` marks a home-equipment shift off the cited
commercial figure.

| Style | Fat % | Sugar % | MSNF % | Stabilizer % | Emulsifier % | Alcohol % | ~Water % |
|---|---|---|---|---|---|---|---|
| **philadelphia** | 12–18[^phil] | 14–21 ‡[^phil] | 6–11[^phil] | 0–0.3[^stab] | 0–0.15[^phil-emul] | 0–6[^alc] | 56–62 |
| **custard** | 12–16[^cust] | 14–20 ‡[^cust] | 8–11[^cust] | 0–0.2[^stab] | 0.1–0.4[^cust-emul] | 0–6[^alc] | 56–62 |
| **gelato** | 4–9[^gel] | 16–24[^gel] | 9–12 †[^gel-msnf] | 0.2–0.5[^stab] | 0–0.2[^cust-emul] | 0–5[^alc] | 60–66 |
| **sherbet** | 1–2[^sher] | 22–28[^sher] | 1–4[^sher] | 0.3–0.5[^sher] | 0–0.1 | 0–4[^alc] | 66–72 |
| **sorbet** | 0–1[^sorb] | 22–30[^sorb] | 0–2[^sorb] | 0.2–0.5[^sorb] | 0 | 0–6[^alc] | 65–75 |
| **vegan** | 3–16[^veg] | 14–24[^veg] | 0–5[^veg] | 0.2–0.6[^veg] | 0–0.3[^veg] | 0–5[^alc] | 55–70 |

## Footnotes

[^phil]: Philadelphia-style = egg-free premium/superpremium ice cream. [G&H] frames the
    split as regular (no egg) vs. French/custard (egg), so "Philadelphia" = the Premium
    → Superpremium rows: fat 12–18, MSNF 5–10, sweetener 13–17, total solids 38–42.
    — [G&H] Table 1.7, book p. 15 (PDF idx ~4). Corroborated — [Clarke] Ch. 3, book p. 50
    (PDF idx ~58): *"ice cream typically has a fat content of 8–10% by weight, though in
    premium ice creams it can be as high as 15–20%."*
    ‡ **Sugar 14–21** = Goff's commercial 13–17 shifted up for the **home-dasher** default
    (D8); the home Philadelphia base ([Cree]) sits ~19.5% sugar and lands in-band.

[^cust]: Frozen custard / French ice cream = same as premium ice cream of the same
    flavor **plus egg yolk**; US minimum **1.4% egg-yolk solids** (1.12% for bulk).
    Fat/sugar/MSNF taken from the premium band. — [G&H] Ch. 2, book p. 24 (PDF idx ~39);
    Table 2.4, book p. 24. Egg-yolk dosing corroborated — [Clarke] book p. 56 (PDF idx ~64):
    egg yolk *"used at concentrations of about 0.5–3%. The high concentrations are only used
    for superpremium products, and can give the ice cream an eggy flavour."*
    ‡ **Sugar 14–20** = Goff's commercial 13–16 shifted up for the **home-dasher** default
    (D8); the home custard base ([Cree]) sits ~19.5% sugar and lands in-band.

[^cust-emul]: **Corrected value (issue #52).** The archetypes previously set emulsifier
    `0.02` (= 2%), which is unreachable — egg yolk is itself only ~2% emulsifier, so a
    2%-emulsifier base would have to be ~100% egg yolk; on load this forced the recipe to
    1000 g egg yolk, zeroing everything else. [G&H] Table 2.4 doses commercial emulsifier
    at **0.10–0.15%**; custard's egg-yolk contribution lands it a touch higher, so the
    style range is **0.1–0.4%**. — [G&H] Table 2.4, book p. 24 (PDF idx ~39).

[^phil-emul]: Egg-free style — emulsifier optional and low. Superpremium runs stabilizer
    + emulsifier combined at 0–0.2%. — [G&H] Table 1.7, book p. 15.

[^stab]: Stabilizer dosing. [G&H] Table 2.4 lists stabilizer 0.15–0.35% (falling as fat
    rises); combined stabilizer+emulsifier 0.2–0.4% for premium (Table 1.7). Custards need
    less (egg helps). — [G&H] Table 2.4 / 1.7, book pp. 24 / 15. Corroborated — [Clarke]
    §3.7, book p. 56 (PDF idx ~64): stabilizers *"used in small amounts (typically 0.2%) in
    ice cream, sorbets, water ices."*

[^gel]: Gelato: lower fat (4–8%), lower overrun (25–60%), higher sugar (up to 25%), softer
    body. — [G&H] Ch. 2 (gelato), book p. 25 (PDF idx ~40) and Ch. 15, book p. 442.
    Sugar corroborated — [Migoya] "Ingredients — Sugars", book p. 15 (PDF idx ~24):
    *"Sugars account for 12 to 16 percent of the final weight of an ice cream base, and 25
    to 30 percent of a sorbet base."*

[^gel-msnf]: † **Practice-based.** The texts describe gelato in prose, not a composition
    table; MSNF 9–12% reflects common gelato practice (higher milk-solids for body at low
    fat). Verify against [Migoya] / [Cree] before finalizing.

[^sher]: Sherbet: low milk ingredients, high sugar, slightly acidified (acidity ≥ 0.35%).
    Fat 1–2%, MSNF 1–3% (Migoya notes 3–4%), sweetener 22–28%, stabilizer 0.4–0.5%,
    total solids 28–34%. — [G&H] Table 1.7 and Ch. 2/15, book pp. 15 / 28 / 444.

[^sorb]: Sorbet = like sherbet but **no dairy**: fruit/juice, high sugar, stabilized with
    egg white / pectin / gums; ≥25% fruit (Euroglaces). Water ice reference composition
    ~14% sugar + 3.5% corn-syrup solids + 0.4% stabilizer. — [G&H] Ch. 2/15, book pp. 28 /
    450. Sorbet-base sugar 25–30% — [Migoya] book p. 15 (PDF idx ~24): *"…25 to 30 percent
    of a sorbet base."*

[^veg]: **Re-derived from real recipes** (was inferred). [G&H]'s non-dairy section (Ch. 15,
    book p. 451) has no composition table — it only notes vegan fat comes from coconut/palm/
    palm-kernel oil and that MSNF-equivalent must still come from a non-dairy protein. So the
    range is sourced from actual formulations instead:
    - The app's 3 vegan archetypes span fat 5% (`vegan-oat-milk`) → 12% (`vegan-coconut`),
      sugar 16–18%, stabilizer 0.4% — this is why vegan is **one wide range, not two**: the
      lean↔rich spread is a fat-*source* choice (oat vs coconut milk preset), not a separate
      dessert style.
    - [S&S] "Coconut Ice Cream Base" computes to **fat 16.4%, sugar 33.3%, stabilizer 0.14%**
      (verified from its cup measures) — the rich/sweet extreme. Fat 16 sets our ceiling;
      S&S's 33% sugar sits *above* our 24% ceiling deliberately (a very sweet/soft guest
      recipe; a less-cloying default is preferred).
    **Model caveat:** "plant solids" reuses the `nonfatSolids` (MSNF) axis, which is a
    category error for vegan — there are no milk solids. Kept loose (0–5%) for coconut/oat
    solids; revisit if a dedicated plant-solids concept is added.

[^alc]: Alcohol is 0 by default and optional per flavor; ceiling ~6% by weight, past which
    the mix won't freeze scoopable. — matches existing app bound `MACRO_BOUNDS.alcohol`.
