import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Select } from "../../components/ui/select";
import { Tabs } from "../../components/ui/tabs";
import { ActivityReportDialog } from "./activity-report-dialog";
import { ActivitiesTable } from "./activities-table";
import { HomeworkQueueTable } from "./homework-queue-table";
import { HOMEWORK_QUEUE_STATUS_FILTER, LECTURE_STATUS } from "./reporting.constants";
import { ActivityLecture } from "./types";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { useActivitiesQuery } from "./use-activities-data";
import { useHomeworkQueueQuery } from "./use-homework-queue-data";
import { useUpdateHomeworkMutation } from "./use-homework-queue-mutations";
import { LESSON_NIVO_LABEL, LESSON_NIVO_ORDER } from "../lessons/constants";

type ActivitiesPanelProps = {
  enabled: boolean;
};

export function ActivitiesPanel({ enabled }: ActivitiesPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("activities");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [homeworkSearch, setHomeworkSearch] = useState("");
  const [homeworkPage, setHomeworkPage] = useState(1);
  const [homeworkNivo, setHomeworkNivo] = useState<number | undefined>(undefined);
  const [homeworkLectureId, setHomeworkLectureId] = useState<string>("");
  const [savingHomeworkKey, setSavingHomeworkKey] = useState<string | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLecture | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityLecture | null>(null);

  const activities = useActivitiesQuery({ search, page, pageSize: DEFAULT_PAGE_SIZE }, enabled);
  const activityItems = activities.data?.items || [];
  const totalPages = Math.max(1, Math.ceil((activities.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const currentPage = activities.data?.page || page;
  const homework = useHomeworkQueueQuery(
    {
      search: homeworkSearch,
      page: homeworkPage,
      pageSize: DEFAULT_PAGE_SIZE,
      status: HOMEWORK_QUEUE_STATUS_FILTER.PENDING,
      nivo: homeworkNivo,
      lectureId: homeworkLectureId || undefined,
    },
    enabled && activeTab === "homework" && Boolean(homeworkLectureId)
  );
  const homeworkLectureOptions = useActivitiesQuery(
    {
      search: "",
      page: 1,
      pageSize: 100,
      nivo: homeworkNivo,
      status: undefined,
    },
    enabled && activeTab === "homework" && typeof homeworkNivo === "number"
  );
  const homeworkItems = homework.data?.items || [];
  const homeworkTotalPages = Math.max(1, Math.ceil((homework.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const homeworkCurrentPage = homework.data?.page || homeworkPage;

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => api.delete(`/lectures/${id}`),
    onSuccess: async () => {
      setDeletingActivity(null);
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success(t("activityReportDeleted"));
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? t("activityReportDeleteFailed"))
          : t("activityReportDeleteFailed");
      toast.error(message);
    },
  });
  const completeActivity = useMutation({
    mutationFn: async (id: string) => (await api.post(`/lectures/${id}/complete`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success(t("activityReportCompleted"));
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? t("activityReportCompleteFailed"))
          : t("activityReportCompleteFailed");
      toast.error(message);
    },
  });
  const updateHomework = useUpdateHomeworkMutation();

  return (
    <Card className="min-w-0 flex flex-col gap-1 overflow-x-hidden p-5">
      {enabled ? (
        <>
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            tabs={[
              { key: "activities", label: t("activityReportActivitiesTab") },
              { key: "homework", label: t("homeworkQueueTabTitle") },
            ]}
          >
            {activeTab === "activities" ? (
              <>
                <div className="shrink-0 space-y-6 pb-2">
                  <EntityListToolbar
                    search={search}
                    onSearchChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder={t("activitiesSearchPlaceholder")}
                  />
                </div>

                <ActivitiesTable
                  activities={activityItems}
                  isLoading={activities.isLoading}
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onEdit={(activity) => {
                    setEditingActivity(activity);
                    setFormOpen(true);
                  }}
                  onDelete={(activity) => setDeletingActivity(activity)}
                  onComplete={(activity) => completeActivity.mutate(activity.id)}
                  completingId={completeActivity.variables}
                />
              </>
            ) : (
              <>
                <div className="grid gap-3 pb-2 md:grid-cols-3">
                  <EntityListToolbar
                    search={homeworkSearch}
                    onSearchChange={(value) => {
                      setHomeworkSearch(value);
                      setHomeworkPage(1);
                    }}
                    placeholder={t("homeworkQueueSearchPlaceholder")}
                  />
                  <Select
                    value={homeworkNivo ? String(homeworkNivo) : ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setHomeworkNivo(value ? Number(value) : undefined);
                      setHomeworkLectureId("");
                      setHomeworkPage(1);
                    }}
                  >
                    <option value="">{t("homeworkQueueSelectNivo")}</option>
                    {LESSON_NIVO_ORDER.map((nivo) => (
                      <option key={nivo} value={String(nivo)}>
                        {LESSON_NIVO_LABEL[nivo]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={homeworkLectureId}
                    onChange={(event) => {
                      setHomeworkLectureId(event.target.value);
                      setHomeworkPage(1);
                    }}
                    disabled={typeof homeworkNivo !== "number"}
                  >
                    <option value="">{t("homeworkQueueSelectLecture")}</option>
                    {(homeworkLectureOptions.data?.items || []).map((lecture) => (
                      <option key={lecture.id} value={lecture.id}>
                        {lecture.status === LECTURE_STATUS.COMPLETED
                          ? `${lecture.topic} (${t("activityReportStatusCompleted")})`
                          : `${lecture.topic} (${t("activityReportStatusDraft")})`}
                      </option>
                    ))}
                  </Select>
                </div>
                {!homeworkLectureId ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-slate-500">
                    {t("homeworkQueueSelectLectureHint")}
                  </div>
                ) : (
                  <HomeworkQueueTable
                    items={homeworkItems}
                    isLoading={homework.isLoading}
                    page={homeworkCurrentPage}
                    totalPages={homeworkTotalPages}
                    savingKey={savingHomeworkKey}
                    onPageChange={setHomeworkPage}
                    onSave={async (item, values) => {
                      setSavingHomeworkKey(`${item.childId}::${item.lessonId}`);
                      try {
                        await updateHomework.mutateAsync({
                          childId: item.childId,
                          lessonId: item.lessonId,
                          done: values.done,
                        });
                      } finally {
                        setSavingHomeworkKey(undefined);
                      }
                    }}
                  />
                )}
              </>
            )}
          </Tabs>

          <ActivityReportDialog
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingActivity(null);
            }}
            editingActivity={editingActivity}
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: ["activities"] });
            }}
          />

          <DeleteConfirmDialog
            open={!!deletingActivity}
            onOpenChange={(open) => {
              if (!open) setDeletingActivity(null);
            }}
            title={t("activityReportDeleteTitle")}
            description={
              deletingActivity
                ? t("activityReportDeleteDescription", { topic: deletingActivity.topic })
                : t("activityReportDeleteDescriptionFallback")
            }
            confirmText={t("delete")}
            submitting={deleteActivity.isPending}
            onConfirm={() => {
              if (!deletingActivity) return;
              deleteActivity.mutate(deletingActivity.id);
            }}
          />
        </>
      ) : (
        <p className="text-sm text-slate-500">{t("activitiesVisibilityHint")}</p>
      )}
    </Card>
  );
}
