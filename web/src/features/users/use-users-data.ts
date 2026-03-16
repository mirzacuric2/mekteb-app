import { useAuthedQuery, useAuthedQueryWithParams } from "../common/use-authed-query";
import { UserRecord } from "./users-table";

export type UsersListResponse = {
  items: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
};

type UsersQueryParams = {
  search?: string;
  role?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  page?: number;
  pageSize?: number;
};

export function useUsersQuery(params: UsersQueryParams, enabled: boolean) {
  return useAuthedQueryWithParams<UsersListResponse | UserRecord[]>(
    "users",
    "/users",
    {
      q: params.search?.trim() || undefined,
      role: params.role,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    },
    enabled
  );
}

type UsersListParams = {
  search: string;
  page: number;
  pageSize: number;
  role?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
};

export function useUsersListQuery(params: UsersListParams, enabled: boolean) {
  return useAuthedQueryWithParams<UsersListResponse>(
    "users",
    "/users",
    {
      q: params.search.trim() || undefined,
      role: params.role,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    },
    enabled
  );
}

export function useDirectoryUsersQuery(enabled: boolean) {
  return useAuthedQuery<UserRecord[]>("directory-users", "/directory", enabled);
}
