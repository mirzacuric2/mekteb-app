export const LECTURE_STATUS = {
  DRAFT: "DRAFT",
  COMPLETED: "COMPLETED",
} as const;

export const HOMEWORK_QUEUE_STATUS_FILTER = {
  ALL: "all",
  PENDING: "pending",
  DONE: "done",
} as const;

export type HomeworkQueueStatusFilter =
  (typeof HOMEWORK_QUEUE_STATUS_FILTER)[keyof typeof HOMEWORK_QUEUE_STATUS_FILTER];
