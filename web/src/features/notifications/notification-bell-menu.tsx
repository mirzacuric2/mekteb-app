import { Bell } from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { formatDateTime } from "../../lib/date-time";
import { useNotificationBellData } from "./use-notifications-data";
import { useNotificationsMutations } from "./use-notifications-mutations";
import { getNotificationTargetPath } from "./navigation";

function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onOutsideClick: () => void
) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      onOutsideClick();
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [enabled, onOutsideClick, ref]);
}

export function NotificationBellMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, isOpen, () => setIsOpen(false));

  const bellNotifications = useNotificationBellData(5);
  const { markAsRead } = useNotificationsMutations();
  const unreadCount = bellNotifications.data?.unreadCount || 0;
  const recentItems = bellNotifications.data?.items || [];

  return (
    <div ref={containerRef} className="group relative">
      <button
        type="button"
        aria-label={t("notifications")}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        onClick={() => setIsOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 top-0 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[90vw] rounded-lg border border-border bg-white p-2 shadow-lg">
          <div className="mb-1 px-2 py-1 text-sm font-semibold text-slate-900">{t("notifications")}</div>
          <div className="max-h-[360px] space-y-1 overflow-y-auto px-1 pb-2">
            {recentItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">
                {t("notificationsBellEmpty")}
              </div>
            ) : (
              recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  onClick={() => {
                    if (!item.isRead) {
                      markAsRead.mutate(item.id);
                    }
                    setIsOpen(false);
                    navigate(getNotificationTargetPath(item));
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={item.isRead ? "text-sm text-slate-600" : "text-sm font-semibold text-slate-900"}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.body}</p>
                </button>
              ))
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsOpen(false);
              navigate("/app/notifications");
            }}
          >
            {t("notificationsSeeAll")}
          </Button>
        </div>
      ) : null}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {t("notifications")}
      </span>
    </div>
  );
}
