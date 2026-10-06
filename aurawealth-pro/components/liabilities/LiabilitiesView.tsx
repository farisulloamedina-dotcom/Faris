"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Flame,
  HandCoins,
  Hourglass,
  Landmark,
  Lightbulb,
  Pencil,
  Percent,
  Plus,
  Receipt,
  Snowflake,
  Trash,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { Debt, Receivable } from "@/lib/types";
import { useData } from "@/lib/store/StoreProvider";
import { useUI } from "@/components/layout/UIProvider";
import {
  amortization,
  avgMonthly,
  debtInterestPaid,
  debtPaid,
  debtProgress,
  isReceivableOverdue,
  monthlyInterest,
  nextPaymentDate,
  receivableCollected,
  receivableOutstanding,
  receivableStatus,
  totalDebt,
  totalReceivable,
} from "@/lib/finance/calculations";
import { CATEGORICAL } from "@/lib/constants/catalog";
import { cn, dateLabel, daysBetween, money, pct, relativeDays, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, IconTile } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoTip } from "@/components/ui/InfoTip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BalanceCurve, YearlySplitBars } from "@/components/charts/AmortizationChart";
import { DonutChart } from "@/components/charts/DonutChart";

type Tab = "deudas" | "cobros";

function Stat({ label, value, tone, icon: Icon, info }: { label: string; value: string; tone: "rose" | "amber" | "indigo" | "emerald" | "cobalt"; icon: typeof Landmark; info?: string }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <IconTile icon={Icon} tone={tone} size="lg" />
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
          {info && <InfoTip>{info}</InfoTip>}
        </p>
        <p className="tabular truncate text-xl font-extrabold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

/* ---------------------------------- Deudas ---------------------------------- */

function debtStatus(d: Debt, today: string): { label: string; tone: BadgeTone; pulse?: boolean } {
  if (d.balance <= 0) return { label: "Liquidada", tone: "emerald" };
  if (d.monthlyPayment <= monthlyInterest(d)) return { label: "Cuota insuficiente", tone: "rose", pulse: true };
  if (d.dueDate < today) return { label: "Plazo vencido", tone: "rose", pulse: true };
  const days = daysBetween(today, nextPaymentDate(d, today));
  if (days <= 5) return { label: `Cuota en ${days} d`, tone: "amber", pulse: true };
  return { label: "Al día", tone: "indigo" };
}

function DebtCard({ debt, onDelete }: { debt: Debt; onDelete: () => void }) {
  const { settings } = useData();
  const ui = useUI();
  const cur = settings.currency;
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState(0);
  const status = debtStatus(debt, today);
  const base = useMemo(() => amortization(debt.balance, debt.annualRate, debt.monthlyPayment, today), [debt, today]);
  const boosted = useMemo(() => amortization(debt.balance, debt.annualRate, debt.monthlyPayment + extra, today), [debt, extra, today]);
  const progress = debtProgress(debt);

  return (
    <Card hover={!open} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <IconTile icon={Landmark} tone="rose" size="lg" />
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-slate-900">{debt.name}</h3>
              <p className="truncate text-xs text-slate-500">
                {debt.lender || "—"} · {debt.type}
              </p>
            </div>
          </div>
          <Badge tone={status.tone} pulse={status.pulse}>
            {status.label}
          </Badge>
        </div>

        <div className="mt-5 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saldo pendiente</p>
            <p className="tabular text-2xl font-extrabold text-slate-900">{money(debt.balance, cur)}</p>
          </div>
          <p className="text-right text-xs text-slate-500">
            de <b className="tabular text-slate-700">{money(debt.principal, cur)}</b>
            <br />
            <span className="font-bold text-emerald-600">{pct(progress, 0)} pagado</span>
          </p>
        </div>
        <ProgressBar value={progress} tone="emerald" size="md" className="mt-3" />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { l: "Tasa anual", v: `${debt.annualRate.toFixed(2)}%` },
            { l: "Cuota", v: money(debt.monthlyPayment, cur) },
            { l: "Interés/mes", v: money(monthlyInterest(debt), cur) },
            { l: "Próxima cuota", v: debt.balance > 0 ? dateLabel(nextPaymentDate(debt, today)).slice(0, 6) : "—" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-slate-50 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{x.l}</p>
              <p className="tabular text-sm font-bold text-slate-800">{x.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Hourglass size={13} className="text-indigo-400" />
            {base.feasible ? (
              <>
                Liquidación estimada <b className="text-slate-700">{base.payoffDate ? dateLabel(base.payoffDate) : "—"}</b> ({base.months} meses)
              </>
            ) : (
              <b className="text-rose-600">La cuota no cubre los intereses</b>
            )}
          </p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="primary" icon={Wallet} disabled={debt.balance <= 0} onClick={() => ui.openDebtPayment(debt)}>
              Pagar
            </Button>
            <Button size="icon" variant="ghost" onClick={() => ui.openDebt(debt)} aria-label="Editar">
              <Pencil size={15} />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Eliminar" className="hover:text-rose-600">
              <Trash size={15} />
            </Button>
            <Button size="icon" variant="soft" onClick={() => setOpen((o) => !o)} aria-label="Detalle" aria-expanded={open}>
              <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/60">
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Amortización proyectada · saldo</p>
                {base.feasible && base.rows.length ? <BalanceCurve rows={base.rows} currency={cur} height={180} /> : <p className="text-sm text-slate-400">Sin proyección disponible.</p>}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Capital vs. interés por año</p>
                {base.feasible && base.rows.length ? <YearlySplitBars rows={base.rows} currency={cur} height={180} /> : <p className="text-sm text-slate-400">—</p>}
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Lightbulb size={15} className="text-amber-500" /> Simulador de pago extra
                </p>
                <input type="range" min={0} max={Math.max(100, Math.round(debt.monthlyPayment * 2))} step={10} value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="mt-3 w-full accent-indigo-600" aria-label="Pago extra mensual" />
                <p className="mt-1 text-xs text-slate-500">
                  Pago extra mensual: <b className="tabular text-indigo-600">{money(extra, cur)}</b>
                </p>
                {extra > 0 && base.feasible && boosted.feasible && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-emerald-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase text-emerald-600">Meses ahorrados</p>
                      <p className="tabular text-lg font-extrabold text-emerald-700">{base.months - boosted.months}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase text-emerald-600">Intereses ahorrados</p>
                      <p className="tabular text-lg font-extrabold text-emerald-700">{money(base.totalInterest - boosted.totalInterest, cur)}</p>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-400">
                  Intereses restantes con la cuota actual: <b className="text-slate-600">{base.feasible ? money(base.totalInterest, cur) : "∞"}</b> · Intereses ya pagados: <b className="text-slate-600">{money(debtInterestPaid(debt), cur)}</b>
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
                <p className="text-sm font-bold text-slate-800">Historial de pagos ({debt.payments.length})</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
                  {debt.payments.length === 0 && <li className="text-xs text-slate-400">Aún no hay pagos registrados.</li>}
                  {[...debt.payments].reverse().map((p) => (
                    <li key={p.id} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50">
                      <span className="font-semibold text-slate-600">{dateLabel(p.date)}</span>
                      <span className="text-slate-400">
                        Cap. {money(p.principal, cur)} · Int. {money(p.interest, cur)}
                      </span>
                      <span className="tabular font-bold text-slate-800">{money(p.amount, cur)}</span>
                      <button onClick={() => ui.removeWithUndo({ type: "debt/unpay", debtId: debt.id, paymentId: p.id }, "Pago anulado")} className="rounded p-1 text-slate-300 opacity-0 transition hover:text-rose-600 group-hover:opacity-100" aria-label="Anular pago">
                        <Trash size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-slate-400">Capital amortizado: {money(debtPaid(debt), cur)} · Inicio {dateLabel(debt.startDate)} · Límite {dateLabel(debt.dueDate)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function DebtsTab() {
  const data = useData();
  const ui = useUI();
  const cur = data.settings.currency;
  const [toDelete, setToDelete] = useState<Debt | null>(null);
  const active = data.debts.filter((d) => d.balance > 0);
  const monthlyPayments = active.reduce((a, d) => a + Math.min(d.monthlyPayment, d.balance), 0);
  const interest = active.reduce((a, d) => a + monthlyInterest(d), 0);
  const avgIncome = avgMonthly(data.transactions, "income");
  const dti = avgIncome > 0 ? monthlyPayments / avgIncome : 0;
  const avalanche = [...active].sort((a, b) => b.annualRate - a.annualRate);
  const snowball = [...active].sort((a, b) => a.balance - b.balance);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Deuda total" value={money(totalDebt(data.debts), cur)} tone="rose" icon={Landmark} />
        <Stat label="Cuotas mensuales" value={money(monthlyPayments, cur)} tone="indigo" icon={CalendarClock} />
        <Stat label="Interés mensual" value={money(interest, cur)} tone="amber" icon={Percent} info="Interés estimado del próximo mes sobre los saldos actuales." />
        <Stat label="Ratio deuda / ingreso" value={pct(dti)} tone={dti > 0.36 ? "rose" : "emerald"} icon={CircleDollarSign} info="Cuotas mensuales ÷ ingreso mensual promedio (3 meses). Saludable por debajo de 36%." />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {data.debts.length === 0 ? (
            <EmptyState icon={Landmark} title="Sin deudas registradas" description="Registra préstamos, tarjetas o hipotecas para controlar intereses y amortización." action={<Button variant="primary" icon={Plus} onClick={() => ui.openDebt()}>Nueva deuda</Button>} />
          ) : (
            data.debts.map((d) => <DebtCard key={d.id} debt={d} onDelete={() => setToDelete(d)} />)
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader title="Estrategia de pago" subtitle="¿Qué deuda atacar primero?" icon={Lightbulb} tone="amber" />
            <div className="mt-4 space-y-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                  <Flame size={13} /> Avalancha (menor interés total)
                </p>
                <ol className="mt-2 space-y-1.5">
                  {avalanche.map((d, i) => (
                    <li key={d.id} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">{i + 1}</span>
                      <span className="flex-1 truncate font-semibold text-slate-700">{d.name}</span>
                      <span className="tabular text-xs font-bold text-slate-500">{d.annualRate}%</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                  <Snowflake size={13} /> Bola de nieve (victorias rápidas)
                </p>
                <ol className="mt-2 space-y-1.5">
                  {snowball.map((d, i) => (
                    <li key={d.id} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{i + 1}</span>
                      <span className="flex-1 truncate font-semibold text-slate-700">{d.name}</span>
                      <span className="tabular text-xs font-bold text-slate-500">{money(d.balance, cur, { compact: true })}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {active.length === 0 && <p className="text-sm text-emerald-600">¡Sin deudas activas! 🎉</p>}
            </div>
          </Card>
          {active.length > 0 && (
            <Card className="p-5">
              <CardHeader title="Composición de la deuda" subtitle="Saldo por crédito" icon={Landmark} tone="rose" />
              <div className="mt-4">
                <DonutChart data={active.map((d, i) => ({ name: d.name, value: d.balance, color: CATEGORICAL[i % CATEGORICAL.length] }))} currency={cur} centerLabel="Deuda" height={190} />
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="¿Eliminar esta deuda?"
        description={<>Se eliminará <b>{toDelete?.name}</b> con todo su historial de pagos. Podrás deshacerlo.</>}
        onConfirm={() => toDelete && ui.removeWithUndo({ type: "debt/delete", id: toDelete.id }, "Deuda eliminada")}
      />
    </>
  );
}

/* ------------------------------ Cuentas por cobrar ----------------------------- */

const STATUS_TONE: Record<string, BadgeTone> = { Pendiente: "amber", Parcial: "cobalt", Cobrado: "emerald" };

function ReceivablesTab() {
  const data = useData();
  const ui = useUI();
  const cur = data.settings.currency;
  const today = todayISO();
  const [filter, setFilter] = useState<"todos" | "Pendiente" | "Parcial" | "Cobrado" | "vencidos">("todos");
  const [toDelete, setToDelete] = useState<Receivable | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = data.receivables
    .filter((r) => (filter === "todos" ? true : filter === "vencidos" ? isReceivableOverdue(r, today) : receivableStatus(r) === filter))
    .sort((a, b) => {
      const sa = receivableStatus(a) === "Cobrado" ? 1 : 0;
      const sb = receivableStatus(b) === "Cobrado" ? 1 : 0;
      return sa - sb || a.dueDate.localeCompare(b.dueDate);
    });
  const overdue = data.receivables.filter((r) => isReceivableOverdue(r, today));
  const next30 = data.receivables.filter((r) => receivableStatus(r) !== "Cobrado" && !isReceivableOverdue(r, today) && daysBetween(today, r.dueDate) <= 30);
  const collected = data.receivables.reduce((a, r) => a + receivableCollected(r), 0);

  const aging = [
    { name: "Al día", value: data.receivables.filter((r) => receivableStatus(r) !== "Cobrado" && r.dueDate >= today).reduce((a, r) => a + receivableOutstanding(r), 0), color: "#4F46E5" },
    { name: "Vencido 1–30 d", value: overdue.filter((r) => daysBetween(r.dueDate, today) <= 30).reduce((a, r) => a + receivableOutstanding(r), 0), color: "#EDA100" },
    { name: "Vencido 31–60 d", value: overdue.filter((r) => { const d = daysBetween(r.dueDate, today); return d > 30 && d <= 60; }).reduce((a, r) => a + receivableOutstanding(r), 0), color: "#EB6834" },
    { name: "Vencido > 60 d", value: overdue.filter((r) => daysBetween(r.dueDate, today) > 60).reduce((a, r) => a + receivableOutstanding(r), 0), color: "#E34948" },
  ].filter((x) => x.value > 0);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total por cobrar" value={money(totalReceivable(data.receivables), cur)} tone="amber" icon={Receipt} />
        <Stat label="Vencido" value={money(overdue.reduce((a, r) => a + receivableOutstanding(r), 0), cur)} tone="rose" icon={TriangleAlert} />
        <Stat label="Vence en 30 días" value={money(next30.reduce((a, r) => a + receivableOutstanding(r), 0), cur)} tone="cobalt" icon={Clock} />
        <Stat label="Cobrado histórico" value={money(collected, cur)} tone="emerald" icon={HandCoins} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card hover={false} className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <Tabs
              size="sm"
              value={filter}
              onChange={setFilter}
              items={[
                { value: "todos", label: "Todos", count: data.receivables.length },
                { value: "Pendiente", label: "Pendiente" },
                { value: "Parcial", label: "Parcial" },
                { value: "Cobrado", label: "Cobrado" },
                { value: "vencidos", label: "Vencidos", count: overdue.length },
              ]}
            />
            <Button size="sm" variant="primary" icon={Plus} onClick={() => ui.openReceivable()}>
              Nueva cuenta
            </Button>
          </div>
          {list.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Receipt} tone="amber" title="Nada por aquí" description="No hay cuentas por cobrar con este filtro." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((r) => {
                const status = receivableStatus(r);
                const late = isReceivableOverdue(r, today);
                const days = daysBetween(today, r.dueDate);
                const progress = r.amount > 0 ? receivableCollected(r) / r.amount : 0;
                return (
                  <li key={r.id} className="group p-4 transition hover:bg-amber-50/30">
                    <div className="flex flex-wrap items-center gap-4">
                      <IconTile icon={late ? TriangleAlert : Receipt} tone={late ? "rose" : status === "Cobrado" ? "emerald" : "amber"} size="lg" />
                      <div className="min-w-[180px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-slate-900">{r.debtor}</p>
                          <Badge tone={STATUS_TONE[status]} dot>
                            {status}
                          </Badge>
                          {late && (
                            <Badge tone="rose" pulse>
                              Vencido {-days} d
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {r.concept || "—"} · {r.type}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <ProgressBar value={progress} tone={status === "Cobrado" ? "emerald" : "amber"} size="sm" className="max-w-[220px]" />
                          <span className="text-[11px] font-bold text-slate-400">{pct(progress, 0)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-lg font-extrabold text-slate-900">{money(receivableOutstanding(r), cur)}</p>
                        <p className="text-[11px] text-slate-400">
                          de {money(r.amount, cur)} · {status === "Cobrado" ? "completado" : `vence ${relativeDays(r.dueDate, today)}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="success" icon={HandCoins} disabled={status === "Cobrado"} onClick={() => ui.openCollect(r)}>
                          Cobrar
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => ui.openReceivable(r)} aria-label="Editar">
                          <Pencil size={15} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(r)} aria-label="Eliminar" className="hover:text-rose-600">
                          <Trash size={15} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setExpanded((e) => (e === r.id ? null : r.id))} aria-label="Ver cobros" aria-expanded={expanded === r.id}>
                          <ChevronDown size={15} className={cn("transition-transform", expanded === r.id && "rotate-180")} />
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded === r.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="ml-16 mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
                            <p className="text-xs font-bold text-slate-600">
                              Emitida {dateLabel(r.issueDate)} · Vence {dateLabel(r.dueDate)} {r.notes && `· ${r.notes}`}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {r.payments.length === 0 && <li className="text-xs text-slate-400">Sin cobros registrados.</li>}
                              {r.payments.map((p) => (
                                <li key={p.id} className="group/p flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-slate-50">
                                  <span className="text-slate-500">{dateLabel(p.date)}</span>
                                  <span className="flex items-center gap-2">
                                    <b className="tabular text-emerald-600">+{money(p.amount, cur)}</b>
                                    <button onClick={() => ui.removeWithUndo({ type: "receivable/uncollect", receivableId: r.id, paymentId: p.id }, "Cobro anulado")} className="rounded p-0.5 text-slate-300 opacity-0 hover:text-rose-600 group-hover/p:opacity-100" aria-label="Anular cobro">
                                      <Trash size={12} />
                                    </button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Antigüedad de saldos" subtitle="Monto pendiente por antigüedad" icon={Clock} tone="amber" />
          <div className="mt-4">{aging.length ? <DonutChart data={aging} currency={cur} centerLabel="Pendiente" height={200} /> : <p className="text-sm text-emerald-600">Todo cobrado. 🎉</p>}</div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="¿Eliminar cuenta por cobrar?"
        description={<>Se eliminará <b>{toDelete?.debtor}</b> — {toDelete?.concept}. Podrás deshacerlo.</>}
        onConfirm={() => toDelete && ui.removeWithUndo({ type: "receivable/delete", id: toDelete.id }, "Cuenta por cobrar eliminada")}
      />
    </>
  );
}

export function LiabilitiesView() {
  const data = useData();
  const ui = useUI();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "cobros" ? "cobros" : "deudas";

  return (
    <>
      <PageHeader
        eyebrow="Módulo 3"
        title="Pasivos y Activos a Cobrar"
        description="Controla créditos con cálculo de intereses y amortización visual, y da seguimiento a cada peso que te deben."
        actions={
          <>
            <Button variant="secondary" icon={Receipt} onClick={() => ui.openReceivable()}>
              Por cobrar
            </Button>
            <Button variant="primary" icon={Landmark} onClick={() => ui.openDebt()}>
              Nueva deuda
            </Button>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={(t) => router.replace(`${pathname}?tab=${t}`, { scroll: false })}
        items={[
          { value: "deudas", label: "Deudas", icon: Landmark, count: data.debts.length },
          { value: "cobros", label: "Cuentas por cobrar", icon: Receipt, count: data.receivables.length },
        ]}
      />
      {tab === "deudas" ? <DebtsTab /> : <ReceivablesTab />}
    </>
  );
}
