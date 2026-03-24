import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChildByIdQuery } from "../children/use-children-data";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import { StatusBadge } from "../common/components/status-badge";
import { useAuthedQuery } from "../common/use-authed-query";
import { LESSONS_API_PATH, LESSONS_QUERY_KEY } from "../lessons/constants";
import { Lesson } from "../lessons/types";
import { ChildLessonOutcome, ChildRecord } from "../children/types";
import { NivoProgress } from "../children/nivo-progress";
import { ChildProgressSummary } from "./use-progress-overview";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { formatDate } from "../../lib/date-time";
import { EntityDetailTable, EntityDetailTableRow } from "../common/components/entity-detail-components";
import {
  HOMEWORK_PROGRESS_STATUS,
  HomeworkProgressItem,
  ProgressHomeworkTimeline,
} from "./progress-homework-timeline";
import { useOpenImamChat } from "../messages/use-open-imam-chat";
import { MESSAGE_CONTEXT_TYPE } from "../messages/types";
import { useRoleAccess } from "../auth/use-role-access";
import { LoadingBlock } from "../common/components/loading-block";
import { isPersistedLessonOutcomeKey } from "./progress-lesson-outcome.constants";
import { hasReportedHomework } from "./attendance-homework";
import { LectureProgressLessonCard, type LectureProgressLessonItem } from "./lecture-progress-lesson-card";
import {
  CHILD_DRAWER_TAB,
  CHILD_DRAWER_TAB_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
  parseChildDrawerTab,
  type ChildDrawerTab,
} from "./child-drawer-tab.constants";

type ProgressChildDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ChildRecord | null;
  summary: ChildProgressSummary | null;
  scheduledLessons: number;
  isLoading?: boolean;
  /**
   * When true, active tab is read/written as query `tab` (`basic-info` default; omit param when default).
   */
  syncTabToSearchParams?: boolean;
  /**
   * `mine` flag for GET /children while the drawer is open so lesson outcomes / attendance stay in sync after save.
   * Dashboard linked view: `true`. Children management (admin/board full list): `false`. Users drawer child: `false`.
   */
  childrenFetchMineOnly: boolean;
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
  isLoading = false,
  syncTabToSearchParams = true,
  childrenFetchMineOnly,
}: ProgressChildDetailsDrawerProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localTab, setLocalTab] = useState<ChildDrawerTab>(DEFAULT_CHILD_DRAWER_TAB);
  const prevChildIdRef = useRef<string | null>(null);

  const activeTab = syncTabToSearchParams
    ? parseChildDrawerTab(searchParams.get(CHILD_DRAWER_TAB_QUERY_KEY))
    : localTab;

  const setActiveTab = (key: string) => {
    const nextTab = parseChildDrawerTab(key);
    if (syncTabToSearchParams) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (nextTab === DEFAULT_CHILD_DRAWER_TAB) {
            p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
          } else {
            p.set(CHILD_DRAWER_TAB_QUERY_KEY, nextTab);
          }
          return p;
        },
        { replace: true }
      );
    } else {
      setLocalTab(nextTab);
    }
  };

  useEffect(() => {
    if (!open) {
      prevChildIdRef.current = null;
      return;
    }
    if (!child?.id) return;
    const prev = prevChildIdRef.current;
    if (prev && prev !== child.id) {
      if (syncTabToSearchParams) {
        setSearchParams(
          (prevParams) => {
            const p = new URLSearchParams(prevParams);
            p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
            return p;
          },
          { replace: true }
        );
      } else {
        setLocalTab(DEFAULT_CHILD_DRAWER_TAB);
      }
    }
    prevChildIdRef.current = child.id;
  }, [child?.id, open, setSearchParams, syncTabToSearchParams]);

  const { openImamChat } = useOpenImamChat();
  const { isParent, isUser, isBoardMember, canSetChildLessonOutcomes } = useRoleAccess();
  const canMessageImam = isParent || isUser || isBoardMember;
  const childRefreshQuery = useChildByIdQuery(child?.id, childrenFetchMineOnly, open && Boolean(child?.id));
  const resolvedChild = useMemo(() => {
    if (!child) return null;
    return childRefreshQuery.data ?? child;
  }, [child, childRefreshQuery.data]);
  const lessonsQuery = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, open && Boolean(child));
  const effectiveSummary = useMemo(() => {
    if (summary) return summary;
    if (!resolvedChild) return null;
    const childAttendance = resolvedChild.attendance || [];
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
  }, [resolvedChild, summary]);

  const lectureProgressItems = useMemo(() => {
    if (!resolvedChild) return [];
    const reportMap = new Map<string, LectureProgressLessonItem>();
    for (const record of resolvedChild.attendance || []) {
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

      const homeworkListRow = hasReportedHomework(record);
      reportMap.set(reportKey, {
        key: reportKey,
        title: reportTitle,
        reports: (previous?.reports || 0) + 1,
        completedReports: (previous?.completedReports || 0) + (record.lecture.status === LECTURE_STATUS.COMPLETED ? 1 : 0),
        presentReports: (previous?.presentReports || 0) + (record.present ? 1 : 0),
        knownHomeworkReports: (previous?.knownHomeworkReports || 0) + (homeworkListRow ? 1 : 0),
        homeworkDoneReports: (previous?.homeworkDoneReports || 0) + (homeworkListRow && record.homeworkDone === true ? 1 : 0),
        comments: mergedComments,
        lastReportedAt:
          previous?.lastReportedAt && new Date(previous.lastReportedAt).getTime() > new Date(nextLastReportedAt).getTime()
            ? previous.lastReportedAt
            : nextLastReportedAt,
      });
    }

    const nivoLessons = (lessonsQuery.data || []).filter((lesson) => lesson.nivo === resolvedChild.nivo);
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
  }, [resolvedChild, lessonsQuery.data]);

  const outcomeByLessonId = useMemo(() => {
    const map = new Map<string, ChildLessonOutcome>();
    for (const row of resolvedChild?.lessonOutcomes || []) {
      map.set(row.lessonId, row);
    }
    return map;
  }, [resolvedChild?.lessonOutcomes]);

  const homeworkProgressItems = useMemo(() => {
    if (!resolvedChild) return [];
    const rows: HomeworkProgressItem[] = [...(resolvedChild.attendance || [])]
      .filter((record) => hasReportedHomework(record))
      .map((record) => ({
        key: `${record.lectureId}:${record.markedAt}`,
        lectureId: record.lectureId,
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
  }, [resolvedChild]);

  const parentsText = useMemo(() => {
    if (!resolvedChild) return null;
    return (
      (resolvedChild.parents || [])
        .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
        .filter(Boolean)
        .join(", ") || null
    );
  }, [resolvedChild]);

  const addressText = useMemo(() => {
    if (!resolvedChild) return null;
    if (!resolvedChild.address) return null;
    return [
      resolvedChild.address.streetLine1,
      resolvedChild.address.streetLine2 || "",
      `${resolvedChild.address.postalCode} ${resolvedChild.address.city}`.trim(),
      resolvedChild.address.state || "",
      resolvedChild.address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [resolvedChild]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right" className="max-w-2xl">
        <DrawerHeader className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <DrawerTitle className="mb-0">
                {resolvedChild ? `${resolvedChild.firstName} ${resolvedChild.lastName}` : t("childrenDetails")}
              </DrawerTitle>
              {resolvedChild ? (
                <span className="inline-flex shrink-0 items-center">
                  <StatusBadge status={resolvedChild.status} />
                </span>
              ) : null}
            </div>
          </div>
          <DrawerClose className="rounded-md border border-border p-2">
            <X size={16} />
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-6 sm:p-4 sm:pb-8">
          {isLoading && !child ? (
            <LoadingBlock text={t("parentDashboardChildDrawerLoading")} />
          ) : !resolvedChild ? (
            <p className="text-sm text-slate-500">{t("parentDashboardNoChildActivity")}</p>
          ) : (
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              tabs={[
                { key: CHILD_DRAWER_TAB.BASIC_INFO, label: t("childrenDetails") },
                { key: CHILD_DRAWER_TAB.LECTURE_PROGRESS, label: t("parentDashboardLectureProgressTab") },
                { key: CHILD_DRAWER_TAB.HOMEWORK_PROGRESS, label: t("parentDashboardHomeworkProgressTab") },
              ]}
            >
              {activeTab === CHILD_DRAWER_TAB.BASIC_INFO ? (
                <div className="space-y-3">
                  <EntityDetailTable>
                    <EntityDetailTableRow label={t("usersTableName")} value={`${resolvedChild.firstName} ${resolvedChild.lastName}`} />
                    <EntityDetailTableRow label={t("ssn")} value={<NaValue value={resolvedChild.ssn} />} />
                    <EntityDetailTableRow label={t("birthDate")} value={formatDate(resolvedChild.birthDate)} />
                    <EntityDetailTableRow
                      label={t("childrenNivoLabel")}
                      value={
                        <div className="inline-flex flex-col items-start gap-1">
                          <NivoProgress nivo={resolvedChild.nivo} showIndexLabel />
                        </div>
                      }
                    />
                    <EntityDetailTableRow label={t("childrenParentsLabel")} value={<NaValue value={parentsText} />} />
                    <EntityDetailTableRow label={t("address")} value={<NaValue value={addressText} />} />
                  </EntityDetailTable>
                </div>
              ) : activeTab === CHILD_DRAWER_TAB.LECTURE_PROGRESS ? (
                <div className="space-y-2 max-md:space-y-1.5">
                  {lectureProgressItems.map((item, idx) => {
                    const outcome = isPersistedLessonOutcomeKey(item.key) ? outcomeByLessonId.get(item.key) : undefined;
                    return (
                      <LectureProgressLessonCard
                        key={item.key}
                        item={item}
                        index={idx}
                        totalItems={lectureProgressItems.length}
                        child={resolvedChild}
                        outcome={outcome}
                        canMessageImam={canMessageImam}
                        canSetChildLessonOutcomes={canSetChildLessonOutcomes}
                        openImamChat={openImamChat}
                      />
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
                            childId: resolvedChild.id,
                            lectureId: item.lectureId,
                            label: `${resolvedChild.firstName} ${resolvedChild.lastName} - ${item.title}`,
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
