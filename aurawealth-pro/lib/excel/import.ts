/**
 * Importador Excel → base de datos.
 *
 * Lee un libro con la misma estructura que genera el exportador (o una versión
 * editada a mano por el usuario) y reconstruye `AppData`:
 *  - Localiza hojas por nombre de forma tolerante (sin acentos/mayúsculas).
 *  - Detecta automáticamente la fila de cabecera y mapea columnas por su título,
 *    sin depender del orden.
 *  - Convierte fechas seriales/texto, montos con separadores locales y booleanos "Sí/No".
 *  - Ignora filas vacías y la fila TOTAL; cada fila pasa por el saneador del dominio.
 *  - Reconstruye pagos, cobros y aportes desde "Historial de Movimientos".
 * Devuelve un informe detallado para previsualizar antes de aplicar.
 */
import type { AppData } from "@/lib/types";
import { excelSerialToISO, isValidISO, uid } from "@/lib/format";
import { loadXLSX, type XLSXModule } from "./xlsx";
import {
  sanitizeDebt,
  sanitizeExpense,
  sanitizeGoal,
  sanitizeIncome,
  sanitizeReceivable,
  sanitizeSettings,
  numv,
  str,
} from "@/lib/store/sanitize";
import {
  CONFIG_COLUMNS,
  DEBT_COLUMNS,
  EXPENSE_COLUMNS,
  GOAL_COLUMNS,
  HISTORY_COLUMNS,
  HISTORY_TYPES,
  INCOME_COLUMNS,
  RECEIVABLE_COLUMNS,
  SHEETS,
  type ColumnSpec,
} from "./model";


export interface SheetReport {
  sheet: string;
  found: boolean;
  matchedName?: string;
  rows: number;
  imported: number;
  skipped: number;
  warnings: string[];
}

export interface ImportReport {
  fileName: string;
  data: AppData;
  sheets: SheetReport[];
  totals: { transactions: number; debts: number; receivables: number; goals: number; history: number };
  /** true si el libro trae la hoja Configuración con valores. */
  hasSettings: boolean;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, "");

/** Alias aceptados además de la cabecera oficial y la clave interna. */
const ALIASES: Record<string, string[]> = {
  date: ["fecha", "dia"],
  amount: ["monto", "importe", "valor", "montototal", "cantidad"],
  category: ["categoria", "tipodeingreso"],
  source: ["fuente", "pagador", "origen", "fuentepagador"],
  method: ["metodo", "metododepago", "metododerecepcion", "formadepago"],
  macro: ["macrocategoria", "categoria"],
  micro: ["microcategoria", "subcategoria"],
  merchant: ["comercio", "detalle", "descripcion", "concepto", "comerciodetalle"],
  notes: ["notas", "nota", "observaciones", "comentarios"],
  name: ["deuda", "meta", "nombre"],
  debtor: ["deudor", "cliente"],
};

function findSheet(X: XLSXModule, wb: import("xlsx-js-style").WorkBook, canonical: string) {
  const target = norm(canonical);
  const name =
    wb.SheetNames.find((n) => norm(n) === target) ??
    wb.SheetNames.find((n) => norm(n).startsWith(target) || (target.startsWith(norm(n)) && norm(n).length >= 8));
  if (!name) return null;
  const rows = X.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
  return { name, rows };
}

function mapHeaders(rows: unknown[][], columns: ColumnSpec[]) {
  let best = { index: -1, map: new Map<number, string>() };
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const map = new Map<number, string>();
    const used = new Set<string>();
    (rows[r] ?? []).forEach((cell, c) => {
      const h = norm(cell);
      if (!h) return;
      const col =
        columns.find((x) => !used.has(x.key) && norm(x.header) === h) ??
        columns.find((x) => !used.has(x.key) && norm(x.key) === h) ??
        columns.find((x) => !used.has(x.key) && (ALIASES[x.key] ?? []).includes(h));
      if (col) {
        map.set(c, col.key);
        used.add(col.key);
      }
    });
    if (map.size > best.map.size) best = { index: r, map };
  }
  return best.map.size >= 2 ? best : null;
}

