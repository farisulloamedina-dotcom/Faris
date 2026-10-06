import { ArrowLeftRight, ChartArea, FileSpreadsheet, LayoutDashboard, Scale, Target, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

/** Mapa de módulos de la aplicación (sidebar, pestañas y breadcrumbs). */
export const NAV: NavItem[] = [
  { href: "/", label: "Command Center", short: "Dashboard", description: "KPIs, alertas y accesos rápidos", icon: LayoutDashboard, gradient: "from-indigo-500 to-blue-500" },
  { href: "/transacciones", label: "Motor de Transacciones", short: "Transacciones", description: "Ingresos y gastos detallados", icon: ArrowLeftRight, gradient: "from-emerald-400 to-teal-500" },
  { href: "/pasivos", label: "Pasivos y Cobros", short: "Pasivos", description: "Deudas y valores a cobrar", icon: Scale, gradient: "from-rose-400 to-pink-500" },
  { href: "/metas", label: "Centro de Metas", short: "Metas", description: "Ahorro e inversión", icon: Target, gradient: "from-amber-400 to-orange-500" },
  { href: "/analitica", label: "Inteligencia y Analítica", short: "Analítica", description: "Predicción y comparativas", icon: ChartArea, gradient: "from-violet-500 to-fuchsia-500" },
  { href: "/excel", label: "Centro Excel y Datos", short: "Excel", description: "Exportar, importar, sincronizar", icon: FileSpreadsheet, gradient: "from-green-500 to-emerald-600" },
];

export const navFor = (pathname: string) => NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href))) ?? NAV[0];
