# Business model & science audit (2026-07-14)

An independent, source-verified audit of (1) the app's food-science coefficients,
(2) the competitor landscape, and (3) monetization — commissioned because the
owner is prioritizing **making money** and wanted external validation rather than
relying on model memory.

Method: `deep-research` harness — fan-out web search → fetch primary sources →
3-vote adversarial verification per claim (2/3 refutes kills it) → synthesis.
First pass verified 25 of 108 extracted claims (budget-limited); a second focused
pass audits the coefficients the first pass left uncovered (see §1b).

---

## 1a. Science — CONFIRMED against literature

All coefficients are relative to **sucrose = 100** — this is the literal gelato
industry convention (POD = *potere dolcificante*, PAC = *potere anticongelante*),
independently confirmed.

| Item | Coded value | Verdict | Source anchor |
|---|---|---|---|
| Freezing model (colligative, FPD ∝ 1/MW, ice concentrates solutes) | — | ✅ Standard approach | ACS *J.Chem.Ed.* 2022; Goff/Guelph e-book |
| Dextrose PAC | 190 | ✅ Confirmed (342/180 = 1.90 exact) | under-belly; icecreamscience; Ice Cream Calc |
| Dextrose POD | 70 | ✅ Confirmed (lit. 70–75) | Owl Software; Cargill |
| Trehalose PAC | 100 | ✅ Confirmed (MW 342 ≈ sucrose) | Sigma-Aldrich MW |
| Trehalose POD | 45 | ✅ Confirmed (lit. 45–50) | food-science sources |
| Sandiness threshold (dairy MSNF ≲ 1/6 ≈ 0.17 of serum) | 0.17 | ✅ Confirmed real — the "MSNF factor of 17" / Rothwell ÷7 rule | dairyscience.info; Guelph e-book |
| Sandiness mechanism (excess serum lactose crystallizes → sandy; also lowers freeze point) | — | ✅ Confirmed verbatim in Goff's textbook | Guelph e-book, "Milk Solids-not-fat" ch. |

**Caveats that refine (not refute):** the ideal colligative law drifts at high
solute concentration (needs activity coefficients above ~1–2 mol/kg) — most
relevant to **high-sugar sorbets**, exactly where the model is weakest. Trehalose
PAC 100 is the ideal-anhydrous value; real freeze-concentrated behavior differs
slightly (higher Tg′, dihydrate crystallization).

## 1b. Science — second validation pass (COMPLETE, run `wf_4488f83e-9b6`)

| Item | Coded | Verdict | Source / note |
|---|---|---|---|
| Invert sugar PAC | 190 | ✅ Confirmed | dairyscience.info FPDF table (342/180 ≈ 1.9) |
| Honey PAC | 190 | ✅ Confirmed | predominantly invert sugars |
| Ethanol FPD | 740 | ✅ Confirmed (idealized) | 342/46 = 743; Ice Cream Calc, dairyscience, SlushiCalc |
| Cryoscopic K | 5.44 | ✅ Confirmed | 1.86 × 1000/342 = 5.44 exact; standard G&H method |
| Lactose fraction of MSNF | 54.5% | ✅ Confirmed | Van Slyke & Bosworth 1915; Ice Cream Calc; Guelph |
| Brown sugar / molasses / maple PAC | 100 | ✅ By inference | mostly sucrose; no discrete tabulated source |
| **Glucose syrup PAC** | **70** | ⚠️ **PARTIAL** | DE-dependent — CANNOT be fixed. 42 DE = 80, 36 DE = 64. App's 70 ≈ **38–40 DE** (low end), not a true 42 DE. |
| **Sherbet fat floor** | **2%** | ⚠️ **PARTIAL** | Goff sherbet fat 0.5–1.5%; app floor sits above it. |
| POD: invert 125 / honey 130 / glucose 50 / molasses 70 | — | ⛔ **THIN** | NOT independently corroborated — audit focused on PAC/FPD. Treat as unaudited. |

**Style bands are an app convention, not a bug.** `macro-bands.ts` models dairy
lactose inside the `sugar` macro, so the app's sugar reads ~+3% and MSNF ~−5% vs
Goff's tables *by design*. Only **fat** bands are a clean literature comparison —
which is why the sherbet-fat mismatch above is the one real style discrepancy.

**All of the above are now locked as regression tests** in
`src/lib/derive.validation.test.ts` (17 assertions, each tagged
CONFIRMED / PARTIAL / UNAUDITED with its source in the comment).

## 1c. Physical (bench) validation — still required, still unaddressed

Neither pass substitutes for making the ice cream and measuring actual scoop
hardness at a known temp against the model's prediction. ~6–8 batches across the
range (sorbet / Philadelphia / custard / alcohol) is the minimum first pass. This
is the gate before claiming "professional-grade" publicly.

---

## 2. Competitor landscape (2026)

