import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconTile, type Tone } from "./Card";

export function EmptyState({ icon, title, description, action, tone = "indigo" }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; tone?: Tone }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-12 text-center">
      <div className="animate-float">
        <IconTile icon={icon} tone={tone} size="lg" />
      </div>
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
