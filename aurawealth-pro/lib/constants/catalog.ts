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
  indigo: "#2B3F6B", // azul marino institucional (color principal)
  cobalt: "#3D5A9E",
  emerald: "#2E8A62", // ingresos / metas
  rose: "#B04848", // gastos / deudas
  amber: "#B5832A", // cuentas por cobrar / avisos
  ink: "#111827",
  muted: "#6B7280",
  grid: "#E5E7EB",
} as const;

/**
 * Paleta categórica sobria de 8 tonos validada (separación CVD ≥ 9,9 ΔE entre vecinos,
 * piso visión normal ≥ 19 ΔE). Se asigna en orden fijo, nunca ciclado.
 */
export const CATEGORICAL = [
  "#3D5A9E",
  "#C46A3A",
  "#1A9480",
  "#C29A2A",
  "#B0628E",
  "#4E7F2E",
  "#5E93CF",
  "#B24848",
] as const;

/** Escala secuencial índigo (claro → oscuro) para mapas de calor. */
export const SEQUENTIAL_INDIGO = ["#F3F5F9", "#E6EAF2", "#CBD3E3", "#A3B0CB", "#7586AB", "#4D628F", "#344A78", "#283B63", "#1F2F50"];

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
  indigo: { solid: "#2B3F6B", soft: "#EEF1F6", gradient: "bg-indigo-700", text: "text-indigo-700" },
  emerald: { solid: "#2E8A62", soft: "#EFF7F3", gradient: "bg-emerald-600", text: "text-emerald-700" },
  amber: { solid: "#B5832A", soft: "#FBF6EC", gradient: "bg-amber-500", text: "text-amber-700" },
  rose: { solid: "#B04848", soft: "#FBF1F1", gradient: "bg-rose-500", text: "text-rose-700" },
  cobalt: { solid: "#3D5A9E", soft: "#F1F4F9", gradient: "bg-blue-600", text: "text-blue-700" },
  violet: { solid: "#5A5F86", soft: "#F2F2F6", gradient: "bg-violet-600", text: "text-violet-700" },
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
