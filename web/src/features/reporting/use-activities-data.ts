import { useAuthedQueryWithParams } from "../common/use-authed-query";
import { ActivitiesListResponse } from "./types";

type ActivitiesQueryParams = {
  search: string;
  page: number;
  pageSize: number;
  nivo?: number;
  status?: string;
};

export function useActivitiesQuery({ search, page, pageSize, nivo, status }: ActivitiesQueryParams, enabled: boolean) {
  return useAuthedQueryWithParams<ActivitiesListResponse>(
    "activities",
    "/lectures",
    {
      q: search.trim() || undefined,
      page,
      pageSize,
      nivo,
      status,
    },
    enabled
  );
}