| Tool | What it is | Tier / price | Science depth |
|---|---|---|---|
| **Ice Cream Calc** | Web PAC/POD recipe balancer — direct competitor, same science | Pricing **not established** (a "it's free" claim was **refuted 0–3** — do not assume free) | Full PAC/POD via MW ratio |
| **Scoopulator** | Free web tool; **explicitly targets Ninja Creami** + churners; pitched at "icy/hard/too-sweet" | Free, donation/ad-supported ("Buy Me A Coffee"), no account | Recipe analysis + fixes |
| **Gelato Pro** | Full commercial production tool | Paid (pro tier) | **Already has PAC/POD, freezing/hardness curves, overrun/density, food cost** |
| Dream Scoops | Educational site + calculator | Free/content | Moderate |

**Strategic read:** the **free consumer tier is crowded** (Scoopulator, Ice Cream
Calc, Dream Scoops); the **paid tier exists only at the professional/production
end** (Gelato Pro). Critically, the three gaps identified in the earlier app
assessment — overrun, freezing/serving-temp curves, costing — are *exactly* the
features Gelato Pro paywalls. That defines the "pay for it" feature set.

*Not exhaustive:* ICECAT, MEC3/PreGel pro tools, community spreadsheets, and mobile
apps did not surface verified claims — a gap for a later pass.

---

## 3. Money (priority)

### Pricing benchmarks — all from vendor pages (confirmed)

| Analog | Model | Price | Free tier |
|---|---|---|---|
| Brewfather (homebrew) | Freemium | **~$30/yr** | capped at 25 recipes |
| Brewer's Friend (homebrew) | Freemium | **$36/yr** ($5/mo); Plus $120/yr | capped at 5 recipes |
| Cronometer (nutrition) | Freemium | **$60/yr** Gold | basic logging free |
| MacroFactor (nutrition) | **Subscription-only** | **$72/yr** ($5.99/mo annual) | **none — ~500K users** |

Two anchors: the category charges **$36–72/yr**, and MacroFactor proves a
**subscription-only** niche prosumer tool can reach ~500K users. The gating
template is consistent: free = calculator with a recipe cap; paid = unlimited
recipes + **cost/inventory tracking + versioning + integrations + export**.

### Market size — read skeptically

US artisanal ice cream ~**$2.19B** (2023); countertop makers ~$700M → ~$1.3B by
2035. **These are hardware/retail dollars, not the app's TAM.** No user headcount
(Creami owners, enthusiasts, small producers) survived verification. A projection
($3.39B by 2030, 6.5% CAGR) was **refuted 0–3 — do not cite it.**

### Recommended strategy

**Do not monetize the free Ninja Creami hobbyist** — that tier is saturated and
racing to $0 (Scoopulator). Use them as top-of-funnel / audience. Monetize the
**serious hobbyist → micro-producer** wedge with freemium at **~$48/yr**:

1. **Free:** the (better-designed) formulator, capped at ~5–10 saved batches. This
   is the marketing — design is the edge over Scoopulator/Ice Cream Calc.
2. **Paid (~$48/yr):** cloud accounts + sync, unlimited batches, **cost/COGS per
   batch**, **overrun modeling**, **export/PDF**, versioning, production scaling.

Rationale: producers pay for money-adjacent features (costing, consistency,
yield), not for science. Science is the credibility that opens the door; costing +
overrun + export closes. Those paid features are also the ones that require bench
validation to be trustworthy — so sequence: **close coefficients (desk) →
bench-validate → build overrun + costing → charge.**

---

## Refuted claims (do NOT repeat)

- Ice Cream Calc is free / no premium tiers — **refuted 0–3**.
- US artisanal ice cream → $3.39B by 2030 at 6.5% CAGR — **refuted 0–3**.
- Sandiness avoidable if lactose < 7–11% of (lactose+water) via Tharp & Young — **refuted 1–2**.

## Open questions

1. Actual TAM in **users** (Creami owners, active enthusiasts, small producers) — only $ market sizes survived.
2. The §1b unaudited coefficients (second pass in progress).
3. Ice Cream Calc's real pricing; MEC3/PreGel and small-producer COGS/compliance software costs.

## Key sources

- Goff & Hartel via **University of Guelph ice cream e-book** (primary): https://books.lib.uoguelph.ca/icecreamtechnologyebook/
- ACS *J. Chem. Education* (colligative FPD): https://pubs.acs.org/doi/10.1021/acs.jchemed.2c00626
- dairyscience.info (MSNF factor / Rothwell): https://www.dairyscience.info/ice-cream/154-ice-cream-mix.html
- under-belly.org, icecreamscience.com, Ice Cream Calc (PAC/POD tables)
- Vendor pricing: brewfather.app, brewersfriend.com, macrofactor.com, cronometer.com
- Competitors: gelato-pro.com, scoopulator.app
