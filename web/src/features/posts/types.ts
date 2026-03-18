export const POST_REACTION_KIND = {
  LIKE: "LIKE",
} as const;

export type PostReactionKind = (typeof POST_REACTION_KIND)[keyof typeof POST_REACTION_KIND];

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type PostReaction = {
  id: string;
  kind: PostReactionKind;
  postId: string;
  userId: string;
  createdAt: string;
};

export type PostComment = {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  author?: PostAuthor | null;
};

export type PostRecord = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  communityId: string;
  publishedAt: string;
  author?: PostAuthor | null;
  comments: PostComment[];
  reactions: PostReaction[];
};

export type CreatePostPayload = {
  title: string;
  content: string;
};

export type UpdatePostPayload = Partial<CreatePostPayload>;
