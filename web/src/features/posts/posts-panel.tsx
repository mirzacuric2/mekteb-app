import { useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { PostCard } from "./post-card";
import { POST_FORM_DEFAULT_VALUES, PostFormValues, postFormSchema } from "./post-form-schema";
import { PostRecord } from "./types";
import { usePostsQuery } from "./use-posts-data";
import { usePostsMutations } from "./use-posts-mutations";
import { useSession } from "../auth/session-context";
import { ROLE } from "../../types";

type Props = { canPublish: boolean };

export function PostsPanel({ canPublish }: Props) {
  const { session } = useSession();
  const posts = usePostsQuery({}, true);
  const mutations = usePostsMutations();
  const [editingPost, setEditingPost] = useState<PostRecord | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostRecord | null>(null);
  const currentUser = session?.user;
  const canModerateComments = currentUser?.role === ROLE.ADMIN || currentUser?.role === ROLE.SUPER_ADMIN;
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<PostFormValues>({
    defaultValues: POST_FORM_DEFAULT_VALUES,
  });

  const submitPost = handleSubmit((values) => {
    clearErrors();
    const parsed = postFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (field === "title" || field === "content") {
          setError(field, { type: "manual", message: issue.message });
        }
      }
      return;
    }

    if (editingPost) {
      mutations.updatePost.mutate(
        {
          id: editingPost.id,
          payload: parsed.data,
        },
        {
          onSuccess: () => {
            toast.success("Post updated.");
            setEditingPost(null);
            reset(POST_FORM_DEFAULT_VALUES);
          },
          onError: () => toast.error("Failed to update post."),
        }
      );
      return;
    }

    mutations.createPost.mutate(parsed.data, {
      onSuccess: () => {
        toast.success("Post published.");
        reset(POST_FORM_DEFAULT_VALUES);
      },
      onError: () => toast.error("Failed to publish post."),
    });
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        {canPublish ? (
          <form className="space-y-3 rounded-md border border-border bg-slate-50 p-3" onSubmit={submitPost}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <Input
                {...register("title", { onChange: () => clearErrors("title") })}
                placeholder="Post title"
              />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Content</label>
              <textarea
                {...register("content", { onChange: () => clearErrors("content") })}
                rows={4}
                placeholder="Write your post..."
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.content ? <p className="mt-1 text-xs text-red-600">{errors.content.message}</p> : null}
            </div>
            <div className="flex items-center justify-start gap-2">
              {editingPost ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => {
                    setEditingPost(null);
                    reset(POST_FORM_DEFAULT_VALUES);
                    clearErrors();
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel edit
                </Button>
              ) : null}
              <Button
                type="submit"
                className="h-8 px-2.5 text-xs"
                disabled={mutations.createPost.isPending || mutations.updatePost.isPending}
              >
                {editingPost ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {editingPost
                  ? mutations.updatePost.isPending
                    ? "Saving..."
                    : "Save post"
                  : mutations.createPost.isPending
                    ? "Publishing..."
                    : "Publish post"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">You can react and comment on posts from your community.</p>
        )}

        {posts.isLoading ? <p className="text-sm text-slate-500">Loading posts...</p> : null}
        {!posts.isLoading && !posts.data?.length ? <p className="text-sm text-slate-500">No posts yet.</p> : null}

        <ul className="space-y-2 text-sm">
          {(posts.data || []).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              canManagePosts={canPublish}
              canModerateComments={canModerateComments}
              canReact={!(currentUser?.role === ROLE.ADMIN && post.authorId === currentUser.id)}
              reacting={mutations.reactToPost.isPending}
              deletingPost={mutations.deletePost.isPending}
              creatingComment={mutations.createComment.isPending}
              updatingComment={mutations.updateComment.isPending}
              deletingComment={mutations.deleteComment.isPending}
              onReact={(postId) => {
                mutations.reactToPost.mutate(postId, {
                  onError: () => toast.error("Failed to react to post."),
                });
              }}
              onEditPost={(postToEdit) => {
                setEditingPost(postToEdit);
                reset({
                  title: postToEdit.title,
                  content: postToEdit.content,
                });
                clearErrors();
              }}
              onDeletePost={(postId) => {
                const target = posts.data?.find((item) => item.id === postId) || null;
                setDeletingPost(target);
              }}
              onCreateComment={(postId, content) => {
                mutations.createComment.mutate(
                  { postId, content },
                  {
                    onError: () => toast.error("Failed to add comment."),
                  }
                );
              }}
              onUpdateComment={(postId, commentId, content) => {
                mutations.updateComment.mutate(
                  { postId, commentId, content },
                  {
                    onError: () => toast.error("Failed to update comment."),
                  }
                );
              }}
              onDeleteComment={(postId, commentId) => {
                mutations.deleteComment.mutate(
                  { postId, commentId },
                  {
                    onError: () => toast.error("Failed to delete comment."),
                  }
                );
              }}
            />
          ))}
        </ul>
      </Card>

      <DeleteConfirmDialog
        open={!!deletingPost}
        onOpenChange={(open) => {
          if (!open) setDeletingPost(null);
        }}
        title="Delete post"
        description={deletingPost ? `Are you sure you want to delete "${deletingPost.title}"?` : "Delete selected post?"}
        confirmText="Delete"
        submitting={mutations.deletePost.isPending}
        onConfirm={() => {
          if (!deletingPost) return;
          mutations.deletePost.mutate(deletingPost.id, {
            onSuccess: () => {
              toast.success("Post deleted.");
              setDeletingPost(null);
            },
            onError: () => toast.error("Failed to delete post."),
          });
        }}
      />
    </div>
  );
}
