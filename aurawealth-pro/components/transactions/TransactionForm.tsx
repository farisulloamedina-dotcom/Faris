"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Expense, ExpenseMacro, Income, IncomeCategory, PaymentMethod, Priority, ReceptionMethod, Transaction } from "@/lib/types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, PRIORITIES, RECEPTION_METHODS, currencyMeta } from "@/lib/constants/catalog";
import { cn, round2, todayISO, uid } from "@/lib/format";
import { useStore } from "@/lib/store/StoreProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Segmented, Select, Switch, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";

interface Props {
  open: boolean;
  onClose: () => void;
  kind: "income" | "expense";
  editing?: Transaction | null;
}

/** Formulario unificado de ingresos y gastos (alta y edición). */
export function TransactionForm(props: Props) {
  // El proveedor de UI remonta este componente (key) en cada apertura → estado limpio
  return <TransactionFormInner {...props} />;
}

function TransactionFormInner({ open, onClose, kind: initialKind, editing }: Props) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const symbol = currencyMeta(data.settings.currency).symbol;
  const [kind, setKind] = useState<"income" | "expense">(editing?.kind ?? initialKind);
  const inc = editing?.kind === "income" ? editing : null;
  const exp = editing?.kind === "expense" ? editing : null;

  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [recurring, setRecurring] = useState(editing?.recurring ?? false);
  // Ingreso
  const [category, setCategory] = useState<IncomeCategory>(inc?.category ?? "Salario");
  const [source, setSource] = useState(inc?.source ?? "");
  const [rmethod, setRmethod] = useState<ReceptionMethod>(inc?.method ?? "Transferencia");
  // Gasto
  const [macro, setMacro] = useState<ExpenseMacro>(exp?.macro ?? "Alimentación");
  const [micro, setMicro] = useState(exp?.micro ?? EXPENSE_CATEGORIES.find((c) => c.value === "Alimentación")!.micros[0]);
  const [merchant, setMerchant] = useState(exp?.merchant ?? "");
  const [pmethod, setPmethod] = useState<PaymentMethod>(exp?.method ?? "Tarjeta de débito");
  const [priority, setPriority] = useState<Priority>(exp?.priority ?? "Necesidad");
  const [error, setError] = useState<string | null>(null);

  const micros = EXPENSE_CATEGORIES.find((c) => c.value === macro)?.micros ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = round2(parseFloat(amount));
    if (!(value > 0)) return setError("Introduce un monto mayor que cero.");
    if (!date) return setError("Selecciona una fecha.");
    const id = editing ? editing.id : uid(kind === "income" ? "inc" : "exp");
    const tx: Transaction =
      kind === "income"
        ? ({ id, kind, date, category, source: source.trim(), amount: value, method: rmethod, recurring, notes: notes.trim() } satisfies Income)
        : ({ id, kind, date, macro, micro, merchant: merchant.trim(), amount: value, method: pmethod, priority, recurring, notes: notes.trim() } satisfies Expense);

    // Si cambió de tipo (ingreso ↔ gasto) se conserva el ID y se reemplaza el registro
    dispatch({ type: editing ? "transaction/update" : "transaction/add", payload: tx });

    toast({ tone: "success", title: editing ? "Movimiento actualizado" : kind === "income" ? "Ingreso registrado" : "Gasto registrado", description: "Sincronizado con el libro Excel en memoria." });
    onClose();
  }

  const isIncome = kind === "income";
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Editar movimiento" : isIncome ? "Nuevo ingreso" : "Nuevo gasto"}
      subtitle={isIncome ? "Registra una entrada de dinero" : "Clasifica tu consumo por categoría, método y prioridad"}
      icon={
        <span className={cn("rounded-2xl p-2.5 ring-1", isIncome ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-rose-100")}>
          {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={isIncome ? "success" : "danger"} type="submit" form="tx-form">
            {editing ? "Guardar cambios" : isIncome ? "Registrar ingreso" : "Registrar gasto"}
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {(["income", "expense"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all",
                kind === k ? (k === "income" ? "bg-white text-emerald-600 shadow-sm" : "bg-white text-rose-600 shadow-sm") : "text-slate-500 hover:text-slate-700",
              )}
            >
              {k === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {k === "income" ? "Ingreso" : "Gasto"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monto" error={error ?? undefined}>
            <MoneyInput symbol={symbol} value={amount} onChange={(e) => (setAmount(e.target.value), setError(null))} placeholder="0.00" required className="text-base font-bold" />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
        </div>

        {isIncome ? (
          <>
            <Field label="Categoría de ingreso">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {INCOME_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = c.value === category;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      title={c.hint}
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-bold ring-1 transition-all active:scale-95",
                        active ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400" : "bg-white text-slate-600 ring-slate-200 hover:-translate-y-0.5 hover:ring-emerald-300",
                      )}
                    >
                      <Icon size={18} />
                      {c.value}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fuente / pagador">
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej. Empresa, cliente, plataforma" />
              </Field>
              <Field label="Método de recepción">
                <Select value={rmethod} onChange={(e) => setRmethod(e.target.value as ReceptionMethod)}>
                  {RECEPTION_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        ) : (
          <>
            <Field label="Macro categoría">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EXPENSE_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = c.value === macro;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => {
                        setMacro(c.value);
                        setMicro(c.micros[0]);
                      }}
                      className={cn("flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-[11px] font-bold ring-1 transition-all active:scale-95", active ? "ring-2" : "bg-white text-slate-600 ring-slate-200 hover:-translate-y-0.5")}
                      style={active ? { background: `${c.color}12`, color: c.color, boxShadow: `inset 0 0 0 2px ${c.color}` } : undefined}
                    >
                      <Icon size={18} />
                      {c.value}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Micro categoría">
                <Select value={micro} onChange={(e) => setMicro(e.target.value)}>
                  {micros.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Comercio / detalle">
                <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Ej. Supermercado, app, proveedor" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Método de pago">
                <Select value={pmethod} onChange={(e) => setPmethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value}>{m.value}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Prioridad" hint={PRIORITIES.find((p) => p.value === priority)?.hint}>
                <Segmented
                  options={PRIORITIES.map((p) => p.value)}
                  value={priority}
                  onChange={setPriority}
                  tones={{
                    Necesidad: "bg-indigo-600 text-white ring-indigo-600",
                    Gusto: "bg-amber-500 text-white ring-amber-500",
                    Inversión: "bg-emerald-500 text-white ring-emerald-500",
                  }}
                />
              </Field>
            </div>
          </>
        )}

        <Field label="Notas">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles opcionales" />
        </Field>
        <Switch checked={recurring} onChange={setRecurring} label={<span>Movimiento recurrente <span className="font-normal text-slate-400">(se repite cada mes)</span></span>} />
      </form>
    </Modal>
  );
}
