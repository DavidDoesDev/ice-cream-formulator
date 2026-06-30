## Problem Statement

Ice cream formulation requires thinking in two registers simultaneously: grams (what you actually measure and make) and percentages (what determines the character, texture, and scoopability of the result). Today, hobbyist tools work only in grams with no ratio awareness, and professional tools work only in ratios with no batch-scale output. Formulators — from home cooks to small-batch producers — are left reconciling two separate documents, or doing the math in Excel. No existing browser tool connects these two views, handles the constraint-solving that experienced formulators do mentally, or provides a visually legible way to understand what a formula actually is.

## Solution

A web-based ice cream formulation tool that treats recipe mode (ingredient amounts in grams) and formula mode (macro ratios as percentages of mix) as two live projections of a single underlying dataset. Change one view and the other updates immediately. A constraint engine (autobalance) handles the math when the user adjusts ratios or locks specific ingredients, surfacing conflicts explicitly rather than silently normalizing them. Onboarding via a template selector — either picking from a tile grid of archetype formulas or describing the desired result in natural language — bootstraps a balanced starting formula in one step. The tool runs entirely in the browser with local storage persistence.

## User Stories

1. As a home ice cream maker, I want to browse archetype formula templates by style (Philadelphia, custard, gelato, sorbet, sherbet, vegan) so that I can start from a proven foundation rather than a blank slate.
2. As a user, I want each template tile to show a visual macro breakdown, title, and description so that I can understand the character of a formula before selecting it.
3. As a user, I want to describe my ideal ice cream in plain language ("smooth, rich chocolate, slightly bitter") so that the system can find a matching starting formula for me.
4. As a user, I want to see an explanation of the key decisions the system made when matching my description to a formula — in plain language, not food science jargon — so that I understand what I'm starting with.
5. As a user, I want the explanation to be broken into labeled decision cards (style choice, fat target, sugar system, key ingredients) so that I can scan individual choices rather than reading a wall of text.
6. As a user, I want a "Try again" option on the explanation screen so that I can refine my description and get a different match without losing my place.
7. As a user, I want one click from the template grid to selecting a template and entering the main workspace so that there is no unnecessary setup friction.
8. As a formulator, I want to see my formula's macro ratios as labeled percentage sliders (sugar, fat, nonfat solids, stabilizers, emulsifiers, alcohol) so that I can reason about composition without doing arithmetic.
9. As a formulator, I want slider adjustments to trigger live autobalance so that other macro ratios update in real time to reflect a valid formula as I drag.
10. As a formulator, I want to see a visual pint-cup representation of my formula with colored layers for each macro so that the composition is immediately legible at a glance.
11. As a formulator, I want all formula percentages labeled "of mix" so that I understand they represent the active mix ingredients, not the total recipe output including process-only additions.
12. As a formulator, I want to see specialty ingredients (peanut butter, cocoa powder, liqueurs) listed separately below the macro sliders at their fixed percentage so that I can see their contribution to the formula without them being absorbed into a generic macro bucket.
13. As a formulator, I want other sliders to visually indicate a conflict state when I drag one slider to a value the system cannot automatically resolve so that I know intervention is needed.
14. As a formulator, I want a "Rebalance" action to appear when the system detects an irresolvable conflict so that I can ask for the most minimal adjustment to restore a valid formula.
15. As a formulator, I want to manually drag other sliders to attempt my own resolution when the system is in a conflict state so that I stay in control of the formula.
16. As a formulator, I want to switch from formula mode to recipe mode and see the same formula expressed as ingredient gram amounts so that I can understand what to actually weigh out.
17. As a user, I want to set a target yield in recipe preview mode and see all ingredient gram amounts scale proportionally so that I can plan a batch of any size.
18. As a user, I want to edit individual ingredient gram amounts in recipe edit mode so that I can make targeted adjustments to specific components.
19. As a user, I want the formula percentages to update when I change a gram amount in recipe edit so that both views stay in sync.
20. As a formulator, I want to pin a specific ingredient at a fixed gram amount so that the autobalance system adjusts around it rather than modifying it.
21. As a formulator, I want to exclude a specific ingredient from the mix calculation so that process-only additions (salt, steeped aromatics) appear in the recipe gram list without affecting formula percentages.
22. As a formulator, I want excluded ingredients to still be included in yield scaling so that a 1000g batch includes their correct gram amounts even though they don't appear in the formula.
23. As a user, I want to search for ingredients to add to my recipe from a curated catalog so that I can expand beyond the template's starter set.
24. As a user, I want the ingredient selector to show only contextually relevant ingredients (e.g., only sweeteners when adding to a sugar mix) so that I am not overwhelmed by irrelevant options.
25. As a user, I want to filter the ingredient selector by text search so that I can find a specific ingredient quickly.
26. As a user, I want each ingredient card in the selector to show title, description, image, and macro breakdown so that I can make an informed choice before adding.
27. As a user, I want a single "Add to recipe" action on each ingredient card so that adding an ingredient requires no intermediate steps.
28. As a user, I want to configure my Sugar Mix from a dropdown of popular sweetener options (sucrose, dextrose, invert sugar, trehalose) plus a custom option so that I can control the sugar system without building it from scratch.
29. As a user, I want to configure my Stabilizer Mix from a dropdown of popular stabilizer blends plus a custom option for the same reason.
30. As a user, I want to name my formula so that I can identify it in my saved list.
31. As a user, I want my formulas to be saved automatically to local storage so that I can return to them in a later session.
32. As a user, I want a home screen showing all my saved formulas as cards so that I can resume any prior formula.
33. As a user, I want each formula card on the home screen to show a mini pint-cup visualization, the formula name, style, fat%, and sugar% so that I can identify a formula at a glance without opening it.
34. As a user, I want to add notes to a formula so that I can record process observations or tasting notes alongside the formula data.
35. As a user, I want to access the configuration view from within the main workspace via a gear icon so that I can adjust name, recipe type, and smart ingredient settings after initial creation.
36. As a user, I want the app to work and feel good on both mobile and desktop screen sizes so that I can use it at a kitchen counter or a desk.
37. As a formulator, I want swipe-to-reveal delete and more actions on ingredient cards in recipe edit mode so that the list stays clean until I need those actions.

