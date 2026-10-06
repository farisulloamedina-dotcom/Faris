"use client";

/**
 * Orquestador de formularios globales: cualquier vista (o el botón "Nuevo"
 * de la barra superior) puede abrir los formularios de alta/edición sin
 * duplicar modales. También centraliza la eliminación con "Deshacer".
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Debt, Goal, Receivable, Transaction } from "@/lib/types";
import { useStore } from "@/lib/store/StoreProvider";
import type { DataAction } from "@/lib/store/reducer";
import { useToast } from "@/components/ui/Toaster";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { CollectDialog, DebtForm, DebtPaymentDialog, ReceivableForm } from "@/components/liabilities/LiabilityForms";
import { ContributeDialog, GoalForm } from "@/components/goals/GoalForms";

type Dialog =
  | { type: "transaction"; kind: "income" | "expense"; editing?: Transaction | null }
  | { type: "debt"; editing?: Debt | null }
  | { type: "debt-payment"; debt: Debt }
  | { type: "receivable"; editing?: Receivable | null }
  | { type: "collect"; receivable: Receivable }
  | { type: "goal"; editing?: Goal | null }
  | { type: "contribute"; goal: Goal };

interface UIApi {
  openTransaction: (kind: "income" | "expense", editing?: Transaction | null) => void;
  openDebt: (editing?: Debt | null) => void;
  openDebtPayment: (debt: Debt) => void;
  openReceivable: (editing?: Receivable | null) => void;
  openCollect: (r: Receivable) => void;
  openGoal: (editing?: Goal | null) => void;
  openContribute: (g: Goal) => void;
  /** Ejecuta una acción destructiva y ofrece "Deshacer" en un toast. */
  removeWithUndo: (action: DataAction, title: string) => void;
}

const UIContext = createContext<UIApi | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  // `dialog` se conserva al cerrar para que la animación de salida tenga contenido;
  // `seq` remonta el formulario en cada apertura para empezar con estado limpio.
  const [state, setState] = useState<{ dialog: Dialog | null; open: boolean; seq: number }>({ dialog: null, open: false, seq: 0 });
  const { dispatch, undo } = useStore();
  const toast = useToast();
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const setDialog = useCallback((dialog: Dialog) => setState((s) => ({ dialog, open: true, seq: s.seq + 1 })), []);

  const removeWithUndo = useCallback(
    (action: DataAction, title: string) => {
      dispatch(action);
      toast({ tone: "info", title, description: "Puedes revertirlo (también con Ctrl+Z).", action: { label: "Deshacer", onClick: undo } });
    },
    [dispatch, toast, undo],
  );

  const api = useMemo<UIApi>(
    () => ({
      openTransaction: (kind, editing) => setDialog({ type: "transaction", kind, editing }),
      openDebt: (editing) => setDialog({ type: "debt", editing }),
      openDebtPayment: (debt) => setDialog({ type: "debt-payment", debt }),
      openReceivable: (editing) => setDialog({ type: "receivable", editing }),
      openCollect: (receivable) => setDialog({ type: "collect", receivable }),
      openGoal: (editing) => setDialog({ type: "goal", editing }),
      openContribute: (goal) => setDialog({ type: "contribute", goal }),
      removeWithUndo,
    }),
    [removeWithUndo, setDialog],
  );

  const { dialog, open, seq } = state;
  const is = (t: Dialog["type"]) => open && dialog?.type === t;

  return (
    <UIContext.Provider value={api}>
      {children}
      <TransactionForm key={`t${seq}`} open={is("transaction")} onClose={close} kind={dialog?.type === "transaction" ? dialog.kind : "expense"} editing={dialog?.type === "transaction" ? dialog.editing : null} />
      <DebtForm key={`d${seq}`} open={is("debt")} onClose={close} editing={dialog?.type === "debt" ? dialog.editing : null} />
      <DebtPaymentDialog key={`dp${seq}`} open={is("debt-payment")} onClose={close} debt={dialog?.type === "debt-payment" ? dialog.debt : null} />
      <ReceivableForm key={`r${seq}`} open={is("receivable")} onClose={close} editing={dialog?.type === "receivable" ? dialog.editing : null} />
      <CollectDialog key={`c${seq}`} open={is("collect")} onClose={close} receivable={dialog?.type === "collect" ? dialog.receivable : null} />
      <GoalForm key={`g${seq}`} open={is("goal")} onClose={close} editing={dialog?.type === "goal" ? dialog.editing : null} />
      <ContributeDialog key={`gc${seq}`} open={is("contribute")} onClose={close} goal={dialog?.type === "contribute" ? dialog.goal : null} />
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI debe usarse dentro de <UIProvider>");
  return ctx;
}
