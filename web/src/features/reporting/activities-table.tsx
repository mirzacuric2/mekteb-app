import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { Loader } from "../common/components/loader";
import { PaginationControls } from "../common/components/pagination-controls";
import { LESSON_NIVO_LABEL } from "../lessons/constants";
import { LECTURE_STATUS } from "./reporting.constants";
import { ActivityLecture } from "./types";
import { formatDateTime } from "../../lib/date-time";

type ActivitiesTableProps = {
  activities: ActivityLecture[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (activity: ActivityLecture) => void;
  onDelete: (activity: ActivityLecture) => void;
  onComplete: (activity: ActivityLecture) => void;
  completingId?: string;
};

export function ActivitiesTable({
  activities,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onComplete,
  completingId,
}: ActivitiesTableProps) {
  const { t } = useTranslation();

  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName="w-full min-w-[980px] border-collapse text-sm"
        headers={
          <>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableTopic")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("childrenNivoLabel")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableChildren")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableStatus")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableCreatedAt")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableUpdatedAt")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportTableCompletedAt")}</th>
            <th className="w-[220px] whitespace-nowrap border-b border-border px-5 py-3.5 text-right font-medium">
              <span className="sr-only">{t("usersTableActions")}</span>
            </th>
          </>
        }
      >
        {activities.map((activity) => (
          <tr key={activity.id} className="border-b border-border transition-colors hover:bg-slate-50">
            <td className="px-5 py-3.5 font-medium text-slate-900">{activity.topic}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              {activity.nivo ? LESSON_NIVO_LABEL[activity.nivo] : t("na")}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{activity.attendance.length}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  activity.status === LECTURE_STATUS.COMPLETED
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {activity.status === LECTURE_STATUS.COMPLETED ? t("activityReportStatusCompleted") : t("activityReportStatusDraft")}
              </span>
            </td>
            <td className="whitespace-nowrap px-5 py-3.5">{formatDateTime(activity.createdAt)}</td>
            <td className="whitespace-nowrap px-5 py-3.5">{formatDateTime(activity.updatedAt)}</td>
            <td className="whitespace-nowrap px-5 py-3.5">
              {activity.completedAt ? formatDateTime(activity.completedAt) : <span className="text-slate-400">{t("na")}</span>}
            </td>
            <td className="w-[220px] whitespace-nowrap px-5 py-3.5 text-right align-middle">
              <div className="flex justify-end gap-2">
                {activity.status === LECTURE_STATUS.DRAFT ? (
                  <Button
                    variant="outline"
                    className="h-9"
                    disabled={completingId === activity.id}
                    onClick={() => onComplete(activity)}
                  >
                    {completingId === activity.id ? t("activityReportCompletingLecture") : t("activityReportCompleteLecture")}
                  </Button>
                ) : null}
                <EntityRowActions onEdit={() => onEdit(activity)} onDelete={() => onDelete(activity)} />
              </div>
            </td>
          </tr>
        ))}
        {isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={8}>
              <Loader size="lg" text={t("childrenLoading")} className="justify-center" />
            </td>
          </tr>
        ) : null}
        {!activities.length && !isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={8}>
              {t("activitiesNoResults")}
            </td>
          </tr>
        ) : null}
      </DataTable>

      <div className="shrink-0 pt-5">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}
