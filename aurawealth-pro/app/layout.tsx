import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-serif-display", display: "swap" });

export const metadata: Metadata = {
  title: "AuraWealth Pro — Finanzas personales",
  description: "Plataforma de finanzas personales local-first con analítica avanzada y motor Excel bidireccional.",
};

export const viewport: Viewport = {
  themeColor: "#2B3F6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plex.variable} ${serif.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
