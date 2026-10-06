/**
 * Catálogos maestros: categorías, métodos, prioridades e iconografía.
 * Es la única fuente de verdad que comparten formularios, filtros, gráficos y Excel.
 */
import {
  Banknote,
  Briefcase,
  Gift,
  ChartLine,
  Laptop,
  Music4,
  Coins,
  House,
  UtensilsCrossed,
  Car,
  PartyPopper,
  Repeat,
  GraduationCap,
  HeartPulse,
  Landmark,
  Package,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  Smartphone,
  FileCheck,
  Building,
  ShieldCheck,
  Plane,
  TrendingUp,
  Heart,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import type {
  CurrencyCode,
  DebtType,
  ExpenseMacro,
  GoalColor,
  GoalIconKey,
  IncomeCategory,
  PaymentMethod,
  Priority,
  ReceptionMethod,
} from "@/lib/types";

/* ---------------------------------- Colores --------------------------------- */

export const BRAND = {
  indigo: "#4F46E5",
  cobalt: "#2563EB",
  emerald: "#10B981",
  rose: "#F43F5E",
  amber: "#F59E0B",
  ink: "#0F172A",
  muted: "#64748B",
  grid: "#E2E8F0",
} as const;

/**
 * Paleta categórica de 8 tonos validada (separación CVD ≥ 9 ΔE entre vecinos,
 * piso visión normal ≥ 19 ΔE). Se asigna en orden fijo, nunca ciclado.
 */
export const CATEGORICAL = [
  "#4F46E5",
  "#EB6834",
  "#1BAF7A",
  "#EDA100",
  "#E87BA4",
  "#008300",
  "#2A78D6",
  "#E34948",
] as const;

/** Escala secuencial índigo (claro → oscuro) para mapas de calor. */
export const SEQUENTIAL_INDIGO = ["#EEF2FF", "#E0E7FF", "#C7D2FE", "#A5B4FC", "#818CF8", "#6366F1", "#4F46E5", "#4338CA", "#3730A3"];

/* -------------------------------- Ingresos ---------------------------------- */

export const INCOME_CATEGORIES: { value: IncomeCategory; icon: LucideIcon; hint: string }[] = [
  { value: "Salario", icon: Briefcase, hint: "Nómina o sueldo fijo" },
  { value: "Pasivos", icon: Building, hint: "Rentas, alquileres, ingresos sin esfuerzo activo" },
  { value: "Inversiones", icon: ChartLine, hint: "Dividendos, intereses, ganancias de capital" },
  { value: "Freelance", icon: Laptop, hint: "Proyectos independientes" },
  { value: "Regalías", icon: Music4, hint: "Derechos de autor, licencias" },
  { value: "Bonos", icon: Gift, hint: "Bonificaciones y gratificaciones" },
  { value: "Otros ingresos", icon: Coins, hint: "Reembolsos, ventas, otros" },
];

export const RECEPTION_METHODS: ReceptionMethod[] = ["Transferencia", "Depósito", "Efectivo", "Billetera digital", "Cheque"];

/* --------------------------------- Gastos ----------------------------------- */

export const EXPENSE_CATEGORIES: { value: ExpenseMacro; icon: LucideIcon; micros: string[]; color: string }[] = [
  { value: "Vivienda", icon: House, color: CATEGORICAL[0], micros: ["Alquiler / Hipoteca", "Servicios básicos", "Internet y telefonía", "Mantenimiento", "Seguro de hogar"] },
  { value: "Alimentación", icon: UtensilsCrossed, color: CATEGORICAL[1], micros: ["Supermercado", "Restaurantes", "Delivery", "Café y snacks"] },
  { value: "Transporte", icon: Car, color: CATEGORICAL[2], micros: ["Combustible", "Transporte público", "Taxi / Apps", "Mantenimiento vehicular", "Estacionamiento"] },
  { value: "Ocio", icon: PartyPopper, color: CATEGORICAL[3], micros: ["Salidas", "Viajes", "Hobbies", "Compras personales", "Eventos"] },
  { value: "Suscripciones", icon: Repeat, color: CATEGORICAL[4], micros: ["Streaming", "Software", "Gimnasio", "Membresías", "Nube"] },
  { value: "Educación", icon: GraduationCap, color: CATEGORICAL[5], micros: ["Matrícula", "Cursos online", "Libros", "Certificaciones"] },
  { value: "Salud", icon: HeartPulse, color: CATEGORICAL[6], micros: ["Seguro médico", "Consultas", "Farmacia", "Dental", "Bienestar"] },
  { value: "Deudas", icon: Landmark, color: CATEGORICAL[7], micros: ["Cuota de préstamo", "Pago de tarjeta", "Intereses", "Comisiones"] },
  { value: "Otros", icon: Package, color: "#94A3B8", micros: ["Regalos", "Donaciones", "Mascotas", "Imprevistos", "Varios"] },
];

export const PAYMENT_METHODS: { value: PaymentMethod; icon: LucideIcon }[] = [
  { value: "Tarjeta de crédito", icon: CreditCard },
  { value: "Tarjeta de débito", icon: CreditCard },
  { value: "Efectivo", icon: Banknote },
  { value: "Transferencia", icon: ArrowLeftRight },
  { value: "Billetera digital", icon: Smartphone },
];

export const PRIORITIES: { value: Priority; tone: "rose" | "amber" | "indigo"; hint: string; ideal: number }[] = [
  { value: "Necesidad", tone: "indigo", hint: "Gastos esenciales (regla 50/30/20: ≤ 50%)", ideal: 50 },
  { value: "Gusto", tone: "amber", hint: "Gastos discrecionales (≤ 30%)", ideal: 30 },
  { value: "Inversión", tone: "rose", hint: "Gastos que construyen futuro (≥ 20%)", ideal: 20 },
];

/* ------------------------------ Deudas / Cobros ------------------------------ */

export const DEBT_TYPES: DebtType[] = ["Hipoteca", "Préstamo personal", "Préstamo vehicular", "Tarjeta de crédito", "Préstamo estudiantil", "Otro"];
export const RECEIVABLE_TYPES = ["Préstamo personal", "Factura", "Servicio", "Otro"] as const;

/* ---------------------------------- Metas ----------------------------------- */

export const GOAL_ICONS: Record<GoalIconKey, LucideIcon> = {
  shield: ShieldCheck,
  plane: Plane,
  home: House,
  car: Car,
  graduation: GraduationCap,
  trending: TrendingUp,
  heart: Heart,
  laptop: Laptop,
  gift: Gift,
  piggy: PiggyBank,
};

export const GOAL_COLORS: Record<GoalColor, { solid: string; soft: string; gradient: string; text: string }> = {
  indigo: { solid: "#4F46E5", soft: "#EEF2FF", gradient: "from-indigo-500 to-violet-500", text: "text-indigo-600" },
  emerald: { solid: "#10B981", soft: "#ECFDF5", gradient: "from-emerald-400 to-teal-500", text: "text-emerald-600" },
  amber: { solid: "#F59E0B", soft: "#FFFBEB", gradient: "from-amber-400 to-orange-500", text: "text-amber-600" },
  rose: { solid: "#F43F5E", soft: "#FFF1F2", gradient: "from-rose-400 to-pink-500", text: "text-rose-600" },
  cobalt: { solid: "#2563EB", soft: "#EFF6FF", gradient: "from-blue-500 to-cyan-500", text: "text-blue-600" },
  violet: { solid: "#8B5CF6", soft: "#F5F3FF", gradient: "from-violet-500 to-fuchsia-500", text: "text-violet-600" },
};

/* --------------------------------- Monedas ---------------------------------- */

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; locale: string; decimals: number }[] = [
  { code: "USD", label: "Dólar estadounidense", symbol: "$", locale: "en-US", decimals: 2 },
  { code: "EUR", label: "Euro", symbol: "€", locale: "es-ES", decimals: 2 },
  { code: "MXN", label: "Peso mexicano", symbol: "$", locale: "es-MX", decimals: 2 },
  { code: "COP", label: "Peso colombiano", symbol: "$", locale: "es-CO", decimals: 0 },
  { code: "ARS", label: "Peso argentino", symbol: "$", locale: "es-AR", decimals: 2 },
  { code: "CLP", label: "Peso chileno", symbol: "$", locale: "es-CL", decimals: 0 },
  { code: "PEN", label: "Sol peruano", symbol: "S/", locale: "es-PE", decimals: 2 },
  { code: "GTQ", label: "Quetzal", symbol: "Q", locale: "es-GT", decimals: 2 },
  { code: "DOP", label: "Peso dominicano", symbol: "RD$", locale: "es-DO", decimals: 2 },
];

/* --------------------------------- Helpers ---------------------------------- */

export const incomeIcon = (c: string) => INCOME_CATEGORIES.find((x) => x.value === c)?.icon ?? Coins;
export const expenseMeta = (c: string) => EXPENSE_CATEGORIES.find((x) => x.value === c) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
export const expenseColor = (c: string) => expenseMeta(c).color;
export const paymentIcon = (m: string) => PAYMENT_METHODS.find((x) => x.value === m)?.icon ?? Wallet;
export const currencyMeta = (code: CurrencyCode) => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
export const ReceivableIcon = FileCheck;