function toISODate(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return excelSerialToISO((v.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000);
  if (typeof v === "number" && v > 0 && v < 2_958_465) return excelSerialToISO(v);
  const s = String(v).trim();
  if (isValidISO(s.slice(0, 10))) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/); // dd/mm/yyyy
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    const iso = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return isValidISO(iso) ? iso : undefined;
  }
  return undefined;
}

function readTable(sheet: { name: string; rows: unknown[][] } | null, columns: ColumnSpec[], report: SheetReport) {
  if (!sheet) return [];
  report.found = true;
  report.matchedName = sheet.name;
  const header = mapHeaders(sheet.rows, columns);
  if (!header) {
    report.warnings.push("No se encontró una fila de cabecera reconocible.");
    return [];
  }
  const fmtOf = new Map(columns.map((c) => [c.key, c.fmt]));
  const out: Record<string, unknown>[] = [];
  for (let r = header.index + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r] ?? [];
    if (row.every((c) => c == null || String(c).trim() === "")) continue;
    if (norm(row[0]) === "total") continue;
    report.rows++;
    const obj: Record<string, unknown> = { __row: r + 1 };
    header.map.forEach((key, c) => {
      const v = row[c];
      const fmt = fmtOf.get(key);
      if (fmt === "date") obj[key] = toISODate(v);
      else if (fmt === "percent") {
        const n = numv(v, NaN);
        obj[key] = Number.isFinite(n) ? (Math.abs(n) <= 1 ? n * 100 : n) : undefined; // 0.185 → 18.5 %
      } else obj[key] = v;
    });
    out.push(obj);
  }
  return out;
}

