import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, Check, Circle, Clock3, MessageSquare, XCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ChildLessonOutcome, ChildRecord } from "../children/types";
import { MESSAGE_CONTEXT_TYPE, MessageContextDraft } from "../messages/types";
import { formatDateTime } from "../../lib/date-time";
import { isLessonActivityReadyForPassedOutcome, lessonRollupHasDraftReports } from "./lesson-activity-readiness";
import { isPersistedLessonOutcomeKey } from "./progress-lesson-outcome.constants";
import { ProgressLessonOutcomeGrading } from "./progress-lesson-outcome-grading";

export type LectureProgressLessonItem = {
  key: string;
  title: string;
  reports: number;
  completedReports: number;
  presentReports: number;
  knownHomeworkReports: number;
  homeworkDoneReports: number;
  comments: string[];
  lastReportedAt: string | null;
};

type LectureProgressLessonCardProps = {
  item: LectureProgressLessonItem;
  index: number;
  totalItems: number;
  child: ChildRecord;
  outcome: ChildLessonOutcome | undefined;
  canMessageImam: boolean;
  canSetChildLessonOutcomes: boolean;
  openImamChat: (context: MessageContextDraft) => void;
};

export function LectureProgressLessonCard({
  item,
  index,
  totalItems,
  child,
  outcome,
  canMessageImam,
  canSetChildLessonOutcomes,
  openImamChat,
}: LectureProgressLessonCardProps) {
  const { t } = useTranslation();
  const isComplete = item.reports > 0 && item.completedReports === item.reports;
  const isInProgress = item.reports > 0 && item.completedReports < item.reports;
  const hasHomeworkPending =
    item.knownHomeworkReports > 0 && item.homeworkDoneReports < item.knownHomeworkReports;

  const attendanceRate = item.reports > 0 ? item.presentReports / item.reports : 1;
  const attendanceBelowHalf = item.reports > 0 && attendanceRate < 0.5;

  const activityStatusLabel = isComplete
    ? hasHomeworkPending
      ? t("parentDashboardLectureStateCompletedHomeworkPending")
      : t("parentDashboardLectureStateCompletedAllDone")
    : isInProgress
      ? t("parentDashboardLectureStateInProgress")
      : t("parentDashboardLectureStateNotStarted");

  const imamPassed = outcome?.passed;
  const imamMarkedComplete = imamPassed === true;
  const statusLabel = imamMarkedComplete
    ? t("lessonOutcomePassed")
    : imamPassed === false
      ? t("lessonOutcomeNotPassed")
      : activityStatusLabel;

  const showGreenPass = imamMarkedComplete;
  const showNotPassed = imamPassed === false;
  const activityReportsFullyDone = isLessonActivityReadyForPassedOutcome({
    reports: item.reports,
    completedReports: item.completedReports,
    presentReports: item.presentReports,
    knownHomeworkReports: item.knownHomeworkReports,
    homeworkDoneReports: item.homeworkDoneReports,
  });
  const lessonOutcomeGradingAllowedNoDrafts =
    item.reports > 0 &&
    !lessonRollupHasDraftReports({
      reports: item.reports,
      completedReports: item.completedReports,
    });
  const softImamNotPassed = showNotPassed && activityReportsFullyDone;
  const hardImamNotPassed = showNotPassed && !softImamNotPassed;
  const showActivityWarning =
    !showGreenPass &&
    !showNotPassed &&
    (isInProgress || hasHomeworkPending || (isComplete && !hasHomeworkPending));

  const iconWrapClass = showGreenPass
    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
    : softImamNotPassed
      ? "border-amber-200 bg-amber-100 text-amber-800"
      : hardImamNotPassed
        ? "border-rose-200 bg-rose-100 text-rose-700"
        : showActivityWarning
          ? "border-amber-200 bg-amber-100 text-amber-700"
          : "border-slate-300 bg-slate-100 text-slate-600";

  const badgeClass = showGreenPass
    ? "bg-emerald-100 text-emerald-700"
    : softImamNotPassed
      ? "bg-amber-100 text-amber-900"
      : hardImamNotPassed
        ? "bg-rose-100 text-rose-700"
        : showActivityWarning
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <div className="relative pl-[1.625rem] sm:pl-9">
      {index < totalItems - 1 ? (
        <span className="absolute left-[9px] top-6 h-[calc(100%+6px)] w-px bg-slate-200 sm:left-[13px] sm:top-7 sm:h-[calc(100%+8px)]" />
      ) : null}
      <span
        className={`absolute left-0 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border sm:top-1 sm:h-7 sm:w-7 ${iconWrapClass}`}
        {...(showGreenPass
          ? { "aria-label": t("lessonOutcomePassedAria") }
          : { "aria-hidden": true as const })}
      >
        {showGreenPass ? (
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
        ) : softImamNotPassed ? (
          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
        ) : hardImamNotPassed ? (
          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
        ) : showActivityWarning ? (
          <Clock3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
        ) : (
          <Circle className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden />
        )}
      </span>
      <Card className="rounded-lg border border-border/70 p-2.5 max-md:shadow-sm sm:p-3 md:p-3.5">
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1 md:gap-x-3">
          <p className="min-w-0 max-w-full break-words text-sm font-medium leading-snug text-slate-900 sm:flex-1 md:flex-none md:max-w-[min(100%,36rem)]">
            {item.title}
          </p>
          <span
            className={`inline-flex w-fit max-w-full min-w-0 shrink-0 break-words rounded-md px-2 py-1 text-left text-[11px] font-medium leading-snug sm:rounded-full sm:py-0.5 sm:text-xs sm:leading-5 ${badgeClass}`}
          >
            <span className="min-w-0">{statusLabel}</span>
          </span>
        </div>
        {softImamNotPassed ? (
          <p className="mt-1.5 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-[11px] leading-snug text-amber-950 sm:text-xs">
            {t("parentDashboardLectureImamVsActivityHint")}
          </p>
        ) : hardImamNotPassed && item.reports > 0 ? (
          <p className="mt-1.5 rounded-md border border-rose-200/80 bg-rose-50/90 px-2 py-1.5 text-[11px] leading-snug text-rose-950 sm:text-xs">
            {t("parentDashboardLectureImamVsActivityMismatchHint")}
          </p>
        ) : null}
        {outcome?.mark != null ? (
          <p className="mt-1 text-xs font-medium text-slate-700">
            {t("parentDashboardLectureMarkLine", { mark: outcome.mark })}
          </p>
        ) : null}

        {item.reports > 0 ? (
          <>
            <div className="mt-1.5 sm:mt-2 md:mt-2.5 md:grid md:grid-cols-2 md:items-start md:gap-x-6">
              <div className="mb-2 w-full rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 sm:mb-2 sm:inline-block sm:w-auto sm:max-w-full sm:px-2.5 sm:py-2 md:mb-0 md:block md:w-full md:px-3 md:py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 max-md:mb-1.5 md:mb-0 md:text-[10px] md:text-slate-500">
                  {t("parentDashboardLectureSectionActivity")}
                </p>
                <dl className="mt-1.5 space-y-1 text-xs sm:mt-2 sm:space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 sm:flex sm:w-auto sm:justify-start sm:gap-x-2 md:flex md:w-full md:justify-between md:gap-3">
                    <dt className="min-w-0 text-slate-600">{t("parentDashboardLectureMetricLectureComplete")}</dt>
                    <dd className="text-right tabular-nums font-medium text-slate-900 sm:text-left md:text-right">
                      {item.completedReports}/{item.reports}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 sm:flex sm:w-auto sm:justify-start sm:gap-x-2 md:flex md:w-full md:justify-between md:gap-3">
                    <dt className="min-w-0 text-slate-600">{t("parentDashboardLectureMetricAttendance")}</dt>
                    <dd className="flex items-center justify-end gap-1 text-right font-medium text-slate-900 sm:justify-start md:justify-end">
                      {attendanceBelowHalf ? (
                        <span
                          className="inline-flex shrink-0"
                          role="img"
                          aria-label={t("parentDashboardLectureAttendanceWarningAria")}
                          title={t("parentDashboardLectureAttendanceWarningAria")}
                        >
                          <AlertTriangle
                            className="h-3 w-3 text-rose-600 sm:h-3.5 sm:w-3.5"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </span>
                      ) : null}
                      <span className="tabular-nums leading-none">
                        {item.presentReports}/{item.reports}
                      </span>
                    </dd>
                  </div>
                  {item.knownHomeworkReports > 0 ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 sm:flex sm:w-auto sm:justify-start sm:gap-x-2 md:flex md:w-full md:justify-between md:gap-3">
                      <dt className="min-w-0 text-slate-600">{t("parentDashboardLectureMetricHomework")}</dt>
                      <dd className="flex items-center justify-end gap-1 text-right font-medium text-slate-900 sm:justify-start md:justify-end">
                        {hasHomeworkPending ? (
                          <span
                            className="inline-flex shrink-0"
                            role="img"
                            aria-label={t("parentDashboardLectureHomeworkPendingAria")}
                            title={t("parentDashboardLectureHomeworkPendingAria")}
                          >
                            <AlertTriangle
                              className="h-3 w-3 text-amber-600 sm:h-3.5 sm:w-3.5"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </span>
                        ) : null}
                        <span className="tabular-nums leading-none">
                          {item.homeworkDoneReports}/{item.knownHomeworkReports}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div
                className={
                  item.comments.length > 0
                    ? "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 md:flex-col md:items-stretch md:justify-start md:gap-2"
                    : "flex flex-col gap-1.5"
                }
              >
                <div className="min-w-0 flex-1 md:flex-none">
                  {item.comments.length ? (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 max-md:mb-1 md:mb-0 md:text-[10px] md:text-slate-500">
                        {t("parentDashboardLectureSectionComments")}
                      </p>
                      <div className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-slate-700 max-md:rounded-md max-md:border max-md:border-slate-200/80 max-md:bg-background max-md:px-2.5 max-md:py-2 md:mt-1 md:space-y-0.5 md:border-0 md:bg-transparent md:p-0 md:text-slate-600">
                        {item.comments.slice(0, 2).map((comment) => (
                          <p key={comment} className="break-words">
                            - {comment}
                          </p>
                        ))}
                        {item.comments.length > 2 ? (
                          <p className="text-slate-500 max-md:pl-0.5 md:pl-0">
                            {t("parentDashboardLectureMoreComments", { count: item.comments.length - 2 })}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="max-md:rounded-md max-md:border max-md:border-dashed max-md:border-slate-200 max-md:bg-muted/30 max-md:px-2.5 max-md:py-2 md:hidden">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {t("parentDashboardLectureSectionComments")}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{t("parentDashboardNoComment")}</p>
                      </div>
                      <p className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:block">
                        {t("parentDashboardLectureSectionComments")}{" "}
                        <span className="text-xs font-normal normal-case tracking-normal text-slate-500">
                          {t("parentDashboardLectureCommentsEmptySuffix")}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                {canMessageImam ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 w-full gap-1.5 px-3 text-xs sm:h-8 sm:w-auto sm:shrink-0 md:w-full max-md:mt-0.5 ${
                      item.comments.length > 0 ? "self-stretch sm:self-center md:self-start" : "md:mt-0"
                    }`}
                    onClick={() =>
                      openImamChat({
                        type: MESSAGE_CONTEXT_TYPE.LECTURE_COMMENT,
                        childId: child.id,
                        label: `${child.firstName} ${child.lastName} - ${item.title}`,
                        preview: item.comments[0] || undefined,
                      })
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t("parentDashboardMessageImam")}
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="mt-2 border-t border-border/60 pt-2 text-[11px] leading-snug text-slate-500 max-md:text-slate-500/90 sm:mt-2 sm:pt-2 sm:text-xs md:mt-2">
              {item.lastReportedAt
                ? t("parentDashboardLastReportAt", { date: formatDateTime(item.lastReportedAt) })
                : t("parentDashboardNoActivityFallback")}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-slate-500">{t("parentDashboardNoActivityFallback")}</p>
        )}

        {canSetChildLessonOutcomes && isPersistedLessonOutcomeKey(item.key) && item.reports > 0 ? (
          <ProgressLessonOutcomeGrading
            childId={child.id}
            lessonId={item.key}
            outcome={outcome}
            activityReadyForPassedOutcome={lessonOutcomeGradingAllowedNoDrafts}
          />
        ) : null}
      </Card>
    </div>
  );
}
