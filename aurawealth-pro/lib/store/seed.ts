/**
 * Generador determinista de datos de demostración (14 meses relativos a hoy).
 * Usa un PRNG con semilla para que la demo sea estable entre recargas.
 */
import type { AppData, Debt, Expense, ExpenseMacro, Goal, Income, PaymentMethod, Priority, Receivable } from "@/lib/types";
import { addDays, addMonths, monthKey, round2, todayISO } from "@/lib/format";
import { splitDebtPayment } from "@/lib/finance/calculations";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let counter = 0;
const sid = (p: string) => `${p}_seed${(++counter).toString(36)}`;

export const EMPTY_DATA: AppData = {
  transactions: [],
  debts: [],
  receivables: [],
  goals: [],
  settings: { userName: "", currency: "USD", openingBalance: 0, monthlyBudget: 0, savingsTarget: 20 },
};

/** Configuración que usa la demo; sirve para reconocerla y no borrar la del usuario. */
const DEMO_SETTINGS = { userName: "Faris", currency: "USD", openingBalance: 8500, monthlyBudget: 3800, savingsTarget: 20 } as const;

/** Los registros de la demo llevan "_seed" en su ID. */
const isSeedId = (id: string) => id.includes("_seed");

/**
 * Quita los registros de demostración y conserva todo lo que agregó el usuario.
 * Si la configuración sigue siendo exactamente la de la demo, se restablece.
 */
export function stripDemoData(data: AppData): AppData {
  const s = data.settings;
  const demoSettings = (Object.keys(DEMO_SETTINGS) as (keyof typeof DEMO_SETTINGS)[]).every((k) => s[k] === DEMO_SETTINGS[k]);
  return {
    transactions: data.transactions.filter((t) => !isSeedId(t.id)),
    debts: data.debts.filter((d) => !isSeedId(d.id)),
    receivables: data.receivables.filter((r) => !isSeedId(r.id)),
    goals: data.goals.filter((g) => !isSeedId(g.id)),
    settings: demoSettings ? EMPTY_DATA.settings : s,
  };
}

export const hasDemoData = (data: AppData) =>
  [...data.transactions, ...data.debts, ...data.receivables, ...data.goals].some((x) => isSeedId(x.id));

