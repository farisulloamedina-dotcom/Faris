"use client";

import { motion } from "motion/react";
import { clamp, cn } from "@/lib/format";

const BAR = {
  indigo: "from-indigo-500 via-indigo-500 to-blue-500",
  emerald: "from-emerald-400 to-teal-500",
  rose: "from-rose-400 to-pink-500",
  amber: "from-amber-400 to-orange-500",
  cobalt: "from-blue-500 to-cyan-500",
  violet: "from-violet-500 to-fuchsia-500",
} as const;

export type ProgressTone = keyof typeof BAR;

/** Barra de progreso animada con brillo deslizante. */
export function ProgressBar({ value, tone = "indigo", size = "md", className, showShine = true }: { value: number; tone?: ProgressTone; size?: "sm" | "md" | "lg"; className?: string; showShine?: boolean }) {
  const v = clamp(value, 0, 1);
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5";
  return (
    <div className={cn("relative w-full overflow-hidden rounded-full bg-slate-100", h, className)} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={cn("relative h-full overflow-hidden rounded-full bg-gradient-to-r", BAR[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {showShine && v > 0.04 && (
          <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.55)_50%,transparent_75%)] bg-[length:200%_100%]" />
        )}
      </motion.div>
    </div>
  );
}

/** Anillo de progreso SVG. */
export function ProgressRing({ value, size = 64, stroke = 7, color = "#4F46E5", track = "#EEF2FF", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
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
