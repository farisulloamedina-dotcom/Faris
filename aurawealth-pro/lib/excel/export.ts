/**
 * Exportador Excel profesional (xlsx-js-style, fork de SheetJS con estilos).
 *
 * Por cada hoja: banda de título con color temático, subtítulo, cabecera índigo
 * con texto blanco, filas cebra, bordes finos, formatos estrictos de moneda,
 * porcentaje y fecha, autofiltro, fila de totales con fórmulas SUBTOTAL y
 * anchos de columna calculados (`wch`) a partir del contenido formateado.
 */
import type { CellFormat, CellValue, ColumnSpec, KpiItem, Row, SheetModel, SheetTone, SummarySheetModel, TableSheetModel, WorkbookModel } from "./model";
import { dateLabel, isoToExcelSerial, isValidISO } from "@/lib/format";
import { loadXLSX, type XLSXModule } from "./xlsx";

type WorkSheet = import("xlsx-js-style").WorkSheet;
type CellObject = import("xlsx-js-style").CellObject;

/* --------------------------------- Estilos --------------------------------- */

const TONES: Record<SheetTone, { solid: string; soft: string }> = {
  indigo: { solid: "2B3F6B", soft: "EEF1F6" },
  emerald: { solid: "23744F", soft: "EFF7F3" },
  rose: { solid: "963A3A", soft: "FBF1F1" },
  amber: { solid: "956A20", soft: "FBF6EC" },
  cobalt: { solid: "31497F", soft: "F1F4F9" },
};

const HEADER_FILL = "2B3F6B";
const ZEBRA = "F6F7F9";
const BORDER = "E4E7EC";
const INK = "111827";
const FONT = "Calibri";

const thin = { style: "thin", color: { rgb: BORDER } };
const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

const STATUS_COLORS: Record<string, string> = {
  "Al día": "23744F",
  Liquidada: "23744F",
  Cobrado: "23744F",
  Lograda: "23744F",
  "En curso": "31497F",
  Parcial: "956A20",
  Pendiente: "956A20",
  "Fuera de ritmo": "956A20",
  Vencida: "963A3A",
  "Cuota insuficiente": "963A3A",
  Necesidad: "2B3F6B",
  Gusto: "956A20",
  Inversión: "23744F",
  "Pago de deuda": "963A3A",
  "Cobro recibido": "956A20",
  "Aporte a meta": "23744F",
};

function numFmt(fmt: CellFormat, symbol: string) {
  switch (fmt) {
    case "currency":
      return `"${symbol}"#,##0.00;[Red]-"${symbol}"#,##0.00`;
    case "percent":
      return "0.0%";
    case "date":
      return "dd/mm/yyyy";
    case "int":
      return "0";
    case "decimal":
      return "#,##0.00";
    default:
      return undefined;
  }
}

