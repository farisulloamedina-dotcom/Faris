/**
 * Utilidades de formato, fechas e identificadores.
 * Las fechas se manejan siempre como `YYYY-MM-DD` en hora local.
 */
import { clsx, type ClassValue } from "clsx";
import { currencyMeta } from "@/lib/constants/catalog";
import type { CurrencyCode, ISODate } from "@/lib/types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* -------------------------------- Números ---------------------------------- */

const fmtCache = new Map<string, Intl.NumberFormat>();
function nf(key: string, factory: () => Intl.NumberFormat) {
  let f = fmtCache.get(key);
  if (!f) {
    f = factory();
    fmtCache.set(key, f);
  }
  return f;
}

export function money(value: number, currency: CurrencyCode, opts: { compact?: boolean; sign?: boolean } = {}) {
  const meta = currencyMeta(currency);
  const key = `m:${currency}:${opts.compact ? 1 : 0}:${opts.sign ? 1 : 0}`;
  const f = nf(key, () =>
    new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      notation: opts.compact ? "compact" : "standard",
      maximumFractionDigits: opts.compact ? 1 : meta.decimals,
      minimumFractionDigits: opts.compact ? 0 : meta.decimals,
      signDisplay: opts.sign ? "exceptZero" : "auto",
    }),
  );
  return f.format(Number.isFinite(value) ? value : 0);
}

export function pct(value: number, digits = 1, sign = false) {
  const f = nf(`p:${digits}:${sign}`, () =>
    new Intl.NumberFormat("es-ES", {
      style: "percent",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
      signDisplay: sign ? "exceptZero" : "auto",
    }),
  );
  return f.format(Number.isFinite(value) ? value : 0);
}

export function num(value: number, digits = 0) {
  return nf(`n:${digits}`, () => new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits })).format(value);
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* --------------------------------- Fechas ---------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());

/** Parsea `YYYY-MM-DD` como fecha local (no UTC). */
export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const isValidISO = (s: unknown): s is ISODate =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const daysBetween = (a: ISODate, b: ISODate) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);

export const monthKey = (iso: ISODate) => iso.slice(0, 7); // YYYY-MM

export function monthsBetween(a: ISODate, b: ISODate) {
  const da = parseISO(a);
  const db = parseISO(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function monthLabel(key: string, long = false) {
  const [y, m] = key.split("-").map(Number);
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}

export function dateLabel(iso: ISODate, style: "short" | "long" = "short") {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (style === "long") return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Lista de claves YYYY-MM de los últimos `n` meses, terminando en el mes de `ref`. */
export function lastMonths(n: number, ref: ISODate = todayISO()) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(addMonths(`${monthKey(ref)}-01`, -i)));
  return out;
}

export function relativeDays(iso: ISODate, ref: ISODate = todayISO()) {
  const d = daysBetween(ref, iso);
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  if (d === -1) return "ayer";
  return d > 0 ? `en ${d} días` : `hace ${-d} días`;
}

/* ------------------------------ Excel (serial) ----------------------------- */

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export function isoToExcelSerial(iso: ISODate) {
  const [y, m, d] = iso.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - EXCEL_EPOCH) / 86_400_000;
}

export function excelSerialToISO(serial: number): ISODate {
  const ms = EXCEL_EPOCH + Math.round(serial) * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
