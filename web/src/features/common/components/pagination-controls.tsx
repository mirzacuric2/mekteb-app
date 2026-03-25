import { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import { PAGINATION_MAX_VISIBLE_PAGES } from "../use-pagination";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= PAGINATION_MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function PaginationControls({ page, totalPages, totalItems, onPageChange }: PaginationControlsProps) {
  const { t } = useTranslation();
  const pages = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pb-6 sm:pb-0">
      {totalItems != null ? (
        <span className="text-xs text-slate-500">{t("paginationTotal", { count: totalItems })}</span>
      ) : <span />}
      <nav aria-label={t("paginationNav")} className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-slate-500 transition-colors hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("paginationPrevious")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t("paginationPrevious")}</span>
        </button>

        {pages.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`e${idx}`} className="inline-flex h-8 w-8 items-center justify-center text-slate-400">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
                item === page
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-slate-500 transition-colors hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("paginationNext")}
        >
          <span className="hidden sm:inline">{t("paginationNext")}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
