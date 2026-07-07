"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Home, Moon, Sun, Settings, RotateCcw } from "lucide-react";
import { loadFormula, saveFormula, type SavedFormula } from "@/lib/persistence";
import { RecipePanel } from "@/components/recipe/RecipePanel";
import { MacrosPanel } from "@/components/formula/MacrosPanel";
import { IngredientSelector } from "@/components/shared/IngredientSelector";
import { ConfigPanel } from "@/components/formula/ConfigPanel";
import { Pill } from "@/components/shared/Pill";
import { Toast } from "@/components/shared/Toast";
import { seedRecipe } from "@/lib/recipe-seeder";
import { computeRatiosFromRecipe, solveRecipe } from "@/lib/recipe-solver";
import {
  totalGrams,
  workspaceRatios,
  workspaceConflict,
  setMixGrams,
  setAdditionalGrams,
  setMacroTarget,
  setYield,
  addAdditionalIngredient,
  removeAdditionalIngredient,
  rebalanceWorkspace,
  type LiveWorkspace,
  type WorkspaceDeps,
} from "@/lib/live-workspace";
import { computeRatios, type MacroRatios, type Ingredient } from "@/lib/formula-engine";
import { stateFromRatios } from "@/lib/bootstrap";
import { getPresetById, registerCustomPreset, buildCustomPreset } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import type { StyleCategory, SmartMixKind, MixPreset } from "@/data/types";
import styles from "./page.module.scss";

// Empty-by-default mixes that activate a real ingredient the first time their
// slider rises above zero.
const AUTO_ACTIVATE: Partial<
  Record<keyof MacroRatios, { kind: SmartMixKind; label: string; empty: string; default: string }>
> = {
  alcohol: { kind: "alcohol", label: "Alcohol", empty: "alcohol-empty", default: "alcohol-vodka" },
  emulsifier: { kind: "emulsifier", label: "Emulsifier", empty: "emulsifier-empty", default: "emulsifier-lecithin" },
};

interface SelectorState {
  context: string;
  onAdd: (ingredient: Ingredient) => void;
}

