import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { formatDateTime } from "../../lib/date-time";
import { useNavigate } from "react-router-dom";
import { useNotificationsData } from "./use-notifications-data";
import { useNotificationsMutations } from "./use-notifications-mutations";
import { getNotificationTargetPath } from "./navigation";
import { Loader } from "../common/components/loader";

export function NotificationsPanel() {
  const navigate = useNavigate();
  const notifications = useNotificationsData();
  const { markAsRead, markAllAsRead, removeNotification } = useNotificationsMutations();
  const items = Array.isArray(notifications.data) ? notifications.data : notifications.data?.items || [];
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => markAllAsRead.mutate()} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {notifications.isLoading ? (
          <li className="rounded-md border border-dashed border-border p-3 text-slate-500">
            <Loader size="sm" text="Loading notifications..." />
          </li>
        ) : null}
        {!notifications.isLoading && items.length === 0 ? (
          <li className="rounded-md border border-dashed border-border p-3 text-slate-500">No notifications found.</li>
        ) : null}
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="flex-1 space-y-1 text-left"
                onClick={() => {
                  if (!item.isRead) {
                    markAsRead.mutate(item.id);
                  }
                  navigate(getNotificationTargetPath(item));
                }}
              >
                <p className={item.isRead ? "text-slate-700" : "font-semibold text-slate-900"}>{item.title}</p>
                <p className="text-slate-600">{item.body}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                {!item.isRead ? (
                  <Button type="button" variant="outline" onClick={() => markAsRead.mutate(item.id)}>
                    Mark read
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => navigate(getNotificationTargetPath(item))}>
                  Open
                </Button>
                <Button type="button" variant="outline" onClick={() => removeNotification.mutate(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
