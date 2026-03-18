import { useAuthedQueryWithParams } from "../common/use-authed-query";
import { POSTS_QUERY_KEY } from "./constants";
import { PostRecord } from "./types";

type PostsQueryArgs = {
  limit?: number;
};

export function usePostsQuery(args: PostsQueryArgs, enabled: boolean) {
  return useAuthedQueryWithParams<PostRecord[]>(
    POSTS_QUERY_KEY,
    "/posts",
    {
      limit: args.limit,
    },
    enabled
  );
}
