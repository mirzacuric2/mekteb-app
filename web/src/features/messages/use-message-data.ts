import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { useSession } from "../auth/session-context";
import { MESSAGE_API_PATH, MESSAGE_POLL_INTERVAL_MS, MESSAGE_QUERY_KEY } from "./constants";
import { MessageReceiver, MessageThreadDetails, MessageThreadSummary } from "./types";

export function useMessageThreadsQuery(enabled: boolean) {
  return useQuery<MessageThreadSummary[]>({
    queryKey: [MESSAGE_QUERY_KEY.THREADS],
    queryFn: async () => (await api.get(MESSAGE_API_PATH.THREADS)).data,
    enabled,
    refetchInterval: MESSAGE_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMessageThreadQuery(threadId: string | null, enabled: boolean) {
  return useQuery<MessageThreadDetails>({
    queryKey: [MESSAGE_QUERY_KEY.THREAD, threadId],
    queryFn: async () => (await api.get(`${MESSAGE_API_PATH.THREADS}/${threadId}/messages`)).data,
    enabled: enabled && Boolean(threadId),
    refetchInterval: MESSAGE_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMessageReceiversQuery(enabled: boolean) {
  const { session } = useSession();
  return useQuery<MessageReceiver[]>({
    queryKey: [MESSAGE_QUERY_KEY.RECEIVERS, session?.user.role],
    queryFn: async () => {
      const items = (await api.get<MessageReceiver[]>(MESSAGE_API_PATH.RECEIVERS)).data || [];
      if (!session) return [];
      return items.filter((item) => item.id !== session.user.id);
    },
    enabled: enabled && Boolean(session),
    staleTime: MESSAGE_POLL_INTERVAL_MS,
  });
}
