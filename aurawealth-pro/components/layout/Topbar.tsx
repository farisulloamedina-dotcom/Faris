"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Command, House, Landmark, Menu, Plus, Receipt, Save, Search, Target, TriangleAlert, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navFor } from "./nav";
import { useUI } from "./UIProvider";
import { cn } from "@/lib/format";
import { useStore } from "@/lib/store/StoreProvider";
import { timeAgo, useNow } from "@/lib/hooks/useFinance";

const SUBVIEWS: Record<string, Record<string, string>> = {
  "/transacciones": { ingresos: "Ingresos", gastos: "Gastos", todos: "Todos los movimientos" },
  "/pasivos": { deudas: "Deudas", cobros: "Cuentas por cobrar" },
};

function Breadcrumbs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const item = navFor(pathname);
  const sub = SUBVIEWS[item.href]?.[params.get("tab") ?? ""];
  return (
    <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      <Link href="/" className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-indigo-600" aria-label="Inicio">
        <House size={15} />
      </Link>
      <ChevronRight size={14} className="text-slate-300" />
      <Link href={item.href} className={cn("truncate font-semibold transition hover:text-indigo-600", sub ? "text-slate-500" : "text-slate-900")}>
        {item.label}
      </Link>
      {sub && (
        <>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="truncate font-semibold text-slate-900">{sub}</span>
        </>
      )}
    </nav>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/transacciones?tab=todos&q=${encodeURIComponent(q.trim())}`);
        ref.current?.blur();
      }}
      className="group relative hidden w-full max-w-xs sm:block"
    >
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-500" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar movimientos…"
        className="h-10 w-full rounded-2xl border-0 bg-white/80 pl-10 pr-14 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200/80 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
        <Command size={10} />K
      </kbd>
    </form>
  );
}

function QuickAdd() {
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);
  const items = [
    { label: "Ingreso", hint: "Salario, freelance, bonos…", icon: ArrowUpRight, cls: "bg-emerald-50 text-emerald-600", run: () => ui.openTransaction("income") },
    { label: "Gasto", hint: "Consumo con categoría y prioridad", icon: ArrowDownRight, cls: "bg-rose-50 text-rose-600", run: () => ui.openTransaction("expense") },
    { label: "Deuda", hint: "Préstamo, tarjeta, hipoteca", icon: Landmark, cls: "bg-indigo-50 text-indigo-600", run: () => ui.openDebt() },
    { label: "Cuenta por cobrar", hint: "Préstamo o factura a terceros", icon: Receipt, cls: "bg-amber-50 text-amber-600", run: () => ui.openReceivable() },
    { label: "Meta", hint: "Ahorro o inversión", icon: Target, cls: "bg-violet-50 text-violet-600", run: () => ui.openGoal() },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-gradient flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white shadow-glow-indigo transition active:scale-95" aria-expanded={open}>
        <Plus size={17} strokeWidth={2.8} className={cn("transition-transform duration-300", open && "rotate-45")} />
        <span className="hidden sm:inline">Nuevo</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="glass absolute right-0 top-12 z-50 w-72 rounded-3xl p-2"
          >
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => {
                  setOpen(false);
                  it.run();
                }}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span className={cn("rounded-xl p-2 transition group-hover:scale-110", it.cls)}>
                  <it.icon size={16} strokeWidth={2.4} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-800">{it.label}</span>
                  <span className="block text-[11px] text-slate-400">{it.hint}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SaveStatus() {
  const { persistence } = useStore();
  const now = useNow(5000);
  if (persistence.error)
    return (
      <span className="hidden items-center gap-1.5 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 xl:flex" title={persistence.error}>
        <TriangleAlert size={13} /> Error al guardar
      </span>
    );
  return (
    <span className="hidden items-center gap-1.5 rounded-xl bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200/70 xl:flex" title="Guardado automático en este navegador (localStorage)">
      <Save size={13} className="text-emerald-500" /> Guardado {timeAgo(persistence.lastSavedAt, now)}
    </span>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { undo, canUndo, undoLabel, data } = useStore();
  const name = data.settings.userName || "Usuario";
  return (
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/55 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <button onClick={onMenu} className="rounded-xl p-2 text-slate-500 hover:bg-white lg:hidden" aria-label="Abrir menú">
          <Menu size={20} />
        </button>
        <Breadcrumbs />
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch />
          <SaveStatus />
          <button
            onClick={undo}
            disabled={!canUndo}
            title={canUndo ? `Deshacer: ${undoLabel} (Ctrl+Z)` : "Nada que deshacer"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-500 ring-1 ring-slate-200/80 transition hover:text-indigo-600 active:scale-95 disabled:opacity-40"
          >
            <Undo2 size={16} />
          </button>
          <QuickAdd />
          <Link href="/excel?tab=preferencias" title="Preferencias" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-rose-400 to-indigo-500 text-sm font-extrabold text-white shadow-md ring-2 ring-white transition hover:scale-105">
            {name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
