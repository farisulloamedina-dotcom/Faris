import {
  ArrowDownLeft,
  ArrowUpRight,
  Car,
  Film,
  GraduationCap,
  Heart,
  Home,
  LineChart,
  Repeat,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import BentoCard from "./BentoCard";
import type { Category, Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORY_ICONS: Record<Category, typeof Home> = {
  Vivienda: Home,
  Alimentación: ShoppingCart,
  Transporte: Car,
  Ocio: Film,
  Salud: Heart,
  Suscripciones: Repeat,
  Ahorro: Wallet,
  Educación: GraduationCap,
  Salario: Wallet,
  Freelance: Wallet,
  Inversiones: LineChart,
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <BentoCard span="md:col-span-2 lg:col-span-4" noPadding className="flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h3 className="font-semibold text-white">Movimientos recientes</h3>
          <p className="text-sm text-slate-400">Últimas transacciones</p>
        </div>
        <button className="text-xs font-medium text-accent-mint hover:text-accent-mint/80">
          Ver todos
        </button>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto scrollbar-thin px-3 pb-3">
        {transactions.map((tx) => {
          const Icon = CATEGORY_ICONS[tx.category];
          const isIncome = tx.type === "income";
          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-300">
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{tx.description}</p>
                <p className="text-xs text-slate-500">
                  {tx.category} · {formatDate(tx.date)}
                </p>
              </div>
              <div
                className={
                  "flex items-center gap-1 text-sm font-semibold " +
                  (isIncome ? "text-accent-mint" : "text-slate-300")
                }
              >
                {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                {isIncome ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}
