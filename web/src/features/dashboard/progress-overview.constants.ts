export const PROGRESS_OVERVIEW_CHILDREN_PAGE_SIZE = 100;
export const PROGRESS_OVERVIEW_SCHEDULED_LESSONS = 20;

export const HOMEWORK_STATUS = {
  DONE: "done",
  PENDING: "pending",
  UNKNOWN: "unknown",
} as const;

export type HomeworkStatus = (typeof HOMEWORK_STATUS)[keyof typeof HOMEWORK_STATUS];
