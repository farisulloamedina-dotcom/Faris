import * as XLSX from "xlsx";
import type { CategoryBreakdown, MonthlySummary, Transaction } from "./types";
import { CURRENT_BALANCE } from "./mock-data";

/**
 * Builds a multi-sheet .xlsx workbook (Resumen, Movimientos, Categorías)
 * from the dashboard's financial data and triggers a browser download.
 * Runs entirely client-side — no data leaves the browser.
 */
export function exportFinancialReport(
  transactions: Transaction[],
  monthlySummary: MonthlySummary[],
  categoryBreakdown: CategoryBreakdown[],
) {
  const workbook = XLSX.utils.book_new();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const summarySheetData = [
    ["Reporte financiero — Proud"],
    [`Generado el ${new Date().toLocaleDateString("es-ES")}`],
    [],
    ["Métrica", "Valor"],
    ["Balance total", CURRENT_BALANCE],
    ["Ingresos del periodo", totalIncome],
    ["Gastos del periodo", totalExpenses],
    ["Ahorro neto", totalIncome - totalExpenses],
    [],
    ["Mes", "Ingresos", "Gastos", "Ahorro"],
    ...monthlySummary.map((m) => [m.month, m.income, m.expenses, m.income - m.expenses]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
  summarySheet["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  const transactionRows = transactions.map((t) => ({
    Fecha: t.date,
    Descripción: t.description,
    Categoría: t.category,
    Tipo: t.type === "income" ? "Ingreso" : "Gasto",
    Cuenta: t.account,
    Monto: t.type === "income" ? t.amount : -t.amount,
  }));
  const transactionsSheet = XLSX.utils.json_to_sheet(transactionRows);
  transactionsSheet["!cols"] = [
    { wch: 12 },
    { wch: 34 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Movimientos");

  const categoryRows = categoryBreakdown.map((c) => ({
    Categoría: c.category,
    Total: c.total,
    "% del gasto": `${((c.total / categoryBreakdown.reduce((s, x) => s + x.total, 0)) * 100).toFixed(1)}%`,
  }));
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
  categorySheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, categorySheet, "Categorías");

  const filename = `proud-reporte-financiero-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename, { compression: true });
}
