import type { FormulaState } from "./formula-engine";
import type { Recipe, EquipmentProfile } from "@/data/types";

export interface SavedFormula {
  id: string;
  name: string;
  style: string;
  equipment?: EquipmentProfile; // freezing/serving machine (D8); absent → home-dasher
  batchNo?: number; // permanent, never-reused batch number ("№ 007"); assigned at creation
  createdAt: number;
  updatedAt: number;
  state: FormulaState;
  recipe: Recipe;
}

const PREFIX = "icf:formula:";
const INDEX_KEY = "icf:index";
const SEQ_KEY = "icf:batchseq"; // monotonic batch-number counter (only ever increases)

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readIndex(ls: Storage): string[] {
  try {
    const raw = ls.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(ls: Storage, ids: string[]): void {
  ls.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function saveFormula(formula: SavedFormula): void {
  const ls = storage();
  if (!ls) return;
  ls.setItem(PREFIX + formula.id, JSON.stringify(formula));
  const index = readIndex(ls);
  if (!index.includes(formula.id)) {
    writeIndex(ls, [...index, formula.id]);
  }
}

export function loadFormula(id: string): SavedFormula | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as SavedFormula;
  } catch {
    return null;
  }
}

export function listFormulas(): SavedFormula[] {
  const ls = storage();
  if (!ls) return [];
  const ids = readIndex(ls);
  return ids
    .map((id) => loadFormula(id))
    .filter((f): f is SavedFormula => f !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteFormula(id: string): void {
  const ls = storage();
  if (!ls) return;
  ls.removeItem(PREFIX + id);
  const index = readIndex(ls);
  writeIndex(ls, index.filter((i) => i !== id));
}

// Allocate a permanent batch number. Monotonic and never reused, even after
// deletes: takes the max of the stored counter and any existing batchNo, +1.
export function assignBatchNo(): number {
  const ls = storage();
  if (!ls) return 0;
  const stored = parseInt(ls.getItem(SEQ_KEY) ?? "0", 10) || 0;
  const maxExisting = listFormulas().reduce((m, f) => Math.max(m, f.batchNo ?? 0), 0);
  const next = Math.max(stored, maxExisting) + 1;
  ls.setItem(SEQ_KEY, String(next));
  return next;
}

// One-time migration: give any pre-existing formula a stable batch number, in
// creation order, so older batches keep low numbers.
export function backfillBatchNumbers(): void {
  const missing = listFormulas()
    .filter((f) => f.batchNo == null)
    .sort((a, b) => a.createdAt - b.createdAt);
  for (const f of missing) {
    saveFormula({ ...f, batchNo: assignBatchNo() });
  }
}