function WorkspaceContent({ saved }: { saved: SavedFormula }) {
  const deps: WorkspaceDeps = useMemo(
    () => ({ getPreset: getPresetById, resolveIngredient: (id) => getIngredientById(id)?.macros }),
    [],
  );

  const initialWs = useMemo<LiveWorkspace>(() => {
    const recipe = saved.recipe ?? seedRecipe(saved.style as StyleCategory);
    (recipe.customPresets ?? []).forEach(registerCustomPreset);
    const yieldGrams = saved.state?.yieldGrams || totalGrams(recipe) || 1000;
    return { recipe, yieldGrams };
  }, [saved]);

  const baseRatios = useMemo(() => computeRatios(saved.state), [saved.state]);

  const [ws, setWs] = useState<LiveWorkspace>(initialWs);
  const [meta, setMeta] = useState({ name: saved.name, style: saved.style });
  const [notes, setNotes] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showConfig, setShowConfig] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editName, setEditName] = useState(false);
  const [selector, setSelector] = useState<SelectorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ratios = workspaceRatios(ws, deps);
  const conflict = workspaceConflict(ws, deps);
  const total = totalGrams(ws.recipe);

  // Theme: reflect stored/system choice, apply explicit override.
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const next =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", next);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing theme from localStorage/system on mount
    setTheme(next);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  // Auto-save committed workspace + meta.
  useEffect(() => {
    const derived = workspaceRatios(ws, deps);
    saveFormula({
      ...saved,
      name: meta.name,
      style: meta.style,
      updatedAt: Date.now(),
      state: stateFromRatios(derived, ws.yieldGrams),
      recipe: ws.recipe,
    });
  }, [ws, meta, saved, deps]);

  // --- Recipe (grams) edits ---
  const onMixGrams = useCallback((pid: string, g: number) => setWs((w) => setMixGrams(w, pid, g)), []);
  const onAdditionalGrams = useCallback((id: string, g: number) => setWs((w) => setAdditionalGrams(w, id, g)), []);
  const onYield = useCallback((g: number) => setWs((w) => setYield(w, g)), []);
  const onRemoveAdditional = useCallback((id: string) => setWs((w) => removeAdditionalIngredient(w, id)), []);

  const onMixNote = useCallback((pid: string, note: string) => {
    setWs((w) => ({
      ...w,
      recipe: { ...w.recipe, smartMixes: w.recipe.smartMixes.map((m) => (m.presetId === pid ? { ...m, note } : m)) },
    }));
  }, []);
  const onAdditionalNote = useCallback((id: string, note: string) => {
    setWs((w) => ({
      ...w,
      recipe: {
        ...w.recipe,
        additionalIngredients: w.recipe.additionalIngredients.map((a) =>
          a.ingredientId === id ? { ...a, note } : a,
        ),
      },
    }));
  }, []);

  const openSelector = useCallback((context: string, onAdd: (ing: Ingredient) => void) => {
    setSelector({ context, onAdd });
  }, []);
  const onAddIngredient = useCallback(() => {
    openSelector("general", (ing) => setWs((w) => addAdditionalIngredient(w, ing.id, ing.grams)));
  }, [openSelector]);

  // --- Macro (slider) edits: continuous, yield-conserving, with auto-activate ---
  const onMacroTarget = useCallback(
    (macro: keyof MacroRatios, target: number) => {
      setWs((w) => {
        let cur = w;
        const auto = AUTO_ACTIVATE[macro];
        if (auto && target > 0) {
          const mixes = cur.recipe.smartMixes;
          const next = mixes.some((m) => m.kind === auto.kind)
            ? mixes.map((m) => (m.kind === auto.kind && m.presetId === auto.empty ? { ...m, presetId: auto.default } : m))
            : [...mixes, { kind: auto.kind, label: auto.label, presetId: auto.default, grams: 0 }];
          cur = { ...cur, recipe: { ...cur.recipe, smartMixes: next } };
        }
        return setMacroTarget(cur, macro, target, deps);
      });
    },
    [deps],
  );
  const onRebalance = useCallback(() => setWs((w) => rebalanceWorkspace(w, deps)), [deps]);

  // --- Config (base systems) — re-solve at fixed yield on any change ---
  const resolveSolve = useCallback(
    (mixes: LiveWorkspace["recipe"]["smartMixes"], w: LiveWorkspace) => {
      const updatedRecipe = { ...w.recipe, smartMixes: mixes };
      const targets = computeRatiosFromRecipe(updatedRecipe, getPresetById, deps.resolveIngredient);
      return solveRecipe(targets, w.yieldGrams, w.recipe.additionalIngredients, mixes, getPresetById, deps.resolveIngredient);
    },
    [deps],
  );
  const handlePresetChange = useCallback((kind: SmartMixKind, presetId: string) => {
    setWs((w) => {
      const mixes = w.recipe.smartMixes.map((m) => (m.kind === kind ? { ...m, presetId } : m));
      return { ...w, recipe: { ...w.recipe, smartMixes: resolveSolve(mixes, w) } };
    });
  }, [resolveSolve]);
  const handleCustomPreset = useCallback((kind: SmartMixKind, preset: MixPreset) => {
    registerCustomPreset(preset);
    setWs((w) => {
      const customPresets = [...(w.recipe.customPresets ?? []).filter((p) => p.kind !== kind), preset];
      const mixes = w.recipe.smartMixes.map((m) => (m.kind === kind ? { ...m, presetId: preset.id } : m));
      return { ...w, recipe: { ...w.recipe, smartMixes: resolveSolve(mixes, w), customPresets } };
    });
  }, [resolveSolve]);
  const handleAddMilkIngredient = useCallback((ing: Ingredient) => {
    const preset = buildCustomPreset("milk", ing.name, [{ ingredientId: ing.id, proportion: 1 }]);
    registerCustomPreset(preset);
    setWs((w) => {
      const already = w.recipe.smartMixes.some(
        (m) => m.kind === "milk" && getPresetById(m.presetId)?.ingredients[0]?.ingredientId === ing.id,
      );
      if (already) return w;
      const customPresets = [...(w.recipe.customPresets ?? []), preset];
      const mixes = [...w.recipe.smartMixes, { kind: "milk" as SmartMixKind, label: ing.name, presetId: preset.id, grams: 0 }];
      return { ...w, recipe: { ...w.recipe, smartMixes: resolveSolve(mixes, w), customPresets } };
    });
  }, [resolveSolve]);
  const handleRemoveMilkIngredient = useCallback((presetId: string) => {
    setWs((w) => {
      const mixes = w.recipe.smartMixes.filter((m) => !(m.kind === "milk" && m.presetId === presetId));
      return { ...w, recipe: { ...w.recipe, smartMixes: resolveSolve(mixes, w) } };
    });
  }, [resolveSolve]);

  // --- Reset / save ---
  const onReset = useCallback(() => {
    setWs(initialWs);
    setMeta({ name: saved.name, style: saved.style });
  }, [initialWs, saved]);
  const onSave = useCallback(() => {
    saveFormula({
      ...saved,
      name: meta.name,
      style: meta.style,
      updatedAt: Date.now(),
      state: stateFromRatios(workspaceRatios(ws, deps), ws.yieldGrams),
      recipe: ws.recipe,
    });
    setToast("Saved to your vault");
  }, [saved, meta, ws, deps]);

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.menuWrap}>
          <button className={styles.iconBtn} type="button" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
            <Menu size={20} strokeWidth={2} />
          </button>
          {menuOpen && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
              <div className={styles.menu}>
                <Link href="/" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  <Home size={16} strokeWidth={2} /> Home
                </Link>
                <button className={styles.menuItem} type="button" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              </div>
            </>
          )}
        </div>
        <span className={styles.brand}>Ice Cream Lab</span>
        <div className={styles.actions}>
          <Pill tone="ghost" size="sm" onClick={() => setShowConfig(true)}>
            <Settings size={15} strokeWidth={2} /> Config
          </Pill>
          <Pill tone="ghost" size="sm" onClick={onReset}>
            <RotateCcw size={15} strokeWidth={2} /> Reset
          </Pill>
          <Pill tone="ink" size="sm" onClick={onSave}>
            Save batch
          </Pill>
        </div>
      </header>

      {showConfig ? (
        <div className={styles.content}>
          <button className={styles.configBack} type="button" onClick={() => setShowConfig(false)}>
            ← Back to workspace
          </button>
          <ConfigPanel
            formulaName={meta.name}
            formulaStyle={meta.style}
            recipe={ws.recipe}
            onNameChange={(name) => setMeta((m) => ({ ...m, name }))}
            onStyleChange={(style) => setMeta((m) => ({ ...m, style }))}
            onPresetChange={handlePresetChange}
            onCustomPreset={handleCustomPreset}
            onAddMilkIngredient={handleAddMilkIngredient}
            onRemoveMilkIngredient={handleRemoveMilkIngredient}
            onOpenIngredientSelector={openSelector}
          />
        </div>
      ) : (
        <div className={styles.content}>
          {editName ? (
            <input
              autoFocus
              className={styles.nameInput}
              value={meta.name}
              onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              onBlur={() => setEditName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditName(false)}
            />
          ) : (
            <h1 className={styles.name} onClick={() => setEditName(true)} title="Click to rename">
              {meta.name}
            </h1>
          )}

          <div className={styles.work}>
            <RecipePanel
              recipe={ws.recipe}
              yieldGrams={ws.yieldGrams}
              total={total}
              notes={notes}
              onMixGrams={onMixGrams}
              onAdditionalGrams={onAdditionalGrams}
              onMixNote={onMixNote}
              onAdditionalNote={onAdditionalNote}
              onRemoveAdditional={onRemoveAdditional}
              onAddIngredient={onAddIngredient}
              onYield={onYield}
              onNotes={setNotes}
            />
            <MacrosPanel
              ratios={ratios}
              baseRatios={baseRatios}
              style={meta.style}
              conflict={conflict}
              onMacroTarget={onMacroTarget}
              onRebalance={onRebalance}
            />
          </div>
        </div>
      )}

      {selector && (
        <IngredientSelector
          context={selector.context}
          onAdd={selector.onAdd}
          onDismiss={() => setSelector(null)}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading persisted formula on mount
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
      <WorkspaceContent saved={saved} />
    </main>
  );
}
