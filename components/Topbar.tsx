import { Bell, Search } from "lucide-react";
import ExportButton from "./ExportButton";

export default function Topbar() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-slate-400">Buenas tardes,</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Bienvenido de vuelta 👋
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-400 md:flex">
          <Search size={15} />
          <span>Buscar movimientos…</span>
        </div>
        <button
          aria-label="Notificaciones"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08]"
        >
          <Bell size={17} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent-coral" />
        </button>
        <ExportButton />
      </div>
    </header>
  );
}
