import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { ChildRecord, ChildrenListResponse } from "../children/types";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export function useMineChildrenInCommunity(communityId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["mine-children-in-community", communityId],
    queryFn: async (): Promise<ChildRecord[]> => {
      const all: ChildRecord[] = [];
      let page = 1;
      while (page <= MAX_PAGES) {
        const response = await api.get<ChildrenListResponse>("/children", {
          params: { mine: 1, page, pageSize: PAGE_SIZE },
        });
        const items = response.data.items || [];
        const total = response.data.total ?? 0;
        all.push(...items);
        if (!items.length || all.length >= total) break;
        page += 1;
      }
      return all.filter((child) => child.communityId === communityId);
    },
    enabled: Boolean(enabled && communityId),
  });
}
