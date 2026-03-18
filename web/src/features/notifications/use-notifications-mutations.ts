import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { NOTIFICATIONS_QUERY_KEY } from "./use-notifications-data";

export function useNotificationsMutations() {
  const queryClient = useQueryClient();

  const invalidateNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
  };

  const markAsRead = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: invalidateNotifications,
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => (await api.patch("/notifications/read-all")).data,
    onSuccess: invalidateNotifications,
  });

  const removeNotification = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: invalidateNotifications,
  });

  return {
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
