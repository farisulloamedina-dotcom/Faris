"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CurrencyCode } from "@/lib/types";
import { cn, money, pct } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

/**
 * Dona de distribución con total central, leyenda con porcentajes (etiquetado
 * directo como alivio de contraste) y resaltado sincronizado al pasar el cursor.
 */
export function DonutChart({ data, currency, centerLabel = "Total", height = 240, legend = true }: { data: DonutDatum[]; currency: CurrencyCode; centerLabel?: string; height?: number; legend?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const focus = hover !== null ? data[hover] : null;

  return (
    <div className="@container">
    <div className={cn("flex flex-col gap-4", legend && "@xl:flex-row @xl:items-center")}>
      <div className="relative mx-auto w-full max-w-[240px] shrink-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={1.5}
              cornerRadius={6}
              stroke="#fff"
              strokeWidth={2}
              onMouseLeave={() => setHover(null)}
              animationDuration={900}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.35} style={{ transition: "opacity .25s", cursor: "pointer" }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{focus ? focus.name : centerLabel}</span>
          <span className="tabular text-lg font-extrabold text-slate-900">{money(focus ? focus.value : total, currency, { compact: (focus ? focus.value : total) >= 100000 })}</span>
          {focus && <span className="text-xs font-bold text-indigo-600">{pct(total ? focus.value / total : 0)}</span>}
        </div>
      </div>
      {legend && (
        <ul className="grid flex-1 grid-cols-1 gap-1.5">
          {data.map((d, i) => (
            <li
              key={d.name}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cn("flex cursor-default items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-xs transition", hover === i ? "bg-slate-100" : "hover:bg-slate-50")}
            >
              <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular font-bold text-slate-900">{money(d.value, currency, { compact: d.value >= 100000 })}</span>
                <span className="tabular w-11 text-right font-semibold text-slate-400">{pct(total ? d.value / total : 0, 0)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
    </div>
  );
}