export function createSeedData(ref = todayISO()): AppData {
  counter = 0;
  const rnd = mulberry32(20261006);
  const between = (a: number, b: number) => round2(a + rnd() * (b - a));
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];

  const MONTHS = 14;
  const firstMonth = addMonths(`${monthKey(ref)}-01`, -(MONTHS - 1));
  const transactions: (Income | Expense)[] = [];

  const income = (date: string, category: Income["category"], source: string, amount: number, method: Income["method"], recurring = false, notes = "") => {
    if (date > ref) return;
    transactions.push({ id: sid("inc"), kind: "income", date, category, source, amount: round2(amount), method, recurring, notes });
  };
  const expense = (date: string, macro: ExpenseMacro, micro: string, merchant: string, amount: number, method: PaymentMethod, priority: Priority, recurring = false, notes = "") => {
    if (date > ref) return;
    transactions.push({ id: sid("exp"), kind: "expense", date, macro, micro, merchant, amount: round2(amount), method, priority, recurring, notes });
  };

  for (let i = 0; i < MONTHS; i++) {
    const m = addMonths(firstMonth, i);
    const d = (day: number) => addDays(m, day - 1);
    const growth = 1 + i * 0.012; // ligero crecimiento salarial

    // Ingresos
    income(d(1), "Salario", "Nómina — Nova Tech S.A.", 4200 * growth, "Transferencia", true, "Salario neto mensual");
    income(d(5), "Pasivos", "Alquiler depto. Av. Central", 650, "Depósito", true);
    if (rnd() > 0.35) income(d(Math.ceil(between(8, 24))), "Freelance", pick(["Studio Lumen", "Acme Digital", "Brand&Co", "Pixel Forge"]), between(450, 1600), pick(["Transferencia", "Billetera digital"] as const));
    if (i % 3 === 2) income(d(15), "Inversiones", "Dividendos ETF VTI", between(120, 260), "Transferencia", false, "Dividendo trimestral");
    if (i % 4 === 1) income(d(20), "Regalías", "Licencia fotografía stock", between(60, 180), "Billetera digital");
    if (i === 5 || i === 11) income(d(28), "Bonos", "Bono de desempeño", 1800, "Transferencia", false, "Bono semestral");

    // Gastos fijos
    expense(d(2), "Vivienda", "Alquiler / Hipoteca", "Inmobiliaria Horizonte", 1350, "Transferencia", "Necesidad", true);
    expense(d(6), "Vivienda", "Servicios básicos", "Luz, agua y gas", between(110, 175), "Tarjeta de débito", "Necesidad", true);
    expense(d(7), "Vivienda", "Internet y telefonía", "FibraMax", 59.9, "Tarjeta de crédito", "Necesidad", true);
    expense(d(3), "Suscripciones", "Streaming", "Netflix + Spotify", 27.98, "Tarjeta de crédito", "Gusto", true);
    expense(d(3), "Suscripciones", "Gimnasio", "SmartFit", 39, "Tarjeta de débito", "Inversión", true);
    expense(d(9), "Suscripciones", "Software", "Adobe CC + iCloud", 32.98, "Tarjeta de crédito", "Inversión", true);
    expense(d(10), "Salud", "Seguro médico", "Aseguradora Vital", 145, "Transferencia", "Necesidad", true);
    expense(d(12), "Deudas", "Cuota de préstamo", "Banco Andino — Préstamo auto", 385, "Transferencia", "Necesidad", true);
    expense(d(16), "Deudas", "Pago de tarjeta", "Visa Platinum", 220, "Transferencia", "Necesidad", true);

    // Gastos variables
    const groceries = Math.floor(between(3, 6));
    for (let g = 0; g < groceries; g++) expense(d(Math.ceil(between(1, 28))), "Alimentación", "Supermercado", pick(["Mercado Central", "SuperFresh", "Walmart", "Organic Market"]), between(45, 140), pick(["Tarjeta de débito", "Tarjeta de crédito"] as const), "Necesidad");
    const dining = Math.floor(between(3, 8));
    for (let g = 0; g < dining; g++) expense(d(Math.ceil(between(1, 28))), "Alimentación", pick(["Restaurantes", "Delivery", "Café y snacks"]), pick(["La Trattoria", "Sushi Zen", "Rappi", "Starbucks", "Burger Lab"]), between(9, 75), pick(["Tarjeta de crédito", "Billetera digital", "Efectivo"] as const), "Gusto");
    const transport = Math.floor(between(2, 5));
    for (let g = 0; g < transport; g++) expense(d(Math.ceil(between(1, 28))), "Transporte", pick(["Combustible", "Taxi / Apps", "Transporte público", "Estacionamiento"]), pick(["Shell", "Uber", "Metro", "Parking Plaza"]), between(8, 70), pick(["Tarjeta de débito", "Billetera digital", "Efectivo"] as const), "Necesidad");
    const leisure = Math.floor(between(1, 4));
    for (let g = 0; g < leisure; g++) expense(d(Math.ceil(between(1, 28))), "Ocio", pick(["Salidas", "Hobbies", "Compras personales", "Eventos"]), pick(["Cinépolis", "Zara", "Ticketmaster", "Amazon", "Bar Lúpulo"]), between(20, 180), pick(["Tarjeta de crédito", "Efectivo"] as const), "Gusto");
    if (rnd() > 0.55) expense(d(Math.ceil(between(1, 28))), "Salud", pick(["Farmacia", "Consultas", "Dental"]), pick(["Farmacia Cruz Verde", "Clínica Norte", "Dental Smile"]), between(18, 160), "Tarjeta de débito", "Necesidad");
    if (rnd() > 0.5) expense(d(Math.ceil(between(1, 28))), "Educación", pick(["Cursos online", "Libros", "Certificaciones"]), pick(["Coursera", "Udemy", "Librería Atenea", "AWS Training"]), between(15, 220), "Tarjeta de crédito", "Inversión");
    if (rnd() > 0.7) expense(d(Math.ceil(between(1, 28))), "Otros", pick(["Regalos", "Mascotas", "Donaciones", "Imprevistos"]), pick(["Petco", "Cruz Roja", "Tienda de regalos", "Cerrajería"]), between(20, 140), pick(["Efectivo", "Tarjeta de débito"] as const), pick(["Necesidad", "Gusto"] as const));
    if (i === 7) expense(d(18), "Ocio", "Viajes", "Vuelos + hotel Cartagena", 1240, "Tarjeta de crédito", "Gusto", false, "Vacaciones de verano");
    if (i === 10) expense(d(22), "Vivienda", "Mantenimiento", "Reparación calentador", 310, "Transferencia", "Necesidad");
  }

  // Deudas con historial de pagos coherente
  const mkDebt = (base: Omit<Debt, "id" | "payments" | "balance">, monthsPaid: number, extraNotes = ""): Debt => {
    let balance = base.principal;
    const payments: Debt["payments"] = [];
    for (let k = 1; k <= monthsPaid; k++) {
      const date = addMonths(base.startDate, k);
      if (date > ref) break;
      const { interest, principal } = splitDebtPayment(balance, base.annualRate, base.monthlyPayment);
      balance = round2(balance - principal);
      payments.push({ id: sid("dp"), date, amount: base.monthlyPayment, interest, principal });
    }
    return { ...base, id: sid("debt"), balance, payments, notes: base.notes || extraNotes };
  };

  const debts: Debt[] = [
    mkDebt({ name: "Préstamo vehicular", lender: "Banco Andino", type: "Préstamo vehicular", principal: 18500, annualRate: 9.5, monthlyPayment: 385, startDate: addMonths(ref, -14), dueDate: addMonths(ref, 46), paymentDay: 12, notes: "Mazda CX-30 — 60 cuotas" }, 14),
    mkDebt({ name: "Tarjeta Visa Platinum", lender: "Banco del Pacífico", type: "Tarjeta de crédito", principal: 4200, annualRate: 28.9, monthlyPayment: 220, startDate: addMonths(ref, -10), dueDate: addMonths(ref, 14), paymentDay: 16, notes: "Saldo revolvente consolidado" }, 10),
    mkDebt({ name: "Crédito educativo MBA", lender: "Fondo Educa", type: "Préstamo estudiantil", principal: 12000, annualRate: 6.2, monthlyPayment: 260, startDate: addMonths(ref, -20), dueDate: addMonths(ref, 48), paymentDay: 25, notes: "Período de gracia de 20 meses finalizado" }, 0),
  ];

  const receivables: Receivable[] = [
    { id: sid("rcv"), debtor: "Carlos Méndez", concept: "Préstamo para mudanza", type: "Préstamo personal", amount: 1200, issueDate: addMonths(ref, -3), dueDate: addDays(ref, -9), notes: "Acordó pagar en 3 partes", payments: [{ id: sid("rp"), date: addMonths(ref, -2), amount: 400 }] },
    { id: sid("rcv"), debtor: "Studio Lumen", concept: "Factura #0142 — Rediseño web", type: "Factura", amount: 2350, issueDate: addDays(ref, -20), dueDate: addDays(ref, 5), notes: "Net 25", payments: [] },
    { id: sid("rcv"), debtor: "Ana Torres", concept: "Entradas concierto", type: "Otro", amount: 180, issueDate: addMonths(ref, -2), dueDate: addMonths(ref, -1), notes: "", payments: [{ id: sid("rp"), date: addDays(addMonths(ref, -1), -3), amount: 180 }] },
    { id: sid("rcv"), debtor: "Acme Digital", concept: "Factura #0147 — Consultoría UX", type: "Servicio", amount: 980, issueDate: addDays(ref, -4), dueDate: addDays(ref, 26), notes: "", payments: [] },
  ];

  const contrib = (amounts: number[]) =>
    amounts.map((amount, k) => ({ id: sid("gc"), date: addDays(addMonths(ref, -(amounts.length - k)), 2), amount }));

  const goals: Goal[] = [
    { id: sid("goal"), name: "Fondo de emergencia", kind: "Ahorro", target: 12000, initial: 3500, deadline: addMonths(ref, 10), monthlyContribution: 600, icon: "shield", color: "emerald", createdAt: addMonths(ref, -8), notes: "6 meses de gastos esenciales", contributions: contrib([500, 600, 600, 650, 600, 600, 700, 600]) },
    { id: sid("goal"), name: "Viaje a Japón", kind: "Ahorro", target: 5500, initial: 400, deadline: addMonths(ref, 7), monthlyContribution: 0, icon: "plane", color: "rose", createdAt: addMonths(ref, -5), notes: "Primavera — temporada sakura", contributions: contrib([300, 250, 400, 300, 350]) },
    { id: sid("goal"), name: "Portafolio indexado", kind: "Inversión", target: 25000, initial: 6200, deadline: addMonths(ref, 30), monthlyContribution: 450, icon: "trending", color: "indigo", createdAt: addMonths(ref, -12), notes: "ETF VTI + VXUS", contributions: contrib([450, 450, 450, 500, 450, 450]) },
    { id: sid("goal"), name: "Laptop de trabajo", kind: "Ahorro", target: 2200, initial: 2200, deadline: addMonths(ref, 1), monthlyContribution: 0, icon: "laptop", color: "cobalt", createdAt: addMonths(ref, -4), notes: "MacBook Pro M-series", contributions: [] },
  ];

  return {
    transactions: transactions.sort((a, b) => (a.date < b.date ? 1 : -1)),
    debts,
    receivables,
    goals,
    settings: { userName: "Faris", currency: "USD", openingBalance: 8500, monthlyBudget: 3800, savingsTarget: 20 },
  };
}
