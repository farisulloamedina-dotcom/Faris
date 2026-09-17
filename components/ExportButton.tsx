"use client";

import { useState } from "react";
import { Check, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportFinancialReport } from "@/lib/export-excel";
import { CATEGORY_BREAKDOWN, MONTHLY_SUMMARY, TRANSACTIONS } from "@/lib/mock-data";

type ExportState = "idle" | "loading" | "done";

export default function ExportButton() {
  const [state, setState] = useState<ExportState>("idle");

  async function handleExport() {
    if (state === "loading") return;
    setState("loading");
    // Small delay so the loading state is perceptible for an instant export.
    await new Promise((resolve) => setTimeout(resolve, 500));
    exportFinancialReport(TRANSACTIONS, MONTHLY_SUMMARY, CATEGORY_BREAKDOWN);
    setState("done");
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      onClick={handleExport}
      disabled={state === "loading"}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-100 shadow-glass transition-colors hover:bg-white/[0.1] disabled:opacity-70"
    >
      {state === "idle" && <FileSpreadsheet size={16} className="text-accent-mint" />}
      {state === "loading" && <Loader2 size={16} className="animate-spin text-accent-mint" />}
      {state === "done" && <Check size={16} className="text-accent-mint" />}
      <span className="hidden sm:inline">
        {state === "done" ? "Reporte exportado" : "Exportar a Excel"}
      </span>
      <span className="sm:hidden">Excel</span>
    </button>
  );
}
