/**
 * Validación y normalización defensiva de datos.
 * Se usa al cargar desde localStorage, al restaurar snapshots y al importar Excel:
 * cualquier dato externo pasa por aquí antes de entrar al estado de la app.
 */
import {
  CURRENCIES,
  DEBT_TYPES,
  EXPENSE_CATEGORIES,
  GOAL_COLORS,
  GOAL_ICONS,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  PRIORITIES,
  RECEIVABLE_TYPES,
  RECEPTION_METHODS,
} from "@/lib/constants/catalog";
import type { AppData, Debt, Expense, Goal, Income, Receivable, Settings } from "@/lib/types";
import { isValidISO, round2, todayISO, uid } from "@/lib/format";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export const str = (v: unknown, fallback = "") => (typeof v === "string" ? v.trim() : v == null ? fallback : String(v).trim());
export const numv = (v: unknown, fallback = 0) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d,.-]/g, "");
    // Admite "1.234,56" y "1,234.56"
    const normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};
export const boolv = (v: unknown) => v === true || (typeof v === "string" && /^(s[ií]|true|1|x|yes)$/i.test(v.trim())) || v === 1;
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => {
  const s = str(v);
  return (options.find((o) => o.toLowerCase() === s.toLowerCase()) ?? fallback) as T;
};
const date = (v: unknown, fallback = todayISO()) => (isValidISO(v) ? v : fallback);
const id = (v: unknown, prefix: string) => str(v) || uid(prefix);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const INCOME_VALUES = INCOME_CATEGORIES.map((c) => c.value);
const EXPENSE_VALUES = EXPENSE_CATEGORIES.map((c) => c.value);
const PAYMENT_VALUES = PAYMENT_METHODS.map((m) => m.value);
const PRIORITY_VALUES = PRIORITIES.map((p) => p.value);

export function sanitizeIncome(o: Obj): Income | null {
  const amount = round2(Math.abs(numv(o.amount)));
  if (!(amount > 0)) return null;
  return {
    id: id(o.id, "inc"),
    kind: "income",
    date: date(o.date),
    category: oneOf(o.category, INCOME_VALUES, "Otros ingresos"),
    source: str(o.source),
    amount,
    method: oneOf(o.method, RECEPTION_METHODS, "Transferencia"),
    recurring: boolv(o.recurring),
    notes: str(o.notes),
  };
}

export function sanitizeExpense(o: Obj): Expense | null {
  const amount = round2(Math.abs(numv(o.amount)));
  if (!(amount > 0)) return null;
  const macro = oneOf(o.macro, EXPENSE_VALUES, "Otros");
  return {
    id: id(o.id, "exp"),
    kind: "expense",
    date: date(o.date),
    macro,
    micro: str(o.micro) || EXPENSE_CATEGORIES.find((c) => c.value === macro)!.micros[0],
    merchant: str(o.merchant),
    amount,
    method: oneOf(o.method, PAYMENT_VALUES, "Tarjeta de débito"),
    priority: oneOf(o.priority, PRIORITY_VALUES, "Necesidad"),
    recurring: boolv(o.recurring),
    notes: str(o.notes),
  };
}

export function sanitizeDebt(o: Obj): Debt | null {
  const name = str(o.name);
  const principal = round2(Math.abs(numv(o.principal)));
  if (!name || !(principal > 0)) return null;
  const start = date(o.startDate);
  return {
    id: id(o.id, "debt"),
    name,
    lender: str(o.lender),
    type: oneOf(o.type, DEBT_TYPES, "Otro"),
    principal,
    balance: round2(Math.min(principal, Math.max(0, numv(o.balance, principal)))),
    annualRate: Math.max(0, numv(o.annualRate)),
    monthlyPayment: round2(Math.max(0, numv(o.monthlyPayment))),
    startDate: start,
    dueDate: date(o.dueDate, start),
    paymentDay: Math.min(31, Math.max(1, Math.round(numv(o.paymentDay, 1)))),
    notes: str(o.notes),
    payments: arr(o.payments)
      .filter(isObj)
      .map((p) => ({
        id: id(p.id, "dp"),
        date: date(p.date),
        amount: round2(numv(p.amount)),
        interest: round2(numv(p.interest)),
        principal: round2(numv(p.principal)),
      }))
      .filter((p) => p.amount > 0),
  };
}

export function sanitizeReceivable(o: Obj): Receivable | null {
  const debtor = str(o.debtor);
  const amount = round2(Math.abs(numv(o.amount)));
  if (!debtor || !(amount > 0)) return null;
  const issue = date(o.issueDate);
  return {
    id: id(o.id, "rcv"),
    debtor,
    concept: str(o.concept),
    type: oneOf(o.type, RECEIVABLE_TYPES, "Otro"),
    amount,
    issueDate: issue,
    dueDate: date(o.dueDate, issue),
    notes: str(o.notes),
    payments: arr(o.payments)
      .filter(isObj)
      .map((p) => ({ id: id(p.id, "rp"), date: date(p.date), amount: round2(numv(p.amount)) }))
      .filter((p) => p.amount > 0),
  };
}

export function sanitizeGoal(o: Obj): Goal | null {
  const name = str(o.name);
  const target = round2(Math.abs(numv(o.target)));
  if (!name || !(target > 0)) return null;
  return {
    id: id(o.id, "goal"),
    name,
    kind: oneOf(o.kind, ["Ahorro", "Inversión"] as const, "Ahorro"),
    target,
    initial: round2(Math.max(0, numv(o.initial))),
    deadline: date(o.deadline),
    monthlyContribution: round2(Math.max(0, numv(o.monthlyContribution))),
    icon: oneOf(o.icon, Object.keys(GOAL_ICONS) as Goal["icon"][], "piggy"),
    color: oneOf(o.color, Object.keys(GOAL_COLORS) as Goal["color"][], "indigo"),
    createdAt: date(o.createdAt),
    notes: str(o.notes),
    contributions: arr(o.contributions)
      .filter(isObj)
      .map((c) => ({ id: id(c.id, "gc"), date: date(c.date), amount: round2(numv(c.amount)) }))
      .filter((c) => c.amount !== 0),
  };
}

export function sanitizeSettings(o: unknown): Settings {
  const s = isObj(o) ? o : {};
  return {
    userName: str(s.userName),
    currency: oneOf(s.currency, CURRENCIES.map((c) => c.code), "USD"),
    openingBalance: round2(numv(s.openingBalance)),
    monthlyBudget: round2(Math.max(0, numv(s.monthlyBudget))),
    savingsTarget: Math.min(100, Math.max(0, numv(s.savingsTarget, 20))),
  };
}

const compact = <T,>(xs: (T | null)[]) => xs.filter((x): x is T => x !== null);

/** Normaliza un objeto arbitrario en `AppData`. Lanza si la forma raíz es inválida. */
export function sanitizeAppData(raw: unknown): AppData {
  if (!isObj(raw)) throw new Error("Estructura de datos inválida");
  const txs = arr(raw.transactions).filter(isObj);
  return {
    transactions: compact(txs.map((t) => (t.kind === "income" ? sanitizeIncome(t) : sanitizeExpense(t)))).sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    ),
    debts: compact(arr(raw.debts).filter(isObj).map(sanitizeDebt)),
    receivables: compact(arr(raw.receivables).filter(isObj).map(sanitizeReceivable)),
    goals: compact(arr(raw.goals).filter(isObj).map(sanitizeGoal)),
    settings: sanitizeSettings(raw.settings),
  };
}
