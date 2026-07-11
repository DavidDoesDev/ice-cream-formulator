import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { saveFormula, deleteFormula, listFormulas, assignBatchNo, backfillBatchNumbers, type SavedFormula } from "./persistence";

// Minimal in-memory localStorage so the persistence layer runs under the node env.
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => { (globalThis as unknown as { window: unknown }).window = { localStorage: new MemStorage() }; });
afterEach(() => { delete (globalThis as unknown as { window?: unknown }).window; });

const mk = (id: string, createdAt: number, batchNo?: number): SavedFormula => ({
  id, name: id, style: "philadelphia", batchNo, createdAt, updatedAt: createdAt,
  state: { ingredients: [], yieldGrams: 1000, conflict: false },
  recipe: { smartMixes: [], additionalIngredients: [] },
});

describe("batch numbers", () => {
  it("hands out increasing numbers", () => {
    expect(assignBatchNo()).toBe(1);
    expect(assignBatchNo()).toBe(2);
    expect(assignBatchNo()).toBe(3);
  });

  it("never reuses a number after a delete", () => {
    const a = assignBatchNo(); saveFormula(mk("a", 1, a)); // 1
    const b = assignBatchNo(); saveFormula(mk("b", 2, b)); // 2
    deleteFormula("b");
    const c = assignBatchNo(); // must skip 2, not reissue it
    expect(c).toBeGreaterThan(b);
    expect(c).toBe(3);
  });

  it("backfills existing formulas in creation order with unique numbers", () => {
    saveFormula(mk("older", 100)); // no batchNo
    saveFormula(mk("newer", 200)); // no batchNo
    backfillBatchNumbers();
    const byId = Object.fromEntries(listFormulas().map((f) => [f.id, f.batchNo]));
    expect(byId.older).toBeLessThan(byId.newer!); // earlier createdAt → lower number
    const nums = listFormulas().map((f) => f.batchNo);
    expect(nums.every((n) => n != null)).toBe(true);
    expect(new Set(nums).size).toBe(nums.length); // all unique
  });
});
