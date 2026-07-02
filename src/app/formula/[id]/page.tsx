"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Menu, Share2 } from "lucide-react";
import { FormulaProvider } from "@/context/FormulaContext";
import { useFormulaContext } from "@/context/FormulaContext";
import { loadFormula, saveFormula, type SavedFormula } from "@/lib/persistence";
import { FormulaPreview } from "@/components/formula/FormulaPreview";
import { FormulaEdit, type FormulaEditHandle } from "@/components/formula/FormulaEdit";
import { RecipePreview } from "@/components/recipe/RecipePreview";
import { RecipeEdit, type RecipeEditHandle } from "@/components/recipe/RecipeEdit";
import { IngredientSelector } from "@/components/shared/IngredientSelector";
import { ConfigPanel } from "@/components/formula/ConfigPanel";
import { seedRecipe } from "@/lib/recipe-seeder";
import { solveRecipe, computeRatiosFromRecipe } from "@/lib/recipe-solver";
import { getPresetById } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import type { FormulaState, Ingredient } from "@/lib/formula-engine";
import type { Recipe, StyleCategory, SmartMixKind } from "@/data/types";
import styles from "./page.module.scss";

type WorkspaceView = "formula" | "recipe";
type WorkspaceMode = "preview" | "edit";

interface IngredientSelectorState {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
}

