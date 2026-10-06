"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthPoint } from "@/lib/finance/calculations";
import type { CurrencyCode } from "@/lib/types";
import { money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, CURSOR, GRID_STROKE, SERIES } from "./theme";

/**
 * Evolución temporal de ingresos vs. gastos (áreas superpuestas).
 * Codificación secundaria: los gastos usan trazo discontinuo (verde/rojo no
 * se distingue con deuteranopía).
 */
export function CashflowChart({ data, currency, height = 280 }: { data: MonthPoint[]; currency: CurrencyCode; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.income.color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={SERIES.income.color} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.expense.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES.expense.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => money(v, currency, { compact: true })} />
        <Tooltip cursor={CURSOR} content={<ChartTooltip currency={currency} showNet />} />
        <Area type="monotone" name={SERIES.income.label} dataKey="income" stroke={SERIES.income.color} strokeWidth={2.5} fill="url(#g-income)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} animationDuration={ANIM_MS} />
        <Area type="monotone" name={SERIES.expense.label} dataKey="expense" stroke={SERIES.expense.color} strokeWidth={2.5} strokeDasharray="6 4" fill="url(#g-expense)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} animationDuration={ANIM_MS} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
