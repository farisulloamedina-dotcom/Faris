/**
 * Modelo de libro Excel en memoria.
 *
 * `buildWorkbookModel(data)` transforma el estado de la app en una descripción
 * declarativa de hojas, columnas, filas y totales. Este modelo es la única
 * fuente para: (1) la vista previa en vivo, (2) la exportación con estilos y
 * (3) el mapeo inverso de cabeceras en la importación.
 * Se recalcula (memoizado) en cada cambio del estado → sincronización en tiempo real.
 */
import type { AppData } from "@/lib/types";
import {
  amortization,
  avgMonthlySavings,
  computeKpis,
  debtInterestPaid,
  debtPaid,
  debtProgress,
  expenses,
  goalForecast,
  goalProgress,
  goalRemaining,
  goalSaved,
  groupSum,
  incomes,
  monthlyInterest,
  monthlySeries,
  nextPaymentDate,
  receivableCollected,
  receivableOutstanding,
  receivableStatus,
  totalOf,
} from "@/lib/finance/calculations";
import { daysBetween, round2, todayISO } from "@/lib/format";
import { currencyMeta } from "@/lib/constants/catalog";

export type CellFormat = "text" | "currency" | "date" | "percent" | "int" | "decimal" | "bool" | "status";
export type CellValue = string | number | boolean | null;
export type SheetTone = "indigo" | "emerald" | "rose" | "amber" | "cobalt";

export interface ColumnSpec {
  key: string;
  header: string;
  fmt: CellFormat;
  /** Columna que se suma en la fila de totales (fórmula SUBTOTAL). */
  total?: boolean;
  /** Si es false, la columna es derivada y se ignora al importar. */
  importable?: boolean;
}

export type Row = Record<string, CellValue>;

export interface TableSheetModel {
  kind: "table";
  name: string;
  title: string;
  description: string;
  tone: SheetTone;
  columns: ColumnSpec[];
  rows: Row[];
}

export interface KpiItem {
  label: string;
  value: number;
  fmt: CellFormat;
  note: string;
  /** Fórmula opcional (con referencia a otras hojas); el valor se escribe como caché. */
  formula?: { sheet: string; column: string };
}

export interface SummaryTable {
  title: string;
  columns: ColumnSpec[];
  rows: Row[];
}

export interface SummarySheetModel {
  kind: "summary";
  name: string;
  title: string;
  description: string;
  tone: SheetTone;
  kpis: KpiItem[];
  tables: SummaryTable[];
}

export type SheetModel = TableSheetModel | SummarySheetModel;

export interface WorkbookModel {
  generatedAt: string;
  currency: string;
  currencySymbol: string;
  owner: string;
  sheets: SheetModel[];
}

/** Nombres canónicos de hoja (el importador los busca de forma tolerante). */
export const SHEETS = {
  summary: "Resumen Ejecutivo",
  incomes: "Libro de Ingresos",
  expenses: "Libro de Gastos",
  debts: "Control de Deudas",
  receivables: "Cuentas por Cobrar",
  goals: "Metas de Ahorro",
  history: "Historial de Movimientos",
  config: "Configuración",
} as const;

/* ------------------------------ Columnas base ------------------------------ */

