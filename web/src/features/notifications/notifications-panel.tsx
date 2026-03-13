import { Card } from "../../components/ui/card";
import { useAuthedQuery } from "../common/use-authed-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { Button } from "../../components/ui/button";

export function NotificationsPanel() {
  const notifications = useAuthedQuery<any[]>("notifications", "/notifications", true);
  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Notifications</h3>
      <ul className="space-y-1 text-sm">
        {(notifications.data || []).map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
            <span className={item.isRead ? "text-slate-500" : "font-medium"}>
              {item.title}: {item.body}
            </span>
            {!item.isRead ? (
              <Button variant="outline" onClick={() => markRead.mutate(item.id)}>
                Mark read
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
