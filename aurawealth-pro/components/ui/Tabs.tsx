"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/format";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

/** Pestañas tipo píldora con indicador animado compartido. */
export function Tabs<T extends string>({ items, value, onChange, className, size = "md" }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; size?: "sm" | "md" }) {
  const id = useId();
  return (
    <div role="tablist" className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1", className)}>
      {items.map((it) => {
        const active = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active ? "text-ink" : "text-slate-500 hover:text-ink",
            )}
          >
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-line" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon size={size === "sm" ? 13 : 15} strokeWidth={2.3} />}
              {it.label}
              {it.count !== undefined && (
                <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", active ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-500")}>{it.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
