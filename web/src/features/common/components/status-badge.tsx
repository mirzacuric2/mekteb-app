import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";

type Props = {
  isActive: boolean;
  className?: string;
};

export function StatusBadge({ isActive, className }: Props) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-700",
        className
      )}
    >
      {isActive ? t("active") : t("inactive")}
    </span>
  );
}
