import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";

export type BulkLessonOutcomeItem = {
  childId: string;
  passed: boolean;
  mark: number | null;
};

export type BulkLessonOutcomesPayload = {
  lessonId: string;
  items: BulkLessonOutcomeItem[];
};

export function useBulkLessonOutcomesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkLessonOutcomesPayload) => {
      const { data } = await api.post<{ updated: number }>("/children/lesson-outcomes/bulk", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview-children"] });
      await queryClient.invalidateQueries({ queryKey: ["children-by-id"] });
      await queryClient.invalidateQueries({ queryKey: ["bulk-lesson-outcome-children"] });
    },
  });
}
