"use client";

import { motion } from "motion/react";
import { clamp, cn } from "@/lib/format";

const BAR = {
  indigo: "bg-indigo-700",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  cobalt: "bg-blue-600",
  violet: "bg-violet-600",
} as const;

export type ProgressTone = keyof typeof BAR;

/** Barra de progreso animada con brillo deslizante. */
export function ProgressBar({ value, tone = "indigo", size = "md", className, showShine = false }: { value: number; tone?: ProgressTone; size?: "sm" | "md" | "lg"; className?: string; showShine?: boolean }) {
  const v = clamp(value, 0, 1);
  const h = size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-1.5";
  return (
    <div className={cn("relative w-full overflow-hidden rounded-full bg-slate-100", h, className)} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={cn("relative h-full overflow-hidden rounded-full", BAR[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
      </motion.div>
    </div>
  );
}

/** Anillo de progreso SVG. */
export function ProgressRing({ value, size = 64, stroke = 7, color = "#2B3F6B", track = "#EDEFF3", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const v = clamp(value, 0, 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
