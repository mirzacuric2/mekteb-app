export const NOTIFICATION_TYPE = {
  POST_PUBLISHED: "POST_PUBLISHED",
  POST_CREATED: "POST_CREATED",
  COMMENT_ADDED: "COMMENT_ADDED",
  REACTION_ADDED: "REACTION_ADDED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",
  ABSENCE_COMMENT_ADDED: "ABSENCE_COMMENT_ADDED",
  HOMEWORK_COMPLETED: "HOMEWORK_COMPLETED",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  targetPath?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationRecord[];
  total: number;
  page: number;
  pageSize: number;
};
