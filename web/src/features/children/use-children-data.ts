import { useAuthedQuery, useAuthedQueryWithParams } from "../common/use-authed-query";
import { ChildRecord, ChildrenListResponse } from "./types";
import { useUsersQuery } from "../users/use-users-data";

export type ChildrenParentOption = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: "PENDING" | "ACTIVE" | "INACTIVE";
  communityId?: string | null;
};

export type ChildrenCommunityOption = {
  id: string;
  name: string;
};

type ChildrenListParams = {
  search: string;
  page: number;
  pageSize: number;
  mineOnly?: boolean;
};

export function useChildrenListQuery({ search, page, pageSize, mineOnly }: ChildrenListParams) {
  return useAuthedQueryWithParams<ChildrenListResponse>(
    "children",
    "/children",
    {
      page,
      pageSize,
      q: search.trim() || undefined,
      mine: mineOnly ? 1 : undefined,
    },
    true
  );
}

export function useChildByIdQuery(childId: string | undefined, mineOnly?: boolean) {
  const query = useAuthedQueryWithParams<ChildrenListResponse>(
    "children-by-id",
    "/children",
    {
      childId,
      page: 1,
      pageSize: 1,
      mine: mineOnly ? 1 : undefined,
    },
    Boolean(childId)
  );

  return {
    ...query,
    data: query.data?.items?.[0] as ChildRecord | undefined,
  };
}

export function useChildrenParentOptionsQuery(enabled: boolean) {
  const users = useUsersQuery({}, enabled);
  const items = Array.isArray(users.data) ? users.data : users.data?.items || [];
  return {
    ...users,
    data: items as ChildrenParentOption[],
  };
}

export function useChildrenCommunityOptionsQuery(enabled: boolean) {
  return useAuthedQuery<ChildrenCommunityOption[]>("children-community-options", "/communities", enabled);
}
