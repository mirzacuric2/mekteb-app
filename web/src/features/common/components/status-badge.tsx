import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";

const STATUS_BADGE_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-800",
  DONE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  DISCONTINUED: "bg-amber-100 text-amber-800",
  DRAFT: "bg-amber-100 text-amber-800",
  NOT_RECORDED: "bg-slate-100 text-slate-700",
  INACTIVE: "bg-slate-200 text-slate-700",
};

const STATUS_BADGE_LABEL_KEY: Record<string, string> = {
  ACTIVE: "active",
  PENDING: "pending",
  COMPLETED: "completed",
  DISCONTINUED: "discontinued",
  DRAFT: "activityReportStatusDraft",
  INACTIVE: "inactive",
};

type StatusBadgeProps = {
  status: string;
  labelKey?: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, labelKey, label, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const normalizedStatus = status.toUpperCase();
  const badgeClassName = STATUS_BADGE_STYLE[normalizedStatus] || STATUS_BADGE_STYLE.INACTIVE;
  const translatedLabelKey = labelKey || STATUS_BADGE_LABEL_KEY[normalizedStatus];
  const resolvedLabel = label ?? (translatedLabelKey ? t(translatedLabelKey) : status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        badgeClassName,
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}
