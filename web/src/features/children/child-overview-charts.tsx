import { useMemo } from "react";
import { PieChart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CommunityDonutChart } from "../communities/community-donut-chart";
import { HOMEWORK_PROGRESS_STATUS } from "../dashboard/progress-homework-timeline";
import { hasReportedHomework } from "../dashboard/attendance-homework";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { LESSON_PROGRAM } from "../lessons/constants";
import type { ChildAttendanceRecord, ChildRecord } from "./types";

function isIlmihalAttendanceForChildNivo(record: ChildAttendanceRecord, childNivo: number) {
  const program = record.lecture.program || LESSON_PROGRAM.ILMIHAL;
  if (program !== LESSON_PROGRAM.ILMIHAL) return false;
  if (record.lesson) {
    return record.lesson.nivo === childNivo;
  }
  const lectureNivo = record.lecture.nivo;
  if (lectureNivo != null) return lectureNivo === childNivo;
  return true;
}

function ilmihalLessonReportKey(record: ChildAttendanceRecord) {
  return record.lesson?.id || `topic:${(record.lesson?.title || record.lecture.topic).trim().toLowerCase()}`;
}

type Props = {
  child: ChildRecord;
  scheduledIlmihalLessons: number;
};

export function ChildOverviewCharts({ child, scheduledIlmihalLessons }: Props) {
  const { t } = useTranslation();

  const attendance = child.attendance || [];

  const completedIlmihalDistinctCount = useMemo(() => {
    const keys = new Set<string>();
    for (const r of attendance) {
      if (r.lecture.status !== LECTURE_STATUS.COMPLETED) continue;
      if (!isIlmihalAttendanceForChildNivo(r, child.nivo)) continue;
      keys.add(ilmihalLessonReportKey(r));
    }
    return keys.size;
  }, [attendance, child.nivo]);

  const completedIlmihalForDonut = Math.min(completedIlmihalDistinctCount, scheduledIlmihalLessons);
  const ilmihalLessonsRemaining = Math.max(0, scheduledIlmihalLessons - completedIlmihalForDonut);

  const ilmihalProgressSegments = useMemo(
    () => [
      {
        key: "completed",
        label: t("childOverviewIlmihalSegmentCompletedLessons"),
        value: completedIlmihalForDonut,
        color: "#22c55e",
      },
      {
        key: "remaining",
        label: t("childOverviewIlmihalSegmentNotCompletedLessons"),
        value: ilmihalLessonsRemaining,
        color: "#cbd5e1",
      },
    ],
    [completedIlmihalForDonut, ilmihalLessonsRemaining, t]
  );

  const presentInCompletedIlmihal = attendance.filter(
    (r) =>
      r.lecture.status === LECTURE_STATUS.COMPLETED &&
      isIlmihalAttendanceForChildNivo(r, child.nivo) &&
      r.present
  ).length;
  const absentInCompletedIlmihal = attendance.filter(
    (r) =>
      r.lecture.status === LECTURE_STATUS.COMPLETED &&
      isIlmihalAttendanceForChildNivo(r, child.nivo) &&
      !r.present
  ).length;

  const homeworkRows = useMemo(
    () => attendance.filter((record) => hasReportedHomework(record)),
    [attendance]
  );
  const homeworkDone = homeworkRows.filter((r) => r.homeworkDone === true).length;
  const homeworkPending = homeworkRows.filter((r) => r.homeworkDone === false).length;
  const homeworkNotRecorded = homeworkRows.filter((r) => r.homeworkDone !== true && r.homeworkDone !== false).length;

  const attendanceSegments = useMemo(
    () => [
      {
        key: "present",
        label: t("activityReportPresent"),
        value: presentInCompletedIlmihal,
        color: "#22c55e",
      },
      {
        key: "absent",
        label: t("activityReportAbsent"),
        value: absentInCompletedIlmihal,
        color: "#f97316",
      },
    ],
    [absentInCompletedIlmihal, presentInCompletedIlmihal, t]
  );

  const homeworkSegments = useMemo(
    () => [
      {
        key: HOMEWORK_PROGRESS_STATUS.DONE,
        label: t("homeworkQueueDoneLabel"),
        value: homeworkDone,
        color: "#22c55e",
      },
      {
        key: HOMEWORK_PROGRESS_STATUS.PENDING,
        label: t("childOverviewHomeworkPendingLabel"),
        value: homeworkPending,
        color: "#f59e0b",
      },
      {
        key: HOMEWORK_PROGRESS_STATUS.NOT_RECORDED,
        label: t("childOverviewHomeworkNotRecordedLabel"),
        value: homeworkNotRecorded,
        color: "#94a3b8",
      },
    ],
    [homeworkDone, homeworkNotRecorded, homeworkPending, t]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <CommunityDonutChart
        title={t("childOverviewChartIlmihalLessonsTitle")}
        subtitle={t("childOverviewChartIlmihalLessonsSubtitle")}
        titleIcon={PieChart}
        titleIconClassName="bg-emerald-50 text-emerald-700"
        segments={ilmihalProgressSegments}
        emptyText={t("childOverviewChartIlmihalLessonsEmpty")}
        noDataLabel={t("communityOverviewNoDataLabel")}
      />
      <CommunityDonutChart
        title={t("childOverviewChartAttendanceIlmihalTitle")}
        subtitle={t("childOverviewChartAttendanceIlmihalSubtitle")}
        titleIcon={PieChart}
        titleIconClassName="bg-orange-50 text-orange-700"
        segments={attendanceSegments}
        emptyText={t("childOverviewChartAttendanceIlmihalEmpty")}
        noDataLabel={t("communityOverviewNoDataLabel")}
      />
      <CommunityDonutChart
        title={t("childOverviewChartHomeworkTitle")}
        subtitle={t("childOverviewChartHomeworkSubtitle")}
        titleIcon={PieChart}
        titleIconClassName="bg-violet-50 text-violet-700"
        segments={homeworkSegments}
        emptyText={t("parentDashboardHomeworkUnknown")}
        noDataLabel={t("communityOverviewNoDataLabel")}
      />
    </div>
  );
}
