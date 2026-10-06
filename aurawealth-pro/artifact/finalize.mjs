/**
 * Convierte dist-artifact/index.html al formato de página de artefacto:
 * sin <!doctype>/<html>/<head>/<body> propios (el visor los añade);
 * <title>, fuentes y estilos primero, luego el contenido y el script.
 * Se extrae por posiciones (no por regex sobre <head>) porque el JS en línea
 * puede contener cadenas como "</head>".
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist-artifact");
const html = readFileSync(path.join(dir, "index.html"), "utf8");

const take = (open, close) => {
  const s = html.indexOf(open);
  if (s < 0) return "";
  const e = html.indexOf(close, s);
  return html.slice(s, e + close.length);
};

const title = take("<title>", "</title>");
const links = [...html.slice(0, html.indexOf("<script")).matchAll(/<link [^>]*>/gi)].map((m) => m[0]).join("\n");
const script = take("<script type=\"module\"", "</script>");
const style = take("<style rel=\"stylesheet\"", "</style>").replace(/ rel="stylesheet"| crossorigin/g, "");
const root = take("<div id=\"root\"", "</div>");
if (!script || !style || !root) throw new Error("No se encontraron script/estilos/raíz en la salida de Vite");

// El visor rechaza U+FFFD literal (lo trata como texto dañado); en el JS se escribe como escape equivalente.
const safeScript = script.replace(" crossorigin", "").replace(/\uFFFD/g, "\\uFFFD");
const out = [title, links, style, root, safeScript].join("\n");
const file = path.join(dir, "aurawealth-pro.html");
writeFileSync(file, out);
console.log(`${file} · ${(out.length / 1024 / 1024).toFixed(2)} MB`);
