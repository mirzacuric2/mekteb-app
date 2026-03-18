import { useMemo, useState } from "react";
import { Check, CircleDashed, Clock3, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import { Card } from "../../components/ui/card";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import { StatusBadge } from "../common/components/status-badge";
import { useAuthedQuery } from "../common/use-authed-query";
import { LESSON_NIVO_LABEL, LESSONS_API_PATH, LESSONS_QUERY_KEY } from "../lessons/constants";
import { Lesson } from "../lessons/types";
import { ChildAttendanceRecord, ChildRecord } from "../children/types";
import { NivoProgress } from "../children/nivo-progress";
import { ChildProgressSummary } from "./use-progress-overview";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { formatDate, formatDateTime } from "../../lib/date-time";
import { EntityDetailTable, EntityDetailTableRow } from "../common/components/entity-detail-components";
import { Button } from "../../components/ui/button";
import {
  HOMEWORK_PROGRESS_STATUS,
  HomeworkProgressItem,
  ProgressHomeworkTimeline,
} from "./progress-homework-timeline";
import { useOpenImamChat } from "../messages/use-open-imam-chat";
import { MESSAGE_CONTEXT_TYPE } from "../messages/types";
import { useRoleAccess } from "../auth/use-role-access";

type ProgressChildDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ChildRecord | null;
  summary: ChildProgressSummary | null;
  scheduledLessons: number;
};

