import type {
  BearTip,
  CategoryBreakdown,
  MonthlySummary,
  SavingsGoal,
  Transaction,
} from "./types";

export const CATEGORY_COLORS: Record<string, string> = {
  Vivienda: "#38BDF8",
  Alimentación: "#5EEAD4",
  Transporte: "#A78BFA",
  Ocio: "#FB7185",
  Salud: "#FCD34D",
  Suscripciones: "#F472B6",
  Ahorro: "#34D399",
  Educación: "#818CF8",
  Salario: "#5EEAD4",
  Freelance: "#38BDF8",
  Inversiones: "#A78BFA",
};

export const CURRENT_BALANCE = 18_642.37;
export const BALANCE_CHANGE_PCT = 8.4;

export const MONTHLY_SUMMARY: MonthlySummary[] = [
  { month: "Abr", income: 3200, expenses: 2380 },
  { month: "May", income: 3200, expenses: 2510 },
  { month: "Jun", income: 3450, expenses: 2290 },
  { month: "Jul", income: 3200, expenses: 2680 },
  { month: "Ago", income: 3980, expenses: 2430 },
  { month: "Sep", income: 3650, expenses: 2190 },
];

export const CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: "Vivienda", total: 950, color: CATEGORY_COLORS.Vivienda },
  { category: "Alimentación", total: 480, color: CATEGORY_COLORS["Alimentación"] },
  { category: "Transporte", total: 210, color: CATEGORY_COLORS.Transporte },
  { category: "Ocio", total: 260, color: CATEGORY_COLORS.Ocio },
  { category: "Suscripciones", total: 89, color: CATEGORY_COLORS.Suscripciones },
  { category: "Salud", total: 140, color: CATEGORY_COLORS.Salud },
  { category: "Educación", total: 120, color: CATEGORY_COLORS["Educación"] },
];

export const SAVINGS_GOALS: SavingsGoal[] = [
  { id: "goal-1", name: "Fondo de emergencia", target: 10000, current: 7250, color: CATEGORY_COLORS.Ahorro },
  { id: "goal-2", name: "Viaje a Japón", target: 4000, current: 1620, color: CATEGORY_COLORS.Inversiones },
  { id: "goal-3", name: "Nuevo laptop", target: 1800, current: 1340, color: CATEGORY_COLORS.Transporte },
];

export const TRANSACTIONS: Transaction[] = [
  { id: "tx-1", date: "2026-09-15", description: "Salario mensual", category: "Salario", type: "income", amount: 3200, account: "Cuenta principal" },
  { id: "tx-2", date: "2026-09-14", description: "Supermercado La Huerta", category: "Alimentación", type: "expense", amount: 86.4, account: "Tarjeta débito" },
  { id: "tx-3", date: "2026-09-13", description: "Renta apartamento", category: "Vivienda", type: "expense", amount: 850, account: "Cuenta principal" },
  { id: "tx-4", date: "2026-09-12", description: "Proyecto freelance — Landing page", category: "Freelance", type: "income", amount: 450, account: "Cuenta principal" },
  { id: "tx-5", date: "2026-09-11", description: "Gasolina", category: "Transporte", type: "expense", amount: 52.3, account: "Tarjeta débito" },
  { id: "tx-6", date: "2026-09-10", description: "Netflix", category: "Suscripciones", type: "expense", amount: 15.99, account: "Tarjeta crédito" },
  { id: "tx-7", date: "2026-09-09", description: "Cena con amigos", category: "Ocio", type: "expense", amount: 64.5, account: "Tarjeta crédito" },
  { id: "tx-8", date: "2026-09-08", description: "Farmacia", category: "Salud", type: "expense", amount: 38.2, account: "Tarjeta débito" },
  { id: "tx-9", date: "2026-09-07", description: "Curso de diseño UX", category: "Educación", type: "expense", amount: 120, account: "Tarjeta crédito" },
  { id: "tx-10", date: "2026-09-06", description: "Dividendos ETF", category: "Inversiones", type: "income", amount: 78.5, account: "Cuenta inversión" },
  { id: "tx-11", date: "2026-09-05", description: "Transferencia a ahorro", category: "Ahorro", type: "expense", amount: 400, account: "Cuenta principal" },
  { id: "tx-12", date: "2026-09-04", description: "Spotify Premium", category: "Suscripciones", type: "expense", amount: 9.99, account: "Tarjeta crédito" },
  { id: "tx-13", date: "2026-09-03", description: "Supermercado La Huerta", category: "Alimentación", type: "expense", amount: 112.75, account: "Tarjeta débito" },
  { id: "tx-14", date: "2026-09-02", description: "Uber", category: "Transporte", type: "expense", amount: 18.4, account: "Tarjeta débito" },
  { id: "tx-15", date: "2026-09-01", description: "Proyecto freelance — Branding", category: "Freelance", type: "income", amount: 620, account: "Cuenta principal" },
];

export const BEAR_TIPS: BearTip[] = [
  {
    id: "tip-1",
    title: "¡Vas muy bien este mes!",
    message:
      "Tus gastos en Ocio bajaron 18% comparado con agosto. Si mantienes este ritmo, llegarás a tu meta de \"Viaje a Japón\" dos meses antes.",
    tone: "positive",
  },
  {
    id: "tip-2",
    title: "Suscripciones duplicadas",
    message:
      "Detecté 3 suscripciones activas (Netflix, Spotify, y una prueba gratuita a punto de cobrarse). Podrías ahorrar ~$12/mes revisándolas.",
    tone: "warning",
  },
  {
    id: "tip-3",
    title: "Sugerencia de ahorro",
    message:
      "Si mueves $50 más al fondo de emergencia cada quincena, lo completarías en 11 semanas en lugar de 16.",
    tone: "info",
  },
];
