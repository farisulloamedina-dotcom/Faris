"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  Gauge,
  History,
  Landmark,
  Link2,
  Receipt,
  RefreshCw,
  ScrollText,
  Settings2,
  Target,
  Unlink,
  Zap,
} from "lucide-react";
import { useExcelSync } from "@/lib/excel/ExcelSyncProvider";
import type { ImportReport } from "@/lib/excel/import";
import { SHEETS } from "@/lib/excel/model";
import { useStore } from "@/lib/store/StoreProvider";
import { timeAgo, useNow } from "@/lib/hooks/useFinance";
import { cn } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { SheetPreview } from "./SheetPreview";
import { ImportPanel, ImportReview } from "./ImportPanel";
import { BackupPanel, PreferencesPanel } from "./DataPanels";

type Tab = "sincronizacion" | "vista-previa" | "importar" | "respaldo" | "preferencias";
const TABS: Tab[] = ["sincronizacion", "vista-previa", "importar", "respaldo", "preferencias"];

const SHEET_ICONS: Record<string, { icon: typeof Gauge; cls: string }> = {
  [SHEETS.summary]: { icon: Gauge, cls: "bg-indigo-50 text-indigo-600" },
  [SHEETS.incomes]: { icon: ArrowUpRight, cls: "bg-emerald-50 text-emerald-600" },
  [SHEETS.expenses]: { icon: ArrowDownRight, cls: "bg-rose-50 text-rose-600" },
  [SHEETS.debts]: { icon: Landmark, cls: "bg-rose-50 text-rose-600" },
  [SHEETS.receivables]: { icon: Receipt, cls: "bg-amber-50 text-amber-600" },
  [SHEETS.goals]: { icon: Target, cls: "bg-emerald-50 text-emerald-600" },
  [SHEETS.history]: { icon: ScrollText, cls: "bg-blue-50 text-blue-600" },
  [SHEETS.config]: { icon: Settings2, cls: "bg-slate-100 text-slate-600" },
};

