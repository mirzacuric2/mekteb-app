import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { ChildAttendanceRecord, ChildrenListResponse } from "../children/types";
import { LessonNivo } from "../lessons/constants";
import {
  HOMEWORK_STATUS,
  HomeworkStatus,
  PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE,
  PROGRESS_OVERVIEW_SCHEDULED_LESSONS,
} from "./progress-overview.constants";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { hasReportedHomework } from "./attendance-homework";

export type LatestProgressState = {
  childId: string;
  childName: string;
  lectureTitle: string;
  lectureStatus: LectureStatus;
  lectureCompletedAt: string | null;
  occurredAt: string;
  present: boolean;
  homeworkStatus: HomeworkStatus;
  comment: string | null;
};
type LectureStatus = (typeof LECTURE_STATUS)[keyof typeof LECTURE_STATUS];

export type ChildProgressSummary = {
  childId: string;
  childName: string;
  childNivo: LessonNivo;
  attendanceRate: number;
  trackedLessons: number;
  presentInTrackedLessons: number;
  lectureCompletionRate: number;
  completedLecturesCount: number;
  reportedLecturesCount: number;
  homeworkCompletionRate: number;
  /** Rows with homework title/description (same scope as child drawer Homework tab). */
  reportedHomeworkCount: number;
  homeworkDoneCount: number;
  currentLectureTitle: string | null;
  currentLectureStatus: LectureStatus | null;
  pendingHomeworkCount: number;
  overallProgressRate: number;
  hasPerformanceRecords: boolean;
  latestState: LatestProgressState | null;
};

const MAX_PROGRESS_OVERVIEW_PAGE_FETCHES = 50;

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round(((value / total) * 100 + Number.EPSILON) * 10) / 10;
}

function toAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length + Number.EPSILON) * 10) / 10;
}

function toEventDate(record: ChildAttendanceRecord) {
  if (record.lecture.status === LECTURE_STATUS.COMPLETED) {
    return record.lecture.completedAt || record.lecture.updatedAt || record.lecture.createdAt;
  }
  return record.lecture.updatedAt || record.lecture.createdAt;
}

function toHomeworkStatus(record: ChildAttendanceRecord): HomeworkStatus {
  if (record.homeworkDone === true) return HOMEWORK_STATUS.DONE;
  if (record.homeworkDone === false) return HOMEWORK_STATUS.PENDING;
  return HOMEWORK_STATUS.UNKNOWN;
}

function byLatestAttendance(a: ChildAttendanceRecord, b: ChildAttendanceRecord) {
  const aCompleted = a.lecture.status === LECTURE_STATUS.COMPLETED ? 1 : 0;
  const bCompleted = b.lecture.status === LECTURE_STATUS.COMPLETED ? 1 : 0;
  if (aCompleted !== bCompleted) return bCompleted - aCompleted;
  return new Date(toEventDate(b)).getTime() - new Date(toEventDate(a)).getTime();
}

