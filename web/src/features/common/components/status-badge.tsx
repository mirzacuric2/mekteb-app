import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";

type Props = {
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation();
  const normalized = status.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        normalized === "active"
          ? "bg-emerald-100 text-emerald-700"
          : normalized === "pending"
            ? "bg-amber-100 text-amber-800"
            : "bg-slate-200 text-slate-700",
        className
      )}
    >
      {normalized === "active" ? t("active") : normalized === "pending" ? t("pending") : t("inactive")}
    </span>
  );
}
