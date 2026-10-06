"use client";

import { useRef, useState } from "react";
import { Database, Download, HardDrive, History, RotateCcw, Save, Settings2, Sparkles, Trash, Upload } from "lucide-react";
import type { CurrencyCode } from "@/lib/types";
import { CURRENCIES, currencyMeta } from "@/lib/constants/catalog";
import { createSnapshot, deleteSnapshot, listSnapshots, storageUsage, SCHEMA_VERSION, type Snapshot } from "@/lib/store/storage";
import { sanitizeAppData } from "@/lib/store/sanitize";
import { createSeedData, EMPTY_DATA } from "@/lib/store/seed";
import { useStore } from "@/lib/store/StoreProvider";
import { downloadBlob } from "@/lib/excel/export";
import { dateLabel, num, todayISO } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";

/* ------------------------------- Respaldos ------------------------------- */

export function BackupPanel() {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const [snaps, setSnaps] = useState<Snapshot[]>(() => listSnapshots());
  const [confirm, setConfirm] = useState<null | "demo" | "clear" | Snapshot>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => setSnaps(listSnapshots());
  const kb = num(storageUsage() / 1024, 1);

  function restore(s: Snapshot) {
    createSnapshot(data, "Antes de restaurar snapshot");
    dispatch({ type: "data/replace", payload: sanitizeAppData(s.data) });
    refresh();
    toast({ tone: "success", title: "Snapshot restaurado", description: new Date(s.savedAt).toLocaleString("es") });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ app: "AuraWealth Pro", version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    void downloadBlob(blob, `AuraWealth_Pro_Respaldo_${todayISO()}.json`).catch((e) => toast({ tone: "error", title: "No se pudo descargar", description: e instanceof Error ? e.message : "" }));
  }

  async function importJSON(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const clean = sanitizeAppData(parsed.data ?? parsed);
      createSnapshot(data, `Antes de importar «${file.name}»`);
      dispatch({ type: "data/replace", payload: clean });
      refresh();
      toast({ tone: "success", title: "Respaldo JSON restaurado", description: `${clean.transactions.length} movimientos cargados.` });
    } catch (e) {
      toast({ tone: "error", title: "Respaldo inválido", description: e instanceof Error ? e.message : "No se pudo leer el archivo" });
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card hover={false} className="p-5">
        <CardHeader
          title="Snapshots locales"
          subtitle="Puntos de restauración automáticos (cada 30 min) y manuales"
          icon={History}
          tone="cobalt"
          action={
            <Button
              size="sm"
              variant="soft"
              icon={Save}
              onClick={() => {
                createSnapshot(data, "Manual");
                refresh();
                toast({ tone: "success", title: "Snapshot creado" });
              }}
            >
              Crear ahora
            </Button>
          }
        />
        <ul className="mt-4 space-y-2">
          {snaps.length === 0 && <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aún no hay snapshots.</li>}
          {snaps.map((s) => (
            <li key={s.id} className="group flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100 transition hover:shadow-card">
              <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Database size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{s.reason}</p>
                <p className="text-[11px] text-slate-400">
                  {dateLabel(s.savedAt.slice(0, 10))} {new Date(s.savedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · {s.counts.transactions} mov. · {s.counts.debts} deudas · {s.counts.goals} metas
                </p>
              </div>
              <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setConfirm(s)}>
                Restaurar
              </Button>
              <button
                onClick={() => {
                  deleteSnapshot(s.id);
                  refresh();
                }}
                className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                aria-label="Eliminar snapshot"
              >
                <Trash size={14} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card hover={false} className="p-5">
          <CardHeader title="Respaldo completo (JSON)" subtitle="Copia exacta de la base de datos, ideal para mover entre navegadores" icon={HardDrive} tone="indigo" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" icon={Download} onClick={exportJSON}>
              Descargar JSON
            </Button>
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
              Restaurar JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (void importJSON(e.target.files?.[0]), (e.target.value = ""))} />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Almacenamiento local usado: <b className="text-slate-600">{kb} KB</b> · Esquema v{SCHEMA_VERSION} · Los datos nunca salen de tu navegador.
          </p>
        </Card>
        <Card hover={false} className="border-rose-100 p-5">
          <CardHeader title="Zona de datos" subtitle="Acciones de reinicio (se crea un snapshot antes)" icon={Trash} tone="rose" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" icon={Sparkles} onClick={() => setConfirm("demo")}>
              Cargar datos de demostración
            </Button>
            <Button variant="danger" icon={Trash} onClick={() => setConfirm("clear")}>
              Empezar en blanco
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        tone={confirm === "clear" ? "danger" : "primary"}
        confirmLabel={confirm === "clear" ? "Borrar todo" : confirm === "demo" ? "Cargar demo" : "Restaurar"}
        title={confirm === "clear" ? "¿Borrar todos los datos?" : confirm === "demo" ? "¿Reemplazar con datos de demostración?" : "¿Restaurar este snapshot?"}
        description="Tus datos actuales se guardarán primero en un snapshot, así que podrás recuperarlos."
        onConfirm={() => {
          if (confirm === "clear" || confirm === "demo") {
            createSnapshot(data, confirm === "clear" ? "Antes de borrar todo" : "Antes de cargar demo");
            dispatch({ type: "data/replace", payload: confirm === "clear" ? { ...EMPTY_DATA, settings: { ...data.settings } } : createSeedData() });
            refresh();
            toast({ tone: "info", title: confirm === "clear" ? "Base de datos vacía" : "Datos de demostración cargados" });
          } else if (confirm) restore(confirm);
        }}
      />
    </div>
  );
}

/* ------------------------------ Preferencias ----------------------------- */

export function PreferencesPanel() {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const s = data.settings;
  const [f, setF] = useState({ userName: s.userName, currency: s.currency, openingBalance: String(s.openingBalance), monthlyBudget: String(s.monthlyBudget), savingsTarget: String(s.savingsTarget) });

  return (
    <Card hover={false} className="max-w-3xl p-5">
      <CardHeader title="Preferencias de la cuenta" subtitle="Se exportan en la hoja «Configuración»" icon={Settings2} />
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: "settings/update",
            payload: {
              userName: f.userName.trim(),
              currency: f.currency as CurrencyCode,
              openingBalance: parseFloat(f.openingBalance) || 0,
              monthlyBudget: Math.max(0, parseFloat(f.monthlyBudget) || 0),
              savingsTarget: Math.min(100, Math.max(0, parseFloat(f.savingsTarget) || 0)),
            },
          });
          toast({ tone: "success", title: "Preferencias guardadas" });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del titular">
            <Input value={f.userName} onChange={(e) => setF({ ...f, userName: e.target.value })} placeholder="Tu nombre" />
          </Field>
          <Field label="Moneda">
            <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as CurrencyCode })}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label} ({c.symbol})
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Saldo inicial de liquidez" hint="Dinero disponible antes del primer registro">
            <MoneyInput symbol={currencyMeta(f.currency as CurrencyCode).symbol} value={f.openingBalance} min={undefined} onChange={(e) => setF({ ...f, openingBalance: e.target.value })} />
          </Field>
          <Field label="Presupuesto mensual" hint="0 = sin presupuesto">
            <MoneyInput symbol={currencyMeta(f.currency as CurrencyCode).symbol} value={f.monthlyBudget} onChange={(e) => setF({ ...f, monthlyBudget: e.target.value })} />
          </Field>
          <Field label="Tasa de ahorro objetivo (%)">
            <Input type="number" min="0" max="100" value={f.savingsTarget} onChange={(e) => setF({ ...f, savingsTarget: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" icon={Save}>
            Guardar preferencias
          </Button>
        </div>
      </form>
    </Card>
  );
}
