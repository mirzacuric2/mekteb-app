import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { DataTable } from "../common/components/data-table";
import { Loader } from "../common/components/loader";
import { PaginationControls } from "../common/components/pagination-controls";
import { LESSON_NIVO_LABEL } from "../lessons/constants";
import { HomeworkQueueItem } from "./types";

type HomeworkQueueTableProps = {
  items: HomeworkQueueItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  savingKey?: string;
  onPageChange: (page: number) => void;
  onSave: (item: HomeworkQueueItem, values: { done: boolean }) => void;
};

export function HomeworkQueueTable({
  items,
  isLoading,
  page,
  totalPages,
  savingKey,
  onPageChange,
  onSave,
}: HomeworkQueueTableProps) {
  const { t } = useTranslation();
  const [draftByKey, setDraftByKey] = useState<Record<string, { done: boolean; title: string; description: string }>>({});

  useEffect(() => {
    const next: Record<string, { done: boolean; title: string; description: string }> = {};
    for (const item of items) {
      next[`${item.childId}::${item.lessonId}`] = {
        done: item.done,
        title: item.title,
        description: item.description || "",
      };
    }
    setDraftByKey(next);
  }, [items]);

  const keys = useMemo(() => new Set(items.map((item) => `${item.childId}::${item.lessonId}`)), [items]);

  return (
    <>
      <DataTable
        className="overflow-hidden"
        scrollClassName="overflow-x-auto !overflow-y-hidden"
        tableClassName="w-full min-w-[1150px] border-collapse text-sm"
        headers={
          <>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("usersTableName")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("childrenNivoLabel")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportLessonPerChild")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("activityReportHomeworkTitle")}</th>
            <th className="whitespace-nowrap border-b border-border px-5 py-3.5 font-medium">{t("homeworkQueueDoneLabel")}</th>
            <th className="w-[130px] whitespace-nowrap border-b border-border px-5 py-3.5 text-right font-medium">
              <span className="sr-only">{t("save")}</span>
            </th>
          </>
        }
      >
        {items.map((item) => {
          const rowKey = `${item.childId}::${item.lessonId}`;
          const draft = draftByKey[rowKey] ?? { done: item.done, title: item.title, description: item.description || "" };
          const changed = draft.done !== item.done;
          return (
            <tr key={rowKey} className="border-b border-border transition-colors hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
                {item.child.firstName} {item.child.lastName}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">{LESSON_NIVO_LABEL[item.child.nivo]}</td>
              <td className="whitespace-nowrap px-5 py-3.5">{item.lesson.title}</td>
              <td className="px-5 py-3.5">{item.title}</td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.done}
                    onCheckedChange={(checked) =>
                      setDraftByKey((current) => ({
                        ...current,
                        [rowKey]: { ...draft, done: checked },
                      }))
                    }
                    aria-label={t("homeworkQueueDoneLabel")}
                  />
                  <span className="text-xs text-slate-600">
                    {draft.done ? t("activityReportHomeworkDone") : t("activityReportHomeworkNotDone")}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-right">
                <Button
                  variant="outline"
                  disabled={!changed || savingKey === rowKey}
                  onClick={() => onSave(item, { done: draft.done })}
                >
                  {savingKey === rowKey ? t("saving") : t("save")}
                </Button>
              </td>
            </tr>
          );
        })}
        {isLoading ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={6}>
              <Loader size="lg" text={t("childrenLoading")} className="justify-center" />
            </td>
          </tr>
        ) : null}
        {!isLoading && !keys.size ? (
          <tr>
            <td className="px-5 py-10 text-center text-slate-500" colSpan={6}>
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
