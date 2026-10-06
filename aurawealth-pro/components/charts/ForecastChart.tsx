"use client";

import { CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastPoint } from "@/lib/finance/calculations";
import type { CurrencyCode } from "@/lib/types";
import { money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, CURSOR, GRID_STROKE, SERIES } from "./theme";

/** Histórico (trazo sólido) + proyección por regresión lineal (trazo punteado, zona sombreada). */
export function ForecastChart({ data, currency, height = 300 }: { data: ForecastPoint[]; currency: CurrencyCode; height?: number }) {
  const firstProjected = data.find((d) => d.projected)?.label;
  const lastLabel = data[data.length - 1]?.label;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => money(v, currency, { compact: true })} />
        {firstProjected && (
          <ReferenceArea x1={firstProjected} x2={lastLabel} fill="#EEF2FF" fillOpacity={0.8} label={{ value: "Proyección", position: "insideTop", fill: "#6366F1", fontSize: 11, fontWeight: 700 }} />
        )}
        <Tooltip cursor={CURSOR} content={<ChartTooltip currency={currency} />} />
        <Line type="monotone" name="Ingresos" dataKey="income" stroke={SERIES.income.color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: SERIES.income.color }} activeDot={{ r: 5 }} animationDuration={ANIM_MS} />
        <Line type="monotone" name="Gastos" dataKey="expense" stroke={SERIES.expense.color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: SERIES.expense.color }} activeDot={{ r: 5 }} animationDuration={ANIM_MS} />
        <Line type="monotone" name="Ingresos (proy.)" dataKey="incomeForecast" stroke={SERIES.income.color} strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} animationDuration={ANIM_MS} />
        <Line type="monotone" name="Gastos (proy.)" dataKey="expenseForecast" stroke={SERIES.expense.color} strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} animationDuration={ANIM_MS} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
