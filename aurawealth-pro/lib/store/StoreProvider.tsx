"use client";

/**
 * Proveedor global de estado.
 *
 * Responsabilidades:
 *  1. Hidratar desde localStorage (o sembrar la demo en el primer uso).
 *  2. Aplicar acciones del reducer guardando historial para Deshacer (Ctrl+Z).
 *  3. Persistir con debounce, forzar guardado al cerrar la pestaña y
 *     sincronizar entre pestañas mediante el evento `storage`.
 *  4. Mantener una bitácora de cambios que alimenta el panel de sincronización Excel.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AppData } from "@/lib/types";
import { dataReducer, describeAction, type DataAction } from "./reducer";
import { createSeedData, EMPTY_DATA } from "./seed";
import { loadData, saveData, STORAGE_KEYS } from "./storage";

const MAX_HISTORY = 40;
const MAX_LOG = 60;
const SAVE_DEBOUNCE_MS = 250;

export interface ChangeLogEntry {
  id: number;
  at: string;
  label: string;
  sheet: string;
}

interface State {
  data: AppData;
  past: { data: AppData; label: string }[];
  log: ChangeLogEntry[];
  revision: number;
  hydrated: boolean;
  source: PersistenceInfo["source"];
  loadedAt: string | null;
}

type Internal =
  | { type: "@hydrate"; data: AppData; label: string; source: PersistenceInfo["source"]; savedAt: string | null }
  | { type: "@undo" }
  | { type: "@external"; data: AppData }
  | DataAction;

let logSeq = 0;

function rootReducer(state: State, action: Internal): State {
  if (action.type === "@hydrate")
    return {
      ...state,
      data: action.data,
      hydrated: true,
      source: action.source,
      loadedAt: action.savedAt,
      revision: state.revision + 1,
      log: [{ id: ++logSeq, at: new Date().toISOString(), label: action.label, sheet: "Todas" }],
    };
  if (action.type === "@external")
    return {
      ...state,
      data: action.data,
      revision: state.revision + 1,
      log: [{ id: ++logSeq, at: new Date().toISOString(), label: "Cambios recibidos de otra pestaña", sheet: "Todas" }, ...state.log].slice(0, MAX_LOG),
    };
  if (action.type === "@undo") {
    const [last, ...rest] = state.past;
    if (!last) return state;
    return {
      ...state,
      data: last.data,
      past: rest,
      revision: state.revision + 1,
      log: [{ id: ++logSeq, at: new Date().toISOString(), label: `Deshacer: ${last.label}`, sheet: "Todas" }, ...state.log].slice(0, MAX_LOG),
    };
  }
  const next = dataReducer(state.data, action);
  if (next === state.data) return state;
  const { label, sheet } = describeAction(action);
  return {
    ...state,
    data: next,
    past: [{ data: state.data, label }, ...state.past].slice(0, MAX_HISTORY),
    revision: state.revision + 1,
    log: [{ id: ++logSeq, at: new Date().toISOString(), label, sheet }, ...state.log].slice(0, MAX_LOG),
  };
}

export interface PersistenceInfo {
  lastSavedAt: string | null;
  error: string | null;
  bytes: number;
  source: "almacenado" | "demo" | "recuperado" | null;
}

interface StoreContextValue {
  data: AppData;
  dispatch: (action: DataAction) => void;
  undo: () => void;
  canUndo: boolean;
  undoLabel: string | null;
  hydrated: boolean;
  revision: number;
  log: ChangeLogEntry[];
  persistence: PersistenceInfo;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(rootReducer, {
    data: EMPTY_DATA,
    past: [],
    log: [],
    revision: 0,
    hydrated: false,
    source: null,
    loadedAt: null,
  });
  const [saveInfo, setSaveInfo] = useState<{ lastSavedAt: string | null; error: string | null; bytes: number }>({ lastSavedAt: null, error: null, bytes: 0 });
  const dataRef = useRef(state.data);
  const dirtyRef = useRef(false);
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    dataRef.current = state.data;
  }, [state.data]);

  // 1. Hidratación inicial
  useEffect(() => {
    const result = loadData();
    if (result.status === "empty") {
      rawDispatch({ type: "@hydrate", data: createSeedData(), label: "Datos de demostración cargados", source: "demo", savedAt: null });
    } else {
      rawDispatch({
        type: "@hydrate",
        data: result.data,
        label: result.status === "recovered" ? "Recuperado desde snapshot" : "Base de datos local cargada",
        source: result.status === "recovered" ? "recuperado" : "almacenado",
        savedAt: result.savedAt,
      });
    }
  }, []);

  const flush = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    const res = saveData(dataRef.current);
    lastWrittenRef.current = res.savedAt;
    setSaveInfo((p) => ({ lastSavedAt: res.ok ? res.savedAt : p.lastSavedAt, error: res.error ?? null, bytes: res.bytes }));
  }, []);

  // 2. Persistencia con debounce en cada revisión
  useEffect(() => {
    if (!state.hydrated) return;
    dirtyRef.current = true;
    const t = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state.revision, state.hydrated, flush]);

  // 3. Guardado forzado al ocultar/cerrar la pestaña
  useEffect(() => {
    const onHide = () => flush();
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  // 4. Sincronización entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEYS.DB_KEY || !e.newValue) return;
      const res = loadData();
      if (res.status !== "empty" && res.savedAt !== lastWrittenRef.current) {
        dirtyRef.current = false;
        rawDispatch({ type: "@external", data: res.data });
        setSaveInfo((p) => ({ ...p, lastSavedAt: res.savedAt }));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const undo = useCallback(() => rawDispatch({ type: "@undo" }), []);

  // Atajo global Ctrl/Cmd+Z (fuera de campos de texto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const dispatch = useCallback((a: DataAction) => rawDispatch(a), []);
  const persistence = useMemo<PersistenceInfo>(
    () => ({ ...saveInfo, lastSavedAt: saveInfo.lastSavedAt ?? state.loadedAt, source: state.source }),
    [saveInfo, state.loadedAt, state.source],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      data: state.data,
      dispatch,
      undo,
      canUndo: state.past.length > 0,
      undoLabel: state.past[0]?.label ?? null,
      hydrated: state.hydrated,
      revision: state.revision,
      log: state.log,
      persistence,
    }),
    [state, dispatch, undo, persistence],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}

/** Atajo para leer solo los datos. */
export const useData = () => useStore().data;
export const useCurrency = () => useStore().data.settings.currency;
