"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn, pct } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { InfoTip } from "./InfoTip";
import { Sparkline } from "@/components/charts/Sparkline";

/** Cada tema solo aporta el color de la línea de tendencia y del icono. */
const THEMES = {
  indigo: { line: "#2B3F6B", icon: "text-indigo-700" },
  emerald: { line: "#2E8A62", icon: "text-emerald-600" },
  rose: { line: "#B04848", icon: "text-rose-500" },
  amber: { line: "#B5832A", icon: "text-amber-600" },
  cobalt: { line: "#3D5A9E", icon: "text-blue-600" },
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

/** Tarjeta de indicador: etiqueta, cifra en serif, variación y línea de tendencia. */
export function KpiCard({ label, value, format, icon: Icon, theme, delta, invertDelta, deltaLabel = "vs. mes anterior", spark, info, footer }: Props) {
  const t = THEMES[theme];
  const up = (delta ?? 0) > 0.0005;
  const down = (delta ?? 0) < -0.0005;
  const good = invertDelta ? down : up;
  const bad = invertDelta ? up : down;
  const DeltaIcon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className="glass card-hover relative rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow flex items-center gap-1.5">
          {label}
          {info && <InfoTip>{info}</InfoTip>}
        </div>
        <Icon size={17} strokeWidth={1.8} className={t.icon} />
      </div>
      <AnimatedNumber value={value} format={format} className="tabular mt-3 block font-serif text-[30px] font-semibold leading-none tracking-tight text-ink" />
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", good ? "text-emerald-600" : bad ? "text-rose-500" : "text-slate-400")}>
            <DeltaIcon size={13} strokeWidth={2.2} />
            {pct(Math.abs(delta), 1)}
          </span>
        )}
        <span className="truncate text-slate-400">{deltaLabel}</span>
      </div>
      {spark && spark.length > 1 && (
        <div className="-mx-1 mt-4 border-t border-line pt-3">
          <Sparkline data={spark} color={t.line} height={36} />
        </div>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
