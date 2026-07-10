"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, RotateCcw, X } from "lucide-react";
import { loadFormula, saveFormula, type SavedFormula } from "@/lib/persistence";
import { RecipePanel } from "@/components/recipe/RecipePanel";
import { MacrosPanel } from "@/components/formula/MacrosPanel";
import { IngredientSelector } from "@/components/shared/IngredientSelector";
import { ConfigPanel } from "@/components/formula/ConfigPanel";
import { Header } from "@/components/shared/Header";
import { Pill } from "@/components/shared/Pill";
import { Toast } from "@/components/shared/Toast";
import { seedRecipe } from "@/lib/recipe-seeder";
import { computeRatiosFromRecipe, solveRecipe } from "@/lib/recipe-solver";
import { derive } from "@/lib/derive";
import {
  totalGrams,
  workspaceRatios,
  workspaceConflict,
  setMixGrams,
  setAdditionalGrams,
  setMacroTarget,
  setTraceMacro,
  setYield,
  addAdditionalIngredient,
  removeAdditionalIngredient,
  rebalanceWorkspace,
  type LiveWorkspace,
  type WorkspaceDeps,
} from "@/lib/live-workspace";
import { type MacroRatios, type Ingredient } from "@/lib/formula-engine";
import { stateFromRatios } from "@/lib/bootstrap";
import { getPresetById, registerCustomPreset, buildCustomPreset } from "@/data/mix-presets";
import { getIngredientById } from "@/data/ingredients";
import { DEFAULT_EQUIPMENT, type StyleCategory, type SmartMixKind, type MixPreset, type EquipmentProfile } from "@/data/types";
import styles from "./page.module.scss";

// Empty-by-default mixes that activate a real ingredient the first time their
// slider rises above zero.
// Trace additives placed directly from a single source, not via the solve.
const TRACE_MACROS = new Set<keyof MacroRatios>(["stabilizer", "emulsifier"]);

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
    // Design B (D2): archetypes carry explicit recipes, so the recipe loads as
    // authored — no on-load trace-dosing. (The old setTraceMacro(...) pass here is
    // what drove custard defaults to a 1000 g-egg-yolk mix; see #52.)
    return { recipe, yieldGrams };
  }, [saved, deps]);

  const [ws, setWs] = useState<LiveWorkspace>(initialWs);
  const [meta, setMeta] = useState<{ name: string; style: string; equipment: EquipmentProfile }>({
    name: saved.name,
    style: saved.style,
    equipment: saved.equipment ?? DEFAULT_EQUIPMENT,
  });
  const [notes, setNotes] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [editName, setEditName] = useState(false);
  const [selector, setSelector] = useState<SelectorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ratios = workspaceRatios(ws, deps);
  const derived = derive(ws.recipe);
  const conflict = workspaceConflict(ws, deps);
  const total = totalGrams(ws.recipe);

  // Single source of truth for writing the workspace to storage.
  const persist = useCallback(
    (w: LiveWorkspace, name: string, style: string, equipment: EquipmentProfile) => {
      saveFormula({
        ...saved,
        name,
        style,
        equipment,
        updatedAt: Date.now(),
        state: stateFromRatios(workspaceRatios(w, deps), w.yieldGrams),
        recipe: w.recipe,
      });
    },
    [saved, deps],
  );

  // Latest workspace/meta, for the unmount flush below (kept out of effect deps).
  const latest = useRef({ ws, meta });
  latest.current = { ws, meta };

  // Auto-save committed workspace + meta — debounced. `ws` changes on every
  // slider drag frame; writing localStorage synchronously each frame stalls the
  // main thread badly on Safari (which flushes localStorage to disk far more
  // aggressively than Chrome), making drags lag and the controlled thumb snap
  // back. The debounce keeps a live drag off disk entirely — the settled state
  // persists ~400ms after the last change. The cleanup cancels the pending write
  // on each new change, so only the final frame is written.
  useEffect(() => {
    const handle = setTimeout(() => persist(ws, meta.name, meta.style, meta.equipment), 400);
    return () => clearTimeout(handle);
  }, [ws, meta, persist]);

  // Flush the final state on unmount so navigating away inside the debounce
  // window can't drop the last edit.
  useEffect(() => {
    return () => {
      const { ws, meta } = latest.current;
      persist(ws, meta.name, meta.style, meta.equipment);
    };
  }, [persist]);

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
  const onQuickAdd = useCallback((id: string) => setWs((w) => addAdditionalIngredient(w, id, 40)), []);

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
        // Trace additives (stabilizer, emulsifier) come from a single source, so
        // dose that source directly instead of routing through the whole-recipe
        // solve (which washes trace targets out and can't place them).
        return TRACE_MACROS.has(macro)
          ? setTraceMacro(cur, macro, target, deps)
          : setMacroTarget(cur, macro, target, deps);
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
    setMeta({ name: saved.name, style: saved.style, equipment: saved.equipment ?? DEFAULT_EQUIPMENT });
  }, [initialWs, saved]);
  const onSave = useCallback(() => {
    persist(ws, meta.name, meta.style, meta.equipment);
    setToast("Saved to your batches");
  }, [persist, ws, meta]);

  return (
    <>
      <Header>
        <Pill tone="ghost" size="sm" onClick={() => setShowConfig(true)}>
          <Settings size={15} strokeWidth={2} /> Config
        </Pill>
        <Pill tone="ghost" size="sm" onClick={onReset}>
          <RotateCcw size={15} strokeWidth={2} /> Reset
        </Pill>
        <Pill tone="ink" size="sm" onClick={onSave}>
          Save batch
        </Pill>
      </Header>

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
            {/* Macros first in the DOM so it stacks on top on narrow screens
                (macros-first matches the product thesis); on desktop the .work
                grid uses `order` to restore recipe-left / macros-right. */}
            <MacrosPanel
              ratios={ratios}
              derived={derived}
              style={meta.style}
              equipment={meta.equipment}
              conflict={conflict}
              onMacroTarget={onMacroTarget}
              onRebalance={onRebalance}
            />
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
              onQuickAdd={onQuickAdd}
              onYield={onYield}
              onNotes={setNotes}
            />
          </div>
        </div>

      {showConfig && (
        <div className={styles.configModal} role="dialog" aria-modal="true">
          <div className={styles.configScrim} onClick={() => setShowConfig(false)} />
          <div className={styles.configSheet}>
            <div className={styles.configHead}>
              <span className={styles.configTitle}>Config</span>
              <button
                className={styles.iconBtn}
                type="button"
                aria-label="Close config"
                onClick={() => setShowConfig(false)}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.configBody}>
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
