/** Ajustes visuales compartidos por todos los gráficos (ejes y rejilla recesivos). */
export const AXIS_TICK = { fontSize: 11, fill: "#94A3B8", fontWeight: 600 } as const;
export const GRID_STROKE = "#EEF2F7";
export const CURSOR = { stroke: "#C7D2FE", strokeWidth: 1.5, strokeDasharray: "4 4" } as const;
export const BAR_CURSOR = { fill: "rgba(99,102,241,0.06)", radius: 10 } as const;
export const ANIM_MS = 900;

export const SERIES = {
  income: { color: "#10B981", label: "Ingresos" },
  expense: { color: "#F43F5E", label: "Gastos" },
  net: { color: "#4F46E5", label: "Flujo neto" },
} as const;