function SyncTab() {
  const sync = useExcelSync();
  const { log } = useStore();
  const toast = useToast();
  const now = useNow(3000);
  const [linkedReport, setLinkedReport] = useState<ImportReport | null>(null);
  const [reading, setReading] = useState(false);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        {/* Exportación */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-6 text-white shadow-float">
          <div className="absolute -right-12 -top-12 h-48 w-48 animate-float rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Libro en memoria sincronizado · {timeAgo(log[0]?.at ?? sync.model.generatedAt, now)}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Exportación profesional a Excel</h2>
              <p className="mt-1 max-w-lg text-sm text-emerald-50">
                {sync.model.sheets.length} hojas independientes · {sync.totalRows} filas · cabeceras índigo, filas cebra, formatos de moneda/porcentaje/fecha, autofiltro y totales con fórmulas.
              </p>
            </div>
            <button onClick={sync.exportNow} disabled={sync.exporting} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-700 shadow-xl transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-70">
              <Download size={18} /> {sync.exporting ? "Generando…" : "Descargar .xlsx"}
            </button>
          </div>
          {sync.lastExportAt && <p className="relative mt-3 text-xs text-emerald-100">Última exportación {timeAgo(sync.lastExportAt, now)}</p>}
        </div>

        <Card hover={false} className="p-5">
          <CardHeader title="Estructura del libro" subtitle="Se actualiza en tiempo real con cada alta, edición o eliminación" icon={FileSpreadsheet} tone="emerald" />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {sync.model.sheets.map((s, i) => {
              const meta = SHEET_ICONS[s.name] ?? SHEET_ICONS[SHEETS.config];
              const rows = s.kind === "table" ? s.rows.length : s.kpis.length;
              return (
                <motion.li key={s.name} layout className="group flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-card">
                  <span className="w-5 text-center text-xs font-extrabold text-slate-300">{i + 1}</span>
                  <span className={cn("rounded-xl p-2 transition group-hover:scale-110", meta.cls)}>
                    <meta.icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-800">{s.name}</span>
                    <span className="block truncate text-[11px] text-slate-400">{s.kind === "summary" ? "KPIs + balances + totales consolidados" : `${s.columns.length} columnas`}</span>
                  </span>
                  <AnimatePresence mode="popLayout">
                    <motion.span key={rows} initial={{ scale: 1.4, color: "#10B981" }} animate={{ scale: 1, color: "#0F172A" }} className="tabular text-sm font-extrabold">
                      {rows}
                    </motion.span>
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        </Card>

        {/* Archivo vinculado */}
        <Card hover={false} className="p-5">
          <CardHeader
            title="Archivo Excel vinculado (sincronización bidireccional)"
            subtitle="Cada cambio se escribe automáticamente en tu archivo; también puedes releerlo tras editarlo en Excel"
            icon={Link2}
            tone="indigo"
            action={
              sync.linkedName ? (
                <Badge tone={sync.linkStatus === "error" ? "rose" : sync.linkStatus === "needs-permission" ? "amber" : "emerald"} pulse={sync.linkStatus === "writing"}>
                  {sync.linkStatus === "writing" ? "Escribiendo…" : sync.linkStatus === "needs-permission" ? "Requiere permiso" : sync.linkStatus === "error" ? "Error" : "Vinculado"}
                </Badge>
              ) : undefined
            }
          />
          {!sync.supportsFileLink ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Vincular un archivo con autoguardado requiere abrir la app directamente en Chrome o Edge de escritorio (no está disponible en este navegador ni dentro de un visor incrustado). Mientras tanto, usa <b>Descargar .xlsx</b> e <b>Importar</b>.
            </p>
          ) : sync.linkedName ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-50/70 p-4 ring-1 ring-indigo-100">
                <FileSpreadsheet className="text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{sync.linkedName}</p>
                  <p className="text-xs text-slate-500">Última escritura: {timeAgo(sync.lastFileWriteAt, now)}</p>
                  {sync.linkError && <p className="text-xs font-semibold text-rose-600">{sync.linkError}</p>}
                </div>
                <Switch checked={sync.autoSave} onChange={sync.setAutoSave} label="Autoguardado" />
              </div>
              <div className="flex flex-wrap gap-2">
                {sync.linkStatus === "needs-permission" && (
                  <Button variant="primary" icon={RefreshCw} onClick={sync.reconnect}>
                    Reconectar
                  </Button>
                )}
                <Button variant="secondary" icon={Zap} onClick={sync.reconnect}>
                  Escribir ahora
                </Button>
                <Button
                  variant="secondary"
                  icon={FileUp}
                  loading={reading}
                  onClick={async () => {
                    setReading(true);
                    try {
                      setLinkedReport(await sync.readLinkedFile());
                    } catch (e) {
                      toast({ tone: "error", title: "No se pudo leer el archivo", description: e instanceof Error ? e.message : "" });
                    } finally {
                      setReading(false);
                    }
                  }}
                >
                  Releer desde Excel
                </Button>
                <Button variant="ghost" icon={Unlink} onClick={sync.unlink}>
                  Desvincular
                </Button>
              </div>
              {linkedReport && <ImportReview report={linkedReport} onDone={() => setLinkedReport(null)} onCancel={() => setLinkedReport(null)} />}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
              <p className="max-w-md text-sm text-slate-600">Elige dónde guardar tu libro. A partir de ahí, AuraWealth Pro lo mantendrá actualizado automáticamente con cada cambio.</p>
              <Button variant="primary" icon={Link2} onClick={sync.linkFile}>
                Vincular archivo .xlsx
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Bitácora */}
      <Card hover={false} className="p-5 xl:col-span-2">
        <CardHeader title="Bitácora de sincronización" subtitle="Cambios aplicados al libro en memoria" icon={Activity} tone="violet" />
        <ol className="relative mt-5 space-y-0 border-l-2 border-indigo-100 pl-5">
          <AnimatePresence initial={false}>
            {log.slice(0, 18).map((e, i) => (
              <motion.li key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative pb-4">
                <span className={cn("absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white", i === 0 ? "bg-emerald-500" : "bg-indigo-300")}>
                  {i === 0 && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />}
                </span>
                <p className="text-sm font-bold text-slate-800">{e.label}</p>
                <p className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  {timeAgo(e.at, now)}
                  <Badge tone="emerald">
                    <FileSpreadsheet size={10} /> {e.sheet}
                  </Badge>
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={14} /> Todo cambio queda listo para exportar al instante.
        </p>
      </Card>
    </div>
  );
}

export function ExcelCenterView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { model } = useExcelSync();
  const { data } = useStore();
  const tab = (TABS.includes(params.get("tab") as Tab) ? params.get("tab") : "sincronizacion") as Tab;
  return (
    <>
      <PageHeader
        eyebrow="Integración Excel · Prioridad máxima"
        title="Centro Excel y Datos"
        description="Motor bidireccional: exportación multi-hoja con estilos corporativos, importación validada, archivo vinculado con autoguardado, respaldos y preferencias."
      />
      <Tabs
        value={tab}
        onChange={(t) => router.replace(`${pathname}?tab=${t}`, { scroll: false })}
        items={[
          { value: "sincronizacion", label: "Sincronización", icon: RefreshCw },
          { value: "vista-previa", label: "Vista previa", icon: Eye },
          { value: "importar", label: "Importar", icon: FileUp },
          { value: "respaldo", label: "Respaldo", icon: History },
          { value: "preferencias", label: "Preferencias", icon: Settings2 },
        ]}
        className="flex-wrap"
      />
      {tab === "sincronizacion" && <SyncTab />}
      {tab === "vista-previa" && <SheetPreview model={model} currency={data.settings.currency} />}
      {tab === "importar" && <ImportPanel />}
      {tab === "respaldo" && <BackupPanel />}
      {tab === "preferencias" && <PreferencesPanel />}
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Database size={12} /> Persistencia local: localStorage versionado + snapshots · Ningún dato se envía a servidores.
      </p>
    </>
  );
}
