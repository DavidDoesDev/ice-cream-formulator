import { SectionHeader } from "ice-cream-formulator";

// SectionHeader labels each section of the formulator with its canonical glyph.
// One export per role so the icon+label pairing for each is visible at a glance.
export const Composition = () => <SectionHeader role="composition" label="Composition" />;
export const Ingredients = () => <SectionHeader role="ingredients" label="Ingredients" />;
export const SpecificMix = () => <SectionHeader role="specific" label="Smart Ingredients" />;
export const Yield = () => <SectionHeader role="yield" label="Yield" />;
export const Notes = () => <SectionHeader role="notes" label="Tasting Notes" />;
