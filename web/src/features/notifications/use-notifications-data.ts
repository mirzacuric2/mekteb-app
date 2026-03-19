import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { useSession } from "../auth/session-context";
import { NotificationBellResponse, NotificationListResponse, NotificationRecord } from "./types";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

type NotificationsParams = {
  limit?: number;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  includeUnreadCount?: boolean;
};

export function useNotificationsData(params?: NotificationsParams) {
  const { session } = useSession();

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, params || {}],
    queryFn: async () => {
      const response = await api.get<NotificationRecord[] | NotificationListResponse>("/notifications", {
        params: {
          ...(params?.limit ? { limit: params.limit } : {}),
          ...(params?.page ? { page: params.page } : {}),
          ...(params?.pageSize ? { pageSize: params.pageSize } : {}),
          ...(typeof params?.unreadOnly === "boolean" ? { unreadOnly: params.unreadOnly ? 1 : 0 } : {}),
          ...(typeof params?.includeUnreadCount === "boolean"
            ? { includeUnreadCount: params.includeUnreadCount ? 1 : 0 }
            : {}),
        },
      });
      return response.data;
    },
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });
}

export function useNotificationBellData(limit = 5) {
  const { session } = useSession();

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "bell", limit],
    queryFn: async () => {
      const response = await api.get<NotificationBellResponse>("/notifications", {
        params: {
          limit,
          includeUnreadCount: 1,
        },
      });
      return response.data;
    },
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });
}