## Implementation Decisions

### Formula Engine
The core of the application is a pure-logic state module with no UI dependencies. It holds a single source of truth: a macro ratio vector (sugar, fat, nonfat solids, stabilizers, emulsifiers, alcohol, water — always summing to 100% of mix) and an ingredient list where each ingredient has a state (normal, pinned, or excluded) and a gram amount.

- **Recipe ↔ formula projection:** Formula percentages are derived by dividing each ingredient's macro contribution by the total mix weight (sum of all non-excluded ingredients). Gram amounts are derived by multiplying the ratio vector by the yield scalar.
- **Autobalance policy:** When a macro slider is dragged, the engine distributes the slack to normal (unpinned, non-excluded) ingredients in priority order: most neutral first (milk, cream, water), most characterful last (specialty fats, inclusions). Pinned ingredients are not touched. Excluded ingredients are not touched.
- **Conflict detection:** When user-imposed pins and slider positions make the constraint system over-determined (no valid solution exists within min/max bounds), the engine enters a conflict state rather than silently normalizing.
- **Rebalance:** On explicit user request, the engine applies the minimal adjustment to normal ingredients to restore a valid formula.
- **"Of mix" semantics:** Excluded ingredients contribute to recipe gram totals and yield scaling but are not counted in formula percentages. Formula percentages always sum to 100% of mix.
- **Min/max limits:** Each macro has type-specific bounds (e.g., stabilizer mix has a narrow range; fat has a wider one) that constrain slider travel and inform conflict detection.

### Template Matcher
A pure-logic module with no UI dependencies. The archetype corpus is a static dataset of ~25 starter formulas, each annotated with structured attributes (style category, fat target, sugar system, texture descriptors, key inclusions). The matcher projects a natural language input string into the same attribute space via keyword and phrase scoring (no LLM), then returns archetypes ranked by weighted Euclidean distance. Match metadata (which attributes matched and why) is passed to the explanation screen for prose and decision card generation.