/** Texto aproximado que verá el usuario, usado para calcular anchos de columna. */
function displayText(v: CellValue, fmt: CellFormat, symbol: string) {
  if (v === null || v === undefined || v === "") return "";
  if (fmt === "currency" && typeof v === "number") return `${symbol}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (fmt === "percent" && typeof v === "number") return `${(v * 100).toFixed(1)}%`;
  if (fmt === "date" && typeof v === "string") return "00/00/0000";
  if (fmt === "bool") return v ? "Sí" : "No";
  return String(v);
}

function makeCell(v: CellValue, fmt: CellFormat, symbol: string, style: Record<string, unknown>): CellObject {
  const z = numFmt(fmt, symbol);
  const s: Record<string, unknown> = { ...style, ...(z ? { numFmt: z } : {}) };
  if (v === null || v === undefined || v === "") return { t: "s", v: "", s } as CellObject;
  if (fmt === "date" && typeof v === "string" && isValidISO(v)) return { t: "n", v: isoToExcelSerial(v), z, s } as CellObject;
  if (fmt === "bool") return { t: "s", v: v ? "Sí" : "No", s: { ...s, alignment: { horizontal: "center", vertical: "center" } } } as CellObject;
  if (fmt === "status") {
    const text = String(v);
    const color = text.includes("Vencido") ? "963A3A" : (STATUS_COLORS[text] ?? INK);
    return { t: "s", v: text, s: { ...s, font: { name: FONT, sz: 10, bold: true, color: { rgb: color } }, alignment: { horizontal: "center", vertical: "center" } } } as CellObject;
  }
  if (typeof v === "number") return { t: "n", v, z, s: { ...s, alignment: { horizontal: "right", vertical: "center" } } } as CellObject;
  if (typeof v === "boolean") return { t: "b", v, s } as CellObject;
  return { t: "s", v: String(v), s } as CellObject;
}

const titleStyle = (tone: SheetTone) => ({
  font: { name: FONT, sz: 16, bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: TONES[tone].solid } },
  alignment: { horizontal: "left", vertical: "center", indent: 1 },
});
const subtitleStyle = (tone: SheetTone) => ({
  font: { name: FONT, sz: 10, italic: true, color: { rgb: "475569" } },
  fill: { patternType: "solid", fgColor: { rgb: TONES[tone].soft } },
  alignment: { horizontal: "left", vertical: "center", indent: 1 },
});
const headerStyle = {
  font: { name: FONT, sz: 11, bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: HEADER_FILL } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: { top: { style: "thin", color: { rgb: "1F2F50" } }, bottom: { style: "medium", color: { rgb: "1F2F50" } }, left: { style: "thin", color: { rgb: "4D628F" } }, right: { style: "thin", color: { rgb: "4D628F" } } },
};
const bodyStyle = (zebra: boolean) => ({
  font: { name: FONT, sz: 10, color: { rgb: INK } },
  fill: { patternType: "solid", fgColor: { rgb: zebra ? ZEBRA : "FFFFFF" } },
  alignment: { vertical: "center" },
  border: borderAll,
});
const totalStyle = {
  font: { name: FONT, sz: 11, bold: true, color: { rgb: "1F2F50" } },
  fill: { patternType: "solid", fgColor: { rgb: "E6EAF2" } },
  alignment: { vertical: "center" },
  border: { top: { style: "medium", color: { rgb: HEADER_FILL } }, bottom: { style: "medium", color: { rgb: HEADER_FILL } }, left: thin, right: thin },
};
const sectionStyle = {
  font: { name: FONT, sz: 12, bold: true, color: { rgb: "1F2F50" } },
  fill: { patternType: "solid", fgColor: { rgb: "E6EAF2" } },
  alignment: { horizontal: "left", vertical: "center", indent: 1 },
  border: { bottom: { style: "medium", color: { rgb: HEADER_FILL } } },
};

/* ----------------------------- Hoja de tabla ------------------------------- */

/** Fila (0-based) donde empieza la cabecera en hojas de tabla. Compartido con el importador. */
export const TABLE_HEADER_ROW = 3;

interface Ctx {
  X: XLSXModule;
  symbol: string;
  generated: string;
  /** Rango de datos por hoja/columna para fórmulas cruzadas del resumen. */
  ranges: Map<string, string>;
}

function quoteSheet(name: string) {
  return `'${name.replace(/'/g, "''")}'`;
}

