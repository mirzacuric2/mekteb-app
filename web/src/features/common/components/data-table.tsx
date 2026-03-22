import { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

export const DATA_TABLE_BODY_DENSITY = {
  COMPACT: "compact",
  COMFORTABLE: "comfortable",
  SPACIOUS: "spacious",
} as const;

export type DataTableBodyDensity = (typeof DATA_TABLE_BODY_DENSITY)[keyof typeof DATA_TABLE_BODY_DENSITY];

const DATA_TABLE_HEAD_BASE_CLASSNAME =
  "bg-slate-100 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:align-middle [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-slate-600";

const BODY_DENSITY_HEAD_PX_CLASSNAME: Record<DataTableBodyDensity, string> = {
  [DATA_TABLE_BODY_DENSITY.COMPACT]: "[&_th]:px-3",
  [DATA_TABLE_BODY_DENSITY.COMFORTABLE]: "[&_th]:px-4",
  [DATA_TABLE_BODY_DENSITY.SPACIOUS]: "[&_th]:px-5",
};

const BODY_DENSITY_TBODY_CLASSNAME: Record<DataTableBodyDensity, string> = {
  [DATA_TABLE_BODY_DENSITY.COMPACT]: "[&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_td]:text-left",
  [DATA_TABLE_BODY_DENSITY.COMFORTABLE]: "[&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle [&_td]:text-left",
  [DATA_TABLE_BODY_DENSITY.SPACIOUS]: "[&_td]:px-5 [&_td]:py-2.5 [&_td]:align-middle [&_td]:text-left",
};

type DataTableProps = {
  headers: ReactNode;
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
  colgroup?: ReactNode;
  bodyDensity?: DataTableBodyDensity;
};

export function DataTable({
  headers,
  children,
  className,
  scrollClassName = "overflow-x-auto overflow-y-hidden",
  tableClassName = "min-w-full border-collapse text-sm",
  colgroup,
  bodyDensity = DATA_TABLE_BODY_DENSITY.COMPACT,
}: DataTableProps) {
  return (
    <div className={cn("min-w-0 w-full max-w-full overflow-hidden rounded-md border border-border", className)}>
      <div className={cn("min-w-0 w-full max-w-full overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain]", scrollClassName)}>
        <table className={cn("text-left", tableClassName)}>
          {colgroup}
          <thead className={cn(DATA_TABLE_HEAD_BASE_CLASSNAME, BODY_DENSITY_HEAD_PX_CLASSNAME[bodyDensity])}>
            <tr>{headers}</tr>
          </thead>
          <tbody className={BODY_DENSITY_TBODY_CLASSNAME[bodyDensity]}>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
