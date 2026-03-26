import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LESSON_PROGRAM,
  LESSON_PROGRAM_I18N_KEY,
  LESSON_PROGRAM_ORDER,
  LESSON_NIVO_LABEL,
  type LessonProgram,
  type LessonNivo,
} from "../lessons/constants";

export type CommunityProgramFilter = LessonProgram | "ALL";

export type ProgressByNivoRow = {
  nivo: LessonNivo;
  children: number;
  withRecords: number;
  withoutRecords: number;
  averageAttendance: number | null;
  needsAttention: number;
};

type CommunityProgressByNivoSectionProps = {
  rows: ProgressByNivoRow[];
  programFilter: CommunityProgramFilter;
  onProgramFilterChange: (value: CommunityProgramFilter) => void;
};

function toRowStatus(row: ProgressByNivoRow): "good" | "watch" | "no_data" {
  if (!row.children || row.withRecords === 0) return "no_data";
  if (row.needsAttention > 0) return "watch";
  return "good";
}

export function CommunityProgressByNivoSection({
  rows,
  programFilter,
  onProgramFilterChange,
}: CommunityProgressByNivoSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-3 flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Activity className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{t("communityOverviewProgressByNivoTitle")}</p>
          <p className="text-xs text-slate-500">{t("communityOverviewProgressByNivoSubtitle")}</p>
        </div>
      </div>
      <div className="mb-3">
        <div>
          <p className="mb-1 block text-xs font-medium text-slate-600">{t("communityOverviewProgressProgramFilterLabel")}</p>
          <div
            role="radiogroup"
            aria-label={t("communityOverviewProgressProgramFilterLabel")}
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          >
            {(["ALL", ...LESSON_PROGRAM_ORDER] as const).map((value) => {
              const isSelected = programFilter === value;
              const label =
                value === "ALL" ? t("communityOverviewProgressProgramAll") : t(LESSON_PROGRAM_I18N_KEY[value]);
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`w-full rounded-md border px-3 py-1.5 text-sm transition-colors sm:w-auto ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => onProgramFilterChange(value)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const rowStatus = toRowStatus(row);
          const statusClassName =
            rowStatus === "good"
              ? "bg-emerald-100 text-emerald-700"
              : rowStatus === "watch"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600";
          const statusLabel =
            rowStatus === "good"
              ? t("communityOverviewStatusGood")
              : rowStatus === "watch"
                ? t("communityOverviewStatusWatch")
                : t("communityOverviewStatusNoData");

          return (
            <div
              key={row.nivo}
              className={`rounded-md border border-border p-3 ${
                row.children === 0 ? "bg-slate-50/70" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <p className="text-base font-semibold text-slate-800">{LESSON_NIVO_LABEL[row.nivo]}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClassName}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p className="text-slate-600">
                  {t("communityOverviewChildrenLabel")}:{" "}
                  <span className="font-medium text-slate-900">{row.children}</span>
                </p>
                <p className="text-slate-600">
                  {t("communityOverviewRecordedCoverageLabel")}:{" "}
                  <span className="font-medium text-slate-900">{`${row.withRecords}/${row.children}`}</span>
                </p>
                <p className="text-slate-600">
                  {t("communityOverviewAttendanceLabel")}:{" "}
                  <span className="font-medium text-slate-900">
                    {row.averageAttendance === null ? "-" : `${row.averageAttendance}%`}
                  </span>
                </p>
              </div>
              {row.withoutRecords > 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {t("communityOverviewNoRecordsLabel")}: {row.withoutRecords}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
