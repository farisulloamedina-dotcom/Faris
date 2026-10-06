"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, PanelLeftClose, PanelLeft, Sparkles, X } from "lucide-react";
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
      <button onClick={exportNow} title="Exportar Excel" className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-glow-emerald transition hover:scale-105">
        <Download size={18} />
      </button>
    );
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-4 ring-1 ring-emerald-100">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-200/40 blur-2xl" />
      <div className="relative flex items-center gap-2 text-xs font-bold text-emerald-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Excel sincronizado
      </div>
      <p className="relative mt-1.5 text-[11px] leading-relaxed text-slate-500">
        {model.sheets.length} hojas · {totalRows} filas · {timeAgo(log[0]?.at ?? model.generatedAt, now)}
      </p>
      {linkedName && (
        <p className="relative mt-1 truncate text-[11px] font-semibold text-indigo-600" title={linkedName}>
          {linkStatus === "writing" ? "Escribiendo…" : "↻"} {linkedName}
        </p>
      )}
      <button
        onClick={exportNow}
        disabled={exporting}
        className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2 text-xs font-bold text-white shadow-glow-emerald transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
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
            className={cn("group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors", collapsed && "justify-center px-0", active ? "text-slate-900" : "text-slate-500 hover:bg-white/70 hover:text-slate-900")}
          >
            {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300", active ? `bg-gradient-to-br ${item.gradient} text-white shadow-md` : "bg-slate-100/80 text-slate-500 group-hover:scale-105 group-hover:bg-white")}>
              <Icon size={17} strokeWidth={2.3} />
            </span>
            {!collapsed && (
              <span className="relative min-w-0 flex-1">
                <span className="block truncate">{item.short}</span>
                <span className="block truncate text-[11px] font-medium text-slate-400">{item.description}</span>
              </span>
            )}
            {badge > 0 && (
              <span className={cn("relative flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-glow-rose", collapsed && "absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]")}>{badge}</span>
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
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-400 text-white shadow-glow-indigo">
        <Sparkles size={19} strokeWidth={2.4} />
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-[17px] font-extrabold tracking-tight text-slate-900">
            Aura<span className="text-gradient">Wealth</span>
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-500">Pro · Local-first</span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      {/* Escritorio */}
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r border-white/80 bg-white/45 px-4 py-5 backdrop-blur-xl transition-[width] duration-300 lg:flex", collapsed ? "w-[88px]" : "w-[272px]")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
          <Brand collapsed={collapsed} />
          <button onClick={onToggle} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}>
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {!collapsed && <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Módulos</p>}
        <div className="-mt-3 flex-1 overflow-y-auto">
          <NavList collapsed={collapsed} />
        </div>
        <SyncWidget collapsed={collapsed} />
      </aside>

      {/* Móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} />
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
