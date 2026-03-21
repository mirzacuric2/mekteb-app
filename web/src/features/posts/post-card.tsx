import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, PencilLine, Send, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { formatDateTime } from "../../lib/date-time";
import { postCommentSchema } from "./post-form-schema";
import { PostComment, PostRecord } from "./types";

type PostCardProps = {
  post: PostRecord;
  currentUserId?: string;
  canManagePosts: boolean;
  canModerateComments: boolean;
  canReact: boolean;
  reacting: boolean;
  deletingPost: boolean;
  creatingComment: boolean;
  updatingComment: boolean;
  deletingComment: boolean;
  onReact: (postId: string) => void;
  onEditPost: (post: PostRecord) => void;
  onDeletePost: (postId: string) => void;
  onCreateComment: (postId: string, content: string) => void;
  onUpdateComment: (postId: string, commentId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
};

export function PostCard({
  post,
  currentUserId,
  canManagePosts,
  canModerateComments,
  canReact,
  reacting,
  deletingPost,
  creatingComment,
  updatingComment,
  deletingComment,
  onReact,
  onEditPost,
  onDeletePost,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
}: PostCardProps) {
  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<PostComment | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState("");
  const [editingCommentError, setEditingCommentError] = useState<string | null>(null);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const likedByCurrentUser = Boolean(currentUserId && post.reactions.some((reaction) => reaction.userId === currentUserId));

  const submitComment = () => {
    setCommentError(null);
    const parsed = postCommentSchema.safeParse({ content: commentInput });
    if (!parsed.success) {
      setCommentError(parsed.error.issues[0]?.message || "Comment is required.");
      return;
    }
    onCreateComment(post.id, parsed.data.content);
    setCommentInput("");
  };

  const submitUpdatedComment = () => {
    if (!editingComment) return;
    setEditingCommentError(null);
    const parsed = postCommentSchema.safeParse({ content: editingCommentInput });
    if (!parsed.success) {
      setEditingCommentError(parsed.error.issues[0]?.message || "Comment is required.");
      return;
    }
    onUpdateComment(post.id, editingComment.id, parsed.data.content);
    setEditingComment(null);
    setEditingCommentInput("");
  };

  return (
    <li className="space-y-3 rounded-md border border-border bg-white p-3">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{post.title}</p>
          {canManagePosts ? (
            <div className="flex items-center gap-1">
              <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => onEditPost(post)}>
                <PencilLine className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => onDeletePost(post.id)}
                disabled={deletingPost}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>
        <p className="text-xs text-slate-500">
          {post.author ? `${post.author.firstName} ${post.author.lastName}` : "Admin"} -{" "}
          {formatDateTime(post.publishedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className={`h-7 px-2 text-xs ${
            likedByCurrentUser ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""
          }`}
          onClick={() => onReact(post.id)}
          disabled={reacting || !canReact}
        >
          <ThumbsUp className="h-4 w-4" />
          {likedByCurrentUser ? "Liked" : "Like"} ({post.reactions.length})
        </Button>
        <Button
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setIsCommentsExpanded((value) => !value)}
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments.length} comments
          {isCommentsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isCommentsExpanded ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="flex gap-2">
            <input
              value={commentInput}
              onChange={(event) => {
                setCommentInput(event.target.value);
                setCommentError(null);
              }}
              className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Add a comment..."
            />
            <Button
              type="button"
              aria-label="Add comment"
              variant="outline"
              className="h-8 px-2 sm:px-2.5 text-xs"
              disabled={creatingComment}
              onClick={submitComment}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Comment</span>
            </Button>
          </div>
          {commentError ? <p className="text-xs text-red-600">{commentError}</p> : null}

          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {post.comments.map((comment) => {
              const isOwnComment = currentUserId === comment.authorId;
              const canDelete = canModerateComments || isOwnComment;
              const isEditingThisComment = editingComment?.id === comment.id;

              return (
                <li key={comment.id} className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-700">
                      {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : "User"}
                    </p>
                    <div className="flex items-center gap-1">
                      {isOwnComment ? (
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setEditingComment(comment);
                            setEditingCommentInput(comment.content);
                            setEditingCommentError(null);
                          }}
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => onDeleteComment(post.id, comment.id)}
                          disabled={deletingComment}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {isEditingThisComment ? (
                    <div className="space-y-2">
                      <input
                        value={editingCommentInput}
                        onChange={(event) => {
                          setEditingCommentInput(event.target.value);
                          setEditingCommentError(null);
                        }}
                        className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      {editingCommentError ? <p className="text-xs text-red-600">{editingCommentError}</p> : null}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="h-7 px-2 text-xs"
                          onClick={submitUpdatedComment}
                          disabled={updatingComment}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setEditingComment(null);
                            setEditingCommentInput("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
