"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Funnel,
  Pencil,
  Repeat,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash,
  X,
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useData } from "@/lib/store/StoreProvider";
import { useUI } from "@/components/layout/UIProvider";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, PRIORITIES, RECEPTION_METHODS, expenseColor, BRAND } from "@/lib/constants/catalog";
import { groupSum, totalOf } from "@/lib/finance/calculations";
import { addMonths, cn, dateLabel, money, monthKey, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Switch } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { PriorityBadge, TxIcon, txSubtitle, txTitle } from "./TxVisuals";

type Tab = "todos" | "ingresos" | "gastos";
type Preset = "mes" | "anterior" | "3m" | "año" | "todo" | "custom";
type SortKey = "date" | "amount" | "category";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "mes", label: "Este mes" },
  { value: "anterior", label: "Mes anterior" },
  { value: "3m", label: "3 meses" },
  { value: "año", label: "Este año" },
  { value: "todo", label: "Todo" },
  { value: "custom", label: "Personalizado" },
];

function presetRange(p: Preset, from: string, to: string): [string | undefined, string | undefined] {
  const t = todayISO();
  const m = `${monthKey(t)}-01`;
  switch (p) {
    case "mes":
      return [m, undefined];
    case "anterior": {
      const s = addMonths(m, -1);
      const e = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 0);
      return [s, `${s.slice(0, 7)}-${String(e.getDate()).padStart(2, "0")}`];
    }
    case "3m":
      return [addMonths(m, -2), undefined];
    case "año":
      return [`${t.slice(0, 4)}-01-01`, undefined];
    case "custom":
      return [from || undefined, to || undefined];
    default:
      return [undefined, undefined];
  }
}

const PAGE_SIZE = 15;

/** Se remonta cuando cambia `?q=` (búsqueda global desde la barra superior). */
export function TransactionsView() {
  const q = useSearchParams().get("q") ?? "";
  return <TransactionsInner key={q} />;
}

