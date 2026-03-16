import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { ActivityReportDialog } from "./activity-report-dialog";
import { ActivitiesTable } from "./activities-table";
import { ActivityLecture } from "./types";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { DEFAULT_PAGE_SIZE } from "../common/use-pagination";
import { useActivitiesQuery } from "./use-activities-data";

type ActivitiesPanelProps = {
  enabled: boolean;
};

export function ActivitiesPanel({ enabled }: ActivitiesPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLecture | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityLecture | null>(null);

  const activities = useActivitiesQuery({ search, page, pageSize: DEFAULT_PAGE_SIZE }, enabled);
  const activityItems = activities.data?.items || [];
  const totalPages = Math.max(1, Math.ceil((activities.data?.total || 0) / DEFAULT_PAGE_SIZE));
  const currentPage = activities.data?.page || page;

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

  return (
    <Card className="min-w-0 flex flex-col gap-1 overflow-x-hidden p-5">
      {enabled ? (
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
          />

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
