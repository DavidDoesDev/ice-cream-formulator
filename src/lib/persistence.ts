import type { FormulaState } from "./formula-engine";

export interface SavedFormula {
  id: string;
  name: string;
  style: string;
  createdAt: number;
  updatedAt: number;
  state: FormulaState;
}

const PREFIX = "icf:formula:";
const INDEX_KEY = "icf:index";

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
