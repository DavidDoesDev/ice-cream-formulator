import { FormulaEdit } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "@/lib/bootstrap";

// The macro-editing surface: one slider per macro (fat, sugar, nonfat solids,
// stabilizer, emulsifier, alcohol) with live percentages, over a bootstrapped
// FormulaState. Callbacks are no-ops for the preview.
const boot = bootstrapFromArchetype(ARCHETYPES.find((a) => a.id === "custard-vanilla")!);

export const Default = () => (
  <FormulaEdit
    initial={boot.state}
    recipe={boot.recipe}
    onDone={() => {}}
    onOpenIngredientSelector={() => {}}
  />
);
