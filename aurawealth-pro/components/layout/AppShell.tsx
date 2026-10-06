"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { useStore } from "@/lib/store/StoreProvider";

function LoadingScreen() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="skeleton h-10 w-72 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-40 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="skeleton h-80 rounded-3xl xl:col-span-2" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );
}

/** Estructura principal: sidebar dinámico + barra superior + pestañas + contenido. */
export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated } = useStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem("aurawealth.ui.sidebar") === "collapsed");
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("aurawealth.ui.sidebar", c ? "expanded" : "collapsed");
      } catch {
        /* sin almacenamiento */
      }
      return !c;
    });

  return (
    <div className="flex min-h-screen">
      <div className="aura-backdrop" />
      <Sidebar collapsed={collapsed} onToggle={toggle} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16" />}>
          <Topbar onMenu={() => setMobileOpen(true)} />
        </Suspense>
        <WorkspaceTabs />
        <main className="flex-1">
          {hydrated ? (
            <div key={pathname} className="animate-fade-up mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">
              <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
            </div>
          ) : (
            <LoadingScreen />
          )}
        </main>
      </div>
    </div>
  );
}
