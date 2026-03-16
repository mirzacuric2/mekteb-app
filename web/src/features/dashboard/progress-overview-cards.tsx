import { ReactNode } from "react";
import { AlertTriangle, BookCheck, CalendarClock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { formatDateTime } from "../../lib/date-time";
import { HOMEWORK_STATUS } from "./progress-overview.constants";
import { useProgressOverview } from "./use-progress-overview";
import { LECTURE_STATUS } from "../reporting/reporting.constants";

type ProgressOverviewCardsProps = {
  enabled: boolean;
};

function ProgressMetricCard({
  title,
  value,
  helper,
  icon,
  tone,
  progress,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone: "neutral" | "success" | "primary" | "warning";
  progress?: number;
}) {
  const toneClass = {
    neutral: {
      shell: "from-slate-50 to-white border-slate-200",
      icon: "bg-slate-900/5 text-slate-700",
      bar: "bg-slate-400",
    },
    success: {
      shell: "from-emerald-50 to-white border-emerald-200",
      icon: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
    },
    primary: {
      shell: "from-sky-50 to-white border-sky-200",
      icon: "bg-sky-100 text-sky-700",
      bar: "bg-sky-500",
    },
    warning: {
      shell: "from-amber-50 to-white border-amber-200",
      icon: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500",
    },
  }[tone];

  return (
    <Card className={`min-w-0 rounded-xl border bg-gradient-to-br p-4 shadow-sm ${toneClass.shell}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneClass.icon}`}>{icon}</span>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full transition-all ${toneClass.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function ProgressOverviewCards({ enabled }: ProgressOverviewCardsProps) {
  const { t } = useTranslation();
  const metrics = useProgressOverview(enabled);
  const latestState = metrics.latestState;
  const attendanceRate = metrics.attendanceRate;
  const homeworkCompletionRate = metrics.homeworkCompletionRate;
  const presentInTrackedLessons = metrics.presentInTrackedLessons;
  const trackedLessons = metrics.trackedLessons;
  const attendanceScopeLabel = t("parentDashboardAllChildrenOption");
  const hasWarningState = metrics.childrenWithWarnings > 0;
  const hasHealthyState = !hasWarningState && metrics.activeChildrenCount > 0;
  const cardTone: "success" | "warning" = hasWarningState ? "warning" : "success";
  const cardAccentClasses = hasWarningState
    ? "border-amber-200 bg-amber-50/30"
    : "border-emerald-200 bg-emerald-50/30";
  const sortedChildSummaries = [...metrics.childSummaries].sort((a, b) => {
    const aWarning =
      a.latestState && (a.latestState.present === false || a.latestState.homeworkStatus === HOMEWORK_STATUS.PENDING)
        ? 1
        : 0;
    const bWarning =
      b.latestState && (b.latestState.present === false || b.latestState.homeworkStatus === HOMEWORK_STATUS.PENDING)
        ? 1
        : 0;
    if (aWarning !== bWarning) return bWarning - aWarning;
    return a.childName.localeCompare(b.childName);
  });
  const latestOverallStateLabel = metrics.childSummaries.some(
    (summary) =>
      summary.latestState?.present === false || summary.latestState?.homeworkStatus === HOMEWORK_STATUS.PENDING
  )
    ? t("parentDashboardStateNeedsAttention")
    : hasHealthyState
      ? t("parentDashboardStateOnTrack")
      : t("parentDashboardNoActivityFallback");

  if (!enabled) return null;

  if (metrics.isLoading) {
    return <p className="text-sm text-slate-500">{t("parentDashboardLoading")}</p>;
  }

  if (metrics.isError) {
    return <p className="text-sm text-slate-500">{t("parentDashboardUnavailable")}</p>;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t("parentDashboardTitle")}</h2>
        <p className="text-sm text-slate-600">{t("parentDashboardSubtitle")}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ProgressMetricCard
          title={t("parentDashboardAttendanceCardTitle")}
          value={`${attendanceRate}%`}
          helper={t("parentDashboardAttendanceCardHelper", {
            present: presentInTrackedLessons,
            total: metrics.scheduledLessons,
            tracked: trackedLessons,
            child: attendanceScopeLabel,
          })}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={cardTone}
          progress={attendanceRate}
        />
        <ProgressMetricCard
          title={t("parentDashboardHomeworkRateLabel")}
          value={`${homeworkCompletionRate}%`}
          helper={
            t("parentDashboardHomeworkRateHelper", {
              count: metrics.recentHomeworkRecords,
            })
          }
          icon={<BookCheck className="h-4 w-4" />}
          tone={cardTone}
          progress={homeworkCompletionRate}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ProgressMetricCard
          title={t("parentDashboardLatestStateCardTitle")}
          value={latestOverallStateLabel}
          helper={
            latestState
              ? t("parentDashboardLatestStateCardHelper", {
                  child: latestState.childName,
                  lecture: `${latestState.lectureTitle} (${latestState.lectureStatus === LECTURE_STATUS.COMPLETED ? t("activityReportStatusCompleted") : t("activityReportStatusDraft")})`,
                })
              : t("parentDashboardNoActivityFallback")
          }
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={cardTone}
        />
        <ProgressMetricCard
          title={t("parentDashboardChildrenLabel")}
          value={`${metrics.childrenCount}`}
          helper={t("parentDashboardChildrenSummaryHelper", {
            active: metrics.activeChildrenCount,
            warnings: metrics.childrenWithWarnings,
          })}
          icon={<Users className="h-4 w-4" />}
          tone={cardTone}
        />
      </div>

      {metrics.childSummaries.length ? (
        <Card
          className={`min-w-0 rounded-xl border bg-white p-4 shadow-sm ${cardAccentClasses}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{t("parentDashboardLatestStateDetailsTitle")}</p>
          </div>
          <div className="mt-3 space-y-2">
            {sortedChildSummaries.map((summary) => {
              const childState = summary.latestState;
              const childHomeworkLabel =
                childState?.homeworkStatus === HOMEWORK_STATUS.DONE
                  ? t("activityReportHomeworkDone")
                  : childState?.homeworkStatus === HOMEWORK_STATUS.PENDING
                    ? t("activityReportHomeworkNotDone")
                    : t("parentDashboardHomeworkUnknown");
              return (
                <div key={summary.childId} className="rounded-lg border border-border/70 bg-white/80 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{t("parentDashboardChildLabel", { child: summary.childName })}</p>
                    <p className="text-xs text-slate-500">
                      {childState ? formatDateTime(childState.occurredAt) : t("parentDashboardNoActivityFallback")}
                    </p>
                  </div>
                  {childState ? (
                    <>
                      <p className="mt-1 text-xs text-slate-500">{childState.lectureTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {childState.lectureStatus === LECTURE_STATUS.COMPLETED
                          ? t("activityReportStatusCompleted")
                          : t("activityReportStatusDraft")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("parentDashboardAttendanceChildHelper", {
                          present: summary.presentInTrackedLessons,
                          total: metrics.scheduledLessons,
                          tracked: summary.trackedLessons,
                        })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                          {childState.present ? t("activityReportPresent") : t("activityReportAbsent")}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">{childHomeworkLabel}</span>
                      </div>
                      {childState.comment ? (
                        <p className="mt-2 text-sm text-slate-600">{`${t("activityReportComment")}: ${childState.comment}`}</p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">{t("parentDashboardNoComment")}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">{t("parentDashboardNoChildActivity")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
