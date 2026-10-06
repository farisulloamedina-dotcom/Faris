"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn, pct } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { InfoTip } from "./InfoTip";
import { Sparkline } from "@/components/charts/Sparkline";

const THEMES = {
  indigo: { bg: "from-indigo-50 via-white to-blue-50", icon: "from-indigo-500 to-blue-500", glow: "bg-indigo-300/30", line: "#4F46E5" },
  emerald: { bg: "from-emerald-50 via-white to-teal-50", icon: "from-emerald-400 to-teal-500", glow: "bg-emerald-300/30", line: "#10B981" },
  rose: { bg: "from-rose-50 via-white to-pink-50", icon: "from-rose-400 to-pink-500", glow: "bg-rose-300/30", line: "#F43F5E" },
  amber: { bg: "from-amber-50 via-white to-orange-50", icon: "from-amber-400 to-orange-500", glow: "bg-amber-300/30", line: "#F59E0B" },
  cobalt: { bg: "from-blue-50 via-white to-cyan-50", icon: "from-blue-500 to-cyan-500", glow: "bg-blue-300/30", line: "#2563EB" },
} as const;

export type KpiTheme = keyof typeof THEMES;

interface Props {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  theme: KpiTheme;
  /** Variación relativa vs. periodo anterior (0.12 = +12 %). */
  delta?: number;
  /** Si true, una subida es mala (ej. deuda). */
  invertDelta?: boolean;
  deltaLabel?: string;
  spark?: number[];
  info?: ReactNode;
  footer?: ReactNode;
}

/** Tarjeta KPI con gradiente pastel, conteo animado, variación y sparkline. */
export function KpiCard({ label, value, format, icon: Icon, theme, delta, invertDelta, deltaLabel = "vs. mes anterior", spark, info, footer }: Props) {
  const t = THEMES[theme];
  const up = (delta ?? 0) > 0.0005;
  const down = (delta ?? 0) < -0.0005;
  const good = invertDelta ? down : up;
  const bad = invertDelta ? up : down;
  const DeltaIcon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className={cn("group glass card-hover relative overflow-hidden rounded-3xl bg-gradient-to-br p-5", t.bg)}>
      <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150", t.glow)} />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
          {label}
          {info && <InfoTip>{info}</InfoTip>}
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110", t.icon)}>
          <Icon size={19} strokeWidth={2.3} />
        </span>
      </div>
      <AnimatedNumber value={value} format={format} className="tabular relative mt-1 block text-[26px] font-extrabold tracking-tight text-slate-900" />
      <div className="relative mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold", good ? "bg-emerald-100 text-emerald-700" : bad ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500")}>
            <DeltaIcon size={12} strokeWidth={2.8} />
            {pct(Math.abs(delta), 1)}
          </span>
        )}
        <span className="truncate text-slate-400">{deltaLabel}</span>
      </div>
      {spark && spark.length > 1 && (
        <div className="relative -mx-1 mt-3">
          <Sparkline data={spark} color={t.line} />
        </div>
      )}
      {footer && <div className="relative mt-3">{footer}</div>}
    </div>
  );
}
