"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurrencyCode } from "@/lib/types";
import { money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, CURSOR, GRID_STROKE } from "./theme";

/** Áreas apiladas: composición del gasto por categoría a lo largo del tiempo. */
export function StackedAreaChart({ data, series, currency, height = 300 }: { data: Record<string, number | string>[]; series: { key: string; color: string }[]; currency: CurrencyCode; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => money(v, currency, { compact: true })} />
        <Tooltip cursor={CURSOR} content={<ChartTooltip currency={currency} hideZero />} itemSorter={(item) => -Number(item.value ?? 0)} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" stackId="1" name={s.key} dataKey={s.key} stroke="#fff" strokeWidth={1.5} fill={s.color} fillOpacity={0.88} animationDuration={ANIM_MS} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
