"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  ChartColumn,
  Grid3x3,
  Layers,
  Minus,
  Percent,
  ShieldCheck,
  Scale,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";
import { useData } from "@/lib/store/StoreProvider";
import {
  avgMonthly,
  expenses,
  forecast,
  groupSum,
  incomes,
  inMonth,
  liquidity,
  monthlySeries,
  stdDev,
  totalOf,
} from "@/lib/finance/calculations";
import { CATEGORICAL, EXPENSE_CATEGORIES, PRIORITIES, expenseColor, expenseMeta } from "@/lib/constants/catalog";
import { cn, lastMonths, money, monthKey, monthLabel, num, parseISO, pct, sum } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { InfoTip } from "@/components/ui/InfoTip";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUI } from "@/components/layout/UIProvider";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { StackedAreaChart } from "@/components/charts/StackedAreaChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { DonutChart } from "@/components/charts/DonutChart";
import { Gauge } from "@/components/charts/Gauge";
import { ChartLegend } from "@/components/charts/Legend";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { AXIS_TICK, BAR_CURSOR, GRID_STROKE } from "@/components/charts/theme";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Ratio({ label, value, hint, tone, icon: Icon, info }: { label: string; value: string; hint: string; tone: "good" | "warn" | "bad" | "neutral"; icon: typeof Activity; info: string }) {
  const cls = { good: "text-emerald-600 bg-emerald-50", warn: "text-amber-600 bg-amber-50", bad: "text-rose-600 bg-rose-50", neutral: "text-indigo-600 bg-indigo-50" }[tone];
  const label2 = { good: "Saludable", warn: "Vigilar", bad: "Crítico", neutral: "Referencia" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className={cn("rounded-xl p-2", cls)}>
          <Icon size={16} strokeWidth={2.4} />
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cls)}>{label2}</span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label} <InfoTip>{info}</InfoTip>
      </p>
      <p className="tabular font-serif text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </Card>
  );
}

export function AnalyticsView() {
  const data = useData();
  if (data.transactions.length === 0) return <AnalyticsEmpty />;
  return <AnalyticsContent />;
}

/** Sin movimientos no hay nada que analizar: se evita mostrar indicadores engañosos. */
function AnalyticsEmpty() {
  const ui = useUI();
  return (
    <>
      <PageHeader eyebrow="Módulo 5" title="Inteligencia y Analítica Visual" description="Análisis predictivo, desgloses porcentuales, comparativas mensuales y matrices de rendimiento financiero." />
      <EmptyState
        icon={Brain}
        tone="violet"
        title="Aún no hay datos para analizar"
        description="Registra tus ingresos y gastos; en cuanto haya movimientos verás aquí proyecciones, comparativas e indicadores."
        action={
          <div className="flex gap-2">
            <Button variant="success" icon={ArrowUpRight} onClick={() => ui.openTransaction("income")}>
              Ingreso
            </Button>
            <Button variant="danger" icon={ArrowDownRight} onClick={() => ui.openTransaction("expense")}>
              Gasto
            </Button>
          </div>
        }
      />
    </>
  );
}

