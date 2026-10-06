"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, Flame, Medal, Pencil, PiggyBank, Plus, Rocket, Sparkles, Target, Trash, TrendingUp, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Goal } from "@/lib/types";
import { useData } from "@/lib/store/StoreProvider";
import { useUI } from "@/components/layout/UIProvider";
import { avgMonthlySavings, goalForecast, goalProgress, goalRemaining, goalSaved } from "@/lib/finance/calculations";
import { GOAL_COLORS, GOAL_ICONS } from "@/lib/constants/catalog";
import { cn, dateLabel, daysBetween, money, monthLabel, pct, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Thermometer } from "@/components/charts/Thermometer";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { AXIS_TICK, BAR_CURSOR, GRID_STROKE } from "@/components/charts/theme";

const MOTIVATION = [
  "Cada aporte cuenta: la constancia vence al monto.",
  "Págate primero a ti: automatiza tu ahorro el día de cobro.",
  "Una meta sin fecha es solo un deseo. ¡Tú ya tienes fecha!",
  "El interés compuesto premia a quien empieza hoy.",
  "Celebra los hitos: 25%, 50%, 75%… ¡y el 100%!",
];

function GoalCard({ goal, globalSavings, onDelete, index }: { goal: Goal; globalSavings: number; onDelete: () => void; index: number }) {
  const { settings } = useData();
  const ui = useUI();
  const cur = settings.currency;
  const c = GOAL_COLORS[goal.color];
  const Icon = GOAL_ICONS[goal.icon];
  const f = goalForecast(goal, globalSavings);
  const p = goalProgress(goal);
  const daysLeft = daysBetween(todayISO(), goal.deadline);
  const milestone = p >= 1 ? "¡Meta cumplida!" : p >= 0.75 ? "Recta final" : p >= 0.5 ? "Más de la mitad" : p >= 0.25 ? "Buen comienzo" : "Arrancando";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <Card className="group relative h-full overflow-hidden">
        <div className={cn("h-1.5 bg-gradient-to-r", c.gradient)} />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl transition-transform duration-700 group-hover:scale-125" style={{ background: c.soft }} />
        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-500 group-hover:rotate-6 group-hover:scale-110", c.gradient)}>
                <Icon size={22} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-slate-900">{goal.name}</h3>
                <p className="text-xs text-slate-500">
                  {goal.kind} · {milestone}
                </p>
              </div>
            </div>
            {f.achieved ? (
              <Badge tone="emerald" icon={<Trophy size={11} />}>
                Lograda
              </Badge>
            ) : f.onTrack ? (
              <Badge tone="indigo" dot>
                En curso
              </Badge>
            ) : (
              <Badge tone="amber" pulse>
                Fuera de ritmo
              </Badge>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Thermometer value={p} color={c.solid} height={130} />
            <div className="min-w-0 flex-1">
              <p className="tabular text-4xl font-extrabold tracking-tight" style={{ color: c.solid }}>
                {pct(p, 0)}
              </p>
              <p className="tabular mt-1 text-sm font-bold text-slate-800">
                {money(goalSaved(goal), cur)} <span className="font-medium text-slate-400">/ {money(goal.target, cur)}</span>
              </p>
              <ProgressBar value={p} tone={goal.color} className="mt-3" />
              <div className="mt-1.5 flex justify-between text-[10px] font-bold text-slate-300">
                {["0", "25", "50", "75", "100"].map((m) => (
                  <span key={m} className={cn(p * 100 >= Number(m) && "text-slate-500")}>
                    {m}%
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
            {f.achieved ? (
              <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <Sparkles size={14} /> ¡Lo lograste! Considera crear una nueva meta.
              </p>
            ) : f.etaDate ? (
              <p>
                <Rocket size={13} className="mr-1 inline text-indigo-500" />
                Ahorrando <b>{money(f.pace, cur)}/mes</b> ({f.paceSource}) la alcanzas en <b>{f.monthsToGoal} {f.monthsToGoal === 1 ? "mes" : "meses"}</b> — <b>{monthLabel(f.etaDate.slice(0, 7), true)}</b>.
              </p>
            ) : (
              <p className="font-semibold text-amber-700">Sin ritmo de ahorro suficiente para estimar una fecha.</p>
            )}
            {!f.achieved && (
              <p className="mt-1">
                <Target size={13} className="mr-1 inline text-rose-500" />
                Para llegar el <b>{dateLabel(goal.deadline)}</b> necesitas <b>{money(f.requiredMonthly, cur)}/mes</b>
                {f.monthsLeft > 0 ? ` durante ${f.monthsLeft} meses.` : " (fecha límite alcanzada)."}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className={cn("flex items-center gap-1 text-xs font-semibold", daysLeft < 0 ? "text-rose-600" : "text-slate-400")}>
              <CalendarClock size={13} /> {daysLeft >= 0 ? `${daysLeft} días restantes` : `Venció hace ${-daysLeft} días`}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="success" icon={PiggyBank} onClick={() => ui.openContribute(goal)}>
                Aportar
              </Button>
              <Button size="icon" variant="ghost" onClick={() => ui.openGoal(goal)} aria-label="Editar">
                <Pencil size={15} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Eliminar" className="hover:text-rose-600">
                <Trash size={15} />
              </Button>
            </div>
          </div>
          {goal.notes && <p className="mt-3 border-t border-slate-100 pt-3 text-xs italic text-slate-400">“{goal.notes}”</p>}
        </div>
      </Card>
    </motion.div>
  );
}

export function GoalsView() {
  const data = useData();
  const ui = useUI();
  const cur = data.settings.currency;
  const [toDelete, setToDelete] = useState<Goal | null>(null);
  const globalSavings = useMemo(() => avgMonthlySavings(data.transactions), [data.transactions]);
  const totalSaved = data.goals.reduce((a, g) => a + goalSaved(g), 0);
  const totalTarget = data.goals.reduce((a, g) => a + g.target, 0);
  const achieved = data.goals.filter((g) => goalRemaining(g) <= 0).length;
  const offTrack = data.goals.filter((g) => !goalForecast(g, globalSavings).onTrack).length;
  const plannedMonthly = data.goals.reduce((a, g) => a + g.monthlyContribution, 0);
  const closest = [...data.goals].filter((g) => goalRemaining(g) > 0).sort((a, b) => goalProgress(b) - goalProgress(a))[0];
  const quote = MOTIVATION[new Date().getDate() % MOTIVATION.length];

  const chart = data.goals.map((g) => ({ name: g.name.length > 14 ? `${g.name.slice(0, 13)}…` : g.name, Ahorrado: goalSaved(g), Restante: goalRemaining(g) }));

  return (
    <>
      <PageHeader
        eyebrow="Módulo 4"
        title="Centro de Metas Financieras"
        description="Metas de ahorro e inversión con progreso animado y estimación de tiempo según tu ritmo real de ahorro."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => ui.openGoal()}>
            Nueva meta
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 p-5 lg:col-span-2">
          <ProgressRing value={totalTarget ? totalSaved / totalTarget : 0} size={120} stroke={12} color="#10B981" track="#ECFDF5">
            <div className="text-center">
              <p className="tabular text-2xl font-extrabold text-slate-900">{pct(totalTarget ? totalSaved / totalTarget : 0, 0)}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400">global</p>
            </div>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Ahorrado", v: money(totalSaved, cur), icon: PiggyBank, c: "text-emerald-600" },
              { l: "Objetivo total", v: money(totalTarget, cur), icon: Target, c: "text-indigo-600" },
              { l: "Ahorro mensual prom.", v: money(globalSavings, cur), icon: TrendingUp, c: "text-blue-600" },
              { l: "Logradas / en riesgo", v: `${achieved} / ${offTrack}`, icon: Medal, c: "text-amber-600" },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100">
                <x.icon size={16} className={x.c} />
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p>
                <p className="tabular text-base font-extrabold text-slate-900">{x.v}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-rose-400 to-fuchsia-500 p-5 text-white shadow-float">
          <div className="absolute -right-8 -top-8 h-32 w-32 animate-float rounded-full bg-white/20 blur-xl" />
          <Flame size={22} />
          <p className="mt-3 text-lg font-extrabold leading-snug">{quote}</p>
          {closest && (
            <p className="mt-3 text-sm text-white/90">
              Estás a <b>{money(goalRemaining(closest), cur)}</b> de completar «{closest.name}».
            </p>
          )}
          <p className="mt-2 text-xs text-white/80">Aportes planificados: {money(plannedMonthly, cur)}/mes</p>
        </div>
      </section>

      {data.goals.length === 0 ? (
        <EmptyState icon={Target} tone="emerald" title="Crea tu primera meta" description="Fondo de emergencia, un viaje, tu primera inversión… define el objetivo y te diremos cuándo lo lograrás." action={<Button variant="primary" icon={Plus} onClick={() => ui.openGoal()}>Nueva meta</Button>} />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} globalSavings={globalSavings} onDelete={() => setToDelete(g)} index={i} />
          ))}
        </section>
      )}

      {data.goals.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Comparativa de metas" subtitle="Ahorrado vs. restante" icon={Target} tone="emerald" />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={Math.max(180, data.goals.length * 52)}>
              <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => money(v, cur, { compact: true })} />
                <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fill: "#475569" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency={cur} />} />
                <Bar dataKey="Ahorrado" stackId="g" fill="#10B981" stroke="#fff" strokeWidth={2} radius={[6, 0, 0, 6]} />
                <Bar dataKey="Restante" stackId="g" fill="#E2E8F0" stroke="#fff" strokeWidth={2} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="¿Eliminar esta meta?"
        description={<>Se eliminará <b>{toDelete?.name}</b> y su historial de aportes. Podrás deshacerlo.</>}
        onConfirm={() => toDelete && ui.removeWithUndo({ type: "goal/delete", id: toDelete.id }, "Meta eliminada")}
      />
    </>
  );
}
