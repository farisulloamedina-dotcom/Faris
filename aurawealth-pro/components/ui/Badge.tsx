import type { ReactNode } from "react";
import { cn } from "@/lib/format";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  rose: "bg-rose-50 text-rose-700 ring-rose-200/70",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70",
  cobalt: "bg-blue-50 text-blue-700 ring-blue-200/70",
  violet: "bg-violet-50 text-violet-700 ring-violet-200/70",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

const DOTS = {
  indigo: "bg-indigo-500 text-indigo-400",
  emerald: "bg-emerald-500 text-emerald-400",
  rose: "bg-rose-500 text-rose-400",
  amber: "bg-amber-500 text-amber-400",
  cobalt: "bg-blue-500 text-blue-400",
  violet: "bg-violet-500 text-violet-400",
  slate: "bg-slate-400 text-slate-300",
} as const;

export type BadgeTone = keyof typeof TONES;

/** Badge de estado; `pulse` añade un punto animado (estados vivos o urgentes). */
export function Badge({ tone = "slate", pulse, dot, icon, children, className }: { tone?: BadgeTone; pulse?: boolean; dot?: boolean; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", TONES[tone], className)}>
      {(dot || pulse) && <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone], pulse && "animate-pulse-ring")} />}
      {icon}
      {children}
    </span>
  );
}
