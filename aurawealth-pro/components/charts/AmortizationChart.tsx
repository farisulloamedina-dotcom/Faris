"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AmortRow } from "@/lib/finance/calculations";
import type { CurrencyCode } from "@/lib/types";
import { dateLabel, money } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { ANIM_MS, AXIS_TICK, BAR_CURSOR, CURSOR, GRID_STROKE } from "./theme";

/** Curva de saldo pendiente proyectada mes a mes. */
export function BalanceCurve({ rows, currency, height = 200 }: { rows: AmortRow[]; currency: CurrencyCode; height?: number }) {
  const data = rows.map((r) => ({ label: dateLabel(r.date).slice(3), balance: r.balance }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g-bal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B04848" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#B04848" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => money(v, currency, { compact: true })} />
        <Tooltip cursor={CURSOR} content={<ChartTooltip currency={currency} />} />
        <Area type="monotone" name="Saldo pendiente" dataKey="balance" stroke="#B04848" strokeWidth={2.5} fill="url(#g-bal)" animationDuration={ANIM_MS} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Composición anual de los pagos: interés vs. capital (barras apiladas). */
export function YearlySplitBars({ rows, currency, height = 200 }: { rows: AmortRow[]; currency: CurrencyCode; height?: number }) {
  const byYear = new Map<string, { label: string; interest: number; principal: number }>();
  for (const r of rows) {
    const y = r.date.slice(0, 4);
    const b = byYear.get(y) ?? { label: y, interest: 0, principal: 0 };
    b.interest += r.interest;
    b.principal += r.principal;
    byYear.set(y, b);
  }
  const data = [...byYear.values()].map((b) => ({ ...b, interest: Math.round(b.interest * 100) / 100, principal: Math.round(b.principal * 100) / 100 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => money(v, currency, { compact: true })} />
        <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency={currency} />} />
        <Bar name="Capital" dataKey="principal" stackId="a" fill="#2B3F6B" stroke="#fff" strokeWidth={2} animationDuration={ANIM_MS} />
        <Bar name="Interés" dataKey="interest" stackId="a" fill="#B5832A" stroke="#fff" strokeWidth={2} radius={[6, 6, 0, 0]} animationDuration={ANIM_MS} />
      </BarChart>
    </ResponsiveContainer>
  );
}
