"use client";

import { motion } from "motion/react";
import { clamp } from "@/lib/format";

/** Termómetro vertical de progreso para metas. */
export function Thermometer({ value, color, height = 150 }: { value: number; color: string; height?: number }) {
  const v = clamp(value, 0, 1);
  const tube = height - 34;
  return (
    <svg width={44} height={height} viewBox={`0 0 44 ${height}`} aria-hidden>
      <rect x={14} y={4} width={16} height={tube} rx={8} fill="#F1F5F9" />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={32} x2={38} y1={4 + tube * (1 - t)} y2={4 + tube * (1 - t)} stroke="#CBD5E1" strokeWidth={1.5} strokeLinecap="round" />
      ))}
      <motion.rect
        x={17}
        width={10}
        rx={5}
        fill={color}
        initial={{ y: 4 + tube, height: 0 }}
        animate={{ y: 4 + tube * (1 - v) + 3, height: Math.max(0, tube * v - 3) + 10 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <circle cx={22} cy={height - 16} r={13} fill={color} />
      <circle cx={18} cy={height - 20} r={4} fill="#fff" opacity={0.45} />
    </svg>
  );
}