type LectureProgressItem = {
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

function toEventDate(occurredAt: string | null, fallback: string) {
  if (!occurredAt) return fallback;
  return occurredAt;
}

export function ProgressChildDetailsDrawer({
  open,
  onOpenChange,
  child,
  summary,
  scheduledLessons,
}: ProgressChildDetailsDrawerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");
  const { openImamChat } = useOpenImamChat();
  const { isParent, isUser, isBoardMember } = useRoleAccess();
  const canMessageImam = isParent || isUser || isBoardMember;
  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, open && Boolean(child));
  const effectiveSummary = useMemo(() => {
    if (summary) return summary;
    if (!child) return null;
    const childAttendance = child.attendance || [];
    const reportedLecturesCount = childAttendance.length;
    const completedLecturesCount = childAttendance.filter((record) => record.lecture.status === LECTURE_STATUS.COMPLETED).length;
    const presentInTrackedLessons = childAttendance.filter((record) => record.present).length;
    const lectureCompletionRate =
      reportedLecturesCount > 0 ? Math.round((completedLecturesCount / reportedLecturesCount) * 100) : 0;
    return {
      completedLecturesCount,
      reportedLecturesCount,
      lectureCompletionRate,
      presentInTrackedLessons,
      trackedLessons: reportedLecturesCount,
    };
  }, [child, summary]);

  const lectureProgressItems = useMemo(() => {
    if (!child) return [];
    const reportMap = new Map<string, LectureProgressItem>();
    for (const record of child.attendance || []) {
      const reportKey = record.lesson?.id || `topic:${(record.lesson?.title || record.lecture.topic).trim().toLowerCase()}`;
      const reportTitle = record.lesson?.title || record.lecture.topic;
      const previous = reportMap.get(reportKey);
      const nextLastReportedAt = toEventDate(
        record.lecture.completedAt || record.lecture.updatedAt || null,
        record.lecture.createdAt
      );
      const mergedComments = [...(previous?.comments || [])];
      const trimmedComment = record.comment?.trim();
      if (trimmedComment && !mergedComments.includes(trimmedComment)) mergedComments.push(trimmedComment);

      reportMap.set(reportKey, {
        key: reportKey,
        title: reportTitle,
        reports: (previous?.reports || 0) + 1,
        completedReports: (previous?.completedReports || 0) + (record.lecture.status === LECTURE_STATUS.COMPLETED ? 1 : 0),
        presentReports: (previous?.presentReports || 0) + (record.present ? 1 : 0),
        knownHomeworkReports: (previous?.knownHomeworkReports || 0) + (typeof record.homeworkDone === "boolean" ? 1 : 0),
        homeworkDoneReports: (previous?.homeworkDoneReports || 0) + (record.homeworkDone === true ? 1 : 0),
        comments: mergedComments,
        lastReportedAt:
          previous?.lastReportedAt && new Date(previous.lastReportedAt).getTime() > new Date(nextLastReportedAt).getTime()
            ? previous.lastReportedAt
            : nextLastReportedAt,
      });
    }

    const nivoLessons = (lessonsQuery.data || []).filter((lesson) => lesson.nivo === child.nivo);
    const lessonRows = nivoLessons.map((lesson) => reportMap.get(lesson.id) || {
      key: lesson.id,
      title: lesson.title,
      reports: 0,
      completedReports: 0,
      presentReports: 0,
      knownHomeworkReports: 0,
      homeworkDoneReports: 0,
      comments: [],
      lastReportedAt: null,
    });

    const nivoLessonIds = new Set(nivoLessons.map((lesson) => lesson.id));
    const extraRows = [...reportMap.entries()]
      .filter(([key]) => !nivoLessonIds.has(key))
      .map(([, value]) => value)
      .sort((a, b) => new Date(b.lastReportedAt || 0).getTime() - new Date(a.lastReportedAt || 0).getTime());

    return [...lessonRows, ...extraRows];
  }, [child, lessonsQuery.data]);

  const homeworkProgressItems = useMemo(() => {
    if (!child) return [];
    const rows: HomeworkProgressItem[] = [...(child.attendance || [])]
      .filter((record) => {
        return Boolean(record.homeworkTitle?.trim() || record.homeworkDescription?.trim());
      })
      .map((record) => ({
        key: record.lectureId,
        title: record.homeworkTitle?.trim() || record.lesson?.title || record.lecture.topic,
        lessonTitle: record.lesson?.title || record.lecture.topic,
        homeworkDescription: record.homeworkDescription?.trim() || null,
        status:
          record.homeworkDone === true
            ? HOMEWORK_PROGRESS_STATUS.DONE
            : record.homeworkDone === false
              ? HOMEWORK_PROGRESS_STATUS.PENDING
              : HOMEWORK_PROGRESS_STATUS.NOT_RECORDED,
        homeworkTitle: record.homeworkTitle?.trim() || null,
        lastReportedAt: toEventDate(record.lecture.completedAt || record.lecture.updatedAt || null, record.markedAt),
      }))
      .sort((a, b) => new Date(b.lastReportedAt || 0).getTime() - new Date(a.lastReportedAt || 0).getTime());

    return rows;
  }, [child]);

  const parentsText = useMemo(() => {
    if (!child) return null;
    return (
      (child.parents || [])
        .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
        .filter(Boolean)
        .join(", ") || null
    );
  }, [child]);

  const addressText = useMemo(() => {
    if (!child) return null;
    if (!child.address) return null;
    return [
      child.address.streetLine1,
      child.address.streetLine2 || "",
      `${child.address.postalCode} ${child.address.city}`.trim(),
      child.address.state || "",
      child.address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [child]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right" className="max-w-2xl">
        <DrawerHeader className="flex items-start justify-between gap-4">
          <div>
            <DrawerTitle>{child ? `${child.firstName} ${child.lastName}` : t("childrenDetails")}</DrawerTitle>
            {child ? (
              <StatusBadge status={child.status} className="mt-2" />
            ) : null}
            <DrawerDescription>{t("parentDashboardChildDetailsDrawerDescription")}</DrawerDescription>
          </div>
          <DrawerClose className="rounded-md border border-border p-2" aria-label={t("cancel")}>
            <X size={16} />
          </DrawerClose>
        </DrawerHeader>

        <div className="h-[calc(100%-88px)] overflow-y-auto p-4 pb-8">
          {!child ? (
            <p className="text-sm text-slate-500">{t("parentDashboardNoChildActivity")}</p>
          ) : (
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              tabs={[
                { key: "details", label: t("childrenDetails") },
                { key: "progress", label: t("parentDashboardLectureProgressTab") },
                { key: "homework", label: t("parentDashboardHomeworkProgressTab") },
              ]}
            >
              {activeTab === "details" ? (
                <div className="space-y-3">
                  <EntityDetailTable>
                    <EntityDetailTableRow label={t("usersTableName")} value={`${child.firstName} ${child.lastName}`} />
                    <EntityDetailTableRow label={t("ssn")} value={<NaValue value={child.ssn} />} />
                    <EntityDetailTableRow label={t("birthDate")} value={formatDate(child.birthDate)} />
                    <EntityDetailTableRow
                      label={t("childrenNivoLabel")}
                      value={
                        <div className="inline-flex flex-col items-start gap-1">
                          <NivoProgress nivo={child.nivo} showIndexLabel />
                        </div>
                      }
                    />
                    <EntityDetailTableRow label={t("childrenParentsLabel")} value={<NaValue value={parentsText} />} />
                    <EntityDetailTableRow label={t("address")} value={<NaValue value={addressText} />} />
                  </EntityDetailTable>
                </div>
              ) : activeTab === "progress" ? (
                <div className="space-y-3">
                  {lectureProgressItems.map((item, idx) => {
                    const isComplete = item.reports > 0 && item.completedReports === item.reports;
                    const isInProgress = item.reports > 0 && item.completedReports < item.reports;
                    const hasHomeworkPending =
                      item.knownHomeworkReports > 0 && item.homeworkDoneReports < item.knownHomeworkReports;
                    const statusLabel = isComplete
                      ? hasHomeworkPending
                        ? t("parentDashboardLectureStateCompletedHomeworkPending")
                        : t("parentDashboardLectureStateCompletedAllDone")
                      : isInProgress
                        ? t("parentDashboardLectureStateInProgress")
                        : t("parentDashboardLectureStateNotStarted");
                    return (
                      <div key={item.key} className="relative pl-8 sm:pl-9">
                        {idx < lectureProgressItems.length - 1 ? (
                          <span className="absolute left-3 top-7 h-[calc(100%+8px)] w-px bg-slate-200 sm:left-[13px]" />
                        ) : null}
                        <span
                          className={`absolute left-0 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border sm:h-7 sm:w-7 ${
                            isComplete && !hasHomeworkPending
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : isInProgress || hasHomeworkPending
                                ? "border-amber-200 bg-amber-100 text-amber-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isComplete && !hasHomeworkPending ? (
                            <Check className="h-4 w-4" />
                          ) : isInProgress || hasHomeworkPending ? (
                            <Clock3 className="h-4 w-4" />
                          ) : (
                            <CircleDashed className="h-4 w-4" />
                          )}
                        </span>
                        <Card className="rounded-lg border border-border/70 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs leading-5 ${
                                  isComplete && !hasHomeworkPending
                                    ? "bg-emerald-100 text-emerald-700"
                                    : isInProgress || hasHomeworkPending
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                          {item.reports > 0 ? (
                            <>
                              <p className="mt-1 text-xs text-slate-500">
                                {t("parentDashboardLectureAttendanceReports", {
                                  present: item.presentReports,
                                  total: item.reports,
                                })}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.knownHomeworkReports > 0
                                  ? t("parentDashboardLectureHomeworkReports", {
                                      done: item.homeworkDoneReports,
                                      total: item.knownHomeworkReports,
                                    })
                                  : t("parentDashboardHomeworkUnknown")}
                              </p>
                              {item.comments.length ? (
                                <div className="mt-1 text-xs text-slate-600">
                                  <p>{t("parentDashboardLectureImamComments", { count: item.comments.length })}</p>
                                  <div className="mt-1 space-y-0.5">
                                    {item.comments.slice(0, 2).map((comment) => (
                                      <p key={comment} className="break-words">
                                        - {comment}
                                      </p>
                                    ))}
                                    {item.comments.length > 2 ? (
                                      <p className="text-slate-500">
                                        {t("parentDashboardLectureMoreComments", { count: item.comments.length - 2 })}
                                      </p>
                                    ) : null}
                                  </div>
                                  {canMessageImam ? (
                                    <div className="mt-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 px-2 py-1 text-xs"
                                        onClick={() =>
                                          openImamChat({
                                            type: MESSAGE_CONTEXT_TYPE.LECTURE_COMMENT,
                                            childId: child.id,
                                            label: `${child.firstName} ${child.lastName} - ${item.title}`,
                                            preview: item.comments[0] || undefined,
                                          })
                                        }
                                      >
                                        Message imam
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-slate-500">{t("parentDashboardNoComment")}</p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">
                                {item.lastReportedAt
                                  ? t("parentDashboardLastReportAt", { date: formatDateTime(item.lastReportedAt) })
                                  : t("parentDashboardNoActivityFallback")}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">{t("parentDashboardNoActivityFallback")}</p>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ProgressHomeworkTimeline
                  items={homeworkProgressItems}
                  onMessageImam={
                    canMessageImam
                      ? (item) =>
                          openImamChat({
                            type: MESSAGE_CONTEXT_TYPE.HOMEWORK,
                            childId: child.id,
                            lectureId: item.key,
                            label: `${child.firstName} ${child.lastName} - ${item.title}`,
                            preview: item.homeworkDescription || undefined,
                          })
                      : undefined
                  }
                />
              )}
            </Tabs>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
