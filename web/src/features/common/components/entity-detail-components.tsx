import { ReactNode } from "react";

type EntityDetailSectionProps = {
  title?: string;
  children: ReactNode;
};

export function EntityDetailSection({ title, children }: EntityDetailSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      {title ? <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4> : null}
      {children}
    </section>
  );
}

type EntityDetailTableProps = {
  children: ReactNode;
};

export function EntityDetailTable({ children }: EntityDetailTableProps) {
  return <div className="overflow-hidden rounded-md border border-border divide-y divide-border">{children}</div>;
}

type EntityDetailTableRowProps = {
  label: string;
  value: ReactNode;
};

export function EntityDetailTableRow({ label, value }: EntityDetailTableRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[40%_60%] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

type EntityDetailGridProps = {
  children: ReactNode;
  columns?: 1 | 2;
  compact?: boolean;
};

export function EntityDetailGrid({ children, columns = 2, compact = false }: EntityDetailGridProps) {
  const columnsClass = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  const gapClass = compact ? "gap-2" : "gap-3";
  return <div className={`grid grid-cols-1 ${gapClass} ${columnsClass}`}>{children}</div>;
}

type EntityDetailItemProps = {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
  inline?: boolean;
  bordered?: boolean;
};

export function EntityDetailItem({
  label,
  value,
  fullWidth = false,
  inline = false,
  bordered = false,
}: EntityDetailItemProps) {
  return (
    <div
      className={`${fullWidth ? "md:col-span-2" : ""} ${
        bordered ? "border border-border px-4 py-3" : "space-y-1"
      }`}
    >
      {inline ? (
        <div className="flex items-center gap-4">
          <p className="w-[44%] text-sm font-medium text-slate-500">{label}</p>
          <div className="w-[56%] text-sm font-medium text-slate-900">{value}</div>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <div className="text-sm text-slate-900">{value}</div>
        </>
      )}
    </div>
  );
}
