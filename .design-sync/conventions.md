# Ice Cream Formulator — building with these components

A React design system for an ice-cream recipe/formula tool. Components ship
compiled on `window.IceCreamDS.*` and are imported by name. They are **fully
self-styled** via CSS-module classes baked into the bundle — you do not pass
`className`/`style` to style them; you compose them and let them render.

## Setup & wrapping

- **Load `styles.css`** (it `@import`s the token layer, the Bricolage Grotesque
  webfont, and `_ds_bundle.css`). Everything renders unstyled without it.
- **Most components are pure props** — no provider needed (`SectionHeader`,
  `PintCup`, `RecipePreview`, `ConfigPanel`, `FormulaEdit`, `RecipeEdit`,
  `ArchetypeTile`, `GramScrubField`, `IngredientNote`, `IngredientSelector`,
  `SearchModule`).
- **`FormulaPreview` is the one exception** — it reads live macro ratios from
  `FormulaContext`, so wrap it (and any tree that shares formula state) in
  **`FormulaProvider`**, which is also exported from the bundle:

```jsx
const { FormulaProvider, FormulaPreview } = window.IceCreamDS;
<FormulaProvider initial={formulaState}>
  <FormulaPreview recipe={recipe} />
</FormulaProvider>
```

`FormulaProvider` takes `initial: FormulaState`; build one from the domain data
(the app derives it via `bootstrapFromArchetype(archetype)` → `{ state, recipe }`).

## Styling idiom — CSS custom-property tokens

The components carry their own look. For **your own layout glue** (page frames,
grids, spacing around the components), style with the DS's CSS variables — never
hardcode hex or px. The full vocabulary (all defined in the shipped stylesheet):

| Family | Tokens |
|---|---|
| Color | `--color-bg` `--color-surface` `--color-text` `--color-text-secondary` `--color-accent` `--color-on-accent` `--color-border` |
| Macro hues | `--color-macro-fat` `--color-macro-sugar` `--color-macro-nonfat` `--color-macro-stabilizer` `--color-macro-emulsifier` `--color-macro-alcohol` |
| Space | `--space-1` `--space-2` `--space-3` `--space-4` `--space-5` `--space-6` `--space-8` `--space-10` `--space-12` `--space-16` `--space-20` `--space-24` (a 4px scale) |
| Radius | `--radius-sm` `--radius-md` `--radius-lg` `--radius-pill` |
| Type | `--font-display` (Bricolage Grotesque) |
| Motion | `--duration-fast` `--duration-default` `--duration-slow` `--ease-jelly` |

`--color-accent` is the brand red used for primary/active states. Dark mode is
built in: it flips automatically under `prefers-color-scheme: dark`, or force it
with `data-theme="dark"` / `data-theme="light"` on a root element.

```jsx
<div style={{
  background: "var(--color-surface)",
  padding: "var(--space-6)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
}}>
  <SectionHeader role="composition" label="Composition" />
  <PintCup ratios={recipe.ratios} />
</div>
```

## Where the truth lives

- **Tokens & type**: `_ds/<folder>/styles.css` and its imports (the copies bound
  to your project). Read them before styling.
- **Per component**: `components/<group>/<Name>/<Name>.d.ts` (the exact props
  interface) and `<Name>.prompt.md` (usage + examples). Groups are `formula/`,
  `recipe/`, `shared/`.
- Note: domain-typed props (`recipe: Recipe`, `ratios: MacroRatios`,
  `archetype: Archetype`) reference the app's data shapes by name — see the
  `.prompt.md` examples for the concrete objects to pass.
