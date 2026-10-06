"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, PanelLeftClose, PanelLeft, X } from "lucide-react";
import { useMemo } from "react";
import { NAV } from "./nav";
import { cn } from "@/lib/format";
import { useAlerts, useNow, timeAgo } from "@/lib/hooks/useFinance";
import { useExcelSync } from "@/lib/excel/ExcelSyncProvider";
import { useStore } from "@/lib/store/StoreProvider";

function useNavBadges() {
  const alerts = useAlerts();
  return useMemo(() => {
    const urgent = alerts.filter((a) => a.level === "critical" || a.level === "warning");
    return {
      "/": urgent.length,
      "/pasivos": urgent.filter((a) => a.href.startsWith("/pasivos")).length,
      "/metas": urgent.filter((a) => a.href.startsWith("/metas")).length,
    } as Record<string, number>;
  }, [alerts]);
}

function SyncWidget({ collapsed }: { collapsed: boolean }) {
  const { model, totalRows, exportNow, exporting, linkedName, linkStatus } = useExcelSync();
  const { log } = useStore();
  const now = useNow(5000);
  if (collapsed)
    return (
      <button onClick={exportNow} title="Exportar Excel" className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-slate-50">
        <Download size={18} />
      </button>
    );
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Excel sincronizado
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        {model.sheets.length} hojas · {totalRows} filas · {timeAgo(log[0]?.at ?? model.generatedAt, now)}
      </p>
      {linkedName && (
        <p className="mt-1 truncate text-[11px] font-medium text-indigo-700" title={linkedName}>
          {linkStatus === "writing" ? "Escribiendo…" : "↻"} {linkedName}
        </p>
      )}
      <button
        onClick={exportNow}
        disabled={exporting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white py-2 text-xs font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        <Download size={14} /> {exporting ? "Generando…" : "Exportar .xlsx"}
      </button>
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const badges = useNavBadges();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        const badge = badges[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.short : undefined}
            className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", collapsed && "justify-center px-0", active ? "text-ink" : "text-slate-500 hover:bg-slate-100/70 hover:text-ink")}
          >
            {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-white shadow-card ring-1 ring-line" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            {active && !collapsed && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-indigo-700" />}
            <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center", active ? "text-indigo-700" : "text-slate-400 group-hover:text-slate-600")}>
              <Icon size={17} strokeWidth={1.8} />
            </span>
            {!collapsed && (
              <span className="relative min-w-0 flex-1">
                <span className="block truncate">{item.short}</span>
                <span className="block truncate text-[11px] font-normal text-slate-400">{item.description}</span>
              </span>
            )}
            {badge > 0 && (
              <span className={cn("relative flex h-5 min-w-5 items-center justify-center rounded-md bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-200", collapsed && "absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]")}>{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-800 font-serif text-[15px] font-semibold tracking-tight text-white">AW</span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block font-serif text-[19px] font-semibold tracking-tight text-ink">AuraWealth</span>
          <span className="eyebrow block text-[9.5px]!">Gestión patrimonial</span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      {/* Escritorio */}
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r border-line bg-white px-4 py-5 transition-[width] duration-300 lg:flex", collapsed ? "w-[80px]" : "w-[264px]")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
          <Brand collapsed={collapsed} />
          <button onClick={onToggle} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}>
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {!collapsed && <p className="eyebrow px-3">Módulos</p>}
        <div className="-mt-3 flex-1 overflow-y-auto">
          <NavList collapsed={collapsed} />
        </div>
        <SyncWidget collapsed={collapsed} />
      </aside>

      {/* Móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[290px] flex-col gap-6 bg-white px-4 py-5 shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="flex items-center justify-between">
                <Brand collapsed={false} />
                <button onClick={onMobileClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar menú">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavList collapsed={false} onNavigate={onMobileClose} />
              </div>
              <SyncWidget collapsed={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
