# Formulation sources

Bibliography for the formulation decisions in this folder. Each book has a short
**citation key** used in footnotes elsewhere (e.g. `[G&H]`). All files live in the
owner's Apple Books library:

```
~/Library/Mobile Documents/iCloud~com~apple~iBooks/Documents/
```

## How to read a citation

Footnotes cite location three ways, most-durable first:

1. **Table / section number** — stable across editions; the primary anchor.
2. **Book page** — the printed page number shown in Apple Books; how you'd navigate.
3. **PDF idx** — the page-*object* index from our local text extraction (see
   "Extraction method"). This is **not** the Apple Books page slider and can drift;
   it's recorded only for reproducibility. When in doubt, use the table number.

Where a page is not yet verified it's written `p. TBD`.

## Science / reference texts (used for per-style target ranges)

### `[G&H]` Goff, H.D. & Hartel, R.W. — *Ice Cream*
Springer; file appears to be the 7th ed. (2013). **Primary source for the style ranges.**
- File: `Ice cream by H Douglas Goff Richard W Hartel auth z-lib.pdf`
- Anchor tables/sections:
  - **Table 1.7** — Approximate composition (% by wt.) of commercial frozen desserts by category — book p. 15 (PDF idx ~4, uncertain)
  - **Table 2.4** — Suggested mixes for hard-frozen ice cream products — book p. 24 (PDF idx ~39)
  - **Ch. 2**, frozen-custard egg-yolk minimums — book p. 24 (PDF idx ~39)
  - **Ch. 2**, product-class descriptions (gelato p. 25, soft-serve p. 26, sherbet/water ice/sorbet p. 28)
  - **Ch. 15** Formulations for Specialty Products — gelato p. 442, frozen yogurt p. 443, sherbet p. 444, water ice p. 449, sorbet p. 450, non-dairy p. 451

### `[Clarke]` Clarke, Chris — *The Science of Ice Cream*
Royal Society of Chemistry (1st ed. 2004 / 2nd ed. 2012 — confirm). Corroborating source.
- File: `Science of Ice Cream by Clarke Chris z-lib.pdf`
- Anchor sections: Ch. 3 "The ingredients of ice cream" — fat (book p. 50, PDF idx ~58);
  egg yolk + stabilizers §3.7 (book p. 56, PDF idx ~64). Folios inferred from a consistent
  ~8-page front-matter offset; verbatim quotes are in `style-targets.md`.

### `[Migoya]` Migoya, Francisco J. — *Frozen Desserts*
The Culinary Institute of America / Wiley (2008). Corroborating; PacoJet/pro-kitchen bias.
- File: `Frozen Desserts by Francisco J Migoya z-liborg.pdf`
- Anchor sections: "Ingredients — Sugars" (book p. 15, PDF idx ~24); Ch. 8 "Base Recipes"
  (book p. 348) incl. **"Sorbet Syrup"** table (book p. 387). Folio inferred from a
  consistent ~9-page front-matter offset.

### `[Arb]` Arbuckle, W.S. — *Ice Cream*
Classic dairy-science text. Extracted but not yet mined for numbers.
- File: `Ice Cream by W S Arbuckle auth z-lib.pdf`

## Recipe / cookbook texts (for step 2 — explicit archetype recipes)

### `[Cree]` Cree, Dana — *Hello, My Name Is Ice Cream: The Art and Science of the Scoop*
**Weighted authority for base formulas** — percentage-based base system that maps closely
onto this app's base+inclusion model (home/artisan scale).
- File: `Hello My Name Is Ice Cream The Art and Science of the Scoop.epub`

### `[Jeni]` Bauer, Jeni Britton — *Jeni's Splendid Ice Cream Desserts*
- File: `Jenis Splendid Ice Cream Desserts.epub`

### `[S&S]` Salt & Straw — *Salt & Straw Ice Cream Cookbook*
**Source for the vegan base.** Ch. 1 "…Base" (`OEBPS/xhtml/c01.xhtml`): "Coconut Ice Cream
Base (Dairy Free!)" (vegan); "Ice Cream Base" (classic — states its functional ratio,
"~58% water, 17% fat, 11% milk solids, 14% sugar", corroborating the Philadelphia band).
- File: `Salt Straw Ice Cream Cookbook.epub`

### `[Scoop]` Lebovitz, David — *The Perfect Scoop* (Revised & Updated)
- File: `The Perfect Scoop Revised and Updated.epub`

### `[BGIC]` *Big Gay Ice Cream*
- File: `Big Gay Ice Cream.epub`

## Extraction method

The PDFs have no external text-tooling available (no poppler/mutool). Text was pulled
locally by inflating each PDF's FlateDecode content streams (Node/Python `zlib`) and
decoding the `Tj`/`TJ` text operators — no network, no uploading. Artifacts to be aware
of when spot-checking: ligatures and dashes mojibake (e.g. `Ã`/`Ð` = en-dash `–`,
`Þ` = "fi", `ß` = "fl"); accented names lose diacritics. **Numbers extract cleanly.**
The epubs are already-unzipped XHTML directories and read directly.
