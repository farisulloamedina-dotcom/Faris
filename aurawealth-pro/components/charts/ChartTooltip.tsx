"use client";

import { money, pct } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

interface Item {
  name?: string | number;
  value?: unknown;
  color?: string;
  stroke?: string;
  fill?: string;
  dataKey?: unknown;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<Item>;
  label?: string | number;
  currency: CurrencyCode;
  /** Claves cuyo valor se muestra como porcentaje. */
  percentKeys?: string[];
  /** Muestra una fila con la diferencia entre las dos primeras series. */
  showNet?: boolean;
  hideZero?: boolean;
  labelFormatter?: (label: string | number, payload?: Record<string, unknown>) => string;
}

/** Tooltip flotante con estética glass y valores formateados. */
export function ChartTooltip({ active, payload, label, currency, percentKeys = [], showNet, hideZero, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value !== null && p.value !== undefined && (!hideZero || Number(p.value) !== 0));
  if (!items.length) return null;
  const first = items[0]?.payload;
  const title = label !== undefined ? (labelFormatter ? labelFormatter(label, first) : String(label)) : String(items[0]?.name ?? "");
  const net = showNet && items.length >= 2 ? Number(items[0].value) - Number(items[1].value) : null;
  return (
    <div className="glass min-w-[180px] rounded-2xl px-3.5 py-3 text-xs">
      {title && <p className="mb-2 font-bold text-slate-900">{title}</p>}
      <div className="space-y-1.5">
        {items.map((p, i) => {
          const key = String(p.dataKey ?? p.name);
          const v = Number(p.value);
          const color = p.color || p.stroke || p.fill || "#4F46E5";
          return (
            <div key={`${key}-${i}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: color }} />
                {p.name}
              </span>
              <span className="tabular font-bold text-slate-900">{percentKeys.includes(key) ? pct(v) : money(v, currency)}</span>
            </div>
          );
        })}
        {net !== null && (
          <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5">
            <span className="font-medium text-slate-500">Diferencia</span>
            <span className={`tabular font-extrabold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(net, currency, { sign: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
