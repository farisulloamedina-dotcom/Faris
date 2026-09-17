import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** Column span on the desktop 4-col grid, e.g. "md:col-span-2" */
  span?: string;
  noPadding?: boolean;
}

export default function BentoCard({ children, className, span, noPadding }: BentoCardProps) {
  return (
    <div
      className={cn(
        "glass-panel glass-panel-hover",
        !noPadding && "p-5 sm:p-6",
        span,
        className,
      )}
    >
      {children}
    </div>
  );
}
