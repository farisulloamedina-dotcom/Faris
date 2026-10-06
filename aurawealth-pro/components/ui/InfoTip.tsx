import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/format";

/** Tooltip flotante explicativo (hover y foco de teclado). */
export function InfoTip({ children, className, side = "top", label }: { children: ReactNode; className?: string; side?: "top" | "bottom"; label?: ReactNode }) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      <button type="button" aria-label="Más información" className="inline-flex items-center text-slate-400 transition-colors hover:text-indigo-500 focus:text-indigo-500">
        {label ?? <Info size={13} strokeWidth={2.4} />}
      </button>
      <span
        role="tooltip"
        className={cn(
          // display:none hasta el hover → no genera desbordamiento horizontal en móvil
          "pointer-events-none absolute left-1/2 z-50 hidden w-60 max-w-[70vw] -translate-x-1/2 animate-fade-up rounded-2xl bg-slate-900/95 px-3.5 py-2.5 text-left text-xs font-medium leading-relaxed text-white shadow-xl backdrop-blur group-hover/tip:block group-focus-within/tip:block",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {children}
      </span>
    </span>
  );
}
