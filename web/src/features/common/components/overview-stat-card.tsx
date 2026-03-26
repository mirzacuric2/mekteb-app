import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

export function OverviewStatCard({
  icon: Icon,
  label,
  value,
  subline,
  accentClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Smaller line under the value (e.g. completed / total). */
  subline?: ReactNode;
  accentClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            accentClassName
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex min-h-12 min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden py-0.5">
          <p
            className="line-clamp-1 text-[11px] font-semibold uppercase leading-none tracking-wide text-slate-500"
            title={label}
          >
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-slate-900">
            {value}
          </p>
          {subline ? <p className="text-xs tabular-nums leading-snug text-slate-500">{subline}</p> : null}
        </div>
      </div>
    </div>
  );
}
