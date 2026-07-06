import { RecipeEdit } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "@/lib/bootstrap";

// The recipe-editing surface: each smart mix / ingredient as an editable row
// with a draggable gram field and a per-ingredient note. Grouped systems (sugar,
// stabilizer) collapse to one card. Real bootstrapped recipe; callbacks no-op.
const { recipe } = bootstrapFromArchetype(ARCHETYPES.find((a) => a.id === "custard-vanilla")!);

export const Default = () => (
  <RecipeEdit
    recipe={recipe}
    initialNotes="Age the base overnight; churn cold for a denser set."
    onDone={() => {}}
    onOpenIngredientSelector={() => {}}
  />
);