export function useProgressOverview(enabled: boolean) {
  const query = useQuery<ChildrenListResponse>({
    queryKey: ["progress-overview-children", { pageSize: PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE }],
    queryFn: async () => {
      const allItems = [];
      let page = 1;
      let total = 0;

      while (page <= MAX_PROGRESS_OVERVIEW_PAGE_FETCHES) {
        const response = await api.get<ChildrenListResponse>("/children", {
          params: { page, pageSize: PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE, mine: 1 },
        });
        const data = response.data;
        const items = data.items || [];
        total = data.total || 0;
        allItems.push(...items);

        if (!items.length || allItems.length >= total) {
          break;
        }
        page += 1;
      }

      return {
        items: allItems,
        total: allItems.length,
        page: 1,
        pageSize: allItems.length || PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE,
      };
    },
    enabled,
  });

  return useMemo(() => {
    const children = query.data?.items || [];
    const attendance = children.flatMap((child) => child.attendance || []);
    const completedAttendance = attendance.filter((entry) => entry.lecture.status === LECTURE_STATUS.COMPLETED);
    const attendanceForMetrics = completedAttendance;
    const recentAttendance = [...attendanceForMetrics].sort(byLatestAttendance).slice(0, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
    const presentInRecentLessons = recentAttendance.filter((entry) => entry.present).length;
    const attendanceRate = toPercent(presentInRecentLessons, recentAttendance.length);
    const childLectureMap = new Map<string, ChildAttendanceRecord>();
    for (const entry of [...attendance].sort(byLatestAttendance)) {
      const key = `${entry.childId}:${entry.lectureId}`;
      if (!childLectureMap.has(key)) childLectureMap.set(key, entry);
    }
    const reportedLecturesCount = childLectureMap.size;
    const completedLecturesCount = [...childLectureMap.values()].filter(
      (entry) => entry.lecture.status === LECTURE_STATUS.COMPLETED
    ).length;
    const lectureCompletionRate = toPercent(completedLecturesCount, reportedLecturesCount);

    const childSummaries: ChildProgressSummary[] = children.map((child) => {
      const childName = `${child.firstName} ${child.lastName}`.trim();
      const childAttendance = [...(child.attendance || [])].sort(byLatestAttendance);
      const childCompletedAttendance = childAttendance.filter((entry) => entry.lecture.status === LECTURE_STATUS.COMPLETED);
      const childRecentAttendance = childCompletedAttendance.slice(0, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
      const childPresentInTrackedLessons = childRecentAttendance.filter((entry) => entry.present).length;
      const childAttendanceRate = toPercent(childPresentInTrackedLessons, childRecentAttendance.length);
      const latestChildRecord = childCompletedAttendance[0] || null;
      const childLectureEntries = new Map<string, ChildAttendanceRecord>();
      for (const entry of childCompletedAttendance) {
        if (!childLectureEntries.has(entry.lectureId)) childLectureEntries.set(entry.lectureId, entry);
      }
      const childReportedLecturesCount = childLectureEntries.size;
      const childCompletedLecturesCount = [...childLectureEntries.values()].filter(
        (entry) => entry.lecture.status === LECTURE_STATUS.COMPLETED
      ).length;
      const childLectureCompletionRate = toPercent(childCompletedLecturesCount, childReportedLecturesCount);
      const currentLectureRecord =
        childAttendance.find((entry) => entry.lecture.status === LECTURE_STATUS.DRAFT) || latestChildRecord || null;
      const childReportedHomeworkEntries = childAttendance.filter((entry) => hasReportedHomework(entry));
      const reportedHomeworkCount = childReportedHomeworkEntries.length;
      const homeworkDoneCount = childReportedHomeworkEntries.filter((entry) => entry.homeworkDone === true).length;
      const pendingHomeworkCount = childReportedHomeworkEntries.filter((entry) => entry.homeworkDone !== true).length;
      const childHomeworkCompletionRate = toPercent(homeworkDoneCount, reportedHomeworkCount);
      const childProgressMetrics = [
        childRecentAttendance.length ? childLectureCompletionRate : null,
        childRecentAttendance.length ? childAttendanceRate : null,
        reportedHomeworkCount > 0 ? childHomeworkCompletionRate : null,
      ].filter((value): value is number => typeof value === "number");
      const childOverallProgressRate = toAverage(childProgressMetrics);
      const hasPerformanceRecords = childProgressMetrics.length > 0;

      const latestChildState: LatestProgressState | null = latestChildRecord
        ? {
            childId: child.id,
            childName,
            lectureTitle: latestChildRecord.lesson?.title || latestChildRecord.lecture.topic,
            lectureStatus: latestChildRecord.lecture.status,
            lectureCompletedAt: latestChildRecord.lecture.completedAt || null,
            occurredAt: toEventDate(latestChildRecord),
            present: latestChildRecord.present,
            homeworkStatus: toHomeworkStatus(latestChildRecord),
            comment: latestChildRecord.comment?.trim() || null,
          }
        : null;

      return {
        childId: child.id,
        childName,
        childNivo: child.nivo,
        attendanceRate: childAttendanceRate,
        trackedLessons: childRecentAttendance.length,
        presentInTrackedLessons: childPresentInTrackedLessons,
        lectureCompletionRate: childLectureCompletionRate,
        completedLecturesCount: childCompletedLecturesCount,
        reportedLecturesCount: childReportedLecturesCount,
        homeworkCompletionRate: childHomeworkCompletionRate,
        reportedHomeworkCount,
        homeworkDoneCount,
        currentLectureTitle: currentLectureRecord
          ? currentLectureRecord.lesson?.title || currentLectureRecord.lecture.topic
          : null,
        currentLectureStatus: currentLectureRecord?.lecture.status || null,
        pendingHomeworkCount,
        overallProgressRate: childOverallProgressRate,
        hasPerformanceRecords,
        latestState: latestChildState,
      };
    });

    const latestStates = childSummaries
      .map((summary) => summary.latestState)
      .filter((state): state is LatestProgressState => Boolean(state));
    const latestState = latestStates.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;
    const childrenWithWarnings = childSummaries.filter(
      (summary) =>
        summary.latestState &&
        (summary.latestState.present === false ||
          summary.latestState.homeworkStatus === HOMEWORK_STATUS.PENDING ||
          summary.pendingHomeworkCount > 0)
    ).length;
    const childrenOnTrack = childSummaries.filter(
      (summary) =>
        summary.overallProgressRate >= 70 &&
        summary.attendanceRate >= 70 &&
        summary.lectureCompletionRate >= 70 &&
        summary.pendingHomeworkCount === 0
    ).length;
    const activeChildrenCount = childSummaries.filter((summary) => summary.latestState !== null).length;
    const childrenWithPendingHomework = childSummaries.filter((summary) => summary.pendingHomeworkCount > 0).length;
    const totalPendingHomework = childSummaries.reduce((sum, summary) => sum + summary.pendingHomeworkCount, 0);
    const homeworkDoneRecords = childSummaries.reduce((sum, summary) => sum + summary.homeworkDoneCount, 0);
    const reportedHomeworkRowsTotal = childSummaries.reduce((sum, summary) => sum + summary.reportedHomeworkCount, 0);
    const homeworkCompletionRate = toPercent(homeworkDoneRecords, reportedHomeworkRowsTotal);
    const childSummariesWithRecords = childSummaries.filter((summary) => summary.hasPerformanceRecords);
    const overallProgressRate = toAverage(childSummariesWithRecords.map((summary) => summary.overallProgressRate));
    const childrenOnTrackRate = toPercent(childrenOnTrack, childSummariesWithRecords.length);

    return {
      childrenCount: children.length,
      children,
      attendanceRate,
      homeworkCompletionRate,
      overallProgressRate,
      lectureCompletionRate,
      completedLecturesCount,
      reportedLecturesCount,
      scheduledLessons: PROGRESS_OVERVIEW_SCHEDULED_LESSONS,
      trackedLessons: recentAttendance.length,
      presentInTrackedLessons: presentInRecentLessons,
      reportedHomeworkRowsTotal,
      homeworkDoneRecords,
      childrenWithWarnings,
      childrenOnTrack,
      childrenOnTrackRate,
      childrenWithPendingHomework,
      totalPendingHomework,
      activeChildrenCount,
      childSummaries,
      latestState,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
    };
  }, [query.data?.items, query.isError, query.isFetching, query.isLoading]);
}
