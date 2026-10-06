/**
 * Capa de persistencia local robusta (localStorage).
 *
 * - Sobre versionado `{ version, savedAt, data }` con migraciones.
 * - Validación completa al cargar (sanitizeAppData); si el contenido está
 *   corrupto se aparta en una clave de cuarentena y se recupera el último snapshot.
 * - Snapshots rotativos (máx. 10) para restauración puntual.
 * - Tolerante a cuotas llenas, modo privado y SSR (todas las llamadas en try/catch).
 */
import type { AppData } from "@/lib/types";
import { sanitizeAppData } from "./sanitize";

export const SCHEMA_VERSION = 1;
const DB_KEY = "aurawealth.pro.db";
const SNAP_KEY = "aurawealth.pro.snapshots";
const MAX_SNAPSHOTS = 10;
const SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000;

interface Envelope {
  version: number;
  savedAt: string;
  data: AppData;
}

export interface Snapshot {
  id: string;
  savedAt: string;
  reason: string;
  counts: { transactions: number; debts: number; receivables: number; goals: number };
  data: AppData;
}

export type LoadResult =
  | { status: "loaded"; data: AppData; savedAt: string }
  | { status: "recovered"; data: AppData; savedAt: string }
  | { status: "empty" };

/** Migraciones: cada función transforma la versión N en N+1. */
const MIGRATIONS: Record<number, (data: unknown) => unknown> = {
  // 1: (d) => ({ ...d, nuevoCampo: [] }),
};

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = "__aw_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const isStorageAvailable = () => storage() !== null;

function migrate(env: { version?: number; data?: unknown }) {
  let version = env.version ?? 1;
  let data = env.data;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (step) data = step(data);
    version++;
  }
  return data;
}

export function loadData(): LoadResult {
  const s = storage();
  if (!s) return { status: "empty" };
  const raw = s.getItem(DB_KEY);
  if (!raw) return { status: "empty" };
  try {
    const env = JSON.parse(raw) as Envelope;
    return { status: "loaded", data: sanitizeAppData(migrate(env)), savedAt: env.savedAt };
  } catch {
    // Cuarentena del contenido dañado y recuperación desde snapshot
    try {
      s.setItem(`aurawealth.pro.corrupt.${Date.now()}`, raw);
    } catch {
      /* sin espacio: se ignora */
    }
    const snap = listSnapshots()[0];
    if (snap) return { status: "recovered", data: sanitizeAppData(snap.data), savedAt: snap.savedAt };
    return { status: "empty" };
  }
}

export function saveData(data: AppData): { ok: boolean; savedAt: string; bytes: number; error?: string } {
  const savedAt = new Date().toISOString();
  const s = storage();
  if (!s) return { ok: false, savedAt, bytes: 0, error: "Almacenamiento local no disponible" };
  const payload = JSON.stringify({ version: SCHEMA_VERSION, savedAt, data } satisfies Envelope);
  try {
    s.setItem(DB_KEY, payload);
    maybeAutoSnapshot(data);
    return { ok: true, savedAt, bytes: payload.length * 2 };
  } catch (e) {
    return { ok: false, savedAt, bytes: payload.length * 2, error: e instanceof Error ? e.message : "Error al guardar" };
  }
}

export function clearData() {
  storage()?.removeItem(DB_KEY);
}

/* -------------------------------- Snapshots -------------------------------- */

export function listSnapshots(): Snapshot[] {
  const s = storage();
  if (!s) return [];
  try {
    const list = JSON.parse(s.getItem(SNAP_KEY) ?? "[]");
    return Array.isArray(list) ? (list as Snapshot[]) : [];
  } catch {
    return [];
  }
}

export function createSnapshot(data: AppData, reason: string): Snapshot | null {
  const s = storage();
  if (!s) return null;
  const snap: Snapshot = {
    id: `snap_${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
    reason,
    counts: {
      transactions: data.transactions.length,
      debts: data.debts.length,
      receivables: data.receivables.length,
      goals: data.goals.length,
    },
    data,
  };
  let list = [snap, ...listSnapshots()].slice(0, MAX_SNAPSHOTS);
  // Si no cabe, se descartan los más antiguos hasta que quepa
  while (list.length) {
    try {
      s.setItem(SNAP_KEY, JSON.stringify(list));
      return snap;
    } catch {
      list = list.slice(0, -1);
    }
  }
  return null;
}

export function deleteSnapshot(id: string) {
  const s = storage();
  if (!s) return;
  s.setItem(SNAP_KEY, JSON.stringify(listSnapshots().filter((x) => x.id !== id)));
}

function maybeAutoSnapshot(data: AppData) {
  const last = listSnapshots().find((x) => x.reason === "Automático");
  if (!last || Date.now() - new Date(last.savedAt).getTime() > SNAPSHOT_INTERVAL_MS) createSnapshot(data, "Automático");
}

export const STORAGE_KEYS = { DB_KEY, SNAP_KEY };

export function storageUsage() {
  const s = storage();
  if (!s) return 0;
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith("aurawealth.")) bytes += ((s.getItem(k) ?? "").length + k.length) * 2;
  }
  return bytes;
}
