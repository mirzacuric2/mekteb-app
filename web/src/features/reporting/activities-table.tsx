import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { DataTable } from "../common/components/data-table";
import { EntityRowActions } from "../common/components/entity-row-actions";
import { PaginationControls } from "../common/components/pagination-controls";
import { StatusBadge } from "../common/components/status-badge";
import { TableLoadingRow } from "../common/components/table-loading-row";
import { LESSON_NIVO_LABEL } from "../lessons/constants";
import { LECTURE_STATUS } from "./reporting.constants";
import { ActivityLecture } from "./types";
import { formatDateTime } from "../../lib/date-time";

type ActivitiesTableProps = {
  activities: ActivityLecture[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  showCommunityColumn?: boolean;
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
  showCommunityColumn = false,
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
  const colSpan = showCommunityColumn ? 8 : 7;

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
        tableClassName={`border-collapse text-sm md:w-full md:table-fixed ${
          showCommunityColumn ? "min-w-[980px]" : "min-w-[900px]"
        } md:min-w-0`}
        headers={
          <>
            {/* Percent widths must sum to 100% with `table-fixed` or columns overlap. */}
            <th className="w-[5%] text-center">
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
            <th className={showCommunityColumn ? "w-[20%]" : "w-[31%]"}>{t("activityReportTableTopic")}</th>
            {showCommunityColumn ? (
              <th className="w-[11%]">{t("usersTableCommunity")}</th>
            ) : null}
            <th className="w-[7%]">{t("activityReportTableChildren")}</th>
            <th className="w-[10%]">{t("activityReportTableStatus")}</th>
            <th className="w-[12%]">{t("activityReportTableUpdatedAt")}</th>
            <th className="w-[19%]">{t("activityReportTableCompleted")}</th>
            <th className="w-[16%] !text-right">
              <span className="sr-only">{t("usersTableActions")}</span>
            </th>
          </>
        }
      >
        {activities.map((activity) => (
          <tr key={activity.id} className="border-b border-border transition-colors hover:bg-slate-50">
            <td>
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
            <td className="min-w-0 font-medium text-slate-900">
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
            {showCommunityColumn ? (
              <td className="px-3 py-3">
                <span className="block truncate" title={activity.community?.name || ""}>
                  {activity.community?.name?.trim() ? activity.community.name : t("na")}
                </span>
              </td>
            ) : null}
            <td>{activity.attendance.length}</td>
            <td>
              <StatusBadge
                status={activity.status}
                labelKey={
                  activity.status === LECTURE_STATUS.COMPLETED
                    ? "activityReportStatusCompleted"
                    : "activityReportStatusDraft"
                }
              />
            </td>
            <td className="whitespace-nowrap">
              <span className="block truncate" title={formatDateTime(activity.updatedAt)}>
                {formatDateTime(activity.updatedAt)}
              </span>
            </td>
            <td className="min-w-0 whitespace-nowrap">
              {activity.completedAt ? (
                <span className="block truncate" title={formatDateTime(activity.completedAt)}>
                  {formatDateTime(activity.completedAt)}
                </span>
              ) : activity.status === LECTURE_STATUS.DRAFT ? (
                <Button
                  variant="outline"
                  className="h-8 shrink-0 whitespace-nowrap px-2.5 text-xs"
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
            <td className="min-w-0 !text-right">
              <div className="flex justify-end gap-1.5">
                <EntityRowActions onEdit={() => onEdit(activity)} onDelete={() => onDelete(activity)} />
              </div>
            </td>
          </tr>
        ))}
        {isLoading ? (
          <TableLoadingRow colSpan={colSpan} text={t("reportingLoading")} />
        ) : null}
        {!activities.length && !isLoading ? (
          <tr>
            <td className="!py-10 !text-center text-slate-500" colSpan={colSpan}>
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
