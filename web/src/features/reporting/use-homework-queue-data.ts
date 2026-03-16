import { useAuthedQueryWithParams } from "../common/use-authed-query";
import { HOMEWORK_QUEUE_STATUS_FILTER, HomeworkQueueStatusFilter } from "./reporting.constants";
import { HomeworkQueueListResponse } from "./types";

type HomeworkQueueQueryParams = {
  search: string;
  page: number;
  pageSize: number;
  status: HomeworkQueueStatusFilter;
  nivo?: number;
  lectureId?: string;
};

function toDoneParam(status: HomeworkQueueStatusFilter) {
  if (status === HOMEWORK_QUEUE_STATUS_FILTER.DONE) return 1;
  if (status === HOMEWORK_QUEUE_STATUS_FILTER.PENDING) return 0;
  return undefined;
}

export function useHomeworkQueueQuery(
  { search, page, pageSize, status, nivo, lectureId }: HomeworkQueueQueryParams,
  enabled: boolean
) {
  return useAuthedQueryWithParams<HomeworkQueueListResponse>(
    "homework-queue",
    "/homework",
    {
      q: search.trim() || undefined,
      page,
      pageSize,
      done: toDoneParam(status),
      nivo,
      lectureId,
    },
    enabled
  );
}
