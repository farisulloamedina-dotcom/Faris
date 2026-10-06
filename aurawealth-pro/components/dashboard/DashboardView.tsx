"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Download,
  Flame,
  Info,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
    Target,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useData } from "@/lib/store/StoreProvider";
import { useAlerts, useKpis } from "@/lib/hooks/useFinance";
import { useExcelSync } from "@/lib/excel/ExcelSyncProvider";
import { useUI } from "@/components/layout/UIProvider";
import {
  avgMonthlySavings,
  delta,
  expenses,
  goalForecast,
  goalProgress,
  goalSaved,
  groupSum,
  inMonth,
  isReceivableOverdue,
  monthlySeries,
  netWorthSeries,
  nextPaymentDate,
  receivableOutstanding,
  receivableStatus,
  type AlertLevel,
} from "@/lib/finance/calculations";
import { dateLabel, daysBetween, money, monthKey, monthLabel, pct, relativeDays, todayISO } from "@/lib/format";
import { expenseColor, GOAL_COLORS, GOAL_ICONS } from "@/lib/constants/catalog";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader, IconTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { ChartLegend } from "@/components/charts/Legend";
import { TxIcon, txSubtitle, txTitle } from "@/components/transactions/TxVisuals";

const ALERT_STYLE: Record<AlertLevel, { icon: typeof Info; cls: string; badge: "rose" | "amber" | "indigo" | "emerald"; label: string }> = {
  critical: { icon: CircleAlert, cls: "bg-rose-50 text-rose-600 ring-rose-100", badge: "rose", label: "Crítica" },
  warning: { icon: TriangleAlert, cls: "bg-amber-50 text-amber-600 ring-amber-100", badge: "amber", label: "Atención" },
  info: { icon: Info, cls: "bg-indigo-50 text-indigo-600 ring-indigo-100", badge: "indigo", label: "Info" },
  success: { icon: CircleCheck, cls: "bg-emerald-50 text-emerald-600 ring-emerald-100", badge: "emerald", label: "Logro" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export function DashboardView() {
  const data = useData();
  const k = useKpis();
  const alerts = useAlerts();
  const ui = useUI();
  const { exportNow, exporting } = useExcelSync();
  const cur = data.settings.currency;
  const [donutRange, setDonutRange] = useState<"mes" | "trimestre" | "año">("mes");

  const series = useMemo(() => monthlySeries(data.transactions, 12), [data.transactions]);
  const nw = useMemo(() => netWorthSeries(data, 12), [data]);
  const today = todayISO();

  const donut = useMemo(() => {
    const months = donutRange === "mes" ? 1 : donutRange === "trimestre" ? 3 : 12;
    const keys = series.slice(-months).map((s) => s.key);
    const exp = expenses(data.transactions).filter((e) => keys.includes(monthKey(e.date)));
    return groupSum(exp, (e) => e.macro, (e) => e.amount).map((g) => ({ name: g.name, value: g.value, color: expenseColor(g.name) }));
  }, [data.transactions, donutRange, series]);

  const upcoming = useMemo(() => {
    const items: { id: string; title: string; detail: string; date: string; amount: number; kind: "debt" | "receivable"; overdue: boolean }[] = [];
    for (const d of data.debts) if (d.balance > 0) {
      const date = nextPaymentDate(d);
      items.push({ id: d.id, title: d.name, detail: `Cuota · ${d.lender}`, date, amount: Math.min(d.monthlyPayment, d.balance), kind: "debt", overdue: false });
    }
    for (const r of data.receivables) if (receivableStatus(r) !== "Cobrado")
      items.push({ id: r.id, title: r.debtor, detail: r.concept, date: r.dueDate, amount: receivableOutstanding(r), kind: "receivable", overdue: isReceivableOverdue(r) });
    return items.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 5);
  }, [data.debts, data.receivables]);

  const globalSavings = avgMonthlySavings(data.transactions);
  const curMonth = inMonth(data.transactions, monthKey(today));
  const budget = data.settings.monthlyBudget;
  const budgetRatio = budget > 0 ? k.expense / budget : 0;
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const urgent = alerts.filter((a) => a.level === "critical" || a.level === "warning").length;

  return (
    <>
      {/* Encabezado */}
      <section className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{dateLabel(today, "long")}</p>
          <h1 className="mt-2 font-serif text-[34px] font-semibold leading-tight tracking-tight text-ink">
            {greeting()}{data.settings.userName ? `, ${data.settings.userName}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Este mes registras <span className="tabular font-medium text-ink">{money(k.income, cur)}</span> en ingresos y{" "}
            <span className="tabular font-medium text-ink">{money(k.expense, cur)}</span> en gastos.{" "}
            {urgent > 0 ? (
              <>
                Hay <span className="font-medium text-rose-600">{urgent} aviso{urgent > 1 ? "s" : ""}</span> que requieren atención.
              </>
            ) : (
              "No hay avisos pendientes."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={ArrowUpRight} onClick={() => ui.openTransaction("income")}>
            Ingreso
          </Button>
          <Button variant="secondary" icon={ArrowDownRight} onClick={() => ui.openTransaction("expense")}>
            Gasto
          </Button>
          <Button variant="primary" icon={Download} onClick={exportNow} loading={exporting}>
            Exportar Excel
          </Button>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Patrimonio neto"
          value={k.netWorth}
          format={(n) => money(n, cur)}
          icon={Scale}
          theme="indigo"
          delta={delta(k.netWorth, k.netWorthPrev)}
          spark={nw.map((p) => p.netWorth)}
          info="Liquidez disponible + cuentas por cobrar pendientes − saldo total de deudas."
        />
        <KpiCard
          label="Flujo de caja (mes)"
          value={k.cashflow}
          format={(n) => money(n, cur, { sign: true })}
          icon={Wallet}
          theme="emerald"
          delta={delta(k.cashflow, k.cashflowPrev)}
          spark={series.map((s) => s.net)}
          info="Ingresos menos gastos del mes en curso. Positivo = estás generando excedente."
        />
        <KpiCard
          label="Tasa de ahorro"
          value={k.savingsRate}
          format={(n) => pct(n)}
          icon={PiggyBank}
          theme="cobalt"
          delta={k.savingsRate - k.savingsRatePrev}
          deltaLabel="pts vs. mes anterior"
          spark={series.map((s) => s.savingsRate)}
          info={`Porcentaje de tus ingresos que conservas. Objetivo configurado: ${data.settings.savingsTarget}%.`}
        />
        <KpiCard
          label="Deuda total"
          value={k.totalDebt}
          format={(n) => money(n, cur)}
          icon={Landmark}
          theme="rose"
          invertDelta
          delta={delta(k.totalDebt, k.totalDebtPrev)}
          spark={nw.map((p) => p.debt)}
          info="Suma de saldos pendientes de todos tus créditos. Una variación negativa es buena."
        />
      </section>

      {/* Bento principal */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <CardHeader
            title="Ingresos vs. gastos"
            subtitle="Evolución de los últimos 12 meses"
            icon={TrendingUp}
            action={
              <ChartLegend
                items={[
                  { label: "Ingresos", color: "#2E8A62", value: money(series.reduce((a, s) => a + s.income, 0), cur, { compact: true }) },
                  { label: "Gastos", color: "#B04848", dashed: true, value: money(series.reduce((a, s) => a + s.expense, 0), cur, { compact: true }) },
                ]}
              />
            }
          />
          <div className="mt-4">
            <CashflowChart data={series} currency={cur} height={290} />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Distribución de gastos" subtitle="Por macro categoría" icon={Flame} tone="rose" />
          <Tabs
            className="mt-4"
            size="sm"
            value={donutRange}
            onChange={setDonutRange}
            items={[
              { value: "mes", label: "Mes" },
              { value: "trimestre", label: "Trimestre" },
              { value: "año", label: "12 meses" },
            ]}
          />
          <div className="mt-4">
            {donut.length ? <DonutChart data={donut} currency={cur} legend={false} height={210} /> : <EmptyState icon={Flame} title="Sin gastos" description="Aún no hay gastos en este periodo." />}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {donut.slice(0, 6).map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-600">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="tabular font-semibold text-slate-900">{pct(d.value / Math.max(1, donut.reduce((a, x) => a + x.value, 0)), 0)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Alertas inteligentes */}
        <Card className="p-5">
          <CardHeader title="Alertas inteligentes" subtitle={`${alerts.length} señales detectadas`} icon={BellRing} tone="amber" action={urgent > 0 && <Badge tone="rose" pulse>{urgent} urgentes</Badge>} />
          <ul className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {alerts.length === 0 && <li className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Sin alertas. ¡Excelente salud financiera!</li>}
            {alerts.map((a) => {
              const s = ALERT_STYLE[a.level];
              return (
                <li key={a.id}>
                  <Link href={a.href} className="group flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-white hover:shadow-card">
                    <span className={`rounded-xl p-2 ring-1 ${s.cls}`}>
                      <s.icon size={16} strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">{a.title}</span>
                      </span>
                      <span className="block text-xs text-slate-500">{a.detail}</span>
                    </span>
                    <ArrowRight size={14} className="mt-1 text-slate-300 transition group-hover:text-indigo-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Presupuesto + próximos vencimientos */}
        <Card className="p-5">
          <CardHeader title="Presupuesto del mes" subtitle={`Día ${dayOfMonth} de ${daysInMonth}`} icon={Target} tone="cobalt" />
          {budget > 0 ? (
            <div className="mt-4 flex items-center gap-5">
              <ProgressRing value={budgetRatio} size={104} stroke={11} color={budgetRatio >= 1 ? "#B04848" : budgetRatio >= 0.8 ? "#B5832A" : "#2E8A62"}>
                <div className="text-center">
                  <p className="tabular font-serif text-xl font-semibold text-slate-900">{Math.round(budgetRatio * 100)}%</p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">usado</p>
                </div>
              </ProgressRing>
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Gastado</span><b className="tabular">{money(k.expense, cur)}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Presupuesto</span><b className="tabular">{money(budget, cur)}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Disponible</span><b className={`tabular ${budget - k.expense < 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(budget - k.expense, cur)}</b></div>
                <p className="text-[11px] text-slate-400">Ritmo ideal: {pct(dayOfMonth / daysInMonth, 0)} del mes transcurrido · {curMonth.length} movimientos</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Define un presupuesto mensual en <Link className="font-semibold text-indigo-600" href="/excel?tab=preferencias">Preferencias</Link>.
            </p>
          )}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <CalendarClock size={13} /> Próximos vencimientos
            </p>
            <ul className="space-y-1.5">
              {upcoming.length === 0 && <li className="text-sm text-slate-400">Nada pendiente.</li>}
              {upcoming.map((u) => (
                <li key={u.kind + u.id}>
                  <Link href={`/pasivos?tab=${u.kind === "debt" ? "deudas" : "cobros"}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50">
                    <IconTile icon={u.kind === "debt" ? Landmark : Receipt} tone={u.kind === "debt" ? "rose" : "amber"} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{u.title}</span>
                      <span className={`block text-[11px] ${u.overdue ? "font-semibold text-rose-600" : "text-slate-400"}`}>{u.overdue ? `Vencido ${relativeDays(u.date)}` : `${dateLabel(u.date)} · ${relativeDays(u.date)}`}</span>
                    </span>
                    <span className={`tabular text-sm font-semibold ${u.kind === "debt" ? "text-rose-600" : "text-amber-600"}`}>
                      {u.kind === "debt" ? "−" : "+"}
                      {money(u.amount, cur)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Metas */}
        <Card className="p-5 lg:col-span-2 xl:col-span-1">
          <CardHeader title="Metas en progreso" subtitle={`${money(k.goalsSaved, cur)} acumulados`} icon={PiggyBank} tone="emerald" action={<Link href="/metas" className="text-xs font-semibold text-indigo-600 hover:underline">Ver todas</Link>} />
          <ul className="mt-4 space-y-4">
            {data.goals.length === 0 && <EmptyState icon={Target} title="Sin metas" description="Crea tu primera meta de ahorro." action={<Button variant="soft" size="sm" onClick={() => ui.openGoal()}>Crear meta</Button>} />}
            {data.goals.slice(0, 4).map((g) => {
              const Icon = GOAL_ICONS[g.icon];
              const c = GOAL_COLORS[g.color];
              const f = goalForecast(g, globalSavings);
              const p = goalProgress(g);
              return (
                <li key={g.id} className="group">
                  <div className="mb-1.5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl transition" style={{ background: c.soft, color: c.solid }}>
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">{g.name}</span>
                        <span className="tabular text-xs font-semibold" style={{ color: c.solid }}>{pct(p, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="tabular">{money(goalSaved(g), cur)} / {money(g.target, cur)}</span>
                        <span>{f.achieved ? "¡Lograda!" : f.etaDate ? `ETA ${monthLabel(f.etaDate.slice(0, 7))}` : "Sin ritmo"}</span>
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={p} tone={g.color === "cobalt" ? "cobalt" : g.color} size="sm" />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {/* Movimientos recientes */}
        <Card className="p-5 xl:col-span-3">
          <CardHeader title="Actividad reciente" subtitle="Últimos movimientos registrados" icon={Wallet} action={<Link href="/transacciones?tab=todos" className="text-xs font-semibold text-indigo-600 hover:underline">Ver libro completo</Link>} />
          <ul className="mt-3 divide-y divide-slate-100">
            {data.transactions.slice(0, 7).map((t) => (
              <li key={t.id}>
                <button onClick={() => ui.openTransaction(t.kind, t)} className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-white">
                  <TxIcon tx={t} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{txTitle(t)}</span>
                    <span className="block truncate text-xs text-slate-400">{txSubtitle(t)}</span>
                  </span>
                  <span className="text-right">
                    <span className={`tabular block text-sm font-semibold ${t.kind === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                      {t.kind === "income" ? "+" : "−"}
                      {money(t.amount, cur)}
                    </span>
                    <span className="block text-[11px] text-slate-400">{relativeDays(t.date, today)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Patrimonio */}
        <Card className="p-5 xl:col-span-2">
          <CardHeader title="Patrimonio neto" subtitle="Cierre de cada mes" icon={Scale} />
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tabular font-serif text-2xl font-semibold text-slate-900">{money(k.netWorth, cur)}</span>
            <span className={`text-xs font-semibold ${k.netWorth >= (nw[0]?.netWorth ?? 0) ? "text-emerald-600" : "text-rose-600"}`}>
              {money(k.netWorth - (nw[0]?.netWorth ?? 0), cur, { sign: true })} en 12 meses
            </span>
          </div>
          <div className="mt-3">
            <NetWorthChart data={nw} currency={cur} height={230} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Liquidez", v: k.liquidity, c: "text-indigo-600" },
              { l: "Por cobrar", v: k.receivable, c: "text-amber-600" },
              { l: "Deudas", v: -k.totalDebt, c: "text-rose-600" },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-slate-50 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{x.l}</p>
                <p className={`tabular text-sm font-semibold ${x.c}`}>{money(x.v, cur, { compact: true })}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/transacciones?tab=gastos", label: "Analizar gastos", icon: ArrowDownRight },
          { href: "/pasivos?tab=deudas", label: "Plan de deudas", icon: Landmark },
          { href: "/analitica", label: "Proyecciones", icon: TrendingUp },
          { href: "/excel", label: "Centro Excel", icon: Download },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="group glass card-hover flex items-center gap-3 rounded-3xl px-4 py-3.5">
            <q.icon size={17} strokeWidth={1.8} className="text-indigo-700" />
            <span className="text-sm font-medium text-ink">{q.label}</span>
            <ArrowRight size={15} className="ml-auto text-slate-300 transition-colors group-hover:text-indigo-700" />
          </Link>
        ))}
      </section>
      <p className="text-center text-[11px] text-slate-400">Días hasta fin de mes: {daysBetween(today, `${monthKey(today)}-${String(daysInMonth).padStart(2, "0")}`)} · Datos guardados localmente en tu navegador</p>
    </>
  );
}
