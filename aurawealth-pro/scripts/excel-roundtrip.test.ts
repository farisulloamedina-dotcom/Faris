/**
 * Prueba de ida y vuelta del motor Excel: semilla → exportar .xlsx → importar → comparar.
 * Ejecutar con: npm run test:excel
 */
import { writeFileSync } from "node:fs";
import { createSeedData } from "@/lib/store/seed";
import { buildWorkbookModel } from "@/lib/excel/model";
import { buildWorkbookBlob } from "@/lib/excel/export";
import { parseWorkbook } from "@/lib/excel/import";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("✗", msg);
    process.exitCode = 1;
  } else console.log("✓", msg);
}

async function main() {
  const data = createSeedData();
  const model = buildWorkbookModel(data);
  const blob = await buildWorkbookBlob(model);
  const buf = await blob.arrayBuffer();
  if (process.argv[2]) writeFileSync(process.argv[2], Buffer.from(buf));

  const report = await parseWorkbook(buf, "roundtrip.xlsx");
  const back = report.data;
  assert(model.sheets.length === 8, `8 hojas generadas (${model.sheets.map((s) => s.name).join(", ")})`);
  assert(back.transactions.length === data.transactions.length, `transacciones ${back.transactions.length}/${data.transactions.length}`);
  assert(back.debts.length === data.debts.length, `deudas ${back.debts.length}/${data.debts.length}`);
  assert(back.receivables.length === data.receivables.length, `cobros ${back.receivables.length}/${data.receivables.length}`);
  assert(back.goals.length === data.goals.length, `metas ${back.goals.length}/${data.goals.length}`);

  const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
  const canon = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canon(x)])) : v;
  const same = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  assert(same(sortById(back.transactions), sortById(data.transactions)), "transacciones idénticas campo a campo");
  const norm = (d: typeof data) => ({
    debts: sortById(d.debts).map((x) => ({ ...x, payments: sortById(x.payments) })),
    receivables: sortById(d.receivables).map((x) => ({ ...x, payments: sortById(x.payments) })),
    goals: sortById(d.goals).map((x) => ({ ...x, contributions: sortById(x.contributions) })),
  });
  const A = norm(back);
  const B = norm(data);
  assert(same(A.debts, B.debts), "deudas + historial de pagos idénticos");
  assert(same(A.receivables, B.receivables), "cuentas por cobrar + cobros idénticos");
  assert(same(A.goals, B.goals), "metas + aportes idénticos");
  assert(same(back.settings, data.settings), "configuración idéntica");
  for (const s of report.sheets) console.log(`   ${s.sheet}: ${s.imported} importadas, ${s.skipped} omitidas ${s.warnings.join(" ")}`);
}

main();