function buildTableSheet(m: TableSheetModel, ctx: Ctx): WorkSheet {
  const { X, symbol } = ctx;
  const ws: WorkSheet = {};
  const ncols = m.columns.length;
  const lastCol = ncols - 1;
  const enc = (r: number, c: number) => X.utils.encode_cell({ r, c });
  const widths = m.columns.map((c) => Math.max(c.header.length + 4, 10));

  // Título y subtítulo (combinados en todo el ancho)
  ws[enc(0, 0)] = { t: "s", v: m.title, s: titleStyle(m.tone) } as CellObject;
  ws[enc(1, 0)] = { t: "s", v: `${m.description}  ·  Generado: ${ctx.generated}  ·  ${m.rows.length} registro(s)`, s: subtitleStyle(m.tone) } as CellObject;
  for (let c = 1; c <= lastCol; c++) {
    ws[enc(0, c)] = { t: "s", v: "", s: titleStyle(m.tone) } as CellObject;
    ws[enc(1, c)] = { t: "s", v: "", s: subtitleStyle(m.tone) } as CellObject;
  }

  // Cabecera
  m.columns.forEach((col, c) => {
    ws[enc(TABLE_HEADER_ROW, c)] = { t: "s", v: col.header, s: headerStyle } as CellObject;
  });

  // Datos
  const firstData = TABLE_HEADER_ROW + 1;
  m.rows.forEach((row, i) => {
    const r = firstData + i;
    const style = bodyStyle(i % 2 === 1);
    m.columns.forEach((col, c) => {
      const v = row[col.key] ?? null;
      const fmt = col.fmt === "text" && typeof v === "number" ? "decimal" : col.fmt;
      ws[enc(r, c)] = makeCell(v, fmt, symbol, style);
      widths[c] = Math.max(widths[c], displayText(v, col.fmt, symbol).length + 2);
    });
  });

  const lastData = firstData + m.rows.length - 1;
  let lastRow = Math.max(lastData, TABLE_HEADER_ROW);

  // Fila de totales con fórmulas SUBTOTAL(109) → respetan el autofiltro
  if (m.rows.length && m.columns.some((c) => c.total)) {
    const r = lastData + 1;
    m.columns.forEach((col, c) => {
      if (c === 0) {
        ws[enc(r, c)] = { t: "s", v: "TOTAL", s: totalStyle } as CellObject;
      } else if (col.total) {
        const L = X.utils.encode_col(c);
        const range = `${L}${firstData + 1}:${L}${lastData + 1}`;
        const cached = m.rows.reduce((a, row) => a + (typeof row[col.key] === "number" ? (row[col.key] as number) : 0), 0);
        ws[enc(r, c)] = { t: "n", v: Math.round(cached * 100) / 100, f: `SUBTOTAL(109,${range})`, z: numFmt(col.fmt, symbol), s: { ...totalStyle, numFmt: numFmt(col.fmt, symbol), alignment: { horizontal: "right" } } } as CellObject;
        ctx.ranges.set(`${m.name}::${col.key}`, `${quoteSheet(m.name)}!${range}`);
      } else {
        ws[enc(r, c)] = { t: "s", v: "", s: totalStyle } as CellObject;
      }
    });
    lastRow = r;
  } else {
    // Rango aunque no haya filas (para fórmulas del resumen)
    m.columns.forEach((col, c) => {
      if (col.total && m.rows.length) {
        const L = X.utils.encode_col(c);
        ctx.ranges.set(`${m.name}::${col.key}`, `${quoteSheet(m.name)}!${L}${firstData + 1}:${L}${lastData + 1}`);
      }
    });
  }

  ws["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } });
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];
  ws["!cols"] = widths.map((w, i) => ({ wch: Math.min(m.columns[i].key === "notes" ? 48 : 40, Math.max(10, w)) }));
  ws["!rows"] = [{ hpt: 32 }, { hpt: 20 }, { hpt: 8 }, { hpt: 30 }];
  if (m.rows.length) ws["!autofilter"] = { ref: X.utils.encode_range({ s: { r: TABLE_HEADER_ROW, c: 0 }, e: { r: lastData, c: lastCol } }) };
  return ws;
}

/* ---------------------------- Resumen ejecutivo ---------------------------- */

