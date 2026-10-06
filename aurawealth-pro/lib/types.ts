/**
 * Modelo de dominio de AuraWealth Pro.
 *
 * Todas las fechas se guardan como cadenas ISO `YYYY-MM-DD` (sin hora) para
 * evitar desfases de zona horaria entre la UI, localStorage y Excel.
 */

export type ISODate = string;

export type IncomeCategory =
  | "Salario"
  | "Pasivos"
  | "Inversiones"
  | "Freelance"
  | "Regalías"
  | "Bonos"
  | "Otros ingresos";

export type ExpenseMacro =
  | "Vivienda"
  | "Alimentación"
  | "Transporte"
  | "Ocio"
  | "Suscripciones"
  | "Educación"
  | "Salud"
  | "Deudas"
  | "Otros";

export type PaymentMethod =
  | "Tarjeta de crédito"
  | "Tarjeta de débito"
  | "Efectivo"
  | "Transferencia"
  | "Billetera digital";

export type ReceptionMethod =
  | "Transferencia"
  | "Depósito"
  | "Efectivo"
  | "Billetera digital"
  | "Cheque";

export type Priority = "Necesidad" | "Gusto" | "Inversión";

export interface Income {
  id: string;
  kind: "income";
  date: ISODate;
  category: IncomeCategory;
  source: string;
  amount: number;
  method: ReceptionMethod;
  recurring: boolean;
  notes: string;
}

export interface Expense {
  id: string;
  kind: "expense";
  date: ISODate;
  macro: ExpenseMacro;
  micro: string;
  merchant: string;
  amount: number;
  method: PaymentMethod;
  priority: Priority;
  recurring: boolean;
  notes: string;
}

export type Transaction = Income | Expense;

export type DebtType =
  | "Hipoteca"
  | "Préstamo personal"
  | "Préstamo vehicular"
  | "Tarjeta de crédito"
  | "Préstamo estudiantil"
  | "Otro";

export interface DebtPayment {
  id: string;
  date: ISODate;
  amount: number;
  interest: number;
  principal: number;
}

export interface Debt {
  id: string;
  name: string;
  lender: string;
  type: DebtType;
  principal: number; // monto original
  balance: number; // saldo pendiente actual
  annualRate: number; // tasa anual en % (ej. 18.5)
  monthlyPayment: number;
  startDate: ISODate;
  dueDate: ISODate; // fecha límite final
  paymentDay: number; // día del mes de la cuota
  notes: string;
  payments: DebtPayment[];
}

export type ReceivableStatus = "Pendiente" | "Parcial" | "Cobrado";

export interface ReceivablePayment {
  id: string;
  date: ISODate;
  amount: number;
}

export interface Receivable {
  id: string;
  debtor: string;
  concept: string;
  type: "Préstamo personal" | "Factura" | "Servicio" | "Otro";
  amount: number;
  issueDate: ISODate;
  dueDate: ISODate;
  notes: string;
  payments: ReceivablePayment[];
}

export type GoalKind = "Ahorro" | "Inversión";

export interface GoalContribution {
  id: string;
  date: ISODate;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  target: number;
  initial: number; // monto inicial antes de aportes registrados
  deadline: ISODate;
  monthlyContribution: number; // aporte mensual planificado (0 = usar ahorro promedio)
  icon: GoalIconKey;
  color: GoalColor;
  createdAt: ISODate;
  notes: string;
  contributions: GoalContribution[];
}

export type GoalIconKey =
  | "shield"
  | "plane"
  | "home"
  | "car"
  | "graduation"
  | "trending"
  | "heart"
  | "laptop"
  | "gift"
  | "piggy";

export type GoalColor = "indigo" | "emerald" | "amber" | "rose" | "cobalt" | "violet";

export type CurrencyCode = "USD" | "EUR" | "MXN" | "COP" | "ARS" | "CLP" | "PEN" | "GTQ" | "DOP";

export interface Settings {
  userName: string;
  currency: CurrencyCode;
  openingBalance: number; // liquidez inicial antes del primer movimiento registrado
  monthlyBudget: number; // presupuesto mensual de gasto (0 = sin presupuesto)
  savingsTarget: number; // tasa de ahorro objetivo en %
}

export interface AppData {
  transactions: Transaction[];
  debts: Debt[];
  receivables: Receivable[];
  goals: Goal[];
  settings: Settings;
}
