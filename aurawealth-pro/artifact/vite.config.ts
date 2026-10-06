/**
 * Compilación alternativa de un solo archivo HTML (todo el JS/CSS en línea),
 * pensada para publicarse como artefacto en claude.ai. Reutiliza los mismos
 * componentes de la app Next.js; solo cambia el enrutado (ver ./router.ts).
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, "..");

export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), tailwind(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.join(here, "shims/link.tsx") },
      { find: "next/navigation", replacement: path.join(here, "shims/navigation.ts") },
      { find: /^@\/(.*)$/, replacement: `${project}/$1` },
    ],
  },
  build: {
    outDir: path.join(project, "dist-artifact"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4096,
  },
  logLevel: "warn",
});
