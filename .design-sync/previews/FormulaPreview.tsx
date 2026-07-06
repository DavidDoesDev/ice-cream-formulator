import { FormulaPreview, FormulaProvider } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "@/lib/bootstrap";

// FormulaPreview reads the live macro ratios from FormulaContext, so it MUST be
// wrapped in FormulaProvider (both imported from the same bundle so they share
// the one context instance). Shows the PintCup, the macro key, and ingredient
// rows for the bootstrapped recipe.
const boot = bootstrapFromArchetype(ARCHETYPES.find((a) => a.id === "custard-chocolate")!);

export const Default = () => (
  <FormulaProvider initial={boot.state}>
    <FormulaPreview recipe={boot.recipe} />
  </FormulaProvider>
);