### Archetype Corpus
Static structured data: each archetype contains formula parameters (macro ratios, default smart ingredient selections), attribute tags (style, texture words, fat tier, sugar system), explanation prose (plain language, no jargon), and decision card content (label + one-line reason per key choice). This is the only place food science knowledge is encoded.

### Pint Cup Visualization
A self-contained SVG component. Takes a macro ratio object as input and renders colored layers scaled to percentage height. Two size variants: full (formula preview) and mini (home screen cards). Colors are mapped to macro categories via design tokens. No external dependencies.

### Ingredient Catalog
Static structured data with runtime filtering. Each ingredient has: name, description, image reference, category (dairy, sweetener, stabilizer, emulsifier, inclusion, alcohol, misc), and full macro profile. The catalog module exposes a context-filtered view — callers specify the context (e.g., "sugar-mix") and receive only the relevant subset.

### Persistence Layer
A thin local storage adapter that serializes and deserializes formula state. No durability guarantees are surfaced in the UI. The adapter is the only place that touches browser storage, keeping the formula engine and UI components storage-agnostic.

### UI Architecture
Each UI component is self-contained: it owns its logic, interaction, and styles. Container queries (not viewport media queries) govern responsive behavior so each component responds to its own container size, not the page. Components do not share state directly — they communicate through the formula engine as the single source of truth.

State management uses a `useFormula` custom hook wrapping `useReducer`, with formula state hoisted into a React context provider at the page level. Components consume via `useFormulaContext()`. The formula engine (pure logic) lives in `src/lib/` and has no React dependency. The hook is the only place engine logic connects to React state.

**Folder structure:**
- `src/app/` — Next.js app router routes (`/`, `/new`, `/formula/[id]`)
- `src/components/` — UI components grouped by screen (home, template-selector, formula-view, recipe-view, ingredient-selector, config, shared)
- `src/lib/` — pure logic modules (formula engine, template matcher)
- `src/data/` — static structured data (archetype corpus, ingredient catalog)
- `src/hooks/` — `useFormula`
- `src/context/` — `FormulaContext`

Shared primitives (Button, SearchInput, Modal shell, PintCup) live in `src/components/shared/`. Each major component decomposes into sub-components that live inside its folder (e.g., `MacroSlider`, `IngredientRow`, `DecisionCard`).

### Responsive Strategy
The layout is a single-column mobile-first view that scales up at wider container widths. No side-by-side dual-view at any size. The mobile wireframe designs are the canonical reference; desktop is a proportionally larger version.

### Search Module (Template Selector)
A self-contained floating component that sits above the template tile grid on the template selector screen. It is always visible — not toggled or triggered.

- **Resting state:** A thin bar containing a text input ("Describe your flavor") and a submit icon. Minimal chrome.
- **Focused state:** Jelly-expands downward to reveal a set of rotating suggestion chips ("a silky pistachio gelato", "a rich brown butter caramel", "a high protein treat").
- **Chip interaction:** Tapping a chip plays a brief selection animation then auto-submits.
- **Submit:** Triggers the template matcher, transitions to the explanation screen. The module animates out as part of the screen transition.
- **Modularity:** Self-contained with no template-selector-specific dependencies. Can be reused in other contexts.

### Style System
All visual values are CSS custom properties. No hardcoded hex values, pixel amounts, or font names anywhere in component files.

**Typeface:** Bricolage Grotesque (variable font, single family). Ultra-light for body and labels, ultra-black for display headings. Loaded via the Next.js font system.

**Color tokens:**
- `--color-bg`: `#FAFAF7` (warm off-white)
- `--color-surface`: `#FFFFFF`
- `--color-text`: `#1C1812` (warm near-black)
- `--color-text-secondary`: `#8C8680`
- `--color-accent`: `#E8522A` (tangerine-coral — primary CTA, active states, submit icons)
- Macro colors (pint cup layers):
  - `--color-macro-sugar`: `#F6D98A`
  - `--color-macro-fat`: `#F0C4A8`
  - `--color-macro-nonfat`: `#A8D8C8`
  - `--color-macro-stabilizer`: `#C8D8F0`
  - `--color-macro-emulsifier`: `#D4C0E8`
  - `--color-macro-alcohol`: `#F0B8C0`

