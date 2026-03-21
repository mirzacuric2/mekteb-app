import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "../../../api";
import {
  DEFAULT_DIPLOMA_TEMPLATE_PUBLIC_PATH,
  DIPLOMA_TEMPLATE_ERR_CUSTOM_NOT_FOUND,
  DIPLOMA_TEMPLATE_ERR_DEFAULT_ASSET,
} from "../../diplomas/diploma-template-constants";

export function useCommunityDiplomaTemplateBytes(
  communityId: string | undefined,
  hasCustomDiplomaTemplate: boolean | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["community-diploma-template-bytes", communityId, hasCustomDiplomaTemplate],
    queryFn: async (): Promise<ArrayBuffer> => {
      if (!communityId) throw new Error("Missing community");
      if (hasCustomDiplomaTemplate) {
        try {
          const res = await api.get(`/communities/${communityId}/diploma-template`, { responseType: "arraybuffer" });
          return res.data as ArrayBuffer;
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 404) {
            throw new Error(DIPLOMA_TEMPLATE_ERR_CUSTOM_NOT_FOUND);
          }
          throw e;
        }
      }
      const r = await fetch(DEFAULT_DIPLOMA_TEMPLATE_PUBLIC_PATH);
      if (!r.ok) throw new Error(DIPLOMA_TEMPLATE_ERR_DEFAULT_ASSET);
      return r.arrayBuffer();
    },
    enabled: Boolean(communityId) && enabled && typeof hasCustomDiplomaTemplate === "boolean",
  });
}
