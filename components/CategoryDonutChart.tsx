"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import BentoCard from "./BentoCard";
import type { CategoryBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="glass-panel rounded-xl border-white/10 px-3.5 py-2.5 text-xs shadow-glass">
      <div className="flex items-center gap-1.5 text-slate-300">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        {entry.name}
      </div>
      <p className="mt-1 font-semibold text-white">{formatCurrency(entry.value)}</p>
    </div>
  );
}

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <BentoCard span="md:col-span-2 lg:col-span-2" className="flex flex-col">
      <div className="mb-2">
        <h3 className="font-semibold text-white">Distribución por categoría</h3>
        <p className="text-sm text-slate-400">Gasto de septiembre</p>
      </div>

      <div className="relative flex h-52 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex flex-col items-center">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-lg font-semibold text-white">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {data.map((entry) => (
          <li key={entry.category} className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="truncate">{entry.category}</span>
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}
