import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuthedQuery } from "../common/use-authed-query";
import { useRoleAccess } from "../auth/use-role-access";
import { ProgressOverviewCards } from "../dashboard/progress-overview-cards";

type Props = { canPublish: boolean };

export function PostsPanel({ canPublish }: Props) {
  const posts = useAuthedQuery<any[]>("posts", "/posts", true);
  const { isParent, isAdmin, isUser, isBoardMember } = useRoleAccess();
  const canSeeProgressDashboard = isParent || isAdmin || isUser || isBoardMember;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async () => (await api.post("/posts", { title, content })).data,
    onSuccess: async () => {
      setTitle("");
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const updatePost = useMutation({
    mutationFn: async () => (await api.patch(`/posts/${editingId}`, { title, content })).data,
    onSuccess: async () => {
      setEditingId(null);
      setTitle("");
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => api.delete(`/posts/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const reactToPost = useMutation({
    mutationFn: async (postId: string) => api.post(`/posts/${postId}/reactions`, { kind: "like" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <div className="space-y-4">
      {canSeeProgressDashboard ? <ProgressOverviewCards enabled /> : null}
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">Posts</h3>
        {canPublish ? (
          <div className="space-y-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
            {editingId ? (
              <Button onClick={() => updatePost.mutate()} disabled={!title || !content}>
                Save post
              </Button>
            ) : (
              <Button onClick={() => createPost.mutate()} disabled={!title || !content}>
                Publish post
              </Button>
            )}
          </div>
        ) : null}
        <ul className="space-y-2 text-sm">
          {(posts.data || []).map((post) => (
            <li key={post.id} className="rounded-md border border-border p-2">
              <p className="font-medium">{post.title}</p>
              <p className="text-slate-600">{post.content}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={() => reactToPost.mutate(post.id)}>
                  Like ({post.reactions?.length || 0})
                </Button>
                {canPublish ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(post.id);
                        setTitle(post.title);
                        setContent(post.content);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => deletePost.mutate(post.id)}>
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
