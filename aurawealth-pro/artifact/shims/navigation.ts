/** Sustituto de `next/navigation` respaldado por el enrutador en memoria. */
import { useMemo } from "react";
import { navigate, useLocation } from "../router";

export const usePathname = () => useLocation().path;

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href, { replace: true }),
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  prefetch: () => undefined,
};

export const useRouter = () => router;
