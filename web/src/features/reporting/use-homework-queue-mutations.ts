import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../../api";

type UpdateHomeworkPayload = {
  childId: string;
  lessonId: string;
  done?: boolean;
  title?: string;
  description?: string;
};

export function useUpdateHomeworkMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, lessonId, ...payload }: UpdateHomeworkPayload) =>
      (await api.patch(`/homework/${childId}/${lessonId}`, payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["homework-queue"] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview-children"] });
      toast.success(t("homeworkQueueUpdated"));
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? t("homeworkQueueUpdateFailed"))
          : t("homeworkQueueUpdateFailed");
      toast.error(message);
    },
  });
}
