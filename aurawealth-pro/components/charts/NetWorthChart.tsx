"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurrencyCode } from "@/lib/types";
import { money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, CURSOR, GRID_STROKE } from "./theme";

/** Evolución del patrimonio neto al cierre de cada mes. */
export function NetWorthChart({ data, currency, height = 240 }: { data: { label: string; netWorth: number }[]; currency: CurrencyCode; height?: number }) {
  const hasNegative = data.some((d) => d.netWorth < 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g-nw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B3F6B" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3D5A9E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => money(v, currency, { compact: true })} />
        {hasNegative && <ReferenceLine y={0} stroke="#CBD5E1" />}
        <Tooltip cursor={CURSOR} content={<ChartTooltip currency={currency} />} />
        <Area type="monotone" name="Patrimonio neto" dataKey="netWorth" stroke="#2B3F6B" strokeWidth={2.5} fill="url(#g-nw)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} animationDuration={ANIM_MS} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
