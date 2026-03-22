import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { Select } from "../../components/ui/select";
import { Tabs } from "../../components/ui/tabs";
import { ActivityReportDialog } from "./activity-report-dialog";
import { ActivitiesTable } from "./activities-table";
import { HomeworkQueueTable } from "./homework-queue-table";
import { HOMEWORK_QUEUE_STATUS_FILTER, LECTURE_STATUS } from "./reporting.constants";
import { ActivityLecture, HomeworkQueueItem } from "./types";
import { useSession } from "../auth/session-context";
import {
  ENTITY_LIST_TO_TABLE_STACK_CLASSNAME,
  ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME,
  EntityListToolbar,
  MANAGEMENT_PAGE_CARD_CLASSNAME,
} from "../common/components/entity-list-toolbar";
import { ROLE } from "../../types";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { useActivitiesQuery } from "./use-activities-data";
import { useHomeworkQueueQuery } from "./use-homework-queue-data";
import { useUpdateHomeworkMutation } from "./use-homework-queue-mutations";
import { LESSON_NIVO_LABEL, LESSON_NIVO_ORDER } from "../lessons/constants";
import { formatDate } from "../../lib/date-time";

type ActivitiesPanelProps = {
  enabled: boolean;
};

export function ActivitiesPanel({ enabled }: ActivitiesPanelProps) {
  const { t } = useTranslation();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const showCommunityColumn = session?.user.role === ROLE.SUPER_ADMIN;
  const [activeTab, setActiveTab] = useState("activities");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reportNivo, setReportNivo] = useState<number | undefined>(undefined);
  const [reportStatus, setReportStatus] = useState<string | undefined>(LECTURE_STATUS.DRAFT);
  const [homeworkSearch, setHomeworkSearch] = useState("");
  const [homeworkPage, setHomeworkPage] = useState(1);
  const [homeworkNivo, setHomeworkNivo] = useState<number | undefined>(undefined);
  const [homeworkLectureId, setHomeworkLectureId] = useState<string>("");
  const [savingHomeworkKey, setSavingHomeworkKey] = useState<string | undefined>(undefined);
  const [isBulkCompletingReports, setIsBulkCompletingReports] = useState(false);
  const [isBulkUpdatingHomework, setIsBulkUpdatingHomework] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLecture | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityLecture | null>(null);

  const activities = useActivitiesQuery(
    {
      search,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      nivo: reportNivo,
      status: reportStatus,
    },
    enabled
  );
  const activityItems = activities.data?.items || [];
  const totalPages = Math.max(1, Math.ceil((activities.data?.total || 0) / DEFAULT_PAGE_SIZE));
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
  const toCompactLectureTitle = (topic: string, nivoLabel: string) => {
    const trimmedTopic = topic.trim();
    const escapedNivoLabel = nivoLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicateNivoPrefix = new RegExp(`^${escapedNivoLabel}\\s*[-:]?\\s*`, "i");
    return trimmedTopic.replace(duplicateNivoPrefix, "").trim() || trimmedTopic;
  };
  const toLectureOptionLabel = (lecture: ActivityLecture) => {
    const reportDate = lecture.completedAt || lecture.createdAt;
    const lessonTitles = [...new Set((lecture.attendance || []).map((entry) => entry.lesson?.title?.trim()).filter(Boolean))];
    const homeworkTitles = [
      ...new Set((lecture.attendance || []).map((entry) => entry.homeworkTitle?.trim()).filter(Boolean)),
    ];
    const lectureTitle = lessonTitles[0] || lecture.topic;
    const nivoLabel =
      typeof lecture.nivo === "number"
        ? LESSON_NIVO_LABEL[lecture.nivo as keyof typeof LESSON_NIVO_LABEL]
        : "";
    const primaryLabel = homeworkTitles[0] || toCompactLectureTitle(lectureTitle, nivoLabel);
    return `${formatDate(reportDate)} - ${primaryLabel}`;
  };

  return (
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, "flex flex-col gap-1 overflow-x-hidden")}>
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
              <div className={ENTITY_LIST_TO_TABLE_STACK_CLASSNAME}>
                <div className="grid gap-2 md:grid-cols-3">
                  <EntityListToolbar
                    search={search}
                    onSearchChange={(value) => {
                      setSearch((prev) => {
                        if (prev !== value) setPage(1);
                        return value;
                      });
                    }}
                    placeholder={t("activitiesSearchPlaceholder")}
                  />
                  <Select
                    className={ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME}
                    value={reportNivo ? String(reportNivo) : ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReportNivo(value ? Number(value) : undefined);
                      setPage(1);
                    }}
                  >
                    <option value="">{t("reportsFilterAllNivos")}</option>
                    {LESSON_NIVO_ORDER.map((nivo) => (
                      <option key={nivo} value={String(nivo)}>
                        {LESSON_NIVO_LABEL[nivo]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className={ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME}
                    value={reportStatus || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReportStatus(value || undefined);
                      setPage(1);
                    }}
                  >
                    <option value="">{t("reportsFilterAllStatuses")}</option>
                    <option value={LECTURE_STATUS.DRAFT}>{t("reportsFilterStatusDraft")}</option>
                    <option value={LECTURE_STATUS.COMPLETED}>{t("reportsFilterStatusCompleted")}</option>
                  </Select>
                </div>

                <ActivitiesTable
                  activities={activityItems}
                  isLoading={activities.isLoading}
                  page={page}
                  totalPages={totalPages}
                  showCommunityColumn={showCommunityColumn}
                  onPageChange={setPage}
                  onEdit={(activity) => {
                    setEditingActivity(activity);
                    setFormOpen(true);
                  }}
                  onDelete={(activity) => setDeletingActivity(activity)}
                  onComplete={(activity) => completeActivity.mutate(activity.id)}
                  completingId={completeActivity.variables}
                  isBulkCompleting={isBulkCompletingReports}
                  onBulkComplete={async (selectedActivities) => {
                    if (!selectedActivities.length) return;
                    setIsBulkCompletingReports(true);
                    try {
                      await Promise.all(selectedActivities.map((activity) => api.post(`/lectures/${activity.id}/complete`)));
                      await queryClient.invalidateQueries({ queryKey: ["activities"] });
                      toast.success(t("reportsBulkCompleted", { count: selectedActivities.length }));
                    } catch (error) {
                      const message =
                        error instanceof AxiosError
                          ? ((error.response?.data as { message?: string } | undefined)?.message ?? t("reportsBulkCompleteFailed"))
                          : t("reportsBulkCompleteFailed");
                      toast.error(message);
                    } finally {
                      setIsBulkCompletingReports(false);
                    }
                  }}
                />
              </div>
            ) : (
              <div className={ENTITY_LIST_TO_TABLE_STACK_CLASSNAME}>
                <div className="grid gap-2 md:grid-cols-3">
                  <EntityListToolbar
                    search={homeworkSearch}
                    onSearchChange={(value) => {
                      setHomeworkSearch((prev) => {
                        if (prev !== value) setHomeworkPage(1);
                        return value;
                      });
                    }}
                    placeholder={t("homeworkQueueSearchPlaceholder")}
                  />
                  <Select
                    className={ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME}
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
                    className={ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME}
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
                        {toLectureOptionLabel(lecture)}
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
                    page={homeworkPage}
                    totalPages={homeworkTotalPages}
                    showCommunityColumn={showCommunityColumn}
                    savingKey={savingHomeworkKey}
                    isBulkSaving={isBulkUpdatingHomework}
                    onPageChange={setHomeworkPage}
                    onToggleDone={async (item, done) => {
                      setSavingHomeworkKey(item.id);
                      try {
                        await updateHomework.mutateAsync({
                          lectureId: item.lectureId,
                          childId: item.childId,
                          done,
                        });
                      } finally {
                        setSavingHomeworkKey(undefined);
                      }
                    }}
                    onBulkMarkDone={async (selectedItems: HomeworkQueueItem[]) => {
                      if (!selectedItems.length) return;
                      setIsBulkUpdatingHomework(true);
                      try {
                        await Promise.all(
                          selectedItems.map((item) =>
                            api.patch(`/homework/${item.lectureId}/${item.childId}`, {
                              done: true,
                            })
                          )
                        );
                        await queryClient.invalidateQueries({ queryKey: ["homework-queue"] });
                        await queryClient.invalidateQueries({ queryKey: ["activities"] });
                        await queryClient.invalidateQueries({ queryKey: ["progress-overview-children"] });
                        toast.success(t("homeworkQueueBulkUpdated", { count: selectedItems.length }));
                      } catch (error) {
                        const message =
                          error instanceof AxiosError
                            ? ((error.response?.data as { message?: string } | undefined)?.message ??
                              t("homeworkQueueBulkUpdateFailed"))
                            : t("homeworkQueueBulkUpdateFailed");
                        toast.error(message);
                      } finally {
                        setIsBulkUpdatingHomework(false);
                      }
                    }}
                  />
                )}
              </div>
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
