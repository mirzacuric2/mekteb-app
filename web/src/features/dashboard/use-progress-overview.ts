import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { ChildAttendanceRecord, ChildrenListResponse } from "../children/types";
import {
  HOMEWORK_STATUS,
  HomeworkStatus,
  PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE,
  PROGRESS_OVERVIEW_SCHEDULED_LESSONS,
} from "./progress-overview.constants";
import { LECTURE_STATUS } from "../reporting/reporting.constants";

type LatestProgressState = {
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

type ChildProgressSummary = {
  childId: string;
  childName: string;
  attendanceRate: number;
  trackedLessons: number;
  presentInTrackedLessons: number;
  latestState: LatestProgressState | null;
};

const MAX_PROGRESS_OVERVIEW_PAGE_FETCHES = 50;

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round(((value / total) * 100 + Number.EPSILON) * 10) / 10;
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
    const attendanceForMetrics = completedAttendance.length ? completedAttendance : attendance;
    const recentAttendance = [...attendanceForMetrics].sort(byLatestAttendance).slice(0, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
    const presentInRecentLessons = recentAttendance.filter((entry) => entry.present).length;
    const attendanceRate = toPercent(presentInRecentLessons, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
    const homeworkKnownEntries = recentAttendance.filter((entry) => typeof entry.homeworkDone === "boolean");
    const homeworkDoneEntries = homeworkKnownEntries.filter((entry) => entry.homeworkDone === true);
    const homeworkCompletionRate = toPercent(homeworkDoneEntries.length, homeworkKnownEntries.length);

    const childSummaries: ChildProgressSummary[] = children.map((child) => {
      const childName = `${child.firstName} ${child.lastName}`.trim();
      const childAttendance = [...(child.attendance || [])].sort(byLatestAttendance);
      const childRecentAttendance = childAttendance.slice(0, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
      const childPresentInTrackedLessons = childRecentAttendance.filter((entry) => entry.present).length;
      const childAttendanceRate = toPercent(childPresentInTrackedLessons, PROGRESS_OVERVIEW_SCHEDULED_LESSONS);
      const latestChildRecord = childAttendance[0];

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
        attendanceRate: childAttendanceRate,
        trackedLessons: childRecentAttendance.length,
        presentInTrackedLessons: childPresentInTrackedLessons,
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
        (summary.latestState.present === false || summary.latestState.homeworkStatus === HOMEWORK_STATUS.PENDING)
    ).length;
    const activeChildrenCount = childSummaries.filter((summary) => summary.latestState !== null).length;

    return {
      childrenCount: children.length,
      attendanceRate,
      homeworkCompletionRate,
      scheduledLessons: PROGRESS_OVERVIEW_SCHEDULED_LESSONS,
      trackedLessons: recentAttendance.length,
      presentInTrackedLessons: presentInRecentLessons,
      recentHomeworkRecords: homeworkKnownEntries.length,
      childrenWithWarnings,
      activeChildrenCount,
      childSummaries,
      latestState,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
    };
  }, [query.data?.items, query.isError, query.isFetching, query.isLoading]);
}
