import { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

type DataTableProps = {
  headers: ReactNode;
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
};

export function DataTable({
  headers,
  children,
  className,
  scrollClassName = "overflow-x-auto overflow-y-hidden",
  tableClassName = "min-w-full border-collapse text-sm",
}: DataTableProps) {
  return (
    <div className={cn("min-w-0 w-full max-w-full overflow-hidden rounded-md border border-border", className)}>
      <div className={cn("min-w-0 w-full max-w-full overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain]", scrollClassName)}>
        <table className={cn(tableClassName)}>
          <thead className="bg-slate-100 text-left">
            <tr>{headers}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
