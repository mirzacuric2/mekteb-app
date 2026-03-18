import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
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
  isBulkCompleting?: boolean;
  onBulkComplete: (activities: ActivityLecture[]) => void | Promise<void>;
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
  isBulkCompleting,
  onBulkComplete,
}: ActivitiesTableProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedIds({});
  }, [activities]);

  const selectableDrafts = useMemo(
    () => activities.filter((activity) => activity.status === LECTURE_STATUS.DRAFT),
    [activities]
  );
  const selectedDrafts = useMemo(
    () => selectableDrafts.filter((activity) => selectedIds[activity.id]),
    [selectableDrafts, selectedIds]
  );
  const selectedCount = selectedDrafts.length;
  const allDraftsSelected = selectableDrafts.length > 0 && selectedCount === selectableDrafts.length;

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-border/70 bg-slate-50/60 px-2.5 py-2">
        <p className="text-xs text-slate-600">
          {selectedCount > 0 ? t("reportsSelectedCount", { count: selectedCount }) : t("reportsSelectRowsHint")}
        </p>
        <Button
          variant="outline"
          className="h-8 px-3 text-xs"
          disabled={!selectedCount || Boolean(isBulkCompleting)}
          onClick={() => onBulkComplete(selectedDrafts)}
        >
          {isBulkCompleting ? t("saving") : t("reportsMarkSelectedCompleted")}
        </Button>
      </div>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName="min-w-[900px] border-collapse text-sm md:min-w-0 md:w-full md:table-fixed"
        headers={
          <>
            <th className="w-[6%] whitespace-nowrap border-b border-border px-3 py-3 align-middle font-medium">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={allDraftsSelected}
                  onCheckedChange={(checked) => {
                    const next: Record<string, boolean> = {};
                    if (checked) {
                      for (const activity of selectableDrafts) {
                        next[activity.id] = true;
                      }
                    }
                    setSelectedIds(next);
                  }}
                  aria-label={t("reportsSelectAllDrafts")}
                />
              </div>
            </th>
            <th className="w-[28%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportTableTopic")}</th>
            <th className="w-[9%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportTableChildren")}</th>
            <th className="w-[14%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportTableStatus")}</th>
            <th className="w-[17%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportTableUpdatedAt")}</th>
            <th className="w-[16%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportTableCompleted")}</th>
            <th className="w-[10%] whitespace-nowrap border-b border-border px-3 py-3 text-right font-medium">
              <span className="sr-only">{t("usersTableActions")}</span>
            </th>
          </>
        }
      >
        {activities.map((activity) => (
          <tr key={activity.id} className="border-b border-border transition-colors hover:bg-slate-50">
            <td className="px-3 py-2.5">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={Boolean(selectedIds[activity.id])}
                  disabled={activity.status !== LECTURE_STATUS.DRAFT}
                  onCheckedChange={(checked) =>
                    setSelectedIds((current) => ({
                      ...current,
                      [activity.id]: Boolean(checked),
                    }))
                  }
                  aria-label={t("reportsSelectRow", { topic: activity.topic })}
                />
              </div>
            </td>
            <td className="px-3 py-2.5 font-medium text-slate-900">
              <span className="block truncate" title={activity.topic}>
                {activity.topic}
              </span>
              <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                {[
                  activity.nivo ? LESSON_NIVO_LABEL[activity.nivo] : null,
                  [...new Set((activity.attendance || []).map((entry) => entry.lesson?.title?.trim()).filter(Boolean))][0] || null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
            </td>
            <td className="px-3 py-2.5">{activity.attendance.length}</td>
            <td className="px-3 py-2.5">
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
            <td className="whitespace-nowrap px-3 py-2.5">
              <span className="block truncate" title={formatDateTime(activity.updatedAt)}>
                {formatDateTime(activity.updatedAt)}
              </span>
            </td>
            <td className="whitespace-nowrap px-3 py-2.5">
              {activity.completedAt ? (
                <span className="block truncate" title={formatDateTime(activity.completedAt)}>
                  {formatDateTime(activity.completedAt)}
                </span>
              ) : activity.status === LECTURE_STATUS.DRAFT ? (
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  aria-label={t("activityReportCompleteLecture")}
                  disabled={completingId === activity.id}
                  onClick={() => onComplete(activity)}
                >
                  {completingId === activity.id ? (
                    t("saving")
                  ) : (
                    <>
                      <Check size={14} aria-hidden />
                      {t("complete")}
                    </>
                  )}
                </Button>
              ) : (
                <span className="text-slate-400">{t("na")}</span>
              )}
            </td>
            <td className="px-3 py-2.5 text-right align-middle">
              <div className="flex justify-end gap-1.5">
                <EntityRowActions onEdit={() => onEdit(activity)} onDelete={() => onDelete(activity)} />
              </div>
            </td>
          </tr>
        ))}
        {isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={7}>
              <Loader size="lg" text={t("childrenLoading")} className="justify-center" />
            </td>
          </tr>
        ) : null}
        {!activities.length && !isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={7}>
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
