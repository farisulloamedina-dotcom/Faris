/**
 * Enrutador en memoria para la compilación de un solo archivo (visor de artefactos).
 * Sustituye al router de Next.js: guarda ruta + query y notifica a los suscriptores.
 * Un ancla simple del enlace (#transacciones, #excel…) abre directamente ese módulo.
 */
import { useSyncExternalStore } from "react";

export interface Loc {
  path: string;
  search: string;
}

function initial(): Loc {
  try {
    const token = window.location.hash.replace(/^#\/?/, "");
    if (/^[a-z]+$/.test(token)) return { path: `/${token}`, search: "" };
  } catch {
    /* sin acceso a location */
  }
  return { path: "/", search: "" };
}

let state: Loc = initial();
const listeners = new Set<() => void>();

export function navigate(href: string, opts: { replace?: boolean } = {}) {
  const [p, q = ""] = href.replace(/^#/, "").split("?");
  const next = { path: p || "/", search: q };
  if (next.path === state.path && next.search === state.search) return;
  const changedPage = next.path !== state.path;
  state = next;
  listeners.forEach((l) => l());
  if (changedPage && !opts.replace) window.scrollTo({ top: 0 });
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Un ancla nueva (#metas) en la misma página también navega
try {
  window.addEventListener("hashchange", () => {
    const token = window.location.hash.replace(/^#\/?/, "");
    if (/^[a-z]+$/.test(token)) navigate(`/${token}`);
  });
} catch {
  /* entorno sin window */
}

export const useLocation = () => useSyncExternalStore(subscribe, () => state, () => state);