function buildSummarySheet(m: SummarySheetModel, ctx: Ctx): WorkSheet {
  const { X, symbol } = ctx;
  const ws: WorkSheet = {};
  const enc = (r: number, c: number) => X.utils.encode_cell({ r, c });
  const W = 5; // columnas A..E
  const merges: import("xlsx-js-style").Range[] = [];
  const rowsMeta: { hpt: number }[] = [];
  const fill = (r: number, style: Record<string, unknown>, text = "") => {
    ws[enc(r, 0)] = { t: "s", v: text, s: style } as CellObject;
    for (let c = 1; c < W; c++) ws[enc(r, c)] = { t: "s", v: "", s: style } as CellObject;
    merges.push({ s: { r, c: 0 }, e: { r, c: W - 1 } });
  };

  fill(0, titleStyle(m.tone), m.title);
  rowsMeta[0] = { hpt: 34 };
  fill(1, subtitleStyle(m.tone), `${m.description}  ·  Generado: ${ctx.generated}`);
  rowsMeta[1] = { hpt: 20 };

  let r = 3;
  fill(r, sectionStyle, "Indicadores clave (KPIs)");
  rowsMeta[r] = { hpt: 24 };
  r++;
  ["Indicador", "Valor", "Detalle"].forEach((h, c) => {
    ws[enc(r, c === 2 ? 2 : c)] = { t: "s", v: h, s: headerStyle } as CellObject;
  });
  ws[enc(r, 3)] = { t: "s", v: "", s: headerStyle } as CellObject;
  ws[enc(r, 4)] = { t: "s", v: "", s: headerStyle } as CellObject;
  merges.push({ s: { r, c: 2 }, e: { r, c: 4 } });
  r++;

  m.kpis.forEach((kpi: KpiItem, i) => {
    const st = bodyStyle(i % 2 === 1);
    ws[enc(r, 0)] = { t: "s", v: kpi.label, s: { ...st, font: { name: FONT, sz: 11, bold: true, color: { rgb: INK } } } } as CellObject;
    const cell = makeCell(kpi.value, kpi.fmt, symbol, { ...st, font: { name: FONT, sz: 12, bold: true, color: { rgb: kpi.value < 0 ? "963A3A" : "1F2F50" } } });
    const range = kpi.formula ? ctx.ranges.get(`${kpi.formula.sheet}::${kpi.formula.column}`) : undefined;
    if (range) (cell as CellObject & { f?: string }).f = `SUM(${range})`;
    ws[enc(r, 1)] = cell;
    ws[enc(r, 2)] = { t: "s", v: kpi.note, s: { ...st, font: { name: FONT, sz: 10, italic: true, color: { rgb: "64748B" } } } } as CellObject;
    ws[enc(r, 3)] = { t: "s", v: "", s: st } as CellObject;
    ws[enc(r, 4)] = { t: "s", v: "", s: st } as CellObject;
    merges.push({ s: { r, c: 2 }, e: { r, c: 4 } });
    rowsMeta[r] = { hpt: 20 };
    r++;
  });

  for (const table of m.tables) {
    r++;
    fill(r, sectionStyle, table.title);
    rowsMeta[r] = { hpt: 24 };
    r++;
    table.columns.forEach((col: ColumnSpec, c: number) => {
      ws[enc(r, c)] = { t: "s", v: col.header, s: headerStyle } as CellObject;
    });
    rowsMeta[r] = { hpt: 22 };
    r++;
    const first = r;
    table.rows.forEach((row: Row, i: number) => {
      table.columns.forEach((col, c) => {
        ws[enc(r, c)] = makeCell(row[col.key] ?? null, col.fmt, symbol, bodyStyle(i % 2 === 1));
      });
      r++;
    });
    if (table.rows.length) {
      table.columns.forEach((col, c) => {
        if (c === 0) ws[enc(r, c)] = { t: "s", v: "TOTAL", s: totalStyle } as CellObject;
        else if (col.total) {
          const L = X.utils.encode_col(c);
          const cached = table.rows.reduce((a, row) => a + (typeof row[col.key] === "number" ? (row[col.key] as number) : 0), 0);
          ws[enc(r, c)] = { t: "n", v: Math.round(cached * 100) / 100, f: `SUM(${L}${first + 1}:${L}${r})`, z: numFmt(col.fmt, symbol), s: { ...totalStyle, numFmt: numFmt(col.fmt, symbol), alignment: { horizontal: "right" } } } as CellObject;
        } else if (col.fmt === "percent" && table.columns.some((x) => x.key === "income")) {
          // Tasa de ahorro global = flujo neto total / ingresos totales
          const Li = X.utils.encode_col(table.columns.findIndex((x) => x.key === "income"));
          const Ln = X.utils.encode_col(table.columns.findIndex((x) => x.key === "net"));
          const ti = table.rows.reduce((a, row) => a + Number(row.income ?? 0), 0);
          const tn = table.rows.reduce((a, row) => a + Number(row.net ?? 0), 0);
          ws[enc(r, c)] = { t: "n", v: ti ? tn / ti : 0, f: `IFERROR(${Ln}${r + 1}/${Li}${r + 1},0)`, z: "0.0%", s: { ...totalStyle, numFmt: "0.0%", alignment: { horizontal: "right" } } } as CellObject;
        } else if (col.fmt === "percent") {
          ws[enc(r, c)] = { t: "n", v: 1, z: "0.0%", s: { ...totalStyle, numFmt: "0.0%", alignment: { horizontal: "right" } } } as CellObject;
        } else ws[enc(r, c)] = { t: "s", v: "", s: totalStyle } as CellObject;
      });
      r++;
    }
  }

  ws["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: W - 1 } });
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }];
  ws["!rows"] = rowsMeta.map((x) => x ?? { hpt: 18 });
  return ws;
}

