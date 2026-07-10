# Formulation relationships (balance hints)

The per-macro sliders stay **independent**. Separately, the balance layer watches
**relationships between macros** and emits advisory **hints** when a combination won't make a
good scoop (e.g. low fat *and* low sugar → icy). Each relationship is a **derived index** — a
formula over the mix — with a **target band**; the hint fires when the index leaves the band.
Nothing here constrains a slider; it only coaches. Extends `src/lib/balance.ts`.

Citations resolve in [sources.md](./sources.md).

## Tier 1 — computed from the 7 macros already in the model

| Relationship | Index | Band / flag | Source |
|---|---|---|---|
| Body / iciness | `TS = fat + sugar + MSNF + stab + emul` | ~36–42% (style-dep.) | [G&H] Table 1.7 (already in `balance.ts`) |
| Sandiness (MSNF ↔ water) | `dairyMSNF ÷ (dairyMSNF + water)` † | flag > **~0.17**; rule of thumb dairy MSNF ≤ ~⅙ of the water | [G&H]: high fat needs low MSNF "to avoid … 'sandiness' (the crystallization of … lactose)" (book p. 17). Exact ⅙-of-water figure: [Arb] — verify page |
| Richness (fat ↔ MSNF) | `fat ÷ dairyMSNF` † | flag when both high (dense/sandy) | [G&H] Table 2.4 (MSNF falls as fat rises) |
| Ice control (stab ↔ water) | stabilizer vs. a water-scaled target | [G&H] Table 2.4: 0.15%@TS40 → 0.35%@TS36; flag if below | [G&H] Table 2.4, book p. 24 |

† **`dairyMSNF`, not the `nonfatSolids` macro.** The 86-ingredient catalog routes cocoa, plant
starch, egg, coffee, and matcha solids into `nonfatSolids`, so that scalar is *total* non-fat
solids, not milk solids. Sandiness and lactose-FPD care only about **dairy** MSNF (its lactose
is what crystallizes and depresses freezing). So `dairyMSNF` is **derived from the recipe** via
a per-ingredient `lactose` coefficient (below), like PAC — never read off the aggregate macro.
Also: rename the `nonfatSolids` UI label from "Milk solids" → **"Non-fat solids"** so it stops
implying dairy (`formula-engine.ts:150`, `balance.ts:19`).

## Tier 2 — scoopability (needs sub-macro data): the FPD / PAC index

"How hard/scoopable at serving temp" is set by **freezing-point depression** — the Italian
gelato metric **PAC** (*potere anticongelante*). It is the real quantifier of the fat↔sugar
case *and* the sugar+alcohol "won't set" case.

```
FPD = Σ (grams_i × factor_i) / batch_grams      over every dissolved small molecule
```

**Why it needs new data fields (answer to "is this part of the ingredient model?"):** yes.
FPD is **not derivable** from the aggregate `sugar` macro — sucrose and dextrose are both
`sugar ≈ 1.0` but depress freezing ~2× differently. Add three optional coefficients (all
**migration-safe** — catalog metadata, re-read fresh, never persisted; only the `recipe`
[preset-ids + grams] and synthetic macro-block `state` are stored):

```ts
// CatalogIngredient
fpd?: number;     // freezing-point depression, sucrose = 100  (sugars / alcohol / salt)
pod?: number;     // sweetening power,        sucrose = 100  (sugars)
lactose?: number; // lactose mass fraction 0..1               (dairy ingredients)
```

`fpd`/`pod` → PAC/POD; `lactose` → true `dairyMSNF` (= Σ grams·lactose ÷ 0.545, since lactose
is ~54.5% of MSNF) and lactose's own FPD contribution. **All three must be computed from the
recipe's actual ingredients** (smartMix → preset → `ingredientId` → grams; additionals are
single ids), *not* the `MacroRatios` snapshot — which has already collapsed which sugar it was
and lumped dairy MSNF with cocoa/starch/egg solids.

### Coefficient table (sucrose = 100)
FPD is colligative (∝ moles), so `factor ≈ 342 / MW × ions`. This both derives from physics
and matches published gelato PAC tables.

