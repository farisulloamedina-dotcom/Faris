"use client";

/**
 * Motor de sincronización Excel en tiempo real.
 *
 * - `model`: libro en memoria recalculado en cada cambio del estado (useMemo).
 * - Exportación bajo demanda (descarga .xlsx con estilos).
 * - Archivo vinculado (File System Access API, Chrome/Edge): el usuario elige
 *   un .xlsx y cada cambio en la app se escribe automáticamente en ese archivo
 *   (debounce). También puede releerse para importar cambios hechos en Excel
 *   → sincronización bidireccional. El vínculo se recuerda en IndexedDB.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store/StoreProvider";
import { buildWorkbookModel, type WorkbookModel } from "./model";
import { buildWorkbookBlob, downloadBlob, workbookFileName } from "./export";
import { parseWorkbook, type ImportReport } from "./import";

/* ---------------------- Tipos mínimos File System Access --------------------- */

interface FSWritable {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}
interface FSHandle {
  name: string;
  kind: "file";
  createWritable: () => Promise<FSWritable>;
  getFile: () => Promise<File>;
  queryPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
}
type SavePicker = (o: { suggestedName?: string; types?: { description: string; accept: Record<string, string[]> }[] }) => Promise<FSHandle>;

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/* ------------------------- IndexedDB (handle persistente) -------------------- */

const IDB_NAME = "aurawealth-pro";
const IDB_STORE = "handles";

function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      const open = indexedDB.open(IDB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(IDB_STORE);
      open.onerror = () => resolve(undefined);
      open.onsuccess = () => {
        try {
          const tx = open.result.transaction(IDB_STORE, mode);
          const req = fn(tx.objectStore(IDB_STORE));
          req.onsuccess = () => resolve(req.result as T);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      };
    } catch {
      resolve(undefined);
    }
  });
}

/* --------------------------------- Contexto --------------------------------- */

export type LinkStatus = "none" | "linked" | "needs-permission" | "writing" | "error";

interface ExcelSyncValue {
  model: WorkbookModel;
  totalRows: number;
  exportNow: () => Promise<void>;
  exporting: boolean;
  lastExportAt: string | null;
  supportsFileLink: boolean;
  linkedName: string | null;
  linkStatus: LinkStatus;
  linkError: string | null;
  lastFileWriteAt: string | null;
  autoSave: boolean;
  setAutoSave: (v: boolean) => void;
  linkFile: () => Promise<void>;
  reconnect: () => Promise<void>;
  unlink: () => Promise<void>;
  readLinkedFile: () => Promise<ImportReport | null>;
}

const ExcelSyncContext = createContext<ExcelSyncValue | null>(null);

export function ExcelSyncProvider({ children }: { children: ReactNode }) {
  const { data, revision, hydrated } = useStore();
  const model = useMemo(() => buildWorkbookModel(data), [data]);
  const modelRef = useRef(model);
  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  const [exporting, setExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [handle, setHandle] = useState<FSHandle | null>(null);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("none");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [lastFileWriteAt, setLastFileWriteAt] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  // Solo se renderiza en cliente tras hidratar, así que la detección perezosa es segura
  const [supportsFileLink] = useState(() => typeof window !== "undefined" && "showSaveFilePicker" in window);
  const lastWrittenRevision = useRef<number>(-1);

  const totalRows = useMemo(
    () => model.sheets.reduce((a, s) => a + (s.kind === "table" ? s.rows.length : s.kpis.length), 0),
    [model],
  );

  // Detección de soporte + restauración del vínculo guardado
  useEffect(() => {
    if (!supportsFileLink) return;
    idb<FSHandle>("readonly", (s) => s.get("linked")).then(async (h) => {
      if (!h) return;
      setHandle(h);
      const perm = (await h.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
      setLinkStatus(perm === "granted" ? "linked" : "needs-permission");
    });
  }, [supportsFileLink]);

  const writeToHandle = useCallback(async (h: FSHandle) => {
    setLinkStatus("writing");
    try {
      const blob = await buildWorkbookBlob(modelRef.current);
      const w = await h.createWritable();
      await w.write(blob);
      await w.close();
      setLastFileWriteAt(new Date().toISOString());
      setLinkStatus("linked");
      setLinkError(null);
    } catch (e) {
      setLinkStatus("error");
      setLinkError(e instanceof Error ? e.message : "No se pudo escribir el archivo");
    }
  }, []);

  // Autoguardado en el archivo vinculado ante cada cambio (debounce 1.2 s)
  useEffect(() => {
    if (!hydrated || !handle || !autoSave || linkStatus === "needs-permission" || linkStatus === "none") return;
    if (lastWrittenRevision.current === revision) return;
    const t = window.setTimeout(() => {
      lastWrittenRevision.current = revision;
      void writeToHandle(handle);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [revision, hydrated, handle, autoSave, linkStatus, writeToHandle]);

  const exportNow = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await buildWorkbookBlob(modelRef.current);
      downloadBlob(blob, workbookFileName());
      setLastExportAt(new Date().toISOString());
    } finally {
      setExporting(false);
    }
  }, []);

  const linkFile = useCallback(async () => {
    const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    if (!picker) return;
    try {
      const h = await picker({ suggestedName: "AuraWealth_Pro_Sync.xlsx", types: [{ description: "Libro de Excel", accept: { [XLSX_MIME]: [".xlsx"] } }] });
      setHandle(h);
      await idb("readwrite", (s) => s.put(h, "linked"));
      lastWrittenRevision.current = revision;
      await writeToHandle(h);
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") {
        setLinkStatus("error");
        setLinkError(e instanceof Error ? e.message : "No se pudo vincular el archivo");
      }
    }
  }, [revision, writeToHandle]);

  const reconnect = useCallback(async () => {
    if (!handle) return;
    const perm = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "granted";
    if (perm === "granted") await writeToHandle(handle);
    else setLinkStatus("needs-permission");
  }, [handle, writeToHandle]);

  const unlink = useCallback(async () => {
    setHandle(null);
    setLinkStatus("none");
    setLastFileWriteAt(null);
    await idb("readwrite", (s) => s.delete("linked"));
  }, []);

  const readLinkedFile = useCallback(async () => {
    if (!handle) return null;
    const perm = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "granted";
    if (perm !== "granted") {
      setLinkStatus("needs-permission");
      return null;
    }
    const file = await handle.getFile();
    return parseWorkbook(file);
  }, [handle]);

  const value = useMemo<ExcelSyncValue>(
    () => ({
      model,
      totalRows,
      exportNow,
      exporting,
      lastExportAt,
      supportsFileLink,
      linkedName: handle?.name ?? null,
      linkStatus,
      linkError,
      lastFileWriteAt,
      autoSave,
      setAutoSave,
      linkFile,
      reconnect,
      unlink,
      readLinkedFile,
    }),
    [model, totalRows, exportNow, exporting, lastExportAt, supportsFileLink, handle, linkStatus, linkError, lastFileWriteAt, autoSave, linkFile, reconnect, unlink, readLinkedFile],
  );

  return <ExcelSyncContext.Provider value={value}>{children}</ExcelSyncContext.Provider>;
}

export function useExcelSync() {
  const ctx = useContext(ExcelSyncContext);
  if (!ctx) throw new Error("useExcelSync debe usarse dentro de <ExcelSyncProvider>");
  return ctx;
}
