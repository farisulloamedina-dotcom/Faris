/** Leyenda HTML (identidad nunca solo por color: muestra etiqueta y, opcionalmente, valor). */
export function ChartLegend({ items }: { items: { label: string; color: string; value?: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2 font-semibold text-slate-600">
          {it.dashed ? (
            <svg width="18" height="8" aria-hidden>
              <line x1="0" y1="4" x2="18" y2="4" stroke={it.color} strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          )}
          {it.label}
          {it.value && <span className="tabular font-semibold text-slate-900">{it.value}</span>}
        </span>
      ))}
    </div>
  );
}
