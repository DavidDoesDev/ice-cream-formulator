# Archetype recipes (explicit)

Design "B" (see [decisions.md](./decisions.md) D2): each archetype loads a **hand-authored
recipe** — concrete ingredients + grams — rather than solving grams from target ratios.

**Structure:** `archetype recipe = style base + flavor inclusions`, batched to **1000 g**
(matches the app's `DEFAULT_YIELD` and Dana Cree's batch size). The base comes from the
archetype's `style`; inclusions (cocoa, purée, peanut butter, rum + raisins…) are added and
the base's balancing agent (milk) is reduced to keep the batch at 1000 g — exactly the
"milk is the balancing agent" rule [Cree] describes.

Citations resolve in [sources.md](./sources.md). Epub sources are reflowable (no stable page
numbers) — cite by section title; the verbatim recipe is reproduced here so no lookup is
needed.

## Standard vs. custom mixes

A recipe never restates a mix's internal composition — its `SmartMix` references a
**`MixPreset` by `presetId`** and supplies `grams`. The preset owns the ingredient ratio
and precomputed `effectiveMacros`. Two tiers, resolved uniformly by `getPresetById(id)`
(standard first, then custom fallback):

| | Standard | Custom |
|---|---|---|
| Defined in | global `MIX_PRESETS` (`mix-presets.ts`) | a formula's `Recipe.customPresets` |
| Registered | always present | `registerCustomPreset()` on formula load |
| Scope | shared/canonical; appears in the mix picker | one formula only |
| For | reusable systems (sucrose, Cremodan, heavy cream…) | a user's one-off bespoke blend |

Archetype bases reference **standard** presets only. Authoring an archetype = pick standard
mixes, set grams, add inclusions. Custom presets stay reserved for a user building a one-off
inside their own formula.

### New standard preset: `sugar-glucose-blend`
Dana Cree's bases use 150 g sucrose + 50 g glucose. Add one standard sugar preset so the
200 g reads correctly (rather than a per-formula custom mix):

```ts
const SUGAR_GLUCOSE_BLEND = preset("sugar-glucose-blend", "sugar", "Sucrose + Glucose", [
  { ingredientId: "sucrose",       proportion: 0.75 },
  { ingredientId: "glucose-syrup", proportion: 0.25 },
]);
// effectiveMacros → sugar 0.95, water 0.05 (glucose syrup carries ~20% water — freeze-point nuance)
```

## Base recipes by style

All bases are % of a 1000 g batch (= grams). "Texture agent" = a stabilizer dose (the app's
stabilizer mix); [Cree] offers cornstarch / tapioca / commercial stabilizer options.

### philadelphia — [Cree] "Blank Slate Philadelphia-Style Ice Cream"
| Component | % | grams | app smart-mix |
|---|---|---|---|
| Milk (whole 4%) | 40 | 400 | `milk-whole` |
| Cream (heavy 40%) | 38 | 380 | `cream-heavy` |
| Sugar | 15 | 150 | `sugar-sucrose` |
| Glucose | 5 | 50 | glucose (sugar system) |
| Milk powder | 2 | 20 | `milk-powder` |

Functional (per [Cree]): butterfat ≈ 17.5%. Verbatim: *"MILK POWDER (2%) 20g … SUGAR (15%)
150g … CREAM (38%) 380g … MILK (40%) 400g … GLUCOSE (5%) 50g."* — [Cree] Appendix "Ratios"
(also stated in the Philadelphia chapter, "Blank Slate Philadelphia-Style Ice Cream").

### custard — [Cree] "Blank Slate Custard Ice Cream"
| Component | % | grams | app smart-mix |
|---|---|---|---|
| Milk | 40 | 400 | `milk-whole` |
| Cream | 30 | 300 | `cream-heavy` |
| Sugar | 15 | 150 | `sugar-sucrose` |
| Glucose | 5 | 50 | glucose |
| Egg yolks | 10 | 100 (~5 large) | `eggs-yolks` |
| Texture agent | — | small | stabilizer |

Verbatim: *"Cream (30%) 300g … Milk (40%) 400g … Glucose syrup (5%) 50g … Sugar (15%) 150g …
Egg yolks (10%) 100g | about 5 large yolks … Texture agent of your choice."* — [Cree]
"Blank Slate Custard Ice Cream". **This is the reference that sets the real emulsifier
contribution** (egg yolk 10% of batch, not the unreachable 2% *emulsifier* — see D1).

### sherbet — [Cree] "Blank Slate Sherbet"
| Component | % | grams | app smart-mix |
|---|---|---|---|
| Milk | 30 | 300 | `milk-whole` |
| Fruit purée | 25 | 250 | inclusion (fruit) |
| Sugar | 15 | 150 | `sugar-sucrose` |
| Cream | 10 | 100 | `cream-light`/`cream-heavy` |
| Glucose | 10 | 100 | glucose |
| Buttermilk | 10 | 100 | `buttermilk` |
| Malic/citric acid | — | 5 | inclusion (optional) |

