import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="animate-fade-up">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
