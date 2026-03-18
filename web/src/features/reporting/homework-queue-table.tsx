import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { DataTable } from "../common/components/data-table";
import { Loader } from "../common/components/loader";
import { PaginationControls } from "../common/components/pagination-controls";
import { HomeworkQueueItem } from "./types";

type HomeworkQueueTableProps = {
  items: HomeworkQueueItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
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
  savingKey,
  isBulkSaving,
  onPageChange,
  onToggleDone,
  onBulkMarkDone,
}: HomeworkQueueTableProps) {
  const { t } = useTranslation();
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});

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
        tableClassName="min-w-[640px] border-collapse text-sm md:min-w-0 md:w-full md:table-fixed"
        headers={
          <>
            <th className="w-[7%] whitespace-nowrap border-b border-border px-3 py-3 align-middle font-medium">
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
            <th className="w-[35%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("usersTableName")}</th>
            <th className="w-[26%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("activityReportLessonPerChild")}</th>
            <th className="w-[32%] whitespace-nowrap border-b border-border px-3 py-3 font-medium">{t("homeworkQueueDoneLabel")}</th>
          </>
        }
      >
        {items.map((item) => {
          const rowKey = item.id;
          return (
            <tr key={rowKey} className="border-b border-border transition-colors hover:bg-slate-50">
              <td className="px-3 py-2.5 align-middle">
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
              <td className="px-3 py-2.5 font-medium text-slate-900">
                <span className="block truncate" title={`${item.child.firstName} ${item.child.lastName}`}>
                  {item.child.firstName} {item.child.lastName}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="block truncate" title={item.lesson.title}>
                  {item.lesson.title}
                </span>
              </td>
              <td className="px-3 py-2.5">
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
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={4}>
              <Loader size="lg" text={t("childrenLoading")} className="justify-center" />
            </td>
          </tr>
        ) : null}
        {!isLoading && !keys.size ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={4}>
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
