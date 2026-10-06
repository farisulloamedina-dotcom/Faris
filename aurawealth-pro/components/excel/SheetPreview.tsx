"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import type { CellFormat, CellValue, ColumnSpec, Row, SheetModel, WorkbookModel } from "@/lib/excel/model";
import { cn, dateLabel, money, pct } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

const MAX_ROWS = 120;

const TONE_BAR: Record<string, string> = {
  indigo: "bg-indigo-600",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  cobalt: "bg-blue-600",
};

const STATUS_TEXT: Record<string, string> = {
  "Al día": "text-emerald-600",
  Liquidada: "text-emerald-600",
  Cobrado: "text-emerald-600",
  Lograda: "text-emerald-600",
  "En curso": "text-blue-600",
  Parcial: "text-amber-600",
  Pendiente: "text-amber-600",
  "Fuera de ritmo": "text-amber-600",
  Necesidad: "text-indigo-600",
  Gusto: "text-amber-600",
  Inversión: "text-emerald-600",
};

function fmtCell(v: CellValue, fmt: CellFormat, currency: CurrencyCode) {
  if (v === null || v === undefined || v === "") return "";
  if (fmt === "currency" && typeof v === "number") return money(v, currency);
  if (fmt === "percent" && typeof v === "number") return pct(v);
  if (fmt === "date" && typeof v === "string") return dateLabel(v);
  if (fmt === "bool") return v ? "Sí" : "No";
  return String(v);
}

function align(fmt: CellFormat) {
  return fmt === "currency" || fmt === "percent" || fmt === "int" || fmt === "decimal" ? "text-right" : fmt === "bool" || fmt === "status" || fmt === "date" ? "text-center" : "text-left";
}

function Table({ columns, rows, currency, totals }: { columns: ColumnSpec[]; rows: Row[]; currency: CurrencyCode; totals?: boolean }) {
  return (
    <table className="w-full border-collapse font-[Calibri,ui-sans-serif] text-[12px]">
      <thead>
        <tr>
          <th className="w-10 border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-400">#</th>
          {columns.map((c) => (
            <th key={c.key} className="whitespace-nowrap border border-indigo-800 bg-indigo-700 px-3 py-2 text-center font-semibold text-white">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, MAX_ROWS).map((r, i) => (
          <tr key={i} className={i % 2 ? "bg-[#F6F7F9]" : "bg-white"}>
            <td className="border border-slate-200 bg-slate-50 text-center text-[10px] text-slate-400">{i + 1}</td>
            {columns.map((c) => {
              const v = r[c.key] ?? null;
              const text = fmtCell(v, c.fmt, currency);
              const negative = typeof v === "number" && v < 0 && c.fmt === "currency";
              return (
                <td
                  key={c.key}
                  className={cn(
                    "max-w-[260px] truncate whitespace-nowrap border border-slate-200 px-3 py-1.5 text-slate-800",
                    align(c.fmt),
                    c.fmt === "status" && cn("font-semibold", String(v).includes("Vencid") || String(v).includes("insuficiente") ? "text-rose-600" : STATUS_TEXT[String(v)]),
                    negative && "text-red-600",
                    c.key === "id" && "font-mono text-[10px] text-slate-400",
                  )}
                  title={text}
                >
                  {text}
                </td>
              );
            })}
          </tr>
        ))}
        {totals && rows.length > 0 && columns.some((c) => c.total) && (
          <tr className="bg-indigo-100 font-semibold text-indigo-900">
            <td className="border border-slate-200 bg-slate-50" />
            {columns.map((c, idx) => (
              <td key={c.key} className={cn("border-y-2 border-x border-y-indigo-600 border-x-slate-200 px-3 py-1.5", align(c.fmt))}>
                {idx === 0 ? "TOTAL" : c.total ? money(rows.reduce((a, r) => a + (typeof r[c.key] === "number" ? (r[c.key] as number) : 0), 0), currency) : ""}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

function SheetBody({ sheet, currency }: { sheet: SheetModel; currency: CurrencyCode }) {
  if (sheet.kind === "summary") {
    return (
      <div className="space-y-5 p-4">
        <div>
          <div className="bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-900">Indicadores clave (KPIs)</div>
          <table className="w-full max-w-3xl border-collapse text-[12px]">
            <tbody>
              {sheet.kpis.map((k, i) => (
                <tr key={k.label} className={i % 2 ? "bg-[#F6F7F9]" : "bg-white"}>
                  <td className="border border-slate-200 px-3 py-1.5 font-semibold text-slate-800">{k.label}</td>
                  <td className={cn("border border-slate-200 px-3 py-1.5 text-right font-semibold", k.value < 0 ? "text-rose-600" : "text-indigo-900")}>{fmtCell(k.value, k.fmt, currency)}</td>
                  <td className="border border-slate-200 px-3 py-1.5 italic text-slate-500">
                    {k.note}
                    {k.formula && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] not-italic text-emerald-700">=SUM(&apos;{k.formula.sheet}&apos;)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sheet.tables.map((t) => (
          <div key={t.title}>
            <div className="bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-900">{t.title}</div>
            <Table columns={t.columns} rows={t.rows} currency={currency} totals />
          </div>
        ))}
      </div>
    );
  }
  return <Table columns={sheet.columns} rows={sheet.rows} currency={currency} totals />;
}

/** Vista previa fiel del libro en memoria (mismo estilo que el .xlsx exportado). */
export function SheetPreview({ model, currency }: { model: WorkbookModel; currency: CurrencyCode }) {
  const [active, setActive] = useState(0);
  const sheet = model.sheets[Math.min(active, model.sheets.length - 1)];
  const count = sheet.kind === "table" ? sheet.rows.length : sheet.kpis.length;
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200">
      {/* Barra estilo Excel */}
      <div className="flex items-center gap-2 bg-emerald-700 px-4 py-2 text-xs font-semibold text-white">
        <FileSpreadsheet size={15} /> AuraWealth_Pro.xlsx — Vista previa en vivo
        <span className="ml-auto rounded bg-white/20 px-2 py-0.5">{count} filas</span>
      </div>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-500">
        <span className="rounded border border-slate-200 bg-white px-2 py-0.5">A1</span>
        <span className="text-slate-300">fx</span>
        <span className="truncate">{sheet.title}</span>
      </div>
      <div className={cn("px-4 py-3 text-white", TONE_BAR[sheet.tone])}>
        <p className="text-base font-semibold">{sheet.title}</p>
        <p className="text-[11px] italic opacity-90">{sheet.description}</p>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <SheetBody sheet={sheet} currency={currency} />
        {sheet.kind === "table" && sheet.rows.length > MAX_ROWS && <p className="p-3 text-center text-xs text-slate-400">Mostrando {MAX_ROWS} de {sheet.rows.length} filas · el archivo exportado incluye todas.</p>}
        {sheet.kind === "table" && sheet.rows.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Hoja vacía</p>}
      </div>
      {/* Pestañas de hojas */}
      <div className="flex gap-0.5 overflow-x-auto border-t border-slate-200 bg-slate-100 px-2 pt-1">
        {model.sheets.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={cn("relative shrink-0 rounded-t-md px-3.5 py-1.5 text-[11px] font-semibold transition", i === active ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-white/60")}
          >
            {i === active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-emerald-600" />}
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