Dark mode overrides all tokens via `@media (prefers-color-scheme: dark)`. The dark accent color (`--color-accent` in dark mode) is deferred until the palette can be evaluated against a dark surface.

**Border radius scale:**
- `--radius-sm`: `12px`
- `--radius-md`: `20px`
- `--radius-lg`: `32px`
- `--radius-pill`: `999px`

**Animation:**
- `--ease-jelly`: `cubic-bezier(0.34, 1.45, 0.64, 1)` — slight elastic overshoot, soft settle. Used for slider thumb movement, module expand/collapse, modal open/close, pint cup layer transitions, card entrances.
- `--duration-fast`: `160ms`
- `--duration-default`: `320ms`
- `--duration-slow`: `480ms`

**Design language:** Oversized type, abundant whitespace, very rounded shapes (pill buttons, large card radii), transparent PNG subjects over soft graphic shapes. Playful, warm, not clinical. Inspired by mubasic.webflow.io and charm.land.

## Testing Decisions

Good tests verify external behavior, not implementation details. They call the module's public interface with realistic inputs and assert on observable outputs. They do not assert on internal state, call order, or intermediate steps.

**Formula Engine** — test suite covering:
- Autobalance: given a slider drag to a valid target, assert the resulting ratio vector is valid (sums to 100%, all values within bounds) and only normal ingredients were adjusted
- Conflict detection: given a pinned configuration that makes the target unachievable, assert the engine enters conflict state rather than producing an invalid vector
- Rebalance: given a conflict state, assert Rebalance produces a valid vector with minimal deviation from the user's intended values
- Pin/exclude states: assert pinned ingredients are not modified by autobalance; assert excluded ingredients are not counted in formula percentages but are counted in yield scaling
- "Of mix" calculation: assert formula percentages sum to 100% regardless of excluded ingredient mass
- Yield scaling: assert all ingredient gram amounts (including excluded) scale proportionally when yield changes

**Template Matcher** — test suite covering:
- Keyword match: given a query containing known texture/style terms, assert the top-ranked archetype matches the expected style category
- Attribute projection: assert that queries with multiple cues (e.g., "lean, fruity, cold") produce a different ranking than single-cue queries
- No-match graceful handling: assert that a nonsense query returns the closest archetype rather than an error

## Out of Scope

- LLM or AI API calls of any kind (template matching is pure attribute scoring)
- AI copilot / formula-watching assistant (deferred)
- Cross-device sync or cloud persistence
- Formula sharing or export (identified as a future addition; local storage only for now)
- Nutritional label generation or regulatory compliance output
- Overrun calculation or serving temperature prediction (may be surfaced as derived stats later, not in scope now)
- Natural language cold-start that generates a novel formula not in the corpus (matching only, not generation)
- Flavor pairing suggestions
- Integration with the Composition Navigator or Flavor Pairings apps (separate repos; coupling deferred)

## Further Notes

- Formula percentages throughout the UI are labeled "of mix" to distinguish them from total recipe output percentages, which differ when excluded ingredients have mass.
- The local storage persistence layer should never use language implying durability ("saved", "backed up", "safe"). The home screen list is a working scratchpad.
- The archetype corpus is the encoded form of Arbuckle-sourced knowledge. Arbuckle (the book) is a reference source only — not served, not distributed, not referenced by name in the UI.
- The formula engine already has prior art in `DavidDoesDev/iceCreamLab` (`misc/ice-cream/src/main.js`) and a curated 20-ingredient dataset (`tools/data-cms/src/Ingredients.json`) that can seed the ingredient catalog.
- Sugar Mix and Stabilizer Mix are "smart ingredients" — they appear as single line items in the formula but expand into their component breakdown in the Config view sub-screens.
