"use client";

import { SEQUENTIAL_INDIGO } from "@/lib/constants/catalog";
import { cn, money } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

/**
 * Matriz de rendimiento (categorías × meses) con escala secuencial índigo
 * (un solo tono, claro → oscuro). Cada celda muestra su valor en hover.
 */
export function Heatmap({ rows, columns, values, currency }: { rows: string[]; columns: { key: string; label: string }[]; values: Record<string, Record<string, number>>; currency: CurrencyCode }) {
  const all = rows.flatMap((r) => columns.map((c) => values[r]?.[c.key] ?? 0));
  const max = Math.max(1, ...all);
  const step = (v: number) => (v <= 0 ? -1 : Math.min(SEQUENTIAL_INDIGO.length - 1, Math.floor((v / max) * (SEQUENTIAL_INDIGO.length - 1) + 0.5)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white/80 px-2 text-left font-semibold text-slate-400" />
            {columns.map((c) => (
              <th key={c.key} className="px-1 pb-1 text-center font-semibold text-slate-400">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="sticky left-0 whitespace-nowrap bg-white/80 pr-3 font-semibold text-slate-600">{r}</td>
              {columns.map((c) => {
                const v = values[r]?.[c.key] ?? 0;
                const s = step(v);
                return (
                  <td key={c.key} className="p-0">
                    <div
                      title={`${r} · ${c.label}: ${money(v, currency)}`}
                      className={cn("group relative flex h-9 min-w-[44px] items-center justify-center rounded-lg font-semibold hover:ring-2 hover:ring-indigo-800/30", s >= 5 ? "text-white" : "text-indigo-900/70")}
                      style={{ background: s < 0 ? "#F8FAFC" : SEQUENTIAL_INDIGO[s] }}
                    >
                      <span className="tabular text-[10px]">{v > 0 ? money(v, currency, { compact: true }) : "—"}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] font-semibold text-slate-400">
        Menor
        <div className="flex overflow-hidden rounded-full">
          {SEQUENTIAL_INDIGO.map((c) => (
            <span key={c} className="h-2.5 w-5" style={{ background: c }} />
          ))}
        </div>
        Mayor
      </div>
    </div>
  );
}