function WorkspaceContent({ saved, isNew = false }: { saved: SavedFormula; isNew?: boolean }) {
  const { state, reset } = useFormulaContext();
  const [view, setView] = useState<WorkspaceView>("formula");
  const [mode, setMode] = useState<WorkspaceMode>("preview");
  const [showConfig, setShowConfig] = useState(false);
  const [ingredientSelector, setIngredientSelector] = useState<IngredientSelectorState | null>(null);
  const [notes, setNotes] = useState("");
  const [meta, setMeta] = useState({ name: saved.name, style: saved.style });
  const [recipe, setRecipe] = useState<Recipe>(
    saved.recipe ?? seedRecipe(saved.style as StyleCategory),
  );

  const formulaEditRef = useRef<FormulaEditHandle>(null);
  const recipeEditRef = useRef<RecipeEditHandle>(null);

  // Auto-save whenever committed state or recipe changes
  useEffect(() => {
    saveFormula({
      ...saved,
      name: meta.name,
      style: meta.style,
      updatedAt: Date.now(),
      state,
      recipe,
    });
  }, [state, meta, saved, recipe]);

  const openIngredientSelector = useCallback(
    (context: string, onAdd: (ingredient: Ingredient) => void) => {
      setIngredientSelector({ context, onAdd });
    },
    []
  );

  const handleFormulaDone = useCallback(
    (newState: FormulaState, newRecipe: Recipe) => {
      reset(newState);
      setRecipe(newRecipe);
      setMode("preview");
    },
    [reset],
  );

  const handlePresetChange = useCallback(
    (kind: SmartMixKind, presetId: string) => {
      setRecipe((prev) => {
        const updatedMixes = prev.smartMixes.map((m) =>
          m.kind === kind ? { ...m, presetId } : m,
        );
        const updatedRecipe: Recipe = { ...prev, smartMixes: updatedMixes };
        const targets = computeRatiosFromRecipe(updatedRecipe, getPresetById, (id) => getIngredientById(id)?.macros);
        const totalGrams = updatedMixes.reduce((s, m) => s + m.grams, 0) + prev.additionalIngredients.reduce((s, a) => s + a.grams, 0) || 1000;
        const solved = solveRecipe(
          targets,
          totalGrams,
          prev.additionalIngredients,
          updatedMixes,
          getPresetById,
          (id) => getIngredientById(id)?.macros,
        );
        return { ...prev, smartMixes: solved };
      });
    },
    [],
  );

  const handleRecipeDone = useCallback(
    (newRecipe: Recipe, newState: FormulaState, newNotes: string) => {
      setRecipe(newRecipe);
      reset(newState);
      setNotes(newNotes);
      setMode("preview");
    },
    [reset],
  );

  const headerLeft = showConfig ? (
    <button className={styles.headerBtn} type="button" onClick={() => setShowConfig(false)}>
      ← Back
    </button>
  ) : mode === "preview" ? (
    <button className={styles.headerBtn} type="button" aria-label="Menu">
      <Menu size={20} strokeWidth={2} />
    </button>
  ) : (
    <div className={styles.headerSlot} />
  );

  const headerRight = (!showConfig && mode === "preview") ? (
    <button className={`${styles.headerBtn} ${styles.headerBtnRight}`} type="button" aria-label="Share">
      <Share2 size={20} strokeWidth={2} />
    </button>
  ) : (
    <div className={styles.headerSlot} />
  );

  const headerTitle = showConfig ? (isNew ? "New Formula" : "Settings") : meta.name;
  const isPreviewTitle = !showConfig && mode === "preview";

  return (
    <>
      <header className={styles.header}>
        {headerLeft}
        <span
          className={`${styles.headerTitle} ${
            mode === "edit" && !showConfig ? styles.headerTitleEdit : ""
          } ${isPreviewTitle ? styles.headerTitleUpper : ""}`}
        >
          {headerTitle}
        </span>
        {headerRight}
      </header>

      <div className={styles.content}>
        {showConfig ? (
          <ConfigPanel
            formulaName={meta.name}
            formulaStyle={meta.style}
            recipe={recipe}
            onNameChange={(name) => setMeta((m) => ({ ...m, name }))}
            onStyleChange={(style) => setMeta((m) => ({ ...m, style }))}
            onPresetChange={handlePresetChange}
            onOpenIngredientSelector={openIngredientSelector}
          />
        ) : (
          <>
            {view === "formula" && mode === "preview" && <FormulaPreview recipe={recipe} />}
            {view === "formula" && mode === "edit" && (
              <FormulaEdit
                ref={formulaEditRef}
                initial={state}
                recipe={recipe}
                onDone={handleFormulaDone}
              />
            )}
            {view === "recipe" && mode === "preview" && (
              <RecipePreview recipe={recipe} notes={notes} />
            )}
            {view === "recipe" && mode === "edit" && (
              <RecipeEdit
                ref={recipeEditRef}
                recipe={recipe}
                initialNotes={notes}
                onDone={handleRecipeDone}
                onOpenIngredientSelector={(onAdd) => openIngredientSelector("general", onAdd)}
              />
            )}
          </>
        )}

        {ingredientSelector && (
          <IngredientSelector
            context={ingredientSelector.context}
            onAdd={ingredientSelector.onAdd}
            onDismiss={() => setIngredientSelector(null)}
          />
        )}
      </div>

      <div className={styles.bottomBar}>
        {showConfig ? (
          <>
            <div className={styles.barSlot} />
            {isNew ? (
              <button
                className={`${styles.barCenter} ${styles.barCreate}`}
                type="button"
                onClick={() => setShowConfig(false)}
              >
                CREATE
              </button>
            ) : (
              <button className={styles.barCenter} type="button" onClick={() => setShowConfig(false)}>
                Done
              </button>
            )}
            <div className={styles.barSlot} />
          </>
        ) : mode === "preview" ? (
          <>
            <button className={styles.barLeft} type="button" onClick={() => setMode("edit")}>
              Edit
            </button>
            <button
              className={styles.barCenter}
              type="button"
              onClick={() => setView(view === "formula" ? "recipe" : "formula")}
            >
              {view === "formula" ? "View Recipe" : "View Formula"}
            </button>
            <button
              className={styles.barRight}
              type="button"
              onClick={() => setShowConfig(true)}
              aria-label="Settings"
            >
              ⚙
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.barLeft}
              type="button"
              onClick={() => {
                if (view === "formula") formulaEditRef.current?.commit();
                else recipeEditRef.current?.commit();
              }}
            >
              Done
            </button>
            <div className={styles.barSlot} />
            <button className={styles.barRight} type="button" onClick={() => setMode("preview")}>
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function FormulaWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedFormula | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const formula = loadFormula(params.id);
    if (!formula) {
      router.replace("/");
      return;
    }
    setSaved(formula);
  }, [params?.id, router]);

  if (!saved) {
    return (
      <main className={styles.main}>
        <p className={styles.loading}>Loading…</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <FormulaProvider initial={saved.state}>
        <WorkspaceContent saved={saved} />
      </FormulaProvider>
    </main>
  );
}
