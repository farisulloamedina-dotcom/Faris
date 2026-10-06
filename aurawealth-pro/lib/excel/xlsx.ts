/** Carga diferida de xlsx-js-style (fuera del bundle inicial). Normaliza el interop CJS/ESM. */
export type XLSXModule = typeof import("xlsx-js-style");

let cached: Promise<XLSXModule> | null = null;

export function loadXLSX(): Promise<XLSXModule> {
  cached ??= import("xlsx-js-style").then((m) => ((m as unknown as { default?: XLSXModule }).default ?? m) as XLSXModule);
  return cached;
}