/* --------------------------------- Público --------------------------------- */

export async function buildWorkbookBlob(model: WorkbookModel): Promise<Blob> {
  const X = await loadXLSX();
  const wb = X.utils.book_new();
  const ctx: Ctx = { X, symbol: model.currencySymbol, generated: `${dateLabel(model.generatedAt.slice(0, 10))} ${model.generatedAt.slice(11, 16)}`, ranges: new Map() };

  // Las tablas se construyen primero para conocer sus rangos (fórmulas del resumen)
  const built = new Map<string, WorkSheet>();
  for (const s of model.sheets) if (s.kind === "table") built.set(s.name, buildTableSheet(s, ctx));
  for (const s of model.sheets) if (s.kind === "summary") built.set(s.name, buildSummarySheet(s, ctx));
  model.sheets.forEach((s: SheetModel) => X.utils.book_append_sheet(wb, built.get(s.name)!, s.name));

  wb.Props = {
    Title: "AuraWealth Pro — Libro financiero",
    Subject: "Finanzas personales",
    Author: model.owner || "AuraWealth Pro",
    Company: "AuraWealth Pro",
    CreatedDate: new Date(model.generatedAt),
  };

  const out = X.write(wb, { bookType: "xlsx", type: "array", cellStyles: true, compression: true }) as ArrayBuffer;
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export const workbookFileName = (date = new Date()) =>
  `AuraWealth_Pro_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.xlsx`;

interface DownloadsApi {
  save: (req: { filename: string; data: Blob }) => Promise<unknown>;
}
type ClaudeHost = { use?: (name: "downloads") => Promise<DownloadsApi | null> };

/**
 * Entrega un archivo al usuario. Dentro del visor de artefactos de claude.ai
 * (donde los enlaces de descarga están bloqueados) usa su capacidad `downloads`,
 * que pide confirmación; en cualquier otro contexto, una descarga normal.
 * Resuelve `false` si el usuario rechazó la descarga.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<boolean> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  const downloads = host?.use ? await host.use("downloads").catch(() => null) : null;
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob });
      return true;
    } catch (e) {
      if ((e as { code?: string })?.code === "declined") return false;
      throw new Error((e as { message?: string })?.message || "No se pudo guardar el archivo");
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}
