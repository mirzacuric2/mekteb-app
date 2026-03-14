import { ReactNode } from "react";
import { cn } from "../../lib/utils";

type TabOption = { key: string; label: ReactNode };

type Props = {
  value: string;
  onChange: (value: string) => void;
  tabs: TabOption[];
  children: ReactNode;
};

export function Tabs({ value, onChange, tabs, children }: Props) {
  return (
    <div className="space-y-4">
      <div className="border-b border-border">
        <div className="flex flex-wrap gap-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors",
              value === tab.key
                ? "border-primary text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>
      {children}
    </div>
  );
}
