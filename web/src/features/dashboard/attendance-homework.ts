import { ChildAttendanceRecord } from "../children/types";

export function hasReportedHomework(record: ChildAttendanceRecord) {
  return Boolean(record.homeworkTitle?.trim() || record.homeworkDescription?.trim());
}
