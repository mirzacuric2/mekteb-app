import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={page === 1}
        className="gap-1.5"
        aria-label={t("paginationPrevious")}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t("paginationPrevious")}</span>
      </Button>
      <span className="text-sm text-slate-600">
        {t("paginationPageOf", { page, total: totalPages })}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={page === totalPages}
        className="gap-1.5"
        aria-label={t("paginationNext")}
        onClick={() => onPageChange(page + 1)}
      >
        <span>{t("paginationNext")}</span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </Button>
    </div>
  );
}
