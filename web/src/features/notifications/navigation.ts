import { NOTIFICATION_TYPE, NotificationRecord } from "./types";

export function getNotificationTargetPath(notification: NotificationRecord) {
  if (notification.targetPath?.trim()) return notification.targetPath;

  if (
    notification.type === NOTIFICATION_TYPE.POST_CREATED ||
    notification.type === NOTIFICATION_TYPE.COMMENT_ADDED ||
    notification.type === NOTIFICATION_TYPE.REACTION_ADDED
  ) {
    return "/app/posts";
  }

  if (
    notification.type === NOTIFICATION_TYPE.HOMEWORK_COMPLETED ||
    notification.type === NOTIFICATION_TYPE.ATTENDANCE_UPDATED
  ) {
    return "/app/children";
  }

  return "/app/notifications";
}
