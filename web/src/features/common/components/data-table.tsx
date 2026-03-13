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
  scrollClassName = "overflow-x-auto",
  tableClassName = "min-w-full border-collapse text-sm",
}: DataTableProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-md border border-border", className)}>
      <div className={cn("w-full overflow-x-auto", scrollClassName)}>
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
