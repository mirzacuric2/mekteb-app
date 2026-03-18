import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { MESSAGE_API_PATH, MESSAGE_QUERY_KEY } from "./constants";
import { MessageContextDraft } from "./types";

type SendMessagePayload = {
  receiverId: string;
  content: string;
  threadId?: string;
  context?: MessageContextDraft;
};

type CloseMessageThreadPayload = {
  threadId: string;
  note?: string;
};

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => (await api.post(MESSAGE_API_PATH.SEND, payload)).data,
    onSuccess: async (data: { threadId?: string }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [MESSAGE_QUERY_KEY.THREADS] }),
        data?.threadId
          ? queryClient.invalidateQueries({ queryKey: [MESSAGE_QUERY_KEY.THREAD, data.threadId] })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useCloseMessageThreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CloseMessageThreadPayload) =>
      (await api.post(`${MESSAGE_API_PATH.THREADS}/${payload.threadId}/close`, { note: payload.note })).data,
    onSuccess: async (_data: unknown, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [MESSAGE_QUERY_KEY.THREADS] }),
        queryClient.invalidateQueries({ queryKey: [MESSAGE_QUERY_KEY.THREAD, variables.threadId] }),
      ]);
    },
  });
}
