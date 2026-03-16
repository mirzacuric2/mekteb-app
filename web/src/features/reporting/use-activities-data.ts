import { useAuthedQueryWithParams } from "../common/use-authed-query";
import { ActivitiesListResponse } from "./types";

type ActivitiesQueryParams = {
  search: string;
  page: number;
  pageSize: number;
};

export function useActivitiesQuery({ search, page, pageSize }: ActivitiesQueryParams, enabled: boolean) {
  return useAuthedQueryWithParams<ActivitiesListResponse>(
    "activities",
    "/lectures",
    {
      q: search.trim() || undefined,
      page,
      pageSize,
    },
    enabled
  );
}
