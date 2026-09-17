"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import BentoCard from "./BentoCard";
import type { MonthlySummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface IncomeExpenseChartProps {
  data: MonthlySummary[];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl border-white/10 px-3.5 py-2.5 text-xs shadow-glass">
      <p className="mb-1.5 font-medium text-slate-300">{label} 2026</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.dataKey === "income" ? "Ingresos" : "Gastos"}
          </span>
          <span className="font-semibold text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <BentoCard span="md:col-span-2 lg:col-span-2" className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Ingresos vs. Gastos</h3>
          <p className="text-sm text-slate-400">Últimos 6 meses</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-mint" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-coral" /> Gastos
          </span>
        </div>
      </div>

      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5EEAD4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#5EEAD4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FB7185" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#5EEAD4"
              strokeWidth={2}
              fill="url(#incomeGradient)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#FB7185"
              strokeWidth={2}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}
