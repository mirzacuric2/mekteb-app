import { useAuthedQuery, useAuthedQueryWithParams } from "../common/use-authed-query";
import { CHILD_STATUS, ChildRecord, ChildStatus, ChildrenListResponse } from "./types";
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
  nivo?: number;
  status?: ChildStatus;
};

export function useChildrenListQuery({ search, page, pageSize, mineOnly, nivo, status }: ChildrenListParams) {
  return useAuthedQueryWithParams<ChildrenListResponse>(
    "children",
    "/children",
    {
      page,
      pageSize,
      q: search.trim() || undefined,
      mine: mineOnly ? 1 : undefined,
      nivo,
      status,
    },
    true
  );
}

/** Active children for diploma batch (max pageSize 100 per API); optional nivo narrows the list. */
export function useChildrenDiplomaCandidatesQuery(open: boolean, nivo: number | undefined) {
  return useAuthedQueryWithParams<ChildrenListResponse>(
    "children-diplomas",
    "/children",
    {
      page: 1,
      pageSize: 100,
      status: CHILD_STATUS.ACTIVE,
      ...(nivo !== undefined ? { nivo } : {}),
    },
    open
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
