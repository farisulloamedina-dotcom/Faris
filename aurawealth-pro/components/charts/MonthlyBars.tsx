"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthPoint } from "@/lib/finance/calculations";
import type { CurrencyCode } from "@/lib/types";
import { money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, BAR_CURSOR, GRID_STROKE, SERIES } from "./theme";

/** Barras comparativas mensuales de ingresos y gastos. */
export function MonthlyBars({ data, currency, height = 260 }: { data: MonthPoint[]; currency: CurrencyCode; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="24%">
        <defs>
          <pattern id="p-expense" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={SERIES.expense.color} />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeWidth="1.6" strokeOpacity="0.45" />
          </pattern>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => money(v, currency, { compact: true })} />
        <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency={currency} showNet />} />
        <Bar name={SERIES.income.label} dataKey="income" fill={SERIES.income.color} radius={[6, 6, 0, 0]} animationDuration={ANIM_MS} />
        <Bar name={SERIES.expense.label} dataKey="expense" fill="url(#p-expense)" radius={[6, 6, 0, 0]} animationDuration={ANIM_MS} />
      </BarChart>
    </ResponsiveContainer>
  );
}
