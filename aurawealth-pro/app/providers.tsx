"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { ExcelSyncProvider } from "@/lib/excel/ExcelSyncProvider";
import { ToastProvider } from "@/components/ui/Toaster";
import { UIProvider } from "@/components/layout/UIProvider";
import { AppShell } from "@/components/layout/AppShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <ExcelSyncProvider>
        <ToastProvider>
          <UIProvider>
            <AppShell>{children}</AppShell>
          </UIProvider>
        </ToastProvider>
      </ExcelSyncProvider>
    </StoreProvider>
  );
}
