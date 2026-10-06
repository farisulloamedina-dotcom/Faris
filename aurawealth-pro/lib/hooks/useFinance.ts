"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store/StoreProvider";
import { buildAlerts, computeKpis } from "@/lib/finance/calculations";

/** KPIs memoizados del estado actual. */
export function useKpis() {
  const data = useData();
  return useMemo(() => computeKpis(data), [data]);
}

/** Alertas inteligentes memoizadas. */
export function useAlerts() {
  const data = useData();
  return useMemo(() => buildAlerts(data), [data]);
}

/** Reloj que se actualiza cada `ms` (para textos relativos tipo "hace 5 s"). */
export function useNow(ms = 10_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

export function timeAgo(iso: string | null, now: number) {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}
