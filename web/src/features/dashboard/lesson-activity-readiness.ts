import type { ChildAttendanceRecord } from "../children/types";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { hasReportedHomework } from "./attendance-homework";

export type LessonActivityRollup = {
  reports: number;
  completedReports: number;
  presentReports: number;
  knownHomeworkReports: number;
  homeworkDoneReports: number;
};

export function rollupLessonActivityFromAttendance(
  attendance: ChildAttendanceRecord[] | undefined,
  lessonId: string
): LessonActivityRollup {
  const rows = (attendance || []).filter((r) => r.lesson?.id === lessonId);
  let completedReports = 0;
  let presentReports = 0;
  let knownHomeworkReports = 0;
  let homeworkDoneReports = 0;
  for (const record of rows) {
    if (record.lecture.status === LECTURE_STATUS.COMPLETED) completedReports += 1;
    if (record.present) presentReports += 1;
    if (hasReportedHomework(record)) {
      knownHomeworkReports += 1;
      if (record.homeworkDone === true) homeworkDoneReports += 1;
    }
  }
  return {
    reports: rows.length,
    completedReports,
    presentReports,
    knownHomeworkReports,
    homeworkDoneReports,
  };
}

export function isLessonActivityReadyForPassedOutcome(rollup: LessonActivityRollup): boolean {
  if (rollup.reports <= 0) return false;
  return (
    rollup.completedReports === rollup.reports &&
    rollup.presentReports === rollup.reports &&
    (rollup.knownHomeworkReports === 0 || rollup.homeworkDoneReports === rollup.knownHomeworkReports)
  );
}

export function lessonRollupHasDraftReports(rollup: Pick<LessonActivityRollup, "reports" | "completedReports">): boolean {
  return rollup.reports > 0 && rollup.completedReports < rollup.reports;
}