export async function parseWorkbook(file: File | ArrayBuffer, fileName = "archivo.xlsx"): Promise<ImportReport> {
  const X = await loadXLSX();
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const wb = X.read(buf, { type: "array", cellDates: false });
  const name = file instanceof File ? file.name : fileName;

  const rep = (sheet: string): SheetReport => ({ sheet, found: false, rows: 0, imported: 0, skipped: 0, warnings: [] });
  const reports = {
    incomes: rep(SHEETS.incomes),
    expenses: rep(SHEETS.expenses),
    debts: rep(SHEETS.debts),
    receivables: rep(SHEETS.receivables),
    goals: rep(SHEETS.goals),
    history: rep(SHEETS.history),
    config: rep(SHEETS.config),
  };

  const seen = new Set<string>();
  const uniqueId = (id: unknown, prefix: string) => {
    let v = str(id);
    if (!v || seen.has(v)) v = uid(prefix);
    seen.add(v);
    return v;
  };

  function collect<T extends { id: string }>(rows: Record<string, unknown>[], report: SheetReport, make: (o: Record<string, unknown>) => T | null, prefix: string, extra: Record<string, unknown> = {}) {
    const out: T[] = [];
    for (const o of rows) {
      const item = make({ ...o, ...extra, id: uniqueId(o.id, prefix) });
      if (item) {
        out.push(item);
        report.imported++;
      } else {
        report.skipped++;
        if (report.warnings.length < 6) report.warnings.push(`Fila ${o.__row}: datos obligatorios ausentes o monto inválido.`);
      }
    }
    return out;
  }

  const incomes = collect(readTable(findSheet(X, wb, SHEETS.incomes), INCOME_COLUMNS, reports.incomes), reports.incomes, sanitizeIncome, "inc", { kind: "income" });
  const expenses = collect(readTable(findSheet(X, wb, SHEETS.expenses), EXPENSE_COLUMNS, reports.expenses), reports.expenses, sanitizeExpense, "exp", { kind: "expense" });
  const debts = collect(readTable(findSheet(X, wb, SHEETS.debts), DEBT_COLUMNS.filter((c) => c.importable !== false), reports.debts), reports.debts, sanitizeDebt, "debt");
  const receivables = collect(readTable(findSheet(X, wb, SHEETS.receivables), RECEIVABLE_COLUMNS.filter((c) => c.importable !== false), reports.receivables), reports.receivables, sanitizeReceivable, "rcv");
  const goals = collect(readTable(findSheet(X, wb, SHEETS.goals), GOAL_COLUMNS.filter((c) => c.importable !== false), reports.goals), reports.goals, sanitizeGoal, "goal");

  // Historial: re-vincula pagos/cobros/aportes con su entidad
  const history = readTable(findSheet(X, wb, SHEETS.history), HISTORY_COLUMNS, reports.history);
  for (const h of history) {
    const type = norm(h.type);
    const refId = str(h.refId);
    const ref = norm(h.reference);
    const date = (h.date as string | undefined) ?? undefined;
    const raw = numv(h.amount);
    const amount = Math.abs(raw); // los aportes a metas conservan el signo (retiros < 0)
    if (!date || raw === 0) {
      reports.history.skipped++;
      continue;
    }
    let attached = false;
    if (type === norm(HISTORY_TYPES.debt)) {
      const d = debts.find((x) => x.id === refId) ?? debts.find((x) => norm(x.name) === ref);
      if (d) {
        const interest = numv(h.interest);
        d.payments.push({ id: uniqueId(h.id, "dp"), date, amount, interest, principal: numv(h.principal, amount - interest) });
        attached = true;
      }
    } else if (type === norm(HISTORY_TYPES.receivable)) {
      const r = receivables.find((x) => x.id === refId) ?? receivables.find((x) => norm(`${x.debtor} — ${x.concept}`) === ref);
      if (r) {
        r.payments.push({ id: uniqueId(h.id, "rp"), date, amount });
        attached = true;
      }
    } else if (type === norm(HISTORY_TYPES.goal)) {
      const g = goals.find((x) => x.id === refId) ?? goals.find((x) => norm(x.name) === ref);
      if (g) {
        g.contributions.push({ id: uniqueId(h.id, "gc"), date, amount: raw });
        attached = true;
      }
    }
    if (attached) reports.history.imported++;
    else {
      reports.history.skipped++;
      if (reports.history.warnings.length < 6) reports.history.warnings.push(`Fila ${h.__row}: referencia "${str(h.reference)}" no encontrada.`);
    }
  }

  // Configuración (clave → valor)
  const configRows = readTable(findSheet(X, wb, SHEETS.config), CONFIG_COLUMNS, reports.config);
  const settingsRaw: Record<string, unknown> = {};
  const labelToKey: Record<string, string> = {
    titular: "userName",
    moneda: "currency",
    saldoinicialdeliquidez: "openingBalance",
    presupuestomensual: "monthlyBudget",
    tasadeahorroobjetivo: "savingsTarget",
    "tasadeahorroobjetivo%": "savingsTarget",
  };
  for (const c of configRows) {
    const key = str(c.key) || labelToKey[norm(c.param)];
    if (key && key !== "schemaVersion") {
      settingsRaw[key] = c.value;
      reports.config.imported++;
    }
  }

  const found = Object.values(reports).filter((r) => r.found).length;
  if (!found) throw new Error("El archivo no contiene ninguna hoja reconocible de AuraWealth Pro.");

  const transactions = [...incomes, ...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return {
    fileName: name,
    data: { transactions, debts, receivables, goals, settings: sanitizeSettings(settingsRaw) },
    sheets: Object.values(reports),
    totals: {
      transactions: transactions.length,
      debts: debts.length,
      receivables: receivables.length,
      goals: goals.length,
      history: reports.history.imported,
    },
    hasSettings: reports.config.imported > 0,
  };
}
