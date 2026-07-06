import { IngredientNote } from "ice-cream-formulator";

// A compact per-ingredient note: a pencil affordance showing the note (or an
// "add a note" prompt) that expands to a textarea on tap. Both states shown.
export const WithNote = () => (
  <IngredientNote value="Bloom the cocoa in warm milk before adding" onChange={() => {}} />
);
export const Empty = () => <IngredientNote value="" onChange={() => {}} />;
