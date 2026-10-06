"use client";

import { useState } from "react";
import { PiggyBank, Target } from "lucide-react";
import type { Goal, GoalColor, GoalIconKey, GoalKind } from "@/lib/types";
import { GOAL_COLORS, GOAL_ICONS, currencyMeta } from "@/lib/constants/catalog";
import { addMonths, cn, money, round2, todayISO, uid } from "@/lib/format";
import { goalSaved } from "@/lib/finance/calculations";
import { useStore } from "@/lib/store/StoreProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Segmented, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";

export function GoalForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Goal | null }) {
  return <GoalFormInner open={open} onClose={onClose} editing={editing} />;
}

function GoalFormInner({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Goal | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const symbol = currencyMeta(data.settings.currency).symbol;
  const [name, setName] = useState(editing?.name ?? "");
  const [kind, setKind] = useState<GoalKind>(editing?.kind ?? "Ahorro");
  const [target, setTarget] = useState(editing ? String(editing.target) : "");
  const [initial, setInitial] = useState(editing ? String(editing.initial) : "0");
  const [deadline, setDeadline] = useState(editing?.deadline ?? addMonths(todayISO(), 12));
  const [monthly, setMonthly] = useState(editing ? String(editing.monthlyContribution) : "");
  const [icon, setIcon] = useState<GoalIconKey>(editing?.icon ?? "piggy");
  const [color, setColor] = useState<GoalColor>(editing?.color ?? "indigo");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = round2(parseFloat(target));
    if (!name.trim()) return setError("Ponle un nombre a tu meta.");
    if (!(t > 0)) return setError("El objetivo debe ser mayor que cero.");
    const goal: Goal = {
      id: editing?.id ?? uid("goal"),
      name: name.trim(),
      kind,
      target: t,
      initial: round2(Math.max(0, parseFloat(initial) || 0)),
      deadline,
      monthlyContribution: round2(Math.max(0, parseFloat(monthly) || 0)),
      icon,
      color,
      createdAt: editing?.createdAt ?? todayISO(),
      notes: notes.trim(),
      contributions: editing?.contributions ?? [],
    };
    dispatch({ type: editing ? "goal/update" : "goal/add", payload: goal });
    toast({ tone: "success", title: editing ? "Meta actualizada" : "¡Nueva meta creada!", description: "Hoja «Metas de Ahorro» sincronizada." });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Editar meta" : "Nueva meta financiera"}
      subtitle="Define tu objetivo y la app estimará cuándo lo alcanzarás"
      icon={
        <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600 ring-1 ring-emerald-100">
          <Target size={20} />
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="goal-form">
            {editing ? "Guardar cambios" : "Crear meta"}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Nombre de la meta" error={error ?? undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Fondo de emergencia" required />
          </Field>
          <Field label="Tipo">
            <Segmented options={["Ahorro", "Inversión"] as const} value={kind} onChange={setKind} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monto objetivo">
            <MoneyInput symbol={symbol} value={target} onChange={(e) => setTarget(e.target.value)} required />
          </Field>
          <Field label="Monto inicial ahorrado">
            <MoneyInput symbol={symbol} value={initial} onChange={(e) => setInitial(e.target.value)} />
          </Field>
          <Field label="Fecha límite">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        <Field label="Aporte mensual planificado" hint="Déjalo en 0 para estimar con tu ritmo real de ahorro">
          <MoneyInput symbol={symbol} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icono">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GOAL_ICONS) as GoalIconKey[]).map((k) => {
                const Icon = GOAL_ICONS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setIcon(k)}
                    aria-label={k}
                    className={cn("rounded-xl p-2.5 ring-1 transition-all active:scale-90", icon === k ? "bg-indigo-600 text-white ring-indigo-600 shadow-glow-indigo" : "bg-white text-slate-500 ring-slate-200 hover:ring-indigo-300")}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(GOAL_COLORS) as GoalColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn("h-8 w-8 rounded-full ring-offset-2 transition-shadow", color === c && "ring-2 ring-slate-900")}
                  style={{ background: GOAL_COLORS[c].solid }}
                />
              ))}
            </div>
          </Field>
        </div>
        <Field label="Notas / motivación">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Por qué es importante para ti?" />
        </Field>
      </form>
    </Modal>
  );
}

export function ContributeDialog({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: Goal | null }) {
  return <ContributeInner open={open} onClose={onClose} goal={goal} />;
}

function ContributeInner({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: Goal | null }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const cur = data.settings.currency;
  const [mode, setMode] = useState<"Aporte" | "Retiro">("Aporte");
  const [amount, setAmount] = useState(goal?.monthlyContribution ? String(goal.monthlyContribution) : "");
  const [date, setDate] = useState(todayISO());
  if (!goal) return null;
  const saved = goalSaved(goal);
  const value = round2(parseFloat(amount) || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal || !(value > 0)) return;
    const signed = mode === "Aporte" ? value : -Math.min(value, saved);
    dispatch({ type: "goal/contribute", goalId: goal.id, contribution: { id: uid("gc"), date, amount: signed } });
    const reached = mode === "Aporte" && saved < goal.target && saved + value >= goal.target;
    toast({ tone: "success", title: reached ? `¡Meta «${goal.name}» alcanzada!` : mode === "Aporte" ? "Aporte registrado" : "Retiro registrado", description: `Nuevo saldo: ${money(saved + signed, cur)}` });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={mode === "Aporte" ? "Aportar a la meta" : "Retirar de la meta"}
      subtitle={`${goal.name} · ${money(saved, cur)} de ${money(goal.target, cur)}`}
      icon={
        <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600 ring-1 ring-emerald-100">
          <PiggyBank size={20} />
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={mode === "Aporte" ? "success" : "danger"} type="submit" form="contrib-form" disabled={!(value > 0)}>
            Confirmar {mode.toLowerCase()}
          </Button>
        </>
      }
    >
      <form id="contrib-form" onSubmit={submit} className="space-y-4">
        <Segmented options={["Aporte", "Retiro"] as const} value={mode} onChange={setMode} tones={{ Aporte: "bg-emerald-500 text-white ring-emerald-500", Retiro: "bg-rose-500 text-white ring-rose-500" }} />
        <Field label="Monto">
          <MoneyInput symbol={currencyMeta(cur).symbol} value={amount} onChange={(e) => setAmount(e.target.value)} className="text-base font-semibold" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
