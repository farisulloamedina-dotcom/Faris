import { LayoutGrid, PiggyBank, Receipt, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Movimientos", icon: Receipt, active: false },
  { label: "Metas", icon: PiggyBank, active: false },
  { label: "Insights", icon: Sparkles, active: false },
  { label: "Ajustes", icon: Settings, active: false },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-20 shrink-0 flex-col items-center justify-between rounded-4xl border border-surface-border bg-surface py-6 backdrop-blur-xl lg:flex">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-mint to-accent-sky text-lg font-bold text-background">
          P
        </div>

        <nav className="flex flex-1 flex-col items-center justify-center gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              title={item.label}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                item.active
                  ? "bg-accent-mint/15 text-accent-mint"
                  : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200",
              )}
            >
              <item.icon size={19} />
            </button>
          ))}
        </nav>

        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent-violet to-accent-coral" />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-3xl border border-surface-border bg-surface px-2 py-2.5 backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
              item.active
                ? "bg-accent-mint/15 text-accent-mint"
                : "text-slate-500 hover:text-slate-200",
            )}
          >
            <item.icon size={19} />
          </button>
        ))}
      </nav>
    </>
  );
}