function TransactionsInner() {
  const data = useData();
  const ui = useUI();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const cur = data.settings.currency;

  const tab = (["todos", "ingresos", "gastos"].includes(params.get("tab") ?? "") ? params.get("tab") : "todos") as Tab;
  const setTab = (t: Tab) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", t);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    setCategories([]);
    setPage(0);
  };

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [preset, setPreset] = useState<Preset>(params.get("q") ? "todo" : "3m");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [priority, setPriority] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);

  const [rangeFrom, rangeTo] = presetRange(preset, from, to);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    const list = data.transactions.filter((t) => {
      if (tab === "ingresos" && t.kind !== "income") return false;
      if (tab === "gastos" && t.kind !== "expense") return false;
      if (rangeFrom && t.date < rangeFrom) return false;
      if (rangeTo && t.date > rangeTo) return false;
      const cat = t.kind === "income" ? t.category : t.macro;
      if (categories.length && !categories.includes(cat)) return false;
      if (method && t.method !== method) return false;
      if (priority.length && (t.kind !== "expense" || !priority.includes(t.priority))) return false;
      if (Number.isFinite(min) && t.amount < min) return false;
      if (Number.isFinite(max) && t.amount > max) return false;
      if (recurringOnly && !t.recurring) return false;
      if (q) {
        const hay = [t.notes, t.kind === "income" ? `${t.source} ${t.category}` : `${t.merchant} ${t.macro} ${t.micro}`, t.method, String(t.amount)].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const catOf = (t: Transaction) => (t.kind === "income" ? t.category : t.macro);
    return list.sort((a, b) => {
      const v = sort.key === "date" ? a.date.localeCompare(b.date) : sort.key === "amount" ? a.amount - b.amount : catOf(a).localeCompare(catOf(b));
      return v * sort.dir || b.date.localeCompare(a.date);
    });
  }, [data.transactions, tab, rangeFrom, rangeTo, categories, method, priority, minAmount, maxAmount, recurringOnly, search, sort]);

  const incomeTotal = totalOf(filtered.filter((t) => t.kind === "income"));
  const expenseTotal = totalOf(filtered.filter((t) => t.kind === "expense"));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages - 1);
  const rows = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  const breakdown = useMemo(() => {
    const showIncome = tab === "ingresos";
    const src = filtered.filter((t) => (showIncome ? t.kind === "income" : t.kind === "expense"));
    return groupSum(src, (t) => (t.kind === "income" ? t.category : t.macro), (t) => t.amount).map((g) => {
      const meta = showIncome ? INCOME_CATEGORIES.find((c) => c.value === g.name) : EXPENSE_CATEGORIES.find((c) => c.value === g.name);
      const Icon = meta?.icon;
      return { ...g, color: showIncome ? BRAND.emerald : expenseColor(g.name), icon: Icon ? <Icon size={14} className="text-slate-400" /> : undefined };
    });
  }, [filtered, tab]);

  const catOptions = tab === "ingresos" ? INCOME_CATEGORIES.map((c) => c.value) : tab === "gastos" ? EXPENSE_CATEGORIES.map((c) => c.value) : [...INCOME_CATEGORIES.map((c) => c.value), ...EXPENSE_CATEGORIES.map((c) => c.value)];
  const methodOptions = tab === "ingresos" ? RECEPTION_METHODS : tab === "gastos" ? PAYMENT_METHODS.map((m) => m.value) : Array.from(new Set([...RECEPTION_METHODS, ...PAYMENT_METHODS.map((m) => m.value)]));
  const activeFilters = categories.length + (method ? 1 : 0) + priority.length + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0) + (recurringOnly ? 1 : 0) + (search ? 1 : 0) + (preset !== "3m" ? 1 : 0);

  const reset = () => {
    setSearch("");
    setPreset("3m");
    setFrom("");
    setTo("");
    setCategories([]);
    setMethod("");
    setPriority([]);
    setMinAmount("");
    setMaxAmount("");
    setRecurringOnly(false);
    setPage(0);
  };
  const toggle = (list: string[], v: string, set: (x: string[]) => void) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    setPage(0);
  };
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <>
      <PageHeader
        eyebrow="Módulo 2"
        title="Motor de Transacciones"
        description="Ingresos y gastos con clasificación macro/micro, métodos de pago, prioridades y filtros avanzados en tiempo real."
        actions={
          <>
            <Button variant="success" icon={ArrowUpRight} onClick={() => ui.openTransaction("income")}>
              Ingreso
            </Button>
            <Button variant="danger" icon={ArrowDownRight} onClick={() => ui.openTransaction("expense")}>
              Gasto
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "todos", label: "Todos", icon: ArrowLeftRight, count: data.transactions.length },
            { value: "ingresos", label: "Ingresos", icon: ArrowUpRight, count: data.transactions.filter((t) => t.kind === "income").length },
            { value: "gastos", label: "Gastos", icon: ArrowDownRight, count: data.transactions.filter((t) => t.kind === "expense").length },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Búsqueda en tiempo real…"
              className="h-10 w-full rounded-2xl sm:w-64 border-0 bg-white pl-9 pr-8 text-sm font-medium shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Limpiar búsqueda">
                <X size={14} />
              </button>
            )}
          </div>
          <Button variant={showFilters ? "soft" : "secondary"} icon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)}>
            Filtros {activeFilters > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{activeFilters}</span>}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card hover={false} className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Funnel size={15} className="text-indigo-500" /> Filtros avanzados
                </p>
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset}>
                  Restablecer
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPreset(p.value);
                      setPage(0);
                    }}
                    className={cn("rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition active:scale-95", preset === p.value ? "bg-indigo-600 text-white ring-indigo-600 shadow-glow-indigo" : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300")}
                  >
                    {p.label}
                  </button>
                ))}
                {preset === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 py-1 text-xs" aria-label="Desde" />
                    <span className="text-xs text-slate-400">→</span>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 py-1 text-xs" aria-label="Hasta" />
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Categorías</p>
                <div className="flex flex-wrap gap-1.5">
                  {catOptions.map((c) => {
                    const active = categories.includes(c);
                    const color = EXPENSE_CATEGORIES.find((x) => x.value === c)?.color ?? BRAND.emerald;
                    return (
                      <button
                        key={c}
                        onClick={() => toggle(categories, c, setCategories)}
                        className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition active:scale-95", active ? "text-white ring-transparent" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300")}
                        style={active ? { background: color } : undefined}
                      >
                        {!active && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Método</p>
                  <Select value={method} onChange={(e) => (setMethod(e.target.value), setPage(0))}>
                    <option value="">Todos los métodos</option>
                    {methodOptions.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Rango de monto</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Mín." value={minAmount} onChange={(e) => (setMinAmount(e.target.value), setPage(0))} />
                    <Input type="number" placeholder="Máx." value={maxAmount} onChange={(e) => (setMaxAmount(e.target.value), setPage(0))} />
                  </div>
                </div>
                {tab !== "ingresos" && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Prioridad</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => toggle(priority, p.value, setPriority)}
                          className={cn("rounded-xl px-3 py-2 text-xs font-bold ring-1 transition", priority.includes(p.value) ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200")}
                        >
                          {p.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-end pb-2">
                  <Switch checked={recurringOnly} onChange={(v) => (setRecurringOnly(v), setPage(0))} label="Solo recurrentes" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen del filtro */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Ingresos filtrados", value: money(incomeTotal, cur), cls: "from-emerald-50 to-white text-emerald-600" },
          { label: "Gastos filtrados", value: money(expenseTotal, cur), cls: "from-rose-50 to-white text-rose-600" },
          { label: "Balance neto", value: money(incomeTotal - expenseTotal, cur, { sign: true }), cls: "from-indigo-50 to-white text-indigo-600" },
          { label: "Movimientos · promedio", value: `${filtered.length} · ${money(filtered.length ? (incomeTotal + expenseTotal) / filtered.length : 0, cur, { compact: true })}`, cls: "from-amber-50 to-white text-amber-600" },
        ].map((s) => (
          <div key={s.label} className={cn("glass rounded-2xl bg-gradient-to-br p-4", s.cls)}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="tabular mt-1 text-lg font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-4">
        <Card hover={false} className="overflow-hidden 2xl:col-span-3">
          {selected.size > 0 && (
            <div className="flex items-center justify-between bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">
              <span>{selected.size} seleccionado(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setSelected(new Set())} className="rounded-lg px-2.5 py-1 hover:bg-white/15">
                  Cancelar
                </button>
                <button onClick={() => setConfirmBulk(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 hover:bg-white/30">
                  <Trash size={14} /> Eliminar
                </button>
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Search} title="Sin resultados" description="Ningún movimiento coincide con los filtros actuales." action={<Button size="sm" variant="soft" onClick={reset}>Limpiar filtros</Button>} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-slate-50/90 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        onChange={() => setSelected((s) => {
                          const n = new Set(s);
                          rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
                          return n;
                        })}
                        className="h-4 w-4 accent-indigo-600"
                        aria-label="Seleccionar página"
                      />
                    </th>
                    <th className="px-2 py-3">
                      <button onClick={() => sortBy("date")} className="flex items-center gap-1 hover:text-indigo-600">Fecha <ArrowUpDown size={11} /></button>
                    </th>
                    <th className="px-2 py-3">Descripción</th>
                    <th className="px-2 py-3">
                      <button onClick={() => sortBy("category")} className="flex items-center gap-1 hover:text-indigo-600">Categoría <ArrowUpDown size={11} /></button>
                    </th>
                    <th className="px-2 py-3">Método</th>
                    <th className="px-2 py-3">Prioridad</th>
                    <th className="px-2 py-3 text-right">
                      <button onClick={() => sortBy("amount")} className="ml-auto flex items-center gap-1 hover:text-indigo-600">Monto <ArrowUpDown size={11} /></button>
                    </th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className={cn("group transition-colors hover:bg-indigo-50/40", selected.has(t.id) && "bg-indigo-50/60")}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => setSelected((s) => {
                            const n = new Set(s);
                            if (n.has(t.id)) n.delete(t.id);
                            else n.add(t.id);
                            return n;
                          })}
                          className="h-4 w-4 accent-indigo-600"
                          aria-label="Seleccionar"
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-xs font-semibold text-slate-500">{dateLabel(t.date)}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-3">
                          <TxIcon tx={t} size={36} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-bold text-slate-800">
                              {txTitle(t)}
                              {t.recurring && <Repeat size={12} className="text-indigo-400" aria-label="Recurrente" />}
                            </p>
                            <p className="truncate text-xs text-slate-400">{t.notes || txSubtitle(t)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        {t.kind === "income" ? (
                          <Badge tone="emerald">{t.category}</Badge>
                        ) : (
                          <span className="inline-flex flex-col">
                            <span className="text-xs font-bold" style={{ color: expenseColor(t.macro) }}>{t.macro}</span>
                            <span className="text-[11px] text-slate-400">{t.micro}</span>
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-xs text-slate-500">{t.method}</td>
                      <td className="px-2 py-2.5">{t.kind === "expense" ? <PriorityBadge priority={t.priority} /> : <span className="text-xs text-slate-300">—</span>}</td>
                      <td className={cn("tabular whitespace-nowrap px-2 py-2.5 text-right font-extrabold", t.kind === "income" ? "text-emerald-600" : "text-slate-900")}>
                        {t.kind === "income" ? "+" : "−"}
                        {money(t.amount, cur)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                          <button onClick={() => ui.openTransaction(t.kind, t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600" aria-label="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => ui.removeWithUndo({ type: "transaction/delete", ids: [t.id] }, "Movimiento eliminado")} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600" aria-label="Eliminar">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500">
              <span>
                {pageSafe * PAGE_SIZE + 1}–{Math.min(filtered.length, (pageSafe + 1) * PAGE_SIZE)} de {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={pageSafe === 0} onClick={() => setPage(pageSafe - 1)} aria-label="Anterior">
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-2">
                  {pageSafe + 1} / {pages}
                </span>
                <Button size="icon" variant="ghost" disabled={pageSafe >= pages - 1} onClick={() => setPage(pageSafe + 1)} aria-label="Siguiente">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title={tab === "ingresos" ? "Ingresos por categoría" : "Gastos por categoría"} subtitle="Según los filtros activos" icon={tab === "ingresos" ? ArrowUpRight : ArrowDownRight} tone={tab === "ingresos" ? "emerald" : "rose"} />
          <div className="mt-5">{breakdown.length ? <HorizontalBars data={breakdown} currency={cur} /> : <p className="text-sm text-slate-400">Sin datos.</p>}</div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title={`¿Eliminar ${selected.size} movimiento(s)?`}
        description="Podrás deshacer la acción inmediatamente desde la notificación o con Ctrl+Z."
        onConfirm={() => {
          ui.removeWithUndo({ type: "transaction/delete", ids: [...selected] }, `${selected.size} movimiento(s) eliminado(s)`);
          setSelected(new Set());
        }}
      />
    </>
  );
}
