import { ReactNode, useEffect, useMemo } from "react";
import { BookCheck, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { useProgressOverview } from "./use-progress-overview";
import { ProgressChildDetailsDrawer } from "./progress-child-details-drawer";
import { CHILD_DRAWER_TAB } from "./child-drawer-tab.constants";

type ProgressOverviewCardsProps = {
  enabled: boolean;
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

export function ProgressOverviewCards({ enabled }: ProgressOverviewCardsProps) {
  const { t } = useTranslation();
  const metrics = useProgressOverview(enabled);
  const [searchParams, setSearchParams] = useSearchParams();
  const childIdFromUrl = searchParams.get("childId");
  const sortedChildSummaries = [...metrics.childSummaries].sort((a, b) => {
    if (a.hasPerformanceRecords !== b.hasPerformanceRecords) return a.hasPerformanceRecords ? -1 : 1;
    if (a.pendingHomeworkCount !== b.pendingHomeworkCount) return b.pendingHomeworkCount - a.pendingHomeworkCount;
    if (a.overallProgressRate !== b.overallProgressRate) return a.overallProgressRate - b.overallProgressRate;
    return a.childName.localeCompare(b.childName, undefined, { sensitivity: "base" });
  });
  const selectedChild = useMemo(
    () => (childIdFromUrl ? metrics.children.find((child) => child.id === childIdFromUrl) || null : null),
    [metrics.children, childIdFromUrl]
  );
  const selectedSummary = useMemo(
    () => (childIdFromUrl ? metrics.childSummaries.find((summary) => summary.childId === childIdFromUrl) || null : null),
    [metrics.childSummaries, childIdFromUrl]
  );

  useEffect(() => {
    if (!enabled || metrics.isLoading || metrics.isError || !childIdFromUrl) return;
    if (metrics.children.some((c) => c.id === childIdFromUrl)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("childId");
        next.delete("tab");
        return next;
      },
      { replace: true }
    );
  }, [childIdFromUrl, enabled, metrics.children, metrics.isError, metrics.isLoading, setSearchParams]);

  const openChildDrawer = (childId: string, tab: (typeof CHILD_DRAWER_TAB)[keyof typeof CHILD_DRAWER_TAB]) => {
    const next = new URLSearchParams(searchParams);
    next.set("childId", childId);
    if (tab === CHILD_DRAWER_TAB.BASIC_INFO) {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  const closeChildDrawer = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("childId");
    next.delete("tab");
    setSearchParams(next, { replace: true });
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
                  onClick={() => openChildDrawer(summary.childId, CHILD_DRAWER_TAB.LECTURE_PROGRESS)}
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
                    onClick={() => openChildDrawer(summary.childId, CHILD_DRAWER_TAB.HOMEWORK_PROGRESS)}
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
      <ProgressChildDetailsDrawer
        open={Boolean(childIdFromUrl)}
        isLoading={Boolean(childIdFromUrl && !selectedChild && metrics.isLoading)}
        onOpenChange={(open) => {
          if (!open) closeChildDrawer();
        }}
        child={selectedChild}
        summary={selectedSummary}
        scheduledLessons={metrics.scheduledLessons}
        childrenFetchMineOnly
      />
    </section>
  );
}
