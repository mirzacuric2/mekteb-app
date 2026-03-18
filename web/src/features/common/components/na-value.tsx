import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";

type Props = {
  value?: ReactNode | null;
  className?: string;
  naClassName?: string;
};

function hasValue(value?: ReactNode | null) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function NaValue({ value, className, naClassName }: Props) {
  const { t } = useTranslation();

  if (!hasValue(value)) {
    return <span className={cn("text-slate-300", naClassName)}>{t("na")}</span>;
  }

  return <span className={className}>{value}</span>;
}
