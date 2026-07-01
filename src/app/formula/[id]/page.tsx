"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FormulaProvider } from "@/context/FormulaContext";
import { useFormulaContext } from "@/context/FormulaContext";
import { loadFormula, saveFormula, type SavedFormula } from "@/lib/persistence";
import { FormulaPreview } from "@/components/formula/FormulaPreview";
import { FormulaEdit } from "@/components/formula/FormulaEdit";
import { RecipePreview } from "@/components/recipe/RecipePreview";
import { RecipeEdit } from "@/components/recipe/RecipeEdit";
import { IngredientSelector } from "@/components/shared/IngredientSelector";
import { ConfigPanel } from "@/components/formula/ConfigPanel";
import type { FormulaState, Ingredient } from "@/lib/formula-engine";
import styles from "./page.module.scss";

type WorkspaceView = "formula" | "recipe";
type WorkspaceMode = "preview" | "edit";

interface IngredientSelectorState {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
}

function WorkspaceContent({ saved }: { saved: SavedFormula }) {
  const { state, reset } = useFormulaContext();
  const [view, setView] = useState<WorkspaceView>("formula");
  const [mode, setMode] = useState<WorkspaceMode>("preview");
  const [showConfig, setShowConfig] = useState(false);
  const [ingredientSelector, setIngredientSelector] = useState<IngredientSelectorState | null>(null);
  const [notes, setNotes] = useState("");
  const [meta, setMeta] = useState({ name: saved.name, style: saved.style });

  // Auto-save whenever committed state changes
  useEffect(() => {
    saveFormula({
      ...saved,
      name: meta.name,
      style: meta.style,
      updatedAt: Date.now(),
      state,
    });
  }, [state, meta, saved]);

  const openIngredientSelector = useCallback(
    (context: string, onAdd: (ingredient: Ingredient) => void) => {
      setIngredientSelector({ context, onAdd });
    },
    []
  );

  const handleFormulaDone = useCallback(
    (newState: FormulaState) => {
      reset(newState);
      setMode("preview");
    },
    [reset]
  );

  const handleRecipeDone = useCallback(
    (newState: FormulaState, newNotes: string) => {
      reset(newState);
      setNotes(newNotes);
      setMode("preview");
    },
    [reset]
  );

  if (showConfig) {
    return (
      <div className={styles.content}>
        <ConfigPanel
          formulaName={meta.name}
          formulaStyle={meta.style}
          onNameChange={(name) => setMeta((m) => ({ ...m, name }))}
          onStyleChange={(style) => setMeta((m) => ({ ...m, style }))}
          onBack={() => setShowConfig(false)}
          onOpenIngredientSelector={openIngredientSelector}
        />
        {ingredientSelector && (
          <IngredientSelector
            context={ingredientSelector.context}
            onAdd={ingredientSelector.onAdd}
            onDismiss={() => setIngredientSelector(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {view === "formula" && mode === "preview" && (
        <FormulaPreview
          onEdit={() => setMode("edit")}
          onToggleView={() => setView("recipe")}
          onConfig={() => setShowConfig(true)}
        />
      )}
      {view === "formula" && mode === "edit" && (
        <FormulaEdit
          initial={state}
          onDone={handleFormulaDone}
          onCancel={() => setMode("preview")}
        />
      )}
      {view === "recipe" && mode === "preview" && (
        <RecipePreview
          notes={notes}
          onEdit={() => setMode("edit")}
          onToggleView={() => setView("formula")}
          onConfig={() => setShowConfig(true)}
        />
      )}
      {view === "recipe" && mode === "edit" && (
        <RecipeEdit
          initial={state}
          initialNotes={notes}
          onDone={handleRecipeDone}
          onCancel={() => setMode("preview")}
          onOpenIngredientSelector={(onAdd) => openIngredientSelector("general", onAdd)}
        />
      )}

      {ingredientSelector && (
        <IngredientSelector
          context={ingredientSelector.context}
          onAdd={ingredientSelector.onAdd}
          onDismiss={() => setIngredientSelector(null)}
        />
      )}
    </div>
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
      <header className={styles.header}>
        <Link href="/" className={styles.back}>← Home</Link>
        <h1 className={styles.title}>{saved.name}</h1>
        <span className={styles.styleTag}>{saved.style}</span>
      </header>
      <FormulaProvider initial={saved.state}>
        <WorkspaceContent saved={saved} />
      </FormulaProvider>
    </main>
  );
}
