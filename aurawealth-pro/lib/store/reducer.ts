/**
 * Reducer puro del estado de la aplicación.
 * Cada acción produce un nuevo `AppData` inmutable; el proveedor se encarga
 * del historial (deshacer), la bitácora de cambios y la persistencia.
 */
import type {
  AppData,
  Debt,
  DebtPayment,
  Goal,
  GoalContribution,
  Receivable,
  ReceivablePayment,
  Settings,
  Transaction,
} from "@/lib/types";
import { round2 } from "@/lib/format";

export type DataAction =
  | { type: "transaction/add"; payload: Transaction }
  | { type: "transaction/update"; payload: Transaction }
  | { type: "transaction/delete"; ids: string[] }
  | { type: "debt/add"; payload: Debt }
  | { type: "debt/update"; payload: Debt }
  | { type: "debt/delete"; id: string }
  | { type: "debt/pay"; debtId: string; payment: DebtPayment }
  | { type: "debt/unpay"; debtId: string; paymentId: string }
  | { type: "receivable/add"; payload: Receivable }
  | { type: "receivable/update"; payload: Receivable }
  | { type: "receivable/delete"; id: string }
  | { type: "receivable/collect"; receivableId: string; payment: ReceivablePayment }
  | { type: "receivable/uncollect"; receivableId: string; paymentId: string }
  | { type: "goal/add"; payload: Goal }
  | { type: "goal/update"; payload: Goal }
  | { type: "goal/delete"; id: string }
  | { type: "goal/contribute"; goalId: string; contribution: GoalContribution }
  | { type: "goal/uncontribute"; goalId: string; contributionId: string }
  | { type: "settings/update"; payload: Partial<Settings> }
  | { type: "data/replace"; payload: AppData }
  | { type: "data/merge"; payload: AppData }
  /** Varias acciones atómicas (un solo paso de Deshacer). */
  | { type: "batch"; label: string; sheet: string; actions: DataAction[] };

const byDateDesc = (a: Transaction, b: Transaction) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

function upsert<T extends { id: string }>(list: T[], incoming: T[]) {
  const map = new Map(list.map((x) => [x.id, x]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

export function dataReducer(state: AppData, action: DataAction): AppData {
  switch (action.type) {
    case "transaction/add":
      return { ...state, transactions: [action.payload, ...state.transactions].sort(byDateDesc) };
    case "transaction/update":
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.payload.id ? action.payload : t)).sort(byDateDesc),
      };
    case "transaction/delete": {
      const ids = new Set(action.ids);
      return { ...state, transactions: state.transactions.filter((t) => !ids.has(t.id)) };
    }

    case "debt/add":
      return { ...state, debts: [...state.debts, action.payload] };
    case "debt/update":
      return { ...state, debts: state.debts.map((d) => (d.id === action.payload.id ? action.payload : d)) };
    case "debt/delete":
      return { ...state, debts: state.debts.filter((d) => d.id !== action.id) };
    case "debt/pay":
      return {
        ...state,
        debts: state.debts.map((d) =>
          d.id === action.debtId
            ? { ...d, balance: round2(Math.max(0, d.balance - action.payment.principal)), payments: [...d.payments, action.payment] }
            : d,
        ),
      };
    case "debt/unpay":
      return {
        ...state,
        debts: state.debts.map((d) => {
          if (d.id !== action.debtId) return d;
          const p = d.payments.find((x) => x.id === action.paymentId);
          if (!p) return d;
          return {
            ...d,
            balance: round2(Math.min(d.principal, d.balance + p.principal)),
            payments: d.payments.filter((x) => x.id !== action.paymentId),
          };
        }),
      };

    case "receivable/add":
      return { ...state, receivables: [...state.receivables, action.payload] };
    case "receivable/update":
      return { ...state, receivables: state.receivables.map((r) => (r.id === action.payload.id ? action.payload : r)) };
    case "receivable/delete":
      return { ...state, receivables: state.receivables.filter((r) => r.id !== action.id) };
    case "receivable/collect":
      return {
        ...state,
        receivables: state.receivables.map((r) =>
          r.id === action.receivableId ? { ...r, payments: [...r.payments, action.payment] } : r,
        ),
      };
    case "receivable/uncollect":
      return {
        ...state,
        receivables: state.receivables.map((r) =>
          r.id === action.receivableId ? { ...r, payments: r.payments.filter((p) => p.id !== action.paymentId) } : r,
        ),
      };

    case "goal/add":
      return { ...state, goals: [...state.goals, action.payload] };
    case "goal/update":
      return { ...state, goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)) };
    case "goal/delete":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "goal/contribute":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, contributions: [...g.contributions, action.contribution] } : g,
        ),
      };
    case "goal/uncontribute":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, contributions: g.contributions.filter((c) => c.id !== action.contributionId) } : g,
        ),
      };

    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "data/replace":
      return action.payload;
    case "data/merge":
      return {
        transactions: upsert(state.transactions, action.payload.transactions).sort(byDateDesc),
        debts: upsert(state.debts, action.payload.debts),
        receivables: upsert(state.receivables, action.payload.receivables),
        goals: upsert(state.goals, action.payload.goals),
        settings: state.settings,
      };
    case "batch":
      return action.actions.reduce(dataReducer, state);
    default:
      return state;
  }
}