| Ingredient | ~MW | factor | note |
|---|---|---|---|
| Sucrose | 342 | **100** | reference |
| Dextrose (glucose), anhydrous | 180 | **190** | monohydrate ~170 (water of crystallization) |
| Fructose | 180 | **190** | |
| Invert sugar | ~180 | **190** | glucose + fructose |
| Honey | ~180 | ~**190** | mostly fructose/glucose |
| Maltose | 342 | **100** | |
| Lactose (≈ ½ of MSNF) | 342 | **100** | MSNF's own contribution to FPD |
| Glucose syrup / corn syrup | — | **~40–90**, DE-dependent | 42 DE ≈ 55, 62 DE ≈ 80; *low PAC is why it's used — solids/chew without over-softening* |
| Maltodextrin (<20 DE) | — | **~15** | bulking, little softening |
| Sorbitol / glycerol | ~182 | ~**190** | |
| Ethanol (alcohol) | 46 | ~**740** | very strong per gram |
| Salt (NaCl) | 58 | ~**1180** | dissociates → ×2 ions |

Glucose syrup needs a chosen DE — the catalog's `glucose-syrup` should pick one (42 DE ≈ 55
is a sensible ice-cream default).

### POD (sweetening power) table — `pod`, sucrose = 100
Sweetness is a *separate* axis from freezing: you can hold PAC steady and shift sweetness by
trading sucrose ↔ dextrose (which is exactly what the sugar-system presets are for). Encoded
now, in the same catalog pass as `fpd`, to avoid re-touching every sugar twice.

| Ingredient | POD | Ingredient | POD |
|---|---|---|---|
| Sucrose | 100 | Lactose | ~16 |
| Dextrose | ~70 | Glucose syrup (42 DE) | ~40 (DE-dep.) |
| Fructose | ~140 | Maltodextrin | ~5 |
| Invert sugar | ~125 | Honey | ~130 |
| Sorbitol | ~60 | | |

Source to firm up: [Migoya] "sweetening power" chart (book p. ~16) — values above are the
standard gelato POD figures; cite Migoya's exact numbers when assigning. Enables a *sweetness*
hint (too bland / cloying) distinct from the *scoopability* (PAC) hint.

### Bands — calibrate from the authored bases, don't invent absolutes
Rather than pull absolute PAC targets from thin air, compute each **style base's** FPD and
center the band there. Worked examples (per 1000 g, factor/100):

- **Philadelphia** (Dana Cree): sucrose 150×1.0 + glucose 50×0.55 + lactose ~45×1.0 ≈ **222**
  sucrose-equiv/1000 g → FPD ≈ **22%**.
- **Sorbet** (Migoya): sucrose 220×1.0 + glucose 80×0.55 ≈ **264** → FPD ≈ **26%** — higher,
  correctly, since a no-fat sorbet needs more freeze-depression to scoop.

So the FPD band is per style, centered on the base's value ± a tolerance. (POD, sweetening
power, is a separate index — [Migoya]'s "sweetening power" chart, book p. ~16 — if we later
want to coach sweetness distinctly from scoopability.)

## Relationship → hint map

| Fires when | Hint |
|---|---|
| fat low **and** (TS below band **or** FPD below band) | "Lean and icy — with less fat, raise the sugar to keep it scoopable." |
| fat high **and** dairyMSNF high | "Dense — ease the milk solids as fat climbs (sandy risk)." |
| dairyMSNF ÷ (dairyMSNF + water) > 0.17 | "Milk solids high for the water content — sandy risk." |
| water high **and** stabilizer below target | "Watery — more stabilizer to hold off ice crystals." |
| FPD above band (sugar + alcohol) | "Very soft — sugar + alcohol may keep it from setting." |
| POD below/above band | "Tastes flat — bump the sugar." / "Cloying — cut sugar or shift to dextrose." |

All advisory. The sliders stay independent; total solids stays the top-level check; these add
the pairwise nuances TS alone can't see (sandiness and scoopability are invisible from TS).
