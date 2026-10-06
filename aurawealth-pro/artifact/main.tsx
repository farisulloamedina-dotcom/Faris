/** Punto de entrada de la compilación de un solo archivo (artefacto de claude.ai). */
import "./styles.css";
import { createRoot } from "react-dom/client";
import type { ComponentType } from "react";
import { Providers } from "@/app/providers";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { LiabilitiesView } from "@/components/liabilities/LiabilitiesView";
import { GoalsView } from "@/components/goals/GoalsView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { ExcelCenterView } from "@/components/excel/ExcelCenterView";
import { useLocation } from "./router";

const ROUTES: Record<string, ComponentType> = {
  "/": DashboardView,
  "/transacciones": TransactionsView,
  "/pasivos": LiabilitiesView,
  "/metas": GoalsView,
  "/analitica": AnalyticsView,
  "/excel": ExcelCenterView,
};

function App() {
  const { path } = useLocation();
  const View = ROUTES[path] ?? DashboardView;
  return (
    <Providers>
      <View />
    </Providers>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