/** Etiqueta legible para la bitácora de sincronización. */
export function describeAction(a: DataAction): { label: string; sheet: string } {
  switch (a.type) {
    case "transaction/add":
      return { label: a.payload.kind === "income" ? "Ingreso registrado" : "Gasto registrado", sheet: a.payload.kind === "income" ? "Libro de Ingresos" : "Libro de Gastos" };
    case "transaction/update":
      return { label: a.payload.kind === "income" ? "Ingreso editado" : "Gasto editado", sheet: a.payload.kind === "income" ? "Libro de Ingresos" : "Libro de Gastos" };
    case "transaction/delete":
      return { label: `${a.ids.length} movimiento(s) eliminado(s)`, sheet: "Libros de Ingresos/Gastos" };
    case "debt/add":
      return { label: "Deuda creada", sheet: "Control de Deudas" };
    case "debt/update":
      return { label: "Deuda editada", sheet: "Control de Deudas" };
    case "debt/delete":
      return { label: "Deuda eliminada", sheet: "Control de Deudas" };
    case "debt/pay":
      return { label: "Pago de deuda registrado", sheet: "Control de Deudas" };
    case "debt/unpay":
      return { label: "Pago de deuda anulado", sheet: "Control de Deudas" };
    case "receivable/add":
      return { label: "Cuenta por cobrar creada", sheet: "Cuentas por Cobrar" };
    case "receivable/update":
      return { label: "Cuenta por cobrar editada", sheet: "Cuentas por Cobrar" };
    case "receivable/delete":
      return { label: "Cuenta por cobrar eliminada", sheet: "Cuentas por Cobrar" };
    case "receivable/collect":
      return { label: "Cobro registrado", sheet: "Cuentas por Cobrar" };
    case "receivable/uncollect":
      return { label: "Cobro anulado", sheet: "Cuentas por Cobrar" };
    case "goal/add":
      return { label: "Meta creada", sheet: "Metas de Ahorro" };
    case "goal/update":
      return { label: "Meta editada", sheet: "Metas de Ahorro" };
    case "goal/delete":
      return { label: "Meta eliminada", sheet: "Metas de Ahorro" };
    case "goal/contribute":
      return { label: "Aporte a meta", sheet: "Metas de Ahorro" };
    case "goal/uncontribute":
      return { label: "Aporte anulado", sheet: "Metas de Ahorro" };
    case "settings/update":
      return { label: "Preferencias actualizadas", sheet: "Configuración" };
    case "data/replace":
      return { label: "Base de datos reemplazada", sheet: "Todas" };
    case "data/merge":
      return { label: "Datos combinados (importación)", sheet: "Todas" };
    case "batch":
      return { label: a.label, sheet: a.sheet };
  }
}
