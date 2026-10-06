import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

/** Tarjeta base con glassmorphism sutil y elevación al pasar el cursor. */
export function Card({ className, hover = true, children, ...rest }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("glass rounded-3xl", hover && "card-hover", className)} {...rest}>
      {children}
    </div>
  );
}

const TONE_TILE = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  cobalt: "bg-blue-50 text-blue-600 ring-blue-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export type Tone = keyof typeof TONE_TILE;

export function IconTile({ icon: Icon, tone = "indigo", size = "md", className, color }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string; color?: string }) {
  const dims = size === "sm" ? "h-8 w-8 rounded-xl" : size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-2xl";
  const icon = size === "sm" ? 15 : size === "lg" ? 22 : 18;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", dims, !color && TONE_TILE[tone], className)}
      style={color ? { background: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}26` } : undefined}
    >
      <Icon size={icon} strokeWidth={2.2} />
    </span>
  );
}

export function CardHeader({ title, subtitle, icon, tone = "indigo", action, className }: { title: ReactNode; subtitle?: ReactNode; icon?: LucideIcon; tone?: Tone; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} />}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="min-w-0 max-w-full">{action}</div>}
    </div>
  );
}