Verbatim: *"Fruit puree (25%) 250g … Buttermilk (10%) 100g … Malic or citric acid 5g …
Milk (30%) 300g … Cream (10%) 100g … Sugar (15%) 150g … Glucose (10%) 100g … Texture
agent."* — [Cree] "Blank Slate Sherbet".

### gelato — derived to range, corroborated by [Migoya] / [G&H]
Not covered by [Cree]. Constructed milk-forward to hit the gelato range (low fat, high MSNF,
high sugar); the app has a gelato-tuned milk preset (`milk-milk-heavy`).
| Component | % | grams | app smart-mix |
|---|---|---|---|
| Whole milk | 62 | 620 | `milk-whole` / `milk-milk-heavy` |
| Cream | 8 | 80 | `cream-heavy` |
| Milk powder | 4 | 40 | `milk-powder` |
| Sugar | 16 | 160 | `sugar-sucrose` |
| Glucose | 5 | 50 | glucose |
| Texture agent | 0.4 | 4 | stabilizer |

Computed: fat ≈ 5.7%, MSNF ≈ 10.3%, sugar ≈ 20.5%, TS ≈ 37% — inside the style range.
Corroboration — [Migoya] "Gelato Base": *"reduce the fat content in an ice cream or gelato
base, because using only heavy cream will produce a base that contains a very high fat
content."*; [G&H] gelato fat 4–8% / sugar up to 25% (book pp. 25 / 442). **Flag: derived, no
single authored source — confirm numbers.**

### sorbet — [Migoya] syrup + fruit model
[Migoya] builds sorbet as fruit purée + a concentrated "Sorbet Syrup". Assembled into the
app's model (no dairy):
| Component | % | grams | app smart-mix |
|---|---|---|---|
| Fruit purée | 50 | 500 | inclusion (fruit) |
| Water | 18 | 180 | `liquid-water` |
| Sugar | 22 | 220 | `sugar-sucrose` |
| Glucose | 8 | 80 | glucose |
| Stabilizer | 0.5 | 5 | stabilizer |
| Lemon juice | 1.5 | 15 | inclusion (optional) |

Computed sugar ≈ 29% (range 22–30). Verbatim — [Migoya] "Sorbet Syrup", BASE RECIPES book
p. 387: *"Sugar 4203 g 42.03% … Sorbet Stabilizer Mix 69 g .69% … Water 3910 g 39.1% …
Glucose powder 1818 g 18.18% … Total 10 kg."* Sorbet-base sugar 25–30% — [Migoya] book p. 15.

### vegan — [S&S] "Coconut Ice Cream Base"
[S&S] coconut base, converted from cups (Aroy-D boxed coconut cream):
| Component | cups | ~grams | % | app smart-mix |
|---|---|---|---|---|
| Coconut cream | 2½ | 600 | 58 | `milk-coconut-cream` |
| Light corn syrup | ¾ | 240 | 23 | glucose |
| Light brown sugar | ½ | 100 | 10 | `sugar-sucrose` (brown) |
| Granulated sugar | ¼ | 50 | 5 | `sugar-sucrose` |
| Toasted shredded coconut | ½ | 40 | 4 | inclusion |
| Xanthan gum | ½ tsp | 1.5 | 0.15 | stabilizer (xanthan) |

Verbatim — [S&S] "Coconut Ice Cream Base (Dairy Free!)": *"½ cup unsweetened shredded coconut …
½ cup light brown sugar … ¼ cup granulated sugar … ½ teaspoon xanthan gum … ¾ cup light corn
syrup … 2½ cups unsweetened coconut cream."*
**Reconcile:** verified macros — fat 16.4%, sugar 33.3%, stabilizer 0.14%. Fat sits at the
(re-derived) vegan ceiling; sugar is *above* it (range 14–24%) and stabilizer *below* it
(0.2–0.6%). [S&S] is a deliberately sweet/soft guest recipe. **Default base uses a moderated
version** that lands inside the range: coconut cream 42% / oat milk 33% / sugar 15% / glucose
5% / stabilizer 0.5% / toasted coconut 4% — with [S&S] cited as the source/inspiration. See
the re-derived vegan range in [style-targets.md](./style-targets.md) footnote `[^veg]`.

## Reference: frozen yogurt (not an app style)
[Cree] "Blank Slate Frozen Yogurt": Greek yogurt 40% (400g) · cream 20% (200g) · milk/water
15% (150g) · sugar 20% (200g) · glucose 5% (50g). Kept in case a froyo style is added later.

## Reconciliation — RESOLVED (D8)
[Cree]'s dairy bases total ~19.5% sugar, above [G&H]'s *commercial* premium band (13–16%). This
is an **equipment** difference, not an error: [Cree] formulates for home churns (warmer/slower
freeze → more sugar to stay scoopable). Resolution: **author faithfully to [Cree]** and treat the
`style-targets.md` ranges as the **home-dasher baseline** (dairy sugar shifted up, marked ‡), so
the bases sit in-band. Other equipment profiles shift the windows later via the equipment feature.
The per-flavor "this vanilla vs. that vanilla" pass is still deferred, but the base-vs-range
tension is closed.
