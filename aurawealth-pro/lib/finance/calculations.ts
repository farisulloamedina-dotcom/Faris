/**
 * Motor de cálculo financiero.
 * Funciones puras (sin React) reutilizadas por la UI, las alertas y el motor Excel.
 */
import type { AppData, Debt, Expense, Goal, Income, ISODate, Receivable, ReceivableStatus, Transaction } from "@/lib/types";
import { addMonths, clamp, daysBetween, lastMonths, monthKey, monthLabel, monthsBetween, parseISO, round2, sum, todayISO } from "@/lib/format";

/* ------------------------------ Transacciones ------------------------------ */

export const isIncome = (t: Transaction): t is Income => t.kind === "income";
export const isExpense = (t: Transaction): t is Expense => t.kind === "expense";

export const incomes = (txs: Transaction[]) => txs.filter(isIncome);
export const expenses = (txs: Transaction[]) => txs.filter(isExpense);

export const inMonth = (txs: Transaction[], key: string) => txs.filter((t) => monthKey(t.date) === key);
export const inRange = <T extends { date: ISODate }>(xs: T[], from?: ISODate, to?: ISODate) =>
  xs.filter((x) => (!from || x.date >= from) && (!to || x.date <= to));

export const totalOf = (txs: { amount: number }[]) => round2(sum(txs.map((t) => t.amount)));

