"use client";

import { useMemo, useState } from "react";
import { HandCoins, Landmark, Receipt, Wallet } from "lucide-react";
import type { Debt, DebtType, Receivable } from "@/lib/types";
import { DEBT_TYPES, RECEIVABLE_TYPES, currencyMeta } from "@/lib/constants/catalog";
import { addMonths, dateLabel, money, round2, todayISO, uid } from "@/lib/format";
import { amortization, receivableOutstanding, splitDebtPayment } from "@/lib/finance/calculations";
import { useStore } from "@/lib/store/StoreProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select, Switch, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";

const tile = (cls: string, node: React.ReactNode) => <span className={`rounded-2xl p-2.5 ring-1 ${cls}`}>{node}</span>;

/* ------------------------------ Alta / edición deuda ------------------------------ */

export function DebtForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Debt | null }) {
  return <DebtFormInner open={open} onClose={onClose} editing={editing} />;
}

function DebtFormInner({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Debt | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const cur = data.settings.currency;
  const symbol = currencyMeta(cur).symbol;
  const [f, setF] = useState({
    name: editing?.name ?? "",
    lender: editing?.lender ?? "",
    type: (editing?.type ?? "Préstamo personal") as DebtType,
    principal: editing ? String(editing.principal) : "",
    balance: editing ? String(editing.balance) : "",
    annualRate: editing ? String(editing.annualRate) : "",
    monthlyPayment: editing ? String(editing.monthlyPayment) : "",
    startDate: editing?.startDate ?? todayISO(),
    dueDate: editing?.dueDate ?? addMonths(todayISO(), 24),
    paymentDay: editing ? String(editing.paymentDay) : String(new Date().getDate()),
    notes: editing?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const preview = useMemo(() => {
    const bal = parseFloat(f.balance || f.principal);
    const pay = parseFloat(f.monthlyPayment);
    const rate = parseFloat(f.annualRate) || 0;
    if (!(bal > 0) || !(pay > 0)) return null;
    return amortization(bal, rate, pay, todayISO());
  }, [f.balance, f.principal, f.monthlyPayment, f.annualRate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const principal = round2(parseFloat(f.principal));
    const balance = f.balance === "" ? principal : round2(parseFloat(f.balance));
    if (!f.name.trim()) return setError("Indica un nombre para la deuda.");
    if (!(principal > 0)) return setError("El monto original debe ser mayor que cero.");
    if (!(balance >= 0) || balance > principal) return setError("El saldo pendiente debe estar entre 0 y el monto original.");
    const debt: Debt = {
      id: editing?.id ?? uid("debt"),
      name: f.name.trim(),
      lender: f.lender.trim(),
      type: f.type,
      principal,
      balance,
      annualRate: Math.max(0, parseFloat(f.annualRate) || 0),
      monthlyPayment: round2(Math.max(0, parseFloat(f.monthlyPayment) || 0)),
      startDate: f.startDate,
      dueDate: f.dueDate,
      paymentDay: Math.min(31, Math.max(1, parseInt(f.paymentDay) || 1)),
      notes: f.notes.trim(),
      payments: editing?.payments ?? [],
    };
    dispatch({ type: editing ? "debt/update" : "debt/add", payload: debt });
    toast({ tone: "success", title: editing ? "Deuda actualizada" : "Deuda registrada", description: "Hoja «Control de Deudas» sincronizada." });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Editar deuda" : "Nueva deuda o crédito"}
      subtitle="Préstamos, tarjetas, hipotecas — con cálculo de intereses y amortización"
      icon={tile("bg-rose-50 text-rose-600 ring-rose-100", <Landmark size={20} />)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="debt-form">
            {editing ? "Guardar cambios" : "Registrar deuda"}
          </Button>
        </>
      }
    >
      <form id="debt-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={error ?? undefined}>
            <Input value={f.name} onChange={set("name")} placeholder="Ej. Préstamo vehicular" required />
          </Field>
          <Field label="Acreedor">
            <Input value={f.lender} onChange={set("lender")} placeholder="Banco o entidad" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tipo">
            <Select value={f.type} onChange={set("type")}>
              {DEBT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Monto original">
            <MoneyInput symbol={symbol} value={f.principal} onChange={set("principal")} required />
          </Field>
          <Field label="Saldo pendiente" hint="Vacío = monto original">
            <MoneyInput symbol={symbol} value={f.balance} onChange={set("balance")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tasa anual (%)">
            <Input type="number" step="0.01" min="0" value={f.annualRate} onChange={set("annualRate")} placeholder="Ej. 18.5" />
          </Field>
          <Field label="Cuota mensual">
            <MoneyInput symbol={symbol} value={f.monthlyPayment} onChange={set("monthlyPayment")} />
          </Field>
          <Field label="Día de pago">
            <Input type="number" min="1" max="31" value={f.paymentDay} onChange={set("paymentDay")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha de inicio">
            <Input type="date" value={f.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="Fecha límite">
            <Input type="date" value={f.dueDate} onChange={set("dueDate")} />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea value={f.notes} onChange={set("notes")} />
        </Field>
        {preview && (
          <div className={`rounded-2xl p-4 text-sm ring-1 ${preview.feasible ? "bg-indigo-50/70 text-indigo-900 ring-indigo-100" : "bg-rose-50 text-rose-800 ring-rose-100"}`}>
            {preview.feasible ? (
              <p>
                Liquidarás esta deuda en <b>{preview.months} meses</b> (≈ {dateLabel(preview.payoffDate!)}) pagando <b>{money(preview.totalInterest, cur)}</b> en intereses.
              </p>
            ) : (
              <p>
                <b>Atención:</b> la cuota no cubre los intereses mensuales. Aumenta la cuota para que la deuda disminuya.
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

/* --------------------------------- Pago de deuda --------------------------------- */

export function DebtPaymentDialog({ open, onClose, debt }: { open: boolean; onClose: () => void; debt: Debt | null }) {
  return <DebtPaymentInner open={open} onClose={onClose} debt={debt} />;
}

function DebtPaymentInner({ open, onClose, debt }: { open: boolean; onClose: () => void; debt: Debt | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const cur = data.settings.currency;
  const [amount, setAmount] = useState(debt ? String(Math.min(debt.monthlyPayment || debt.balance, debt.balance + debt.balance * (debt.annualRate / 1200))) : "");
  const [date, setDate] = useState(todayISO());
  const [asExpense, setAsExpense] = useState(true);
  if (!debt) return null;
  const value = round2(parseFloat(amount) || 0);
  const split = splitDebtPayment(debt.balance, debt.annualRate, value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!debt || !(value > 0)) return;
    const payment = { id: uid("dp"), date, amount: value, interest: split.interest, principal: split.principal };
    dispatch({
      type: "batch",
      label: "Pago de deuda registrado",
      sheet: "Control de Deudas",
      actions: [
        { type: "debt/pay", debtId: debt.id, payment },
        ...(asExpense
          ? [
              {
                type: "transaction/add" as const,
                payload: { id: uid("exp"), kind: "expense" as const, date, macro: "Deudas" as const, micro: debt.type === "Tarjeta de crédito" ? "Pago de tarjeta" : "Cuota de préstamo", merchant: `${debt.lender || debt.name} — ${debt.name}`, amount: value, method: "Transferencia" as const, priority: "Necesidad" as const, recurring: false, notes: `Interés ${money(split.interest, cur)} · Capital ${money(split.principal, cur)}` },
              },
            ]
          : []),
      ],
    });
    toast({ tone: "success", title: "Pago registrado", description: `Saldo restante: ${money(Math.max(0, debt.balance - split.principal), cur)}` });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Registrar pago"
      subtitle={debt.name}
      icon={tile("bg-indigo-50 text-indigo-600 ring-indigo-100", <Wallet size={20} />)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="pay-form" disabled={!(value > 0)}>
            Confirmar pago
          </Button>
        </>
      }
    >
      <form id="pay-form" onSubmit={submit} className="space-y-4">
        <Field label="Monto pagado">
          <MoneyInput symbol={currencyMeta(cur).symbol} value={amount} onChange={(e) => setAmount(e.target.value)} className="text-base font-bold" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Interés</p>
            <p className="tabular text-lg font-extrabold text-amber-700">{money(split.interest, cur)}</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">Capital</p>
            <p className="tabular text-lg font-extrabold text-indigo-700">{money(split.principal, cur)}</p>
          </div>
        </div>
        <Switch checked={asExpense} onChange={setAsExpense} label="Registrar también como gasto (Deudas)" />
      </form>
    </Modal>
  );
}

/* ---------------------------- Cuenta por cobrar ---------------------------- */

export function ReceivableForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Receivable | null }) {
  return <ReceivableFormInner open={open} onClose={onClose} editing={editing} />;
}

function ReceivableFormInner({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Receivable | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const symbol = currencyMeta(data.settings.currency).symbol;
  const [f, setF] = useState({
    debtor: editing?.debtor ?? "",
    concept: editing?.concept ?? "",
    type: (editing?.type ?? "Préstamo personal") as Receivable["type"],
    amount: editing ? String(editing.amount) : "",
    issueDate: editing?.issueDate ?? todayISO(),
    dueDate: editing?.dueDate ?? addMonths(todayISO(), 1),
    notes: editing?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = round2(parseFloat(f.amount));
    if (!f.debtor.trim()) return setError("Indica quién te debe.");
    if (!(amount > 0)) return setError("El monto debe ser mayor que cero.");
    const r: Receivable = {
      id: editing?.id ?? uid("rcv"),
      debtor: f.debtor.trim(),
      concept: f.concept.trim(),
      type: f.type,
      amount,
      issueDate: f.issueDate,
      dueDate: f.dueDate,
      notes: f.notes.trim(),
      payments: editing?.payments ?? [],
    };
    dispatch({ type: editing ? "receivable/update" : "receivable/add", payload: r });
    toast({ tone: "success", title: editing ? "Cuenta actualizada" : "Cuenta por cobrar registrada", description: "Hoja «Cuentas por Cobrar» sincronizada." });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? "Editar cuenta por cobrar" : "Nueva cuenta por cobrar"}
      subtitle="Dinero prestado, facturas o servicios pendientes de cobro"
      icon={tile("bg-amber-50 text-amber-600 ring-amber-100", <Receipt size={20} />)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="rcv-form">
            {editing ? "Guardar cambios" : "Registrar"}
          </Button>
        </>
      }
    >
      <form id="rcv-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deudor" error={error ?? undefined}>
            <Input value={f.debtor} onChange={set("debtor")} placeholder="Persona o empresa" required />
          </Field>
          <Field label="Tipo">
            <Select value={f.type} onChange={set("type")}>
              {RECEIVABLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Concepto">
          <Input value={f.concept} onChange={set("concept")} placeholder="Ej. Factura #0150 — Diseño" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monto">
            <MoneyInput symbol={symbol} value={f.amount} onChange={set("amount")} required />
          </Field>
          <Field label="Emisión">
            <Input type="date" value={f.issueDate} onChange={set("issueDate")} />
          </Field>
          <Field label="Vencimiento">
            <Input type="date" value={f.dueDate} onChange={set("dueDate")} />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea value={f.notes} onChange={set("notes")} />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------------ Cobro ------------------------------------ */

export function CollectDialog({ open, onClose, receivable }: { open: boolean; onClose: () => void; receivable: Receivable | null }) {
  return <CollectInner open={open} onClose={onClose} receivable={receivable} />;
}

function CollectInner({ open, onClose, receivable }: { open: boolean; onClose: () => void; receivable: Receivable | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const cur = data.settings.currency;
  const outstanding = receivable ? receivableOutstanding(receivable) : 0;
  const [amount, setAmount] = useState(String(outstanding));
  const [date, setDate] = useState(todayISO());
  const [asIncome, setAsIncome] = useState(receivable ? receivable.type !== "Préstamo personal" : true);
  if (!receivable) return null;
  const value = round2(Math.min(parseFloat(amount) || 0, outstanding));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!receivable || !(value > 0)) return;
    dispatch({
      type: "batch",
      label: "Cobro registrado",
      sheet: "Cuentas por Cobrar",
      actions: [
        { type: "receivable/collect", receivableId: receivable.id, payment: { id: uid("rp"), date, amount: value } },
        ...(asIncome
          ? [{ type: "transaction/add" as const, payload: { id: uid("inc"), kind: "income" as const, date, category: receivable.type === "Préstamo personal" ? ("Otros ingresos" as const) : ("Freelance" as const), source: receivable.debtor, amount: value, method: "Transferencia" as const, recurring: false, notes: `Cobro: ${receivable.concept}` } }]
          : []),
      ],
    });
    toast({ tone: "success", title: value >= outstanding ? "¡Cuenta cobrada por completo!" : "Cobro parcial registrado", description: `${receivable.debtor} · ${money(value, cur)}` });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Registrar cobro"
      subtitle={`${receivable.debtor} · pendiente ${money(outstanding, cur)}`}
      icon={tile("bg-emerald-50 text-emerald-600 ring-emerald-100", <HandCoins size={20} />)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="success" type="submit" form="collect-form" disabled={!(value > 0)}>
            Confirmar cobro
          </Button>
        </>
      }
    >
      <form id="collect-form" onSubmit={submit} className="space-y-4">
        <Field label="Monto cobrado" hint={`Máximo ${money(outstanding, cur)}`}>
          <MoneyInput symbol={currencyMeta(cur).symbol} value={amount} max={outstanding} onChange={(e) => setAmount(e.target.value)} className="text-base font-bold" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Switch checked={asIncome} onChange={setAsIncome} label="Registrar también como ingreso" />
        <p className="text-xs text-slate-400">Para préstamos personales normalmente no es un ingreso nuevo, sino la recuperación de tu dinero.</p>
      </form>
    </Modal>
  );
}
