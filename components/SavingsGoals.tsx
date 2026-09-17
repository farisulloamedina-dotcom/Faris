import { PiggyBank } from "lucide-react";
import BentoCard from "./BentoCard";
import type { SavingsGoal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SavingsGoalsProps {
  goals: SavingsGoal[];
}

export default function SavingsGoals({ goals }: SavingsGoalsProps) {
  return (
    <BentoCard span="md:col-span-2 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-violet/15 text-accent-violet">
          <PiggyBank size={18} />
        </span>
        <div>
          <h3 className="font-semibold text-white">Metas de ahorro</h3>
          <p className="text-sm text-slate-400">3 objetivos activos</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-200">{goal.name}</span>
                <span className="text-slate-400">
                  {formatCurrency(goal.current)}{" "}
                  <span className="text-slate-600">/ {formatCurrency(goal.target)}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: goal.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}
