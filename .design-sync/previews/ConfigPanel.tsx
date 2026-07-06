import { ConfigPanel } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "@/lib/bootstrap";

// The recipe configuration surface: name field, recipe-type grid, and the smart
// ingredient systems (milk base, sugar, stabilizer, …) with preset selectors.
// Built from a real bootstrapped recipe; callbacks are no-ops for the preview.
const noop = () => {};
const { recipe } = bootstrapFromArchetype(ARCHETYPES.find((a) => a.id === "custard-vanilla")!);

export const Default = () => (
  <ConfigPanel
    formulaName="Vanilla Bean Custard"
    formulaStyle="custard"
    recipe={recipe}
    onNameChange={noop}
    onStyleChange={noop}
    onPresetChange={noop}
    onCustomPreset={noop}
    onAddMilkIngredient={noop}
    onRemoveMilkIngredient={noop}
    onOpenIngredientSelector={noop}
  />
);
