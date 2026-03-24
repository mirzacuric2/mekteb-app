import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { CHILD_STATUS, type ChildRecord, type ChildrenListResponse } from "./types";

const MAX_PAGES = 50;

export function useBulkLessonOutcomeChildrenQuery(nivo: number | undefined, open: boolean) {
  return useQuery({
    queryKey: ["bulk-lesson-outcome-children", nivo],
    enabled: open && nivo != null,
    queryFn: async (): Promise<ChildRecord[]> => {
      const all: ChildRecord[] = [];
      let page = 1;
      const pageSize = 100;
      while (page <= MAX_PAGES) {
        const res = await api.get<ChildrenListResponse>("/children", {
          params: { nivo, status: CHILD_STATUS.ACTIVE, page, pageSize },
        });
        const items = res.data.items || [];
        all.push(...items);
        const total = res.data.total ?? 0;
        if (all.length >= total || items.length === 0) break;
        page += 1;
      }
      return all;
    },
  });
}
