"use client";

import { motion } from "motion/react";
import { money, pct } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

/** Barras horizontales HTML con porcentaje y valor etiquetados directamente. */
export function HorizontalBars({ data, currency, max }: { data: { name: string; value: number; share: number; color: string; icon?: React.ReactNode }[]; currency: CurrencyCode; max?: number }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.name} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              {d.icon}
              {d.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular font-bold text-slate-900">{money(d.value, currency)}</span>
              <span className="tabular w-12 rounded-md bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-500">{pct(d.share)}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full transition-[filter] group-hover:brightness-110"
              style={{ background: d.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / top) * 100}%` }}
              transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
