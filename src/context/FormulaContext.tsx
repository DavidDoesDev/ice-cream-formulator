"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFormula, type UseFormulaReturn } from "@/hooks/useFormula";
import { type FormulaState } from "@/lib/formula-engine";

const FormulaContext = createContext<UseFormulaReturn | null>(null);

interface FormulaProviderProps {
  initial: FormulaState;
  children: ReactNode;
}

export function FormulaProvider({ initial, children }: FormulaProviderProps) {
  const formula = useFormula(initial);
  return (
    <FormulaContext.Provider value={formula}>
      {children}
    </FormulaContext.Provider>
  );
}

export function useFormulaContext(): UseFormulaReturn {
  const ctx = useContext(FormulaContext);
  if (!ctx) throw new Error("useFormulaContext must be used within FormulaProvider");
  return ctx;
}
