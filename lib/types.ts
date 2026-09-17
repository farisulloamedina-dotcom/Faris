export type TransactionType = "income" | "expense";

export type Category =
  | "Vivienda"
  | "Alimentación"
  | "Transporte"
  | "Ocio"
  | "Salud"
  | "Suscripciones"
  | "Ahorro"
  | "Educación"
  | "Salario"
  | "Freelance"
  | "Inversiones";

export interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  category: Category;
  type: TransactionType;
  amount: number; // always positive; sign derived from `type`
  account: string;
}

export interface MonthlySummary {
  month: string; // e.g. "Ene"
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

export interface BearTip {
  id: string;
  title: string;
  message: string;
  tone: "positive" | "warning" | "info";
}
