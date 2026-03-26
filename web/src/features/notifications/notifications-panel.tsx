import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { formatDateTime } from "../../lib/date-time";
import { useNotificationsData } from "./use-notifications-data";
import { useNotificationsMutations } from "./use-notifications-mutations";
import { getNotificationTargetPath } from "./navigation";
import {
  MANAGEMENT_PAGE_CARD_CLASSNAME,
  MANAGEMENT_PAGE_CARD_STACK_CLASSNAME,
} from "../common/components/entity-list-toolbar";
import { Loader } from "../common/components/loader";
import { EmptyStateNotice } from "../common/components/empty-state-notice";

export function NotificationsPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notifications = useNotificationsData();
  const { markAsRead, markAllAsRead, removeNotification } = useNotificationsMutations();
  const items = Array.isArray(notifications.data) ? notifications.data : notifications.data?.items || [];
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, MANAGEMENT_PAGE_CARD_STACK_CLASSNAME)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t("notifications")}</h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => markAllAsRead.mutate()} disabled={unreadCount === 0}>
            {t("notificationsMarkAllRead")}
          </Button>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {notifications.isLoading ? (
          <li>
            <EmptyStateNotice className="p-3">
            <Loader size="sm" text={t("notificationsLoading")} />
            </EmptyStateNotice>
          </li>
        ) : null}
        {!notifications.isLoading && items.length === 0 ? (
          <li>
            <EmptyStateNotice className="p-3">{t("notificationsEmpty")}</EmptyStateNotice>
          </li>
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
                    {t("notificationsMarkRead")}
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => navigate(getNotificationTargetPath(item))}>
                  {t("notificationsOpen")}
                </Button>
                <Button type="button" variant="outline" onClick={() => removeNotification.mutate(item.id)}>
                  {t("notificationsDelete")}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
