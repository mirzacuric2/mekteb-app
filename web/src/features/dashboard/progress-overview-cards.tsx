import { ReactNode } from "react";
import { BookCheck, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { LESSON_PROGRAM, LESSON_PROGRAM_I18N_KEY } from "../lessons/constants";
import { useProgressOverview } from "./use-progress-overview";
import {
  CHILD_DRAWER_TAB,
  CHILD_DRAWER_TAB_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
  type ChildDrawerTab,
} from "./child-drawer-tab.constants";
import { childDetailPagePath } from "../children/child-paths";

type ProgressOverviewCardsProps = {
  enabled: boolean;
  /** Dashboard: open child quick-view drawer via URL instead of navigating away. */
  onOpenChildInDrawer?: (childId: string, tab: ChildDrawerTab) => void;
};

type ProgressTone = "orange" | "yellow" | "green";

function toProgressTone(rate: number): ProgressTone {
  if (rate >= 75) return "green";
  if (rate >= 45) return "yellow";
  return "orange";
}

function ProgressMetricCard({
  title,
  value,
  helper,
  icon,
  tone,
  progress,
  children,
}: {
  title: string;
  value: string;
  helper?: ReactNode;
  icon: ReactNode;
  tone: ProgressTone;
  progress?: number;
  children?: ReactNode;
}) {
  const toneClass = {
    green: {
      shell: "from-emerald-50 to-white border-emerald-200",
      icon: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
    },
    yellow: {
      shell: "from-amber-50 to-white border-amber-200",
      icon: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500",
    },
    orange: {
      shell: "from-orange-50 to-white border-orange-200",
      icon: "bg-orange-100 text-orange-700",
      bar: "bg-orange-500",
    },
  }[tone];

  return (
    <Card className={`flex h-full min-w-0 flex-col rounded-xl border bg-gradient-to-br p-3 shadow-sm ${toneClass.shell}`}>
      <div className="flex min-h-[64px] items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {helper ? <div className="text-xs text-slate-500">{helper}</div> : null}
        </div>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneClass.icon}`}>{icon}</span>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full transition-all ${toneClass.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      ) : null}
      {children ? <div className="mt-2 flex-1 border-t border-slate-200/70 pt-2">{children}</div> : null}
    </Card>
  );
}

export function ProgressOverviewCards({ enabled, onOpenChildInDrawer }: ProgressOverviewCardsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const metrics = useProgressOverview(enabled);
  const sortedChildSummaries = [...metrics.childSummaries].sort((a, b) => {
    if (a.hasPerformanceRecords !== b.hasPerformanceRecords) return a.hasPerformanceRecords ? -1 : 1;
    if (a.pendingHomeworkCount !== b.pendingHomeworkCount) return b.pendingHomeworkCount - a.pendingHomeworkCount;
    if (a.overallProgressRate !== b.overallProgressRate) return b.overallProgressRate - a.overallProgressRate;
    return a.childName.localeCompare(b.childName, undefined, { sensitivity: "base" });
  });

  const openChildDetail = (childId: string, tab: ChildDrawerTab) => {
    if (onOpenChildInDrawer) {
      onOpenChildInDrawer(childId, tab);
      return;
    }
    const query =
      tab === DEFAULT_CHILD_DRAWER_TAB ? "" : `?${CHILD_DRAWER_TAB_QUERY_KEY}=${encodeURIComponent(tab)}`;
    navigate(`${childDetailPagePath(childId)}${query}`);
  };

  if (!enabled) return null;

  if (metrics.isLoading) {
    return <p className="text-sm text-slate-500">{t("parentDashboardLoading")}</p>;
  }

  if (metrics.isError) {
    return <p className="text-sm text-slate-500">{t("parentDashboardUnavailable")}</p>;
  }

  const progressTone = toProgressTone(metrics.overallProgressRate);
  const homeworkTone = toProgressTone(metrics.homeworkCompletionRate);
  const detailsFallback = (
    <p className="rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-500">
      {t("parentDashboardNoChildActivity")}
    </p>
  );
  const showSufaraCard = metrics.enrolledProgramCounts[LESSON_PROGRAM.SUFARA] > 0;
  const showQuranCard = metrics.enrolledProgramCounts[LESSON_PROGRAM.QURAN] > 0;
  const visibleProgramCards = [showSufaraCard, showQuranCard].filter(Boolean).length;

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <ProgressMetricCard
          title={t("parentDashboardOverallProgressCardTitle")}
          value={`${metrics.overallProgressRate}%`}
          icon={<BookOpen className="h-4 w-4" />}
          tone={progressTone}
          progress={metrics.overallProgressRate}
        >
          {sortedChildSummaries.length ? (
            <div className="space-y-2">
              {sortedChildSummaries.map((summary) => (
                <button
                  key={`overall-${summary.childId}`}
                  type="button"
                  className="w-full rounded-md border border-slate-200 bg-white/70 p-1.5 text-left transition-colors hover:bg-white"
                  onClick={() => openChildDetail(summary.childId, CHILD_DRAWER_TAB.LECTURE_PROGRESS)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{summary.childName}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {summary.hasPerformanceRecords ? `${summary.overallProgressRate}%` : t("parentDashboardNoRecordsLabel")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {summary.hasPerformanceRecords
                      ? t("parentDashboardChildPerformanceCompactLine", {
                          attendance: summary.attendanceRate,
                          completed: summary.completedLecturesCount,
                          reported: summary.reportedLecturesCount,
                        })
                      : t("parentDashboardNoActivityFallback")}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            detailsFallback
          )}
        </ProgressMetricCard>
        <ProgressMetricCard
          title={t("parentDashboardHomeworkRateLabel")}
          value={`${metrics.homeworkCompletionRate}%`}
          icon={<BookCheck className="h-4 w-4" />}
          tone={homeworkTone}
          progress={metrics.homeworkCompletionRate}
        >
          {sortedChildSummaries.length ? (
            <div className="space-y-2">
              {sortedChildSummaries.map((summary) => {
                const hasTrackedHomework = summary.reportedHomeworkCount > 0;
                const hasPendingHomework = summary.pendingHomeworkCount > 0;
                const childHomeworkSubline = hasTrackedHomework
                  ? t("parentDashboardChildHomeworkDoneCompactLine", {
                      done: summary.homeworkDoneCount,
                      known: summary.reportedHomeworkCount,
                    })
                  : t("parentDashboardHomeworkUnknown");
                return (
                  <button
                    key={`homework-${summary.childId}`}
                    type="button"
                    className="w-full rounded-md border border-slate-200 bg-white/70 p-1.5 text-left transition-colors hover:bg-white"
                    onClick={() => openChildDetail(summary.childId, CHILD_DRAWER_TAB.HOMEWORK_PROGRESS)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{summary.childName}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          !hasTrackedHomework
                            ? "bg-slate-100 text-slate-700"
                            : hasPendingHomework
                              ? "bg-orange-100 text-orange-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {!hasTrackedHomework
                          ? t("parentDashboardNoRecordsLabel")
                          : hasPendingHomework
                            ? t("parentDashboardPendingCompactLabel", { count: summary.pendingHomeworkCount })
                            : t("homeworkQueueDoneLabel")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{childHomeworkSubline}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            detailsFallback
          )}
        </ProgressMetricCard>
      </div>
      {visibleProgramCards > 0 ? (
        <div className={`grid gap-3 ${visibleProgramCards > 1 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {showSufaraCard ? (
            <ProgressMetricCard
              title={`${t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.SUFARA])} ${t("parentDashboardOverallProgressCardTitle").toLowerCase()}`}
              value={`${metrics.programProgress[LESSON_PROGRAM.SUFARA].overallProgressRate}%`}
              icon={<BookOpen className="h-4 w-4" />}
              tone={toProgressTone(metrics.programProgress[LESSON_PROGRAM.SUFARA].overallProgressRate)}
              progress={metrics.programProgress[LESSON_PROGRAM.SUFARA].overallProgressRate}
            />
          ) : null}
          {showQuranCard ? (
            <ProgressMetricCard
              title={`${t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.QURAN])} ${t("parentDashboardOverallProgressCardTitle").toLowerCase()}`}
              value={`${metrics.programProgress[LESSON_PROGRAM.QURAN].overallProgressRate}%`}
              icon={<BookCheck className="h-4 w-4" />}
              tone={toProgressTone(metrics.programProgress[LESSON_PROGRAM.QURAN].overallProgressRate)}
              progress={metrics.programProgress[LESSON_PROGRAM.QURAN].overallProgressRate}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
