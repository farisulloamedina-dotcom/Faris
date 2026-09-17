import BalanceCard from "@/components/BalanceCard";
import CategoryDonutChart from "@/components/CategoryDonutChart";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import ProudBear from "@/components/ProudBear";
import RecentTransactions from "@/components/RecentTransactions";
import SavingsGoals from "@/components/SavingsGoals";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import {
  BALANCE_CHANGE_PCT,
  CATEGORY_BREAKDOWN,
  CURRENT_BALANCE,
  MONTHLY_SUMMARY,
  SAVINGS_GOALS,
  TRANSACTIONS,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Sidebar />

      <main className="min-w-0 flex-1 space-y-6 pb-24 lg:pb-6">
        <Topbar />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <BalanceCard balance={CURRENT_BALANCE} changePct={BALANCE_CHANGE_PCT} />
          <SavingsGoals goals={SAVINGS_GOALS} />
          <IncomeExpenseChart data={MONTHLY_SUMMARY} />
          <CategoryDonutChart data={CATEGORY_BREAKDOWN} />
          <RecentTransactions transactions={TRANSACTIONS} />
        </div>
      </main>

      <ProudBear />
    </div>
  );
}
