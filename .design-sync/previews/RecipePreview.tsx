import { RecipePreview } from "ice-cream-formulator";
import { ARCHETYPES } from "@/data/archetypes";
import { bootstrapFromArchetype } from "@/lib/bootstrap";

// RecipePreview is the finished-recipe view: an adjustable yield, the flattened
// ingredient list in grams, and tasting notes. Built from a real bootstrapped
// recipe so the ingredient rows and gram weights are the app's actual output.
const recipeFor = (id: string) =>
  bootstrapFromArchetype(ARCHETYPES.find((a) => a.id === id)!).recipe;

export const CustardVanilla = () => (
  <RecipePreview
    recipe={recipeFor("custard-vanilla")}
    notes="Age the base overnight for a rounder mouthfeel. Churn cold."
  />
);

export const MangoSorbet = () => (
  <RecipePreview
    recipe={recipeFor("sorbet-mango")}
    notes="Ripe Alphonso mango carries the sugar — taste and adjust before spinning."
  />
);
