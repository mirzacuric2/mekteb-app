import { ChildAttendanceRecord } from "../children/types";

/**
 * Whether this attendance row counts as a “homework item” in the UI.
 * All homework-related numerators/denominators that should match the Homework tab use this.
 *
 * **Data source:** `ChildRecord.attendance[]` from `GET /children` (each element is one child on one lecture).
 *
 * **Consumers:**
 * - `use-progress-overview.ts` — dashboard Homework card: `reportedHomeworkCount`, `homeworkDoneCount`,
 *   `pendingHomeworkCount`, top-card `homeworkCompletionRate` (sums across linked children).
 * - `progress-child-details-drawer.tsx` — Homework tab list (one card per matching row); Lecture tab per-lesson
 *   `knownHomeworkReports` / `homeworkDoneReports` (aggregated by catalog `lesson.id` or topic fallback).
 *
 * **Done / pending:** `homeworkDone === true` → done; anything else (`false`, `null`, `undefined`) → not done
 * for rates and pending counts (list badges still distinguish Pending vs Not recorded).
 */
export function hasReportedHomework(record: ChildAttendanceRecord) {
  return Boolean(record.homeworkTitle?.trim() || record.homeworkDescription?.trim());
}
