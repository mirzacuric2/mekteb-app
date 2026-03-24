import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type TabOption = { key: string; label: ReactNode; icon?: LucideIcon };

type Props = {
  value: string;
  onChange: (value: string) => void;
  tabs: TabOption[];
  children: ReactNode;
};

export function Tabs({ value, onChange, tabs, children }: Props) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="border-b border-border">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
                value === tab.key
                  ? "border-primary text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    value === tab.key ? "text-primary" : "text-slate-400 group-hover:text-slate-500"
                  )}
                  aria-hidden
                />
              ) : null}
              {tab.label}
            </button>
          );
        })}
        </div>
      </div>
      {children}
    </div>
  );
}