/** Último día (ISO) del mes `YYYY-MM`. */
export function monthEnd(key: string): ISODate {
  const [y, m] = key.split("-").map(Number);
  return `${key}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
}

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // 0..1
}

export function monthlySeries(txs: Transaction[], months = 12, ref: ISODate = todayISO()): MonthPoint[] {
  const keys = lastMonths(months, ref);
  const map = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
  for (const t of txs) {
    const bucket = map.get(monthKey(t.date));
    if (!bucket) continue;
    if (t.kind === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }
  return keys.map((key) => {
    const b = map.get(key)!;
    const net = b.income - b.expense;
    return {
      key,
      label: monthLabel(key),
      income: round2(b.income),
      expense: round2(b.expense),
      net: round2(net),
      savingsRate: b.income > 0 ? net / b.income : 0,
    };
  });
}

export function groupSum<T>(xs: T[], keyOf: (x: T) => string, valueOf: (x: T) => number) {
  const m = new Map<string, number>();
  for (const x of xs) m.set(keyOf(x), (m.get(keyOf(x)) ?? 0) + valueOf(x));
  const total = sum([...m.values()]);
  return [...m.entries()]
    .map(([name, value]) => ({ name, value: round2(value), share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

export const liquidity = (data: AppData, at?: ISODate) =>
  round2(
    data.settings.openingBalance +
      sum(data.transactions.filter((t) => !at || t.date <= at).map((t) => (t.kind === "income" ? t.amount : -t.amount))),
  );

/** Ahorro neto mensual promedio de los últimos `n` meses completos (excluye el mes en curso). */
export function avgMonthlySavings(txs: Transaction[], n = 3, ref: ISODate = todayISO()) {
  const series = monthlySeries(txs, n + 1, ref).slice(0, n);
  return round2(sum(series.map((s) => s.net)) / Math.max(1, series.length));
}

export function avgMonthly(txs: Transaction[], kind: "income" | "expense", n = 3, ref: ISODate = todayISO()) {
  const series = monthlySeries(txs, n + 1, ref).slice(0, n);
  return round2(sum(series.map((s) => (kind === "income" ? s.income : s.expense))) / Math.max(1, series.length));
}

/* --------------------------------- Deudas ---------------------------------- */

export interface AmortRow {
  period: number;
  date: ISODate;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface AmortResult {
  rows: AmortRow[];
  months: number;
  totalInterest: number;
  payoffDate: ISODate | null;
  feasible: boolean; // false si la cuota no cubre ni los intereses
}

/** Divide un pago en interés y capital usando interés mensual simple sobre saldo. */
export function splitDebtPayment(balance: number, annualRate: number, amount: number) {
  const interest = round2(Math.max(0, balance) * (annualRate / 100 / 12));
  const principal = round2(Math.min(Math.max(0, amount - interest), balance));
  return { interest: Math.min(interest, amount), principal };
}

export function amortization(balance: number, annualRate: number, payment: number, start: ISODate, maxMonths = 480): AmortResult {
  const r = annualRate / 100 / 12;
  const rows: AmortRow[] = [];
  let b = balance;
  if (balance <= 0) return { rows, months: 0, totalInterest: 0, payoffDate: start, feasible: true };
  if (payment <= b * r) return { rows, months: Infinity, totalInterest: Infinity, payoffDate: null, feasible: false };
  let totalInterest = 0;
  for (let p = 1; p <= maxMonths && b > 0.005; p++) {
    const interest = round2(b * r);
    const pay = Math.min(payment, round2(b + interest));
    const principal = round2(pay - interest);
    b = round2(b - principal);
    totalInterest += interest;
    rows.push({ period: p, date: addMonths(start, p), payment: pay, interest, principal, balance: Math.max(0, b) });
  }
  return {
    rows,
    months: rows.length,
    totalInterest: round2(totalInterest),
    payoffDate: rows.length ? rows[rows.length - 1].date : start,
    feasible: b <= 0.005,
  };
}

export const debtPaid = (d: Debt) => round2(Math.max(0, d.principal - d.balance));
export const debtProgress = (d: Debt) => (d.principal > 0 ? clamp(debtPaid(d) / d.principal, 0, 1) : 0);
export const debtInterestPaid = (d: Debt) => round2(sum(d.payments.map((p) => p.interest)));
export const monthlyInterest = (d: Debt) => round2(d.balance * (d.annualRate / 100 / 12));

/** Próxima fecha de cuota según el día de pago configurado. */
export function nextPaymentDate(d: Debt, ref: ISODate = todayISO()): ISODate {
  const base = parseISO(ref);
  const last = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  let y = base.getFullYear();
  let m = base.getMonth();
  if (base.getDate() > Math.min(d.paymentDay, last(y, m))) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  const day = Math.min(d.paymentDay, last(y, m));
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Saldo histórico aproximado de una deuda al cierre de `at`. */
export function debtBalanceAt(d: Debt, at: ISODate) {
  if (d.startDate > at) return 0;
  const later = sum(d.payments.filter((p) => p.date > at).map((p) => p.principal));
  return round2(Math.min(d.principal, d.balance + later));
}

export const totalDebt = (debts: Debt[]) => round2(sum(debts.map((d) => d.balance)));

/* ---------------------------- Cuentas por cobrar ---------------------------- */

export const receivableCollected = (r: Receivable) => round2(sum(r.payments.map((p) => p.amount)));
export const receivableOutstanding = (r: Receivable) => round2(Math.max(0, r.amount - receivableCollected(r)));

export function receivableStatus(r: Receivable): ReceivableStatus {
  const c = receivableCollected(r);
  if (c >= r.amount - 0.005) return "Cobrado";
  if (c > 0) return "Parcial";
  return "Pendiente";
}

export const isReceivableOverdue = (r: Receivable, ref: ISODate = todayISO()) =>
  receivableStatus(r) !== "Cobrado" && r.dueDate < ref;

export function receivableOutstandingAt(r: Receivable, at: ISODate) {
  if (r.issueDate > at) return 0;
  return round2(Math.max(0, r.amount - sum(r.payments.filter((p) => p.date <= at).map((p) => p.amount))));
}

export const totalReceivable = (rs: Receivable[]) => round2(sum(rs.map(receivableOutstanding)));

/* ---------------------------------- Metas ---------------------------------- */

export const goalSaved = (g: Goal) => round2(g.initial + sum(g.contributions.map((c) => c.amount)));
export const goalProgress = (g: Goal) => (g.target > 0 ? clamp(goalSaved(g) / g.target, 0, 1) : 0);
export const goalRemaining = (g: Goal) => round2(Math.max(0, g.target - goalSaved(g)));

export interface GoalForecast {
  pace: number; // aporte mensual considerado
  paceSource: "plan" | "histórico" | "ahorro global";
  monthsToGoal: number; // Infinity si no hay ritmo
  etaDate: ISODate | null;
  monthsLeft: number; // meses hasta la fecha límite
  requiredMonthly: number;
  onTrack: boolean;
  achieved: boolean;
}

export function goalForecast(g: Goal, globalSavings: number, ref: ISODate = todayISO()): GoalForecast {
  const remaining = goalRemaining(g);
  const monthsLeft = Math.max(0, monthsBetween(ref, g.deadline) + (parseISO(g.deadline).getDate() >= parseISO(ref).getDate() ? 0 : -1));
  // Ritmo histórico: aportes de los últimos 3 meses
  const since = addMonths(ref, -3);
  const recent = sum(g.contributions.filter((c) => c.date > since).map((c) => c.amount)) / 3;

  let pace = g.monthlyContribution;
  let paceSource: GoalForecast["paceSource"] = "plan";
  if (!(pace > 0)) {
    if (recent > 0) {
      pace = round2(recent);
      paceSource = "histórico";
    } else {
      pace = Math.max(0, globalSavings);
      paceSource = "ahorro global";
    }
  }
  const achieved = remaining <= 0;
  const monthsToGoal = achieved ? 0 : pace > 0 ? Math.ceil(remaining / pace) : Infinity;
  const etaDate = Number.isFinite(monthsToGoal) ? addMonths(ref, monthsToGoal) : null;
  const requiredMonthly = monthsLeft > 0 ? round2(remaining / monthsLeft) : remaining;
  return {
    pace,
    paceSource,
    monthsToGoal,
    etaDate,
    monthsLeft,
    requiredMonthly,
    onTrack: achieved || (etaDate !== null && etaDate <= g.deadline),
    achieved,
  };
}

/* ---------------------------------- KPIs ----------------------------------- */

export interface Kpis {
  liquidity: number;
  netWorth: number;
  netWorthPrev: number;
  cashflow: number;
  cashflowPrev: number;
  income: number;
  expense: number;
  savingsRate: number;
  savingsRatePrev: number;
  totalDebt: number;
  totalDebtPrev: number;
  receivable: number;
  goalsSaved: number;
}

export const netWorthAt = (data: AppData, at: ISODate) =>
  round2(
    liquidity(data, at) +
      sum(data.receivables.map((r) => receivableOutstandingAt(r, at))) -
      sum(data.debts.map((d) => debtBalanceAt(d, at))),
  );

export function computeKpis(data: AppData, ref: ISODate = todayISO()): Kpis {
  const [prevKey, curKey] = lastMonths(2, ref);
  const cur = inMonth(data.transactions, curKey);
  const prev = inMonth(data.transactions, prevKey);
  const inc = totalOf(incomes(cur));
  const exp = totalOf(expenses(cur));
  const incP = totalOf(incomes(prev));
  const expP = totalOf(expenses(prev));
  const prevEndISO = monthEnd(prevKey);
  const debt = totalDebt(data.debts);
  const receivable = totalReceivable(data.receivables);
  const liq = liquidity(data);
  return {
    liquidity: liq,
    netWorth: round2(liq + receivable - debt),
    netWorthPrev: netWorthAt(data, prevEndISO),
    cashflow: round2(inc - exp),
    cashflowPrev: round2(incP - expP),
    income: inc,
    expense: exp,
    savingsRate: inc > 0 ? (inc - exp) / inc : 0,
    savingsRatePrev: incP > 0 ? (incP - expP) / incP : 0,
    totalDebt: debt,
    totalDebtPrev: round2(sum(data.debts.map((d) => debtBalanceAt(d, prevEndISO)))),
    receivable,
    goalsSaved: round2(sum(data.goals.map(goalSaved))),
  };
}

/** Serie histórica de patrimonio neto (cierre de cada mes). */
export function netWorthSeries(data: AppData, months = 12, ref: ISODate = todayISO()) {
  return lastMonths(months, ref).map((key, i, arr) => {
    const end = i === arr.length - 1 ? ref : monthEnd(key);
    return {
      key,
      label: monthLabel(key),
      netWorth: netWorthAt(data, end),
      debt: round2(sum(data.debts.map((d) => debtBalanceAt(d, end)))),
      liquidity: liquidity(data, end),
    };
  });
}

export const delta = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 1) : (cur - prev) / Math.abs(prev));

/* ------------------------------- Predicción -------------------------------- */

/** Regresión lineal por mínimos cuadrados. Devuelve pendiente, intercepto y R². */
export function linearRegression(ys: number[]) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
  const xs = ys.map((_, i) => i);
  const mx = sum(xs) / n;
  const my = sum(ys) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2 };
}

export interface ForecastPoint {
  key: string;
  label: string;
  income: number | null;
  expense: number | null;
  incomeForecast: number | null;
  expenseForecast: number | null;
  projected: boolean;
}

/** Proyecta ingresos y gastos `ahead` meses usando los últimos `window` meses completos. */
export function forecast(txs: Transaction[], window = 6, ahead = 3, ref: ISODate = todayISO()) {
  const hist = monthlySeries(txs, window + 1, ref).slice(0, window);
  const ri = linearRegression(hist.map((h) => h.income));
  const re = linearRegression(hist.map((h) => h.expense));
  const points: ForecastPoint[] = hist.map((h) => ({
    key: h.key,
    label: h.label,
    income: h.income,
    expense: h.expense,
    incomeForecast: null,
    expenseForecast: null,
    projected: false,
  }));
  // Une la línea proyectada con el último punto real
  if (points.length) {
    const last = points[points.length - 1];
    last.incomeForecast = last.income;
    last.expenseForecast = last.expense;
  }
  const curMonthStart = `${monthKey(ref)}-01`;
  for (let i = 0; i < ahead; i++) {
    const x = window + i;
    const key = monthKey(addMonths(curMonthStart, i));
    points.push({
      key,
      label: monthLabel(key),
      income: null,
      expense: null,
      incomeForecast: round2(Math.max(0, ri.intercept + ri.slope * x)),
      expenseForecast: round2(Math.max(0, re.intercept + re.slope * x)),
      projected: true,
    });
  }
  const nextIncome = points[window]?.incomeForecast ?? 0;
  const nextExpense = points[window]?.expenseForecast ?? 0;
  return { points, incomeTrend: ri, expenseTrend: re, nextIncome, nextExpense, nextNet: round2(nextIncome - nextExpense) };
}

export function stdDev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = sum(xs) / xs.length;
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}

/* -------------------------------- Alertas ---------------------------------- */

export type AlertLevel = "critical" | "warning" | "info" | "success";

export interface SmartAlert {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
  href: string;
}

export function buildAlerts(data: AppData, ref: ISODate = todayISO()): SmartAlert[] {
  const out: SmartAlert[] = [];
  const { settings } = data;
  const curKey = monthKey(ref);

  for (const r of data.receivables) {
    if (receivableStatus(r) === "Cobrado") continue;
    const d = daysBetween(ref, r.dueDate);
    if (d < 0)
      out.push({ id: `rv-o-${r.id}`, level: "critical", title: `Cobro vencido: ${r.debtor}`, detail: `${r.concept} venció hace ${-d} días.`, href: "/pasivos?tab=cobros" });
    else if (d <= 7)
      out.push({ id: `rv-s-${r.id}`, level: "warning", title: `Cobro próximo: ${r.debtor}`, detail: `${r.concept} vence en ${d} día${d === 1 ? "" : "s"}.`, href: "/pasivos?tab=cobros" });
  }

  for (const debt of data.debts) {
    if (debt.balance <= 0) continue;
    if (debt.monthlyPayment <= monthlyInterest(debt))
      out.push({ id: `db-x-${debt.id}`, level: "critical", title: `${debt.name}: cuota insuficiente`, detail: "La cuota no cubre los intereses mensuales; la deuda nunca se liquidará.", href: "/pasivos" });
    if (debt.dueDate < ref)
      out.push({ id: `db-o-${debt.id}`, level: "critical", title: `${debt.name}: plazo vencido`, detail: "La fecha límite pasó y aún hay saldo pendiente.", href: "/pasivos" });
    const next = nextPaymentDate(debt, ref);
    const d = daysBetween(ref, next);
    const paidThisMonth = debt.payments.some((p) => monthKey(p.date) === monthKey(next));
    if (d <= 5 && !paidThisMonth)
      out.push({ id: `db-n-${debt.id}`, level: "warning", title: `Cuota de ${debt.name}`, detail: `Vence ${d === 0 ? "hoy" : `en ${d} días`}.`, href: "/pasivos" });
  }

  const cur = inMonth(data.transactions, curKey);
  const exp = totalOf(expenses(cur));
  const inc = totalOf(incomes(cur));
  if (settings.monthlyBudget > 0) {
    const ratio = exp / settings.monthlyBudget;
    if (ratio >= 1)
      out.push({ id: "budget-over", level: "critical", title: "Presupuesto mensual superado", detail: `Has gastado el ${Math.round(ratio * 100)}% del presupuesto.`, href: "/transacciones" });
    else if (ratio >= 0.8)
      out.push({ id: "budget-80", level: "warning", title: "Presupuesto al límite", detail: `Llevas el ${Math.round(ratio * 100)}% del presupuesto del mes.`, href: "/transacciones" });
  }
  if (inc > 0) {
    const rate = (inc - exp) / inc;
    if (rate < settings.savingsTarget / 100)
      out.push({ id: "savings-low", level: "warning", title: "Tasa de ahorro bajo objetivo", detail: `Este mes ahorras ${Math.round(rate * 100)}% vs. objetivo ${settings.savingsTarget}%.`, href: "/analitica" });
    else
      out.push({ id: "savings-ok", level: "success", title: "Ahorro en objetivo", detail: `Tasa de ahorro del ${Math.round(rate * 100)}% este mes. ¡Excelente!`, href: "/analitica" });
  }

  // Picos por categoría frente al promedio de los 3 meses previos
  const prevKeys = lastMonths(4, ref).slice(0, 3);
  const byMacroNow = groupSum(expenses(cur), (e) => e.macro, (e) => e.amount);
  for (const c of byMacroNow) {
    const avg = sum(prevKeys.map((k) => totalOf(expenses(inMonth(data.transactions, k)).filter((e) => e.macro === c.name)))) / 3;
    if (avg > 0 && c.value > avg * 1.3 && c.value - avg > 50)
      out.push({ id: `spike-${c.name}`, level: "info", title: `Gasto elevado en ${c.name}`, detail: `+${Math.round((c.value / avg - 1) * 100)}% sobre tu promedio trimestral.`, href: "/analitica" });
  }

  const globalSavings = avgMonthlySavings(data.transactions, 3, ref);
  for (const g of data.goals) {
    const f = goalForecast(g, globalSavings, ref);
    if (f.achieved)
      out.push({ id: `goal-ok-${g.id}`, level: "success", title: `Meta lograda: ${g.name}`, detail: "Alcanzaste el 100% del objetivo.", href: "/metas" });
    else if (!f.onTrack)
      out.push({ id: `goal-off-${g.id}`, level: "warning", title: `${g.name} fuera de ritmo`, detail: `Necesitas aportar ${Math.round(f.requiredMonthly)} al mes para llegar a tiempo.`, href: "/metas" });
  }

  const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
