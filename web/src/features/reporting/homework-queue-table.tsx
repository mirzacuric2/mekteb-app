import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { DataTable } from "../common/components/data-table";
import { PaginationControls } from "../common/components/pagination-controls";
import { TableLoadingRow } from "../common/components/table-loading-row";
import { HomeworkQueueItem } from "./types";

type HomeworkQueueTableProps = {
  items: HomeworkQueueItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  showCommunityColumn?: boolean;
  savingKey?: string;
  isBulkSaving?: boolean;
  onPageChange: (page: number) => void;
  onToggleDone: (item: HomeworkQueueItem, done: boolean) => void;
  onBulkMarkDone: (items: HomeworkQueueItem[]) => void | Promise<void>;
};

export function HomeworkQueueTable({
  items,
  isLoading,
  page,
  totalPages,
  showCommunityColumn = false,
  savingKey,
  isBulkSaving,
  onPageChange,
  onToggleDone,
  onBulkMarkDone,
}: HomeworkQueueTableProps) {
  const { t } = useTranslation();
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const colSpan = showCommunityColumn ? 5 : 4;

  const keys = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const selectedItems = useMemo(() => items.filter((item) => selectedKeys[item.id]), [items, selectedKeys]);
  const selectedCount = selectedItems.length;
  const allSelectableSelected = items.length > 0 && selectedCount === items.length;

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-border/70 bg-slate-50/60 px-2.5 py-2">
        <p className="text-xs text-slate-600">
          {selectedCount > 0 ? t("homeworkQueueSelectedCount", { count: selectedCount }) : t("homeworkQueueSelectRowsHint")}
        </p>
        <Button
          variant="outline"
          className="h-8 px-3 text-xs"
          disabled={!selectedCount || Boolean(isBulkSaving)}
          onClick={() => onBulkMarkDone(selectedItems)}
        >
          {isBulkSaving ? t("saving") : t("homeworkQueueMarkSelectedDone")}
        </Button>
      </div>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName={`${showCommunityColumn ? "min-w-[760px]" : "min-w-[640px]"} border-collapse text-sm md:min-w-0 md:w-full md:table-fixed`}
        headers={
          <>
            <th className="w-[7%] !text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={allSelectableSelected}
                  onCheckedChange={(checked) => {
                    const next: Record<string, boolean> = {};
                    if (checked) {
                      for (const item of items) {
                        next[item.id] = true;
                      }
                    }
                    setSelectedKeys(next);
                  }}
                  aria-label={t("homeworkQueueSelectAll")}
                />
              </div>
            </th>
            <th className="w-[30%]">{t("usersTableName")}</th>
            {showCommunityColumn ? (
              <th className="w-[18%]">{t("usersTableCommunity")}</th>
            ) : null}
            <th className="w-[24%]">{t("activityReportLessonPerChild")}</th>
            <th className="w-[28%]">{t("homeworkQueueDoneLabel")}</th>
          </>
        }
      >
        {items.map((item) => {
          const rowKey = item.id;
          return (
            <tr key={rowKey} className="border-b border-border transition-colors hover:bg-slate-50">
              <td>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={Boolean(selectedKeys[rowKey])}
                    onCheckedChange={(checked) =>
                      setSelectedKeys((current) => ({
                        ...current,
                        [rowKey]: Boolean(checked),
                      }))
                    }
                    aria-label={t("homeworkQueueSelectRow", {
                      child: `${item.child.firstName} ${item.child.lastName}`,
                    })}
                  />
                </div>
              </td>
              <td className="font-medium text-slate-900">
                <span className="block truncate" title={`${item.child.firstName} ${item.child.lastName}`}>
                  {item.child.firstName} {item.child.lastName}
                </span>
              </td>
              {showCommunityColumn ? (
                <td>
                  <span className="block truncate" title={item.lecture.community?.name || ""}>
                    {item.lecture.community?.name?.trim() ? item.lecture.community.name : t("na")}
                  </span>
                </td>
              ) : null}
              <td>
                <span className="block truncate" title={item.lesson.title}>
                  {item.lesson.title}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.done}
                    disabled={savingKey === rowKey || Boolean(isBulkSaving)}
                    onCheckedChange={(checked) => onToggleDone(item, checked)}
                    aria-label={t("homeworkQueueDoneLabel")}
                  />
                  <span className="text-xs text-slate-600">
                    {item.done ? t("homeworkQueueDoneLabel") : t("parentDashboardPendingCompactLabel", { count: 1 })}
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
        {isLoading ? (
          <TableLoadingRow colSpan={colSpan} text={t("reportingLoading")} />
        ) : null}
        {!isLoading && !keys.size ? (
          <tr>
            <td className="!py-10 !text-center text-slate-500" colSpan={colSpan}>
              {t("homeworkQueueNoResults")}
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