export const INCOME_COLUMNS: ColumnSpec[] = [
  { key: "date", header: "Fecha", fmt: "date" },
  { key: "category", header: "Categoría", fmt: "text" },
  { key: "source", header: "Fuente / Pagador", fmt: "text" },
  { key: "amount", header: "Monto", fmt: "currency", total: true },
  { key: "method", header: "Método de recepción", fmt: "text" },
  { key: "recurring", header: "Recurrente", fmt: "bool" },
  { key: "notes", header: "Notas", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const EXPENSE_COLUMNS: ColumnSpec[] = [
  { key: "date", header: "Fecha", fmt: "date" },
  { key: "macro", header: "Macro categoría", fmt: "text" },
  { key: "micro", header: "Micro categoría", fmt: "text" },
  { key: "merchant", header: "Comercio / Detalle", fmt: "text" },
  { key: "amount", header: "Monto", fmt: "currency", total: true },
  { key: "method", header: "Método de pago", fmt: "text" },
  { key: "priority", header: "Prioridad", fmt: "status" },
  { key: "recurring", header: "Recurrente", fmt: "bool" },
  { key: "notes", header: "Notas", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const DEBT_COLUMNS: ColumnSpec[] = [
  { key: "name", header: "Deuda", fmt: "text" },
  { key: "lender", header: "Acreedor", fmt: "text" },
  { key: "type", header: "Tipo", fmt: "text" },
  { key: "principal", header: "Monto original", fmt: "currency", total: true },
  { key: "balance", header: "Saldo pendiente", fmt: "currency", total: true },
  { key: "paid", header: "Capital pagado", fmt: "currency", total: true, importable: false },
  { key: "progress", header: "% Avance", fmt: "percent", importable: false },
  { key: "annualRate", header: "Tasa anual", fmt: "percent" },
  { key: "monthlyInterest", header: "Interés mensual", fmt: "currency", total: true, importable: false },
  { key: "monthlyPayment", header: "Cuota mensual", fmt: "currency", total: true },
  { key: "interestPaid", header: "Intereses pagados", fmt: "currency", total: true, importable: false },
  { key: "startDate", header: "Fecha inicio", fmt: "date" },
  { key: "dueDate", header: "Fecha límite", fmt: "date" },
  { key: "paymentDay", header: "Día de pago", fmt: "int" },
  { key: "nextPayment", header: "Próxima cuota", fmt: "date", importable: false },
  { key: "monthsLeft", header: "Meses restantes", fmt: "int", importable: false },
  { key: "payoff", header: "Liquidación estimada", fmt: "date", importable: false },
  { key: "status", header: "Estado", fmt: "status", importable: false },
  { key: "notes", header: "Notas", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const RECEIVABLE_COLUMNS: ColumnSpec[] = [
  { key: "debtor", header: "Deudor", fmt: "text" },
  { key: "concept", header: "Concepto", fmt: "text" },
  { key: "type", header: "Tipo", fmt: "text" },
  { key: "amount", header: "Monto total", fmt: "currency", total: true },
  { key: "collected", header: "Cobrado", fmt: "currency", total: true, importable: false },
  { key: "outstanding", header: "Pendiente", fmt: "currency", total: true, importable: false },
  { key: "progress", header: "% Cobrado", fmt: "percent", importable: false },
  { key: "issueDate", header: "Fecha emisión", fmt: "date" },
  { key: "dueDate", header: "Vencimiento", fmt: "date" },
  { key: "daysLeft", header: "Días para vencer", fmt: "int", importable: false },
  { key: "status", header: "Estado", fmt: "status", importable: false },
  { key: "notes", header: "Notas", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const GOAL_COLUMNS: ColumnSpec[] = [
  { key: "name", header: "Meta", fmt: "text" },
  { key: "kind", header: "Tipo", fmt: "text" },
  { key: "target", header: "Objetivo", fmt: "currency", total: true },
  { key: "saved", header: "Ahorrado", fmt: "currency", total: true, importable: false },
  { key: "remaining", header: "Restante", fmt: "currency", total: true, importable: false },
  { key: "progress", header: "% Cumplimiento", fmt: "percent", importable: false },
  { key: "deadline", header: "Fecha límite", fmt: "date" },
  { key: "monthlyContribution", header: "Aporte mensual plan", fmt: "currency" },
  { key: "required", header: "Aporte requerido / mes", fmt: "currency", importable: false },
  { key: "pace", header: "Ritmo considerado", fmt: "currency", importable: false },
  { key: "eta", header: "Fecha estimada", fmt: "date", importable: false },
  { key: "status", header: "Estado", fmt: "status", importable: false },
  { key: "initial", header: "Monto inicial", fmt: "currency" },
  { key: "createdAt", header: "Creada", fmt: "date" },
  { key: "icon", header: "Icono", fmt: "text" },
  { key: "color", header: "Color", fmt: "text" },
  { key: "notes", header: "Notas", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const HISTORY_COLUMNS: ColumnSpec[] = [
  { key: "date", header: "Fecha", fmt: "date" },
  { key: "type", header: "Tipo de movimiento", fmt: "status" },
  { key: "reference", header: "Referencia", fmt: "text" },
  { key: "amount", header: "Monto", fmt: "currency", total: true },
  { key: "interest", header: "Interés", fmt: "currency", total: true },
  { key: "principal", header: "Capital", fmt: "currency", total: true },
  { key: "refId", header: "ID referencia", fmt: "text" },
  { key: "id", header: "ID", fmt: "text" },
];

export const CONFIG_COLUMNS: ColumnSpec[] = [
  { key: "param", header: "Parámetro", fmt: "text" },
  { key: "value", header: "Valor", fmt: "text" },
  { key: "key", header: "Clave", fmt: "text" },
];

export const HISTORY_TYPES = { debt: "Pago de deuda", receivable: "Cobro recibido", goal: "Aporte a meta" } as const;

/* --------------------------------- Builder --------------------------------- */

export function buildWorkbookModel(data: AppData, ref = todayISO()): WorkbookModel {
  const k = computeKpis(data, ref);
  const series = monthlySeries(data.transactions, 12, ref);
  const inc = incomes(data.transactions);
  const exp = expenses(data.transactions);
  const globalSavings = avgMonthlySavings(data.transactions, 3, ref);
  const cur = currencyMeta(data.settings.currency);

  const incomeRows: Row[] = inc.map((t) => ({
    date: t.date, category: t.category, source: t.source, amount: t.amount, method: t.method, recurring: t.recurring, notes: t.notes, id: t.id,
  }));

  const expenseRows: Row[] = exp.map((t) => ({
    date: t.date, macro: t.macro, micro: t.micro, merchant: t.merchant, amount: t.amount, method: t.method, priority: t.priority, recurring: t.recurring, notes: t.notes, id: t.id,
  }));

  const debtRows: Row[] = data.debts.map((d) => {
    const am = amortization(d.balance, d.annualRate, d.monthlyPayment, ref);
    return {
      name: d.name, lender: d.lender, type: d.type, principal: d.principal, balance: d.balance, paid: debtPaid(d),
      progress: debtProgress(d), annualRate: d.annualRate / 100, monthlyInterest: monthlyInterest(d), monthlyPayment: d.monthlyPayment,
      interestPaid: debtInterestPaid(d), startDate: d.startDate, dueDate: d.dueDate, paymentDay: d.paymentDay,
      nextPayment: d.balance > 0 ? nextPaymentDate(d, ref) : null,
      monthsLeft: am.feasible ? am.months : null,
      payoff: am.feasible ? am.payoffDate : null,
      status: d.balance <= 0 ? "Liquidada" : !am.feasible ? "Cuota insuficiente" : d.dueDate < ref ? "Vencida" : "Al día",
      notes: d.notes, id: d.id,
    };
  });

  const receivableRows: Row[] = data.receivables.map((r) => {
    const status = receivableStatus(r);
    const overdue = status !== "Cobrado" && r.dueDate < ref;
    return {
      debtor: r.debtor, concept: r.concept, type: r.type, amount: r.amount, collected: receivableCollected(r), outstanding: receivableOutstanding(r),
      progress: r.amount > 0 ? receivableCollected(r) / r.amount : 0, issueDate: r.issueDate, dueDate: r.dueDate,
      daysLeft: status === "Cobrado" ? null : daysBetween(ref, r.dueDate),
      status: overdue ? `${status} (Vencido)` : status, notes: r.notes, id: r.id,
    };
  });

  const goalRows: Row[] = data.goals.map((g) => {
    const f = goalForecast(g, globalSavings, ref);
    return {
      name: g.name, kind: g.kind, target: g.target, saved: goalSaved(g), remaining: goalRemaining(g), progress: goalProgress(g),
      deadline: g.deadline, monthlyContribution: g.monthlyContribution, required: f.achieved ? 0 : f.requiredMonthly, pace: f.pace,
      eta: f.etaDate, status: f.achieved ? "Lograda" : f.onTrack ? "En curso" : "Fuera de ritmo",
      initial: g.initial, createdAt: g.createdAt, icon: g.icon, color: g.color, notes: g.notes, id: g.id,
    };
  });

  const historyRows: Row[] = [
    ...data.debts.flatMap((d) => d.payments.map((p) => ({ date: p.date, type: HISTORY_TYPES.debt, reference: d.name, amount: p.amount, interest: p.interest, principal: p.principal, refId: d.id, id: p.id }))),
    ...data.receivables.flatMap((r) => r.payments.map((p) => ({ date: p.date, type: HISTORY_TYPES.receivable, reference: `${r.debtor} — ${r.concept}`, amount: p.amount, interest: null, principal: null, refId: r.id, id: p.id }))),
    ...data.goals.flatMap((g) => g.contributions.map((c) => ({ date: c.date, type: HISTORY_TYPES.goal, reference: g.name, amount: c.amount, interest: null, principal: null, refId: g.id, id: c.id }))),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const configRows: Row[] = [
    { param: "Titular", value: data.settings.userName, key: "userName" },
    { param: "Moneda", value: data.settings.currency, key: "currency" },
    { param: "Saldo inicial de liquidez", value: data.settings.openingBalance, key: "openingBalance" },
    { param: "Presupuesto mensual", value: data.settings.monthlyBudget, key: "monthlyBudget" },
    { param: "Tasa de ahorro objetivo (%)", value: data.settings.savingsTarget, key: "savingsTarget" },
    { param: "Versión de esquema", value: 1, key: "schemaVersion" },
  ];

  const expenseByMacro = groupSum(exp.filter((e) => e.date >= `${series[0].key}-01`), (e) => e.macro, (e) => e.amount);
  const incomeByCat = groupSum(inc.filter((e) => e.date >= `${series[0].key}-01`), (e) => e.category, (e) => e.amount);

  const summary: SummarySheetModel = {
    kind: "summary",
    name: SHEETS.summary,
    title: "AuraWealth Pro — Resumen Ejecutivo",
    description: `Titular: ${data.settings.userName || "—"} · Moneda: ${data.settings.currency}`,
    tone: "indigo",
    kpis: [
      { label: "Patrimonio neto", value: k.netWorth, fmt: "currency", note: "Liquidez + cuentas por cobrar − deudas" },
      { label: "Liquidez disponible", value: k.liquidity, fmt: "currency", note: "Saldo inicial + ingresos − gastos" },
      { label: "Flujo de caja del mes", value: k.cashflow, fmt: "currency", note: "Ingresos − gastos del mes en curso" },
      { label: "Ingresos del mes", value: k.income, fmt: "currency", note: "Mes en curso" },
      { label: "Gastos del mes", value: k.expense, fmt: "currency", note: "Mes en curso" },
      { label: "Tasa de ahorro del mes", value: k.savingsRate, fmt: "percent", note: `Objetivo: ${data.settings.savingsTarget}%` },
      { label: "Deuda total", value: k.totalDebt, fmt: "currency", note: "Suma de saldos pendientes", formula: { sheet: SHEETS.debts, column: "balance" } },
      { label: "Cuentas por cobrar", value: k.receivable, fmt: "currency", note: "Pendiente de cobro", formula: { sheet: SHEETS.receivables, column: "outstanding" } },
      { label: "Ahorro acumulado en metas", value: k.goalsSaved, fmt: "currency", note: "Fondos asignados a metas", formula: { sheet: SHEETS.goals, column: "saved" } },
      { label: "Ingresos históricos", value: totalOf(inc), fmt: "currency", note: "Todos los registros", formula: { sheet: SHEETS.incomes, column: "amount" } },
      { label: "Gastos históricos", value: totalOf(exp), fmt: "currency", note: "Todos los registros", formula: { sheet: SHEETS.expenses, column: "amount" } },
    ],
    tables: [
      {
        title: "Balance mensual — últimos 12 meses",
        columns: [
          { key: "label", header: "Mes", fmt: "text" },
          { key: "income", header: "Ingresos", fmt: "currency", total: true },
          { key: "expense", header: "Gastos", fmt: "currency", total: true },
          { key: "net", header: "Flujo neto", fmt: "currency", total: true },
          { key: "savingsRate", header: "Tasa de ahorro", fmt: "percent" },
        ],
        rows: series.map((s) => ({ label: s.label, income: s.income, expense: s.expense, net: s.net, savingsRate: round2(s.savingsRate * 10000) / 10000 })),
      },
      {
        title: "Gasto por categoría — últimos 12 meses",
        columns: [
          { key: "name", header: "Categoría", fmt: "text" },
          { key: "value", header: "Monto", fmt: "currency", total: true },
          { key: "share", header: "% del total", fmt: "percent" },
        ],
        rows: expenseByMacro.map((c) => ({ name: c.name, value: c.value, share: c.share })),
      },
      {
        title: "Ingresos por categoría — últimos 12 meses",
        columns: [
          { key: "name", header: "Categoría", fmt: "text" },
          { key: "value", header: "Monto", fmt: "currency", total: true },
          { key: "share", header: "% del total", fmt: "percent" },
        ],
        rows: incomeByCat.map((c) => ({ name: c.name, value: c.value, share: c.share })),
      },
    ],
  };

  const table = (name: string, title: string, description: string, tone: SheetTone, columns: ColumnSpec[], rows: Row[]): TableSheetModel => ({
    kind: "table", name, title, description, tone, columns, rows,
  });

  return {
    generatedAt: new Date().toISOString(),
    currency: data.settings.currency,
    currencySymbol: cur.symbol,
    owner: data.settings.userName,
    sheets: [
      summary,
      table(SHEETS.incomes, "Libro de Ingresos", "Registro detallado de todas las entradas de dinero", "emerald", INCOME_COLUMNS, incomeRows),
      table(SHEETS.expenses, "Libro de Gastos y Consumos", "Desglose completo por macro/micro categoría, método y prioridad", "rose", EXPENSE_COLUMNS, expenseRows),
      table(SHEETS.debts, "Control de Deudas", "Estado de pasivos, intereses, amortización y saldos pendientes", "rose", DEBT_COLUMNS, debtRows),
      table(SHEETS.receivables, "Cuentas por Cobrar", "Activos pendientes de cobro y su estado de recuperación", "amber", RECEIVABLE_COLUMNS, receivableRows),
      table(SHEETS.goals, "Metas de Ahorro e Inversión", "Progreso, proyección y porcentaje de cumplimiento", "emerald", GOAL_COLUMNS, goalRows),
      table(SHEETS.history, "Historial de Movimientos", "Pagos de deudas, cobros y aportes a metas (necesario para restauración completa)", "cobalt", HISTORY_COLUMNS, historyRows),
      table(SHEETS.config, "Configuración", "Parámetros de la cuenta — no modificar la columna Clave", "indigo", CONFIG_COLUMNS, configRows),
    ],
  };
}
