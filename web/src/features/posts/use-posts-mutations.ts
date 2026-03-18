import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { POSTS_QUERY_KEY } from "./constants";
import { CreatePostPayload, PostRecord, POST_REACTION_KIND, UpdatePostPayload } from "./types";

export function usePostsMutations() {
  const queryClient = useQueryClient();
  const invalidatePosts = async () => {
    await queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
  };

  const createPost = useMutation({
    mutationFn: async (payload: CreatePostPayload) => (await api.post("/posts", payload)).data as PostRecord,
    onSuccess: invalidatePosts,
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePostPayload }) =>
      (await api.patch(`/posts/${id}`, payload)).data as PostRecord,
    onSuccess: invalidatePosts,
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => api.delete(`/posts/${postId}`),
    onSuccess: invalidatePosts,
  });

  const reactToPost = useMutation({
    mutationFn: async (postId: string) =>
      (
        await api.post(`/posts/${postId}/reactions`, {
          kind: POST_REACTION_KIND.LIKE,
        })
      ).data,
    onSuccess: invalidatePosts,
  });

  const createComment = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) =>
      (await api.post(`/posts/${postId}/comments`, { content })).data,
    onSuccess: invalidatePosts,
  });

  const updateComment = useMutation({
    mutationFn: async ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      (await api.patch(`/posts/${postId}/comments/${commentId}`, { content })).data,
    onSuccess: invalidatePosts,
  });

  const deleteComment = useMutation({
    mutationFn: async ({ postId, commentId }: { postId: string; commentId: string }) =>
      api.delete(`/posts/${postId}/comments/${commentId}`),
    onSuccess: invalidatePosts,
  });

  return {
    createPost,
    updatePost,
    deletePost,
    reactToPost,
    createComment,
    updateComment,
    deleteComment,
  };
}
