"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

const base =
  "w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function Field({ label, hint, error, children, className }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...rest} />;
}

export function MoneyInput({ symbol, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { symbol: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{symbol}</span>
      <input type="number" inputMode="decimal" step="0.01" min="0" className={cn(base, "tabular pl-9", symbol.length > 1 && "pl-11", className)} {...rest} />
    </div>
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(base, "cursor-pointer appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
      <ChevronDown size={15} strokeWidth={2.6} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-[72px] resize-y", className)} {...rest} />;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group inline-flex items-center gap-2.5 text-sm font-semibold text-slate-700">
      <span className={cn("relative h-6 w-11 rounded-full transition-colors duration-300", checked ? "bg-gradient-to-r from-indigo-500 to-blue-500" : "bg-slate-200")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

/** Selector segmentado (opciones excluyentes con chips). */
export function Segmented<T extends string>({ options, value, onChange, tones }: { options: readonly T[]; value: T; onChange: (v: T) => void; tones?: Partial<Record<T, string>> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold ring-1 ring-inset transition-all active:scale-95",
              active ? (tones?.[o] ?? "bg-indigo-600 text-white ring-indigo-600 shadow-glow-indigo") : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
