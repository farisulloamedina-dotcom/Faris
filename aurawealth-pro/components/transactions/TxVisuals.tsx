import type { Transaction } from "@/lib/types";
import { BRAND, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/catalog";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

/** Icono de categoría coloreado para una transacción. */
const ICON_BY_CATEGORY = Object.fromEntries([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => [c.value, c.icon]));
const COLOR_BY_MACRO = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.color]));

export function TxIcon({ tx, size = 40 }: { tx: Transaction; size?: number }) {
  const key = tx.kind === "income" ? tx.category : tx.macro;
  const Icon = ICON_BY_CATEGORY[key] ?? ICON_BY_CATEGORY["Otros"];
  const color = tx.kind === "income" ? BRAND.emerald : (COLOR_BY_MACRO[key] ?? "#94A3B8");
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      style={{ width: size, height: size, background: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}22` }}
    >
      <Icon size={size * 0.45} strokeWidth={2.3} />
    </span>
  );
}

export const txTitle = (tx: Transaction) => (tx.kind === "income" ? tx.source || tx.category : tx.merchant || tx.micro);
export const txSubtitle = (tx: Transaction) => (tx.kind === "income" ? `${tx.category} · ${tx.method}` : `${tx.macro} › ${tx.micro}`);

const PRIORITY_TONE: Record<string, BadgeTone> = { Necesidad: "indigo", Gusto: "amber", Inversión: "emerald" };

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority] ?? "slate"} dot>
      {priority}
    </Badge>
  );
}