function AnalyticsContent() {
  const data = useData();
  const cur = data.settings.currency;
  const [range, setRange] = useState<"6" | "12">("12");
  const months = Number(range);

  const series = useMemo(() => monthlySeries(data.transactions, months), [data.transactions, months]);
  const fc = useMemo(() => forecast(data.transactions, 6, 3), [data.transactions]);
  const exps = useMemo(() => expenses(data.transactions), [data.transactions]);
  const keys = series.map((s) => s.key);
  const fromKey = `${keys[0]}-01`;
  const windowExp = exps.filter((e) => e.date >= fromKey);
  const windowInc = incomes(data.transactions).filter((e) => e.date >= fromKey);

  // Comparativa mes actual vs. anterior por categoría
  const [prevKey, curKey] = lastMonths(2);
  const comparison = EXPENSE_CATEGORIES.map((c) => {
    const now = totalOf(expenses(inMonth(data.transactions, curKey)).filter((e) => e.macro === c.value));
    const prev = totalOf(expenses(inMonth(data.transactions, prevKey)).filter((e) => e.macro === c.value));
    return { name: c.value, icon: c.icon, color: c.color, now, prev, diff: now - prev, rel: prev > 0 ? (now - prev) / prev : now > 0 ? 1 : 0 };
  }).filter((r) => r.now > 0 || r.prev > 0);

  // Matriz de rendimiento (últimos 6 meses)
  const heatCols = lastMonths(6).map((k) => ({ key: k, label: monthLabel(k) }));
  const heatValues: Record<string, Record<string, number>> = {};
  for (const e of exps) {
    const k = monthKey(e.date);
    if (!heatCols.some((c) => c.key === k)) continue;
    heatValues[e.macro] ??= {};
    heatValues[e.macro][k] = (heatValues[e.macro][k] ?? 0) + e.amount;
  }
  const heatRows = EXPENSE_CATEGORIES.map((c) => c.value).filter((c) => heatValues[c]);

  // Composición apilada por categoría
  const stackSeries = EXPENSE_CATEGORIES.filter((c) => windowExp.some((e) => e.macro === c.value)).map((c) => ({ key: c.value, color: c.color }));
  const stackData = series.map((s) => {
    const row: Record<string, number | string> = { label: s.label };
    for (const c of stackSeries) row[c.key] = Math.round(sum(windowExp.filter((e) => monthKey(e.date) === s.key && e.macro === c.key).map((e) => e.amount)) * 100) / 100;
    return row;
  });

  // 50/30/20
  const prioTotal = totalOf(windowExp);
  const priorities = PRIORITIES.map((p) => {
    const amount = totalOf(windowExp.filter((e) => e.priority === p.value));
    return { ...p, amount, share: prioTotal ? amount / prioTotal : 0 };
  });

  // Métodos de pago e ingresos
  const methods = groupSum(windowExp, (e) => e.method, (e) => e.amount).map((g, i) => ({ name: g.name, value: g.value, color: CATEGORICAL[i % CATEGORICAL.length] }));
  const incomeSources = groupSum(windowInc, (e) => e.category, (e) => e.amount).map((g, i) => ({ name: g.name, value: g.value, color: CATEGORICAL[i % CATEGORICAL.length] }));

  // Día de la semana
  const weekday = WEEKDAYS.map((d, i) => {
    const xs = windowExp.filter((e) => parseISO(e.date).getDay() === i && !e.recurring);
    return { label: d, Gasto: Math.round(sum(xs.map((e) => e.amount)) * 100) / 100 };
  });
  const maxWeekday = Math.max(...weekday.map((w) => w.Gasto));

  // Comercios principales
  const merchants = groupSum(windowExp.filter((e) => e.merchant), (e) => e.merchant, (e) => e.amount).slice(0, 6);

  // Ratios
  const avgInc = avgMonthly(data.transactions, "income", 6);
  const avgExp = avgMonthly(data.transactions, "expense", 6);
  const savingsRate6 = avgInc > 0 ? (avgInc - avgExp) / avgInc : 0;
  const liq = liquidity(data);
  const essential = avgMonthly(data.transactions.filter((t) => t.kind === "expense" && t.priority === "Necesidad"), "expense", 6);
  const emergencyMonths = essential > 0 ? liq / essential : 0;
  const debtPayments = data.debts.filter((d) => d.balance > 0).reduce((a, d) => a + Math.min(d.monthlyPayment, d.balance), 0);
  const dti = avgInc > 0 ? debtPayments / avgInc : 0;
  const expSeries = monthlySeries(data.transactions, 7).slice(0, 6).map((s) => s.expense);
  const volatility = avgExp > 0 ? stdDev(expSeries) / avgExp : 0;
  const recurringShare = prioTotal ? totalOf(windowExp.filter((e) => e.recurring)) / prioTotal : 0;
  const dailySpend = avgExp / 30.4;

  const trendWord = (slope: number) => (slope > 15 ? "al alza" : slope < -15 ? "a la baja" : "estable");

  return (
    <>
      <PageHeader
        eyebrow="Módulo 5"
        title="Inteligencia y Analítica Visual"
        description="Análisis predictivo, desgloses porcentuales, comparativas mensuales y matrices de rendimiento financiero."
        actions={
          <Tabs
            value={range}
            onChange={setRange}
            items={[
              { value: "6", label: "6 meses" },
              { value: "12", label: "12 meses" },
            ]}
          />
        }
      />

      {/* Predicción */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <CardHeader
            title="Proyección de flujo de caja"
            subtitle="Regresión lineal sobre los últimos 6 meses completos → próximos 3 meses"
            icon={Brain}
            tone="violet"
            action={
              <ChartLegend
                items={[
                  { label: "Ingresos", color: "#2E8A62" },
                  { label: "Gastos", color: "#B04848" },
                  { label: "Proyección", color: "#94A3B8", dashed: true },
                ]}
              />
            }
          />
          <div className="mt-4">
            <ForecastChart data={fc.points} currency={cur} height={300} />
          </div>
        </Card>
        <div className="grid gap-4">
          <div className="rounded-3xl bg-indigo-800 p-5 text-white">
            <p className="flex items-center gap-2 text-sm font-semibold text-indigo-100">
              <Sparkles size={15} /> Próximo mes (estimado)
            </p>
            <div className="mt-4 space-y-3">
              {[
                { l: "Ingresos", v: fc.nextIncome, t: fc.incomeTrend },
                { l: "Gastos", v: fc.nextExpense, t: fc.expenseTrend },
              ].map((x) => (
                <div key={x.l} className="flex items-center justify-between">
                  <span className="text-sm text-indigo-100">{x.l}</span>
                  <span className="text-right">
                    <span className="tabular font-serif block text-lg font-semibold">{money(x.v, cur)}</span>
                    <span className="block text-[11px] text-indigo-200">
                      Tendencia {trendWord(x.t.slope)} · R² {num(x.t.r2, 2)}
                    </span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/20 pt-3">
                <span className="text-sm font-semibold">Flujo neto</span>
                <span className={cn("tabular font-serif text-2xl font-semibold", fc.nextNet < 0 && "text-rose-200")}>{money(fc.nextNet, cur, { sign: true })}</span>
              </div>
            </div>
          </div>
          <Card className="p-5">
            <CardHeader title="Tasa de ahorro promedio" subtitle="Últimos 6 meses completos" icon={Percent} tone="emerald" />
            <div className="mt-3">
              <Gauge value={Math.max(0, savingsRate6)} target={data.settings.savingsTarget / 100} display={pct(savingsRate6, 1)} label={`Objetivo ${data.settings.savingsTarget}% (marcador)`} size={210} />
            </div>
          </Card>
        </div>
      </section>

      {/* Ratios */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <Ratio label="Fondo de emergencia" value={`${num(emergencyMonths, 1)} meses`} hint="de gastos esenciales cubiertos" tone={emergencyMonths >= 6 ? "good" : emergencyMonths >= 3 ? "warn" : "bad"} icon={ShieldCheck} info="Liquidez actual ÷ gasto esencial mensual promedio (prioridad Necesidad). Recomendado: 3–6 meses." />
        <Ratio label="Deuda / ingreso" value={pct(dti)} hint={`${money(debtPayments, cur)} en cuotas/mes`} tone={dti <= 0.2 ? "good" : dti <= 0.36 ? "warn" : "bad"} icon={Scale} info="Cuotas mensuales de deuda ÷ ingreso mensual promedio. Saludable < 20%, aceptable < 36%." />
        <Ratio label="Volatilidad del gasto" value={pct(volatility)} hint="coeficiente de variación (6 m)" tone={volatility <= 0.15 ? "good" : volatility <= 0.3 ? "warn" : "bad"} icon={Activity} info="Desviación estándar del gasto mensual ÷ promedio. Cuanto menor, más predecible es tu gasto." />
        <Ratio label="Gasto fijo" value={pct(recurringShare)} hint="del gasto es recurrente" tone={recurringShare <= 0.5 ? "good" : recurringShare <= 0.65 ? "warn" : "bad"} icon={Layers} info="Porción del gasto marcada como recurrente. Un gasto fijo alto reduce tu flexibilidad." />
        <Ratio label="Gasto diario" value={money(dailySpend, cur)} hint="promedio por día" tone="neutral" icon={CalendarDays} info="Gasto mensual promedio (6 meses) ÷ 30,4 días." />
        <Ratio label="Margen mensual" value={money(avgInc - avgExp, cur, { sign: true })} hint="ingreso − gasto promedio" tone={avgInc - avgExp > 0 ? "good" : "bad"} icon={Wallet} info="Diferencia entre ingreso y gasto mensual promedio de los últimos 6 meses completos." />
      </section>

      {/* Comparativas */}
      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-3">
          <CardHeader title="Comparativa mensual" subtitle={`Ingresos y gastos · últimos ${months} meses`} icon={ChartColumn} action={<ChartLegend items={[{ label: "Ingresos", color: "#2E8A62" }, { label: "Gastos (trama)", color: "#B04848" }]} />} />
          <div className="mt-4">
            <MonthlyBars data={series} currency={cur} height={280} />
          </div>
        </Card>
        <Card className="p-5 xl:col-span-2">
          <CardHeader title={`${monthLabel(curKey, true)} vs. ${monthLabel(prevKey, true)}`} subtitle="Variación por categoría (mes en curso parcial)" icon={Activity} tone="cobalt" />
          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-right">Anterior</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparison.map((r) => {
                  const Icon = r.icon;
                  const DIcon = r.diff > 0 ? ArrowUpRight : r.diff < 0 ? ArrowDownRight : Minus;
                  return (
                    <tr key={r.name} className="transition hover:bg-slate-50/70">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2 font-semibold text-slate-700">
                          <Icon size={14} style={{ color: r.color }} /> {r.name}
                        </span>
                      </td>
                      <td className="tabular px-2 py-2 text-right text-slate-500">{money(r.prev, cur, { compact: true })}</td>
                      <td className="tabular px-2 py-2 text-right font-semibold text-slate-900">{money(r.now, cur, { compact: true })}</td>
                      <td className="px-2 py-2 text-right">
                        <span className={cn("inline-flex whitespace-nowrap items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold", r.diff > 0 ? "bg-rose-50 text-rose-600" : r.diff < 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                          <DIcon size={11} /> {pct(Math.abs(r.rel), 0)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Composición y matriz */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Composición del gasto en el tiempo" subtitle="Áreas apiladas por macro categoría" icon={Layers} tone="rose" />
          <div className="mt-4">
            <StackedAreaChart data={stackData} series={stackSeries} currency={cur} height={290} />
          </div>
          <div className="mt-3">
            <ChartLegend items={stackSeries.map((s) => ({ label: s.key, color: s.color }))} />
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Matriz de rendimiento" subtitle="Gasto por categoría × mes (intensidad = monto)" icon={Grid3x3} tone="indigo" />
          <div className="mt-4">
            <Heatmap rows={heatRows} columns={heatCols} values={heatValues} currency={cur} />
          </div>
        </Card>
      </section>

      {/* Desgloses porcentuales */}
      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Card className="p-5">
          <CardHeader title="Regla 50/30/20" subtitle="Tu distribución real vs. ideal" icon={Percent} tone="amber" />
          <div className="mt-5 space-y-4">
            {priorities.map((p) => {
              const color = p.value === "Necesidad" ? "#2B3F6B" : p.value === "Gusto" ? "#B5832A" : "#2E8A62";
              const over = p.value === "Inversión" ? p.share < p.ideal / 100 : p.share > p.ideal / 100;
              return (
                <div key={p.value}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{p.value}</span>
                    <span className="tabular font-semibold">
                      <span className={over ? "text-rose-600" : "text-emerald-600"}>{pct(p.share, 0)}</span>
                      <span className="text-slate-400"> / ideal {p.value === "Inversión" ? "≥" : "≤"} {p.ideal}%</span>
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.share * 100}%`, background: color }} />
                    <div className="absolute inset-y-0 w-0.5 bg-slate-900" style={{ left: `${p.ideal}%` }} title={`Ideal ${p.ideal}%`} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{money(p.amount, cur)} en el periodo</p>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Métodos de pago" subtitle="Cómo pagas tus consumos" icon={Wallet} tone="cobalt" />
          <div className="mt-4">
            <DonutChart data={methods} currency={cur} centerLabel="Gasto" height={180} />
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Fuentes de ingreso" subtitle="Diversificación de ingresos" icon={ArrowUpRight} tone="emerald" />
          <div className="mt-4">
            <DonutChart data={incomeSources} currency={cur} centerLabel="Ingresos" height={180} />
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Gasto por día de la semana" subtitle="Solo gastos variables" icon={CalendarDays} tone="violet" />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekday} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => money(v, cur, { compact: true })} />
                <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency={cur} />} />
                <Bar dataKey="Gasto" radius={[6, 6, 0, 0]}>
                  {weekday.map((w) => (
                    <Cell key={w.label} fill={w.Gasto === maxWeekday ? "#5A5F86" : "#DCDDE8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-500">
              Tu día de mayor gasto variable es el <b className="text-violet-600">{weekday.find((w) => w.Gasto === maxWeekday)?.label}</b>.
            </p>
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <CardHeader title="Comercios principales" subtitle={`Dónde se concentra tu gasto · últimos ${months} meses`} icon={Store} tone="rose" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {merchants.map((m, i) => {
            const e = windowExp.find((x) => x.merchant === m.name)!;
            const meta = expenseMeta(e.macro);
            const Icon = meta.icon;
            return (
              <div key={m.name} className="group flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100 transition hover:shadow-card">
                <span className="text-lg font-semibold text-slate-300">#{i + 1}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl transition" style={{ background: `${expenseColor(e.macro)}14`, color: expenseColor(e.macro) }}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {e.macro} · {pct(m.share, 1)} del total
                  </p>
                </div>
                <span className="tabular text-sm font-semibold text-slate-900">{money(m.value, cur)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
