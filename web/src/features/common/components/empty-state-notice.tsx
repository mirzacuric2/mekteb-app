import { ReactNode } from "react";
import { cn } from "../../../lib/utils";

type EmptyStateNoticeProps = {
  children: ReactNode;
  className?: string;
};

export function EmptyStateNotice({ children, className }: EmptyStateNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-border px-3 py-4 text-sm text-slate-500",
        className
      )}
    >
      {children}
    </div>
  );
}
