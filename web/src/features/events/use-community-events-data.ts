import { useAuthedQueryWithParams } from "../common/use-authed-query";
import { COMMUNITY_EVENTS_QUERY_KEY } from "./constants";
import { CommunityEventsResponse } from "./types";

type EventsRangeArgs = {
  communityId?: string | null;
  from?: string;
  to?: string;
};

export function useCommunityEventsQuery(args: EventsRangeArgs, enabled: boolean) {
  return useAuthedQueryWithParams<CommunityEventsResponse>(
    COMMUNITY_EVENTS_QUERY_KEY,
    `/communities/${args.communityId}/events`,
    {
      from: args.from,
      to: args.to,
    },
    enabled && Boolean(args.communityId)
  );
}
