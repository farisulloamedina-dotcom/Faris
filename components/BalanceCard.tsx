import { ArrowUpRight, Wallet } from "lucide-react";
import BentoCard from "./BentoCard";
import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  changePct: number;
}

export default function BalanceCard({ balance, changePct }: BalanceCardProps) {
  return (
    <BentoCard span="md:col-span-2 lg:col-span-2" className="flex flex-col justify-between overflow-hidden relative">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-mint/20 blur-3xl"
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-mint/15 text-accent-mint">
            <Wallet size={18} />
          </span>
          Balance total
        </div>
        <span className="flex items-center gap-1 rounded-full bg-accent-mint/15 px-2.5 py-1 text-xs font-medium text-accent-mint">
          <ArrowUpRight size={13} />
          {changePct}%
        </span>
      </div>

      <div className="mt-6">
        <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {formatCurrency(balance)}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          En 3 cuentas conectadas · actualizado hace instantes
        </p>
      </div>
    </BentoCard>
  );
}
