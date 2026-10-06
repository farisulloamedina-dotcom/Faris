"use client";

import { motion } from "motion/react";
import { clamp } from "@/lib/format";

/**
 * Medidor semicircular (ej. tasa de ahorro). La aguja marca el valor y la
 * muesca el objetivo. El color pasa de coral a ámbar a esmeralda según el estado.
 */
export function Gauge({ value, target, label, display, size = 220 }: { value: number; target?: number; label: string; display: string; size?: number }) {
  const v = clamp(value, 0, 1);
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const arc = Math.PI * r;
  const color = target !== undefined ? (value >= target ? "#10B981" : value >= target * 0.6 ? "#F59E0B" : "#F43F5E") : "#4F46E5";
  const point = (t: number) => [cx - r * Math.cos(Math.PI * t), cy - r * Math.sin(Math.PI * t)];
  const [tx, ty] = target !== undefined ? point(clamp(target, 0, 1)) : [0, 0];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 + 28 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <defs>
          <linearGradient id="gauge-track" x1="0" x2="1">
            <stop offset="0%" stopColor="#FFE4E6" />
            <stop offset="50%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#D1FAE5" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="url(#gauge-track)" strokeWidth={16} fill="none" strokeLinecap="round" />
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke={color}
          strokeWidth={16}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arc}
          initial={{ strokeDashoffset: arc }}
          animate={{ strokeDashoffset: arc * (1 - v) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
        {target !== undefined && <circle cx={tx} cy={ty} r={6} fill="#fff" stroke="#0F172A" strokeWidth={2.5} />}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="tabular text-3xl font-extrabold tracking-tight" style={{ color }}>
          {display}
        </span>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
    </div>
  );
}
