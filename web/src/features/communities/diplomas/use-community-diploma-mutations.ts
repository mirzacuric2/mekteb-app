import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api";
import { COMMUNITIES_QUERY_KEY } from "../constants";
import type { CommunityDiplomaSettingsPayload } from "./community-diploma-schema";

const MAX_TEMPLATE_BYTES = 15 * 1024 * 1024;

export function useCommunityDiplomaMutations(communityId: string | undefined) {
  const queryClient = useQueryClient();

  const patchSettings = useMutation({
    mutationFn: async (payload: CommunityDiplomaSettingsPayload) => {
      if (!communityId) throw new Error("Missing community");
      const res = await api.patch(`/communities/${communityId}/diploma-settings`, payload);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      if (communityId) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", communityId] });
      }
    },
  });

  const uploadTemplate = useMutation({
    mutationFn: async (file: File) => {
      if (!communityId) throw new Error("Missing community");
      if (file.size > MAX_TEMPLATE_BYTES) {
        throw new Error("TEMPLATE_TOO_LARGE");
      }
      const buf = await file.arrayBuffer();
      await api.put(`/communities/${communityId}/diploma-template`, buf, {
        headers: { "Content-Type": "application/pdf" },
        maxBodyLength: MAX_TEMPLATE_BYTES,
        maxContentLength: MAX_TEMPLATE_BYTES,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      if (communityId) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", communityId] });
        await queryClient.invalidateQueries({ queryKey: ["community-diploma-template-bytes", communityId] });
      }
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async () => {
      if (!communityId) throw new Error("Missing community");
      await api.delete(`/communities/${communityId}/diploma-template`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] });
      if (communityId) {
        await queryClient.invalidateQueries({ queryKey: ["community-details", communityId] });
        await queryClient.invalidateQueries({ queryKey: ["community-diploma-template-bytes", communityId] });
      }
    },
  });

  return { patchSettings, uploadTemplate, deleteTemplate };
}
