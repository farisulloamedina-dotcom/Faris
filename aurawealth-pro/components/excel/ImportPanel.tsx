"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { CircleCheck, CircleX, FileDown, FileSpreadsheet, FileUp, GitMerge, Replace, TriangleAlert, Upload } from "lucide-react";
import type { ImportReport } from "@/lib/excel/import";
import { parseWorkbook } from "@/lib/excel/import";
import { buildWorkbookModel } from "@/lib/excel/model";
import { buildWorkbookBlob, downloadBlob } from "@/lib/excel/export";
import { createSnapshot } from "@/lib/store/storage";
import { EMPTY_DATA } from "@/lib/store/seed";
import { useStore } from "@/lib/store/StoreProvider";
import { cn } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toaster";

/** Revisión previa a aplicar una importación (informe por hoja + modo). */
export function ImportReview({ report, onDone, onCancel }: { report: ImportReport; onDone: () => void; onCancel: () => void }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const [mode, setMode] = useState<"replace" | "merge">("replace");

  function apply() {
    createSnapshot(data, `Antes de importar «${report.fileName}»`);
    const incoming = { ...report.data, settings: report.hasSettings ? report.data.settings : data.settings };
    dispatch({ type: mode === "replace" ? "data/replace" : "data/merge", payload: incoming });
    toast({
      tone: "success",
      title: mode === "replace" ? "Base de datos restaurada desde Excel" : "Datos combinados desde Excel",
      description: `${report.totals.transactions} movimientos · ${report.totals.debts} deudas · ${report.totals.receivables} cobros · ${report.totals.goals} metas. Snapshot previo guardado.`,
    });
    onDone();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
        <FileSpreadsheet className="text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{report.fileName}</p>
          <p className="text-xs text-slate-500">
            {report.totals.transactions} movimientos · {report.totals.debts} deudas · {report.totals.receivables} cuentas por cobrar · {report.totals.goals} metas · {report.totals.history} movimientos de historial
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left">Hoja</th>
              <th className="px-4 py-2 text-center">Estado</th>
              <th className="px-4 py-2 text-right">Importadas</th>
              <th className="px-4 py-2 text-right">Omitidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.sheets.map((s) => (
              <tr key={s.sheet}>
                <td className="px-4 py-2">
                  <p className="font-semibold text-slate-800">{s.sheet}</p>
                  {s.matchedName && s.matchedName !== s.sheet && <p className="text-[11px] text-slate-400">Detectada como «{s.matchedName}»</p>}
                  {s.warnings.map((w) => (
                    <p key={w} className="text-[11px] text-amber-600">
                      {w}
                    </p>
                  ))}
                </td>
                <td className="px-4 py-2 text-center">
                  {s.found ? (
                    <Badge tone="emerald" icon={<CircleCheck size={11} />}>
                      Encontrada
                    </Badge>
                  ) : (
                    <Badge tone="slate" icon={<CircleX size={11} />}>
                      No incluida
                    </Badge>
                  )}
                </td>
                <td className="tabular px-4 py-2 text-right font-bold text-emerald-600">{s.imported}</td>
                <td className={cn("tabular px-4 py-2 text-right font-bold", s.skipped ? "text-amber-600" : "text-slate-300")}>{s.skipped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { v: "replace", icon: Replace, title: "Reemplazar todo", desc: "Restaura la base de datos exactamente como está en el Excel." },
            { v: "merge", icon: GitMerge, title: "Combinar", desc: "Agrega registros nuevos y actualiza los existentes por ID." },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setMode(o.v)}
            className={cn("flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition", mode === o.v ? "bg-indigo-50 ring-2 ring-indigo-500" : "bg-white ring-slate-200 hover:ring-indigo-300")}
          >
            <o.icon size={18} className={mode === o.v ? "text-indigo-600" : "text-slate-400"} />
            <span>
              <span className="block text-sm font-bold text-slate-800">{o.title}</span>
              <span className="block text-xs text-slate-500">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>
      {mode === "replace" && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          <TriangleAlert size={14} /> Se guardará automáticamente un snapshot de tus datos actuales antes de reemplazarlos.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" icon={Upload} onClick={apply}>
          Aplicar importación
        </Button>
      </div>
    </motion.div>
  );
}

export function ImportPanel() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) {
      toast({ tone: "error", title: "Formato no soportado", description: "Selecciona un archivo .xlsx" });
      return;
    }
    setLoading(true);
    try {
      setReport(await parseWorkbook(file));
    } catch (e) {
      toast({ tone: "error", title: "No se pudo leer el archivo", description: e instanceof Error ? e.message : "Archivo inválido" });
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    const blob = await buildWorkbookBlob(buildWorkbookModel(EMPTY_DATA));
    downloadBlob(blob, "AuraWealth_Pro_Plantilla.xlsx");
  }

  return (
    <Card hover={false} className="p-5">
      <CardHeader
        title="Importar desde Excel"
        subtitle="Carga un libro con la misma estructura para poblar o restaurar la base de datos"
        icon={FileUp}
        tone="emerald"
        action={
          <Button size="sm" variant="secondary" icon={FileDown} onClick={downloadTemplate}>
            Plantilla vacía
          </Button>
        }
      />
      <div className="mt-5">
        {report ? (
          <ImportReview report={report} onDone={() => setReport(null)} onCancel={() => setReport(null)} />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void handle(e.dataTransfer.files[0]);
            }}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all",
              drag ? "scale-[1.01] border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white/60 hover:border-emerald-400 hover:bg-emerald-50/40",
            )}
          >
            <span className={cn("flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-glow-emerald transition-transform duration-500", drag ? "scale-110 rotate-6" : "group-hover:-translate-y-1")}>
              {loading ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-r-transparent" /> : <Upload size={26} />}
            </span>
            <span className="text-base font-bold text-slate-800">{loading ? "Analizando libro…" : "Arrastra tu archivo .xlsx aquí"}</span>
            <span className="max-w-md text-sm text-slate-500">o haz clic para seleccionarlo. Se detectan las hojas y columnas por nombre (sin importar el orden), se validan los datos y verás un informe antes de aplicar.</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" className="hidden" onChange={(e) => (void handle(e.target.files?.[0]), (e.target.value = ""))} />
      </div>
    </Card>
  );
}
