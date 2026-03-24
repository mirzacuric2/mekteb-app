import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import type { ChildLessonOutcome } from "../children/types";

export type PatchChildLessonOutcomePayload = {
  childId: string;
  lessonId: string;
  passed: boolean | null;
  mark: number | null;
};

/** Backend: `ADMIN` / `SUPER_ADMIN` only; use only with `canSetChildLessonOutcomes` in UI. */
export function usePatchChildLessonOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, lessonId, passed, mark }: PatchChildLessonOutcomePayload) => {
      const { data } = await api.patch<ChildLessonOutcome>(
        `/children/${childId}/lesson-outcomes/${lessonId}`,
        { passed, mark }
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview-children"] });
      await queryClient.invalidateQueries({ queryKey: ["children-by-id"] });
    },
  });
}
