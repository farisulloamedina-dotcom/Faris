"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV, navFor } from "./nav";
import { cn } from "@/lib/format";

const KEY = "aurawealth.ui.tabs";

function readTabs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((h) => NAV.some((n) => n.href === h)) : [];
  } catch {
    return [];
  }
}

/**
 * Pestañas de espacio de trabajo al estilo software de escritorio:
 * cada módulo visitado queda abierto como pestaña (se recuerda por navegador).
 */
export function WorkspaceTabs() {
  const pathname = usePathname();
  const current = navFor(pathname).href;
  const [tabs, setTabs] = useState<string[]>(["/"]);

  useEffect(() => {
    // Sincroniza la lista con el módulo activo (y la restaura de localStorage la primera vez)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabs((prev) => {
      const base = prev.length <= 1 ? Array.from(new Set(["/", ...readTabs(), ...prev])) : prev;
      const next = base.includes(current) ? base : [...base, current];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });
  }, [current]);

  const close = (href: string) =>
    setTabs((prev) => {
      const next = prev.filter((h) => h !== href);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });

  return (
    <div className="flex items-end gap-1 overflow-x-auto px-4 pt-2 md:px-8">
      <AnimatePresence initial={false}>
        {tabs.map((href) => {
          const item = NAV.find((n) => n.href === href)!;
          const active = href === current;
          const Icon = item.icon;
          return (
            <motion.div
              key={href}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 rounded-t-2xl border border-b-0 py-2 pl-3 pr-2 text-xs font-bold transition-colors",
                active ? "border-white bg-white/90 text-slate-900 shadow-[0_-6px_16px_-10px_rgba(79,70,229,0.35)]" : "border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-800",
              )}
            >
              {active && <span className={cn("absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-to-r", item.gradient)} />}
              <Link href={href} className="flex items-center gap-2">
                <Icon size={14} strokeWidth={2.4} />
                {item.short}
              </Link>
              {href !== "/" && !active ? (
                <button onClick={() => close(href)} className="rounded-md p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100" aria-label={`Cerrar ${item.short}`}>
                  <X size={12} />
                </button>
              ) : (
                <span className="w-4" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
