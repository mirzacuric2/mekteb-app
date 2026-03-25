import {
  ChildStatus,
  LectureStatus,
  MessageContextType,
  MessageKind,
  MessageThreadStatus,
  NotificationType,
  Role,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";
import {
  getNivoBookAbsolutePathByNivo,
  getNivoBookFileNameByNivo,
  NIVO_BOOK_NIVOS,
} from "./nivo-book-storage.js";

export function communicationRouter() {
  const router = Router();
  const postListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
  });
  const postPayloadSchema = z.object({
    title: z.string().trim().min(3),
    content: z.string().trim().min(3),
  });
  const postUpdatePayloadSchema = z.object({
    title: z.string().trim().min(3).optional(),
    content: z.string().trim().min(3).optional(),
  });
  const postCommentPayloadSchema = z.object({
    content: z.string().trim().min(1),
  });
  const postReactionPayloadSchema = z.object({
    kind: z.enum(["LIKE"]).default("LIKE"),
  });

  const canReadPostCommunity = (req: AppRequest, communityId: string) => {
    if (!req.user) return false;
    if (req.user.role === Role.SUPER_ADMIN) return true;
    if (!req.user.communityId) return false;
    return req.user.communityId === communityId;
  };

  const lessonPayloadSchema = z.object({
    title: z.string().min(2),
    nivo: z.number().int().min(1).max(5),
  });
  const lessonUpdatePayloadSchema = z.object({
    title: z.string().min(2).optional(),
    nivo: z.number().int().min(1).max(5).optional(),
  });
  const nivoBookParamsSchema = z.object({
    nivo: z.coerce.number().int().min(1).max(5),
  });
  const lectureListQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    nivo: z.coerce.number().int().min(1).max(5).optional(),
    status: z.nativeEnum(LectureStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  });
  const homeworkListQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    nivo: z.coerce.number().int().min(1).max(5).optional(),
    done: z.coerce.number().int().min(0).max(1).optional(),
    childId: z.string().optional(),
    lectureId: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  });
  const messageContextSchema = z.object({
    type: z.nativeEnum(MessageContextType).optional(),
    childId: z.string().uuid().optional(),
    lectureId: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(180).optional(),
    preview: z.string().trim().min(1).max(500).optional(),
  });
  const messagePayloadSchema = z.object({
    receiverId: z.string().uuid(),
    content: z.string().trim().min(1).max(2000),
    threadId: z.string().uuid().optional(),
    context: messageContextSchema.optional(),
  });
  const closeMessageThreadPayloadSchema = z.object({
    note: z.string().trim().min(1).max(180).optional(),
  });
  const notificationListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    unreadOnly: z.coerce.number().int().min(0).max(1).optional(),
    includeUnreadCount: z.coerce.number().int().min(0).max(1).optional(),
  });
  const updateNotificationPayloadSchema = z.object({
    isRead: z.boolean(),
  });
  const limitedMessagingRoles = new Set<Role>([Role.USER, Role.PARENT, Role.BOARD_MEMBER]);
  const isLimitedMessagingRole = (role: Role) => limitedMessagingRoles.has(role);
  const formatFullName = (firstName?: string | null, lastName?: string | null) =>
    [firstName?.trim() || "", lastName?.trim() || ""].filter(Boolean).join(" ").trim();
  type NotificationClient = Pick<typeof prisma, "parentChild" | "notification">;

  const applyHomeworkStateToLecture = async <
    T extends {
      attendance: Array<{
        homeworkDone?: boolean | null;
        homeworkTitle?: string | null;
        homeworkDescription?: string | null;
      }>;
    },
  >(
    lecture: T
  ): Promise<T> => {
    return {
      ...lecture,
      attendance: lecture.attendance.map((item) => ({
        ...item,
        homeworkDone: typeof item.homeworkDone === "boolean" ? item.homeworkDone : null,
        homeworkTitle: item.homeworkTitle?.trim() || null,
        homeworkDescription: item.homeworkDescription?.trim() || null,
      })),
    };
  };
  const applyHomeworkStateToLectures = async <
    T extends {
      attendance: Array<{
        homeworkDone?: boolean | null;
        homeworkTitle?: string | null;
        homeworkDescription?: string | null;
      }>;
    },
  >(
    lectures: T[]
  ): Promise<T[]> => Promise.all(lectures.map((lecture) => applyHomeworkStateToLecture(lecture)));
  const createAbsenceCommentNotifications = async (
    tx: NotificationClient,
    rows: Array<{ childId: string; childName: string; present: boolean; comment?: string | null }>,
    actorId: string
  ) => {
    const absentRows = rows
      .map((row) => ({
        ...row,
        comment: row.comment?.trim() || "",
      }))
      .filter((row) => !row.present && Boolean(row.comment));
    if (absentRows.length === 0) return;

    const childIds = [...new Set(absentRows.map((row) => row.childId))];
    const parentLinks = await tx.parentChild.findMany({
      where: { childId: { in: childIds } },
      select: { parentId: true, childId: true },
    });
    if (parentLinks.length === 0) return;

    const parentIdsByChildId = parentLinks.reduce<Record<string, string[]>>((acc, row) => {
      acc[row.childId] = acc[row.childId] || [];
      acc[row.childId].push(row.parentId);
      return acc;
    }, {});

    const data: Array<{ userId: string; type: NotificationType; title: string; body: string; targetPath?: string }> = [];
    for (const row of absentRows) {
      const linkedParentIds = parentIdsByChildId[row.childId] || [];
      for (const parentId of linkedParentIds) {
        if (parentId === actorId) continue;
        data.push({
          userId: parentId,
          type: NotificationType.ABSENCE_COMMENT_ADDED,
          title: "Absence comment",
          body: `${row.childName}: ${row.comment}`,
          targetPath: `/app/children?childId=${row.childId}`,
        });
      }
    }
    if (data.length > 0) {
      await tx.notification.createMany({ data });
    }
  };
  const createPostEngagementNotifications = async (params: {
    postId: string;
    actorId: string;
    type: NotificationType;
    title: string;
    body: string;
    targetPath?: string;
  }) => {
    const [reactions, comments] = await Promise.all([
      prisma.reaction.findMany({
        where: { postId: params.postId },
        select: { userId: true },
      }),
      prisma.comment.findMany({
        where: { postId: params.postId },
        select: { authorId: true },
      }),
    ]);
    const recipientIds = [
      ...new Set([...reactions.map((reaction) => reaction.userId), ...comments.map((comment) => comment.authorId)]),
    ].filter((userId) => userId !== params.actorId);
    if (recipientIds.length === 0) return;
    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        targetPath: params.targetPath,
      })),
    });
  };

  router.get("/posts", requireAuth, async (req: AppRequest, res) => {
    const query = postListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });

    if (req.user!.role !== Role.SUPER_ADMIN && !req.user!.communityId) {
      return res.status(403).json({ message: "Forbidden community" });
    }
    const where = req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId as string };
    const posts = await prisma.post.findMany({
      where,
      include: {
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        reactions: true,
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      ...(query.data.limit ? { take: query.data.limit } : {}),
    });
    return res.json(posts);
  });

  router.post(
    "/posts",
    requireAuth,
    requireAnyRole(Role.ADMIN),
    async (req: AppRequest, res) => {
    const payload = postPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const communityId = req.user!.communityId;
    if (!communityId) return res.status(403).json({ message: "Forbidden community" });

    const post = await prisma.post.create({
      data: {
        title: payload.data.title,
        content: payload.data.content,
        authorId: req.user!.id,
        communityId,
      },
    });

    const users = await prisma.user.findMany({
      where: { role: { in: [Role.USER, Role.PARENT, Role.BOARD_MEMBER] }, communityId },
      select: { id: true },
    });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: NotificationType.POST_CREATED,
          title: "New post",
          body: payload.data.title,
          targetPath: "/app/posts",
        })),
      });
    }
      return res.status(201).json(post);
    }
  );

  router.patch(
    "/posts/:postId",
    requireAuth,
    requireAnyRole(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: AppRequest, res) => {
    const payload = postUpdatePayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const existing = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    const updated = await prisma.post.update({ where: { id: req.params.postId }, data: payload.data });
      return res.json(updated);
    }
  );

  router.delete(
    "/posts/:postId",
    requireAuth,
    requireAnyRole(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: AppRequest, res) => {
    const existing = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.post.delete({ where: { id: req.params.postId } });
      return res.status(204).send();
    }
  );

  router.post("/posts/:postId/comments", requireAuth, async (req: AppRequest, res) => {
    const payload = postCommentPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const post = await prisma.post.findUnique({
      where: { id: req.params.postId },
      select: { id: true, communityId: true, title: true },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canReadPostCommunity(req, post.communityId)) return res.status(403).json({ message: "Forbidden community" });

    const comment = await prisma.comment.create({
      data: { postId: post.id, authorId: req.user!.id, content: payload.data.content },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    await createPostEngagementNotifications({
      postId: post.id,
      actorId: req.user!.id,
      type: NotificationType.COMMENT_ADDED,
      title: "New comment on followed post",
      body: post.title,
      targetPath: "/app/posts",
    });
    return res.status(201).json(comment);
  });

  router.patch("/posts/:postId/comments/:commentId", requireAuth, async (req: AppRequest, res) => {
    const payload = postCommentPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      include: { post: { select: { id: true, communityId: true } } },
    });
    if (!existing || existing.postId !== req.params.postId) return res.status(404).json({ message: "Comment not found" });
    if (!canReadPostCommunity(req, existing.post.communityId)) return res.status(403).json({ message: "Forbidden community" });
    if (existing.authorId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

    const updated = await prisma.comment.update({
      where: { id: existing.id },
      data: { content: payload.data.content },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    return res.json(updated);
  });

  router.delete("/posts/:postId/comments/:commentId", requireAuth, async (req: AppRequest, res) => {
    const existing = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      include: { post: { select: { id: true, communityId: true } } },
    });
    if (!existing || existing.postId !== req.params.postId) return res.status(404).json({ message: "Comment not found" });
    if (!canReadPostCommunity(req, existing.post.communityId)) return res.status(403).json({ message: "Forbidden community" });

    const canModerate = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;
    const isOwnComment = existing.authorId === req.user!.id;
    if (!canModerate && !isOwnComment) return res.status(403).json({ message: "Forbidden" });

    await prisma.comment.delete({ where: { id: existing.id } });
    return res.status(204).send();
  });

  router.post("/posts/:postId/reactions", requireAuth, async (req: AppRequest, res) => {
    const payload = postReactionPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const post = await prisma.post.findUnique({
      where: { id: req.params.postId },
      select: { id: true, communityId: true, authorId: true, title: true },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canReadPostCommunity(req, post.communityId)) return res.status(403).json({ message: "Forbidden community" });
    if (req.user!.role === Role.ADMIN && post.authorId === req.user!.id) {
      return res.status(403).json({ message: "Admin cannot react to own post" });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_userId: { postId: req.params.postId, userId: req.user!.id } },
      select: { id: true },
    });
    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { postId_userId: { postId: req.params.postId, userId: req.user!.id } },
          data: { kind: payload.data.kind },
        })
      : await prisma.reaction.create({
          data: { postId: post.id, userId: req.user!.id, kind: payload.data.kind },
        });
    if (!existingReaction) {
      await createPostEngagementNotifications({
        postId: post.id,
        actorId: req.user!.id,
        type: NotificationType.REACTION_ADDED,
        title: "New like on followed post",
        body: post.title,
        targetPath: "/app/posts",
      });
    }
    return res.json(reaction);
  });

  router.get("/notifications", requireAuth, async (req: AppRequest, res) => {
    const query = notificationListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });

    const where = {
      userId: req.user!.id,
      ...(query.data.unreadOnly === 1 ? { isRead: false } : {}),
    };
    const shouldPaginate = query.data.page !== undefined || query.data.pageSize !== undefined;
    const page = query.data.page ?? 1;
    const pageSize = query.data.pageSize ?? query.data.limit ?? 20;
    if (shouldPaginate) {
      const [total, items] = await prisma.$transaction([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return res.json({ items, total, page, pageSize });
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(query.data.limit ? { take: query.data.limit } : {}),
    });
    if (query.data.includeUnreadCount === 1) {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.user!.id,
          isRead: false,
        },
      });
      return res.json({ items: notifications, unreadCount });
    }
    return res.json(notifications);
  });

  router.patch("/notifications/read-all", requireAuth, async (req: AppRequest, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ updatedCount: result.count });
  });

  router.patch("/notifications/:id/read", requireAuth, async (req: AppRequest, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Notification not found" });
    if (existing.userId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return res.json(updated);
  });
  router.get("/notifications/:id", requireAuth, async (req: AppRequest, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.userId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    return res.json(notification);
  });

  router.patch("/notifications/:id", requireAuth, async (req: AppRequest, res) => {
    const payload = updateNotificationPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Notification not found" });
    if (existing.userId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: payload.data.isRead },
    });
    return res.json(updated);
  });

  router.delete("/notifications/:id", requireAuth, async (req: AppRequest, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Notification not found" });
    if (existing.userId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    await prisma.notification.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  router.get("/messages", requireAuth, async (req: AppRequest, res) => {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    return res.json(messages);
  });

  router.get("/message-threads", requireAuth, async (req: AppRequest, res) => {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    const threadMap = new Map<string, (typeof messages)[number]>();
    for (const message of messages) {
      if (threadMap.has(message.threadId)) continue;
      threadMap.set(message.threadId, message);
    }
    const threads = [...threadMap.values()].map((message) => {
      const counterpart = message.senderId === req.user!.id ? message.receiver : message.sender;
      const canWrite = message.threadStatus !== MessageThreadStatus.CLOSED;
      return {
        threadId: message.threadId,
        updatedAt: message.createdAt,
        lastMessageId: message.id,
        lastMessage: message.content,
        lastMessageKind: message.kind,
        threadStatus: message.threadStatus,
        contextType: message.contextType,
        contextChildId: message.contextChildId,
        contextLectureId: message.contextLectureId,
        contextLabel: message.contextLabel,
        contextPreview: message.contextPreview,
        canWrite,
        counterpart,
      };
    });
    return res.json(threads);
  });

  router.get("/message-threads/:threadId/messages", requireAuth, async (req: AppRequest, res) => {
    const userScope = { OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] };
    const threadId = req.params.threadId;
    const hasAccess = await prisma.message.findFirst({
      where: { threadId, ...userScope },
      select: { id: true },
    });
    if (!hasAccess) return res.status(404).json({ message: "Thread not found" });

    const messages = await prisma.message.findMany({
      where: { threadId, ...userScope },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    const latestMessage = messages[messages.length - 1];
    const canWrite = latestMessage?.threadStatus !== MessageThreadStatus.CLOSED;
    return res.json({
      threadId,
      threadStatus: latestMessage?.threadStatus || MessageThreadStatus.OPEN,
      canWrite,
      contextType: latestMessage?.contextType || MessageContextType.GENERAL,
      contextChildId: latestMessage?.contextChildId || null,
      contextLectureId: latestMessage?.contextLectureId || null,
      contextLabel: latestMessage?.contextLabel || null,
      contextPreview: latestMessage?.contextPreview || null,
      messages,
    });
  });

  router.post("/messages", requireAuth, async (req: AppRequest, res) => {
    const payload = messagePayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const receiver = await prisma.user.findUnique({ where: { id: payload.data.receiverId } });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (isLimitedMessagingRole(req.user!.role) && receiver.role !== Role.ADMIN) {
      return res.status(403).json({ message: "User can only message admin" });
    }
    let existingThreadMessage: {
      threadId: string;
      senderId: string;
      receiverId: string;
      threadStatus: MessageThreadStatus;
      contextType: MessageContextType;
      contextChildId: string | null;
      contextLectureId: string | null;
      contextLabel: string | null;
      contextPreview: string | null;
    } | null = null;
    if (payload.data.threadId) {
      existingThreadMessage = await prisma.message.findFirst({
        where: { threadId: payload.data.threadId },
        orderBy: { createdAt: "desc" },
      });
      if (!existingThreadMessage) return res.status(404).json({ message: "Thread not found" });
      const participantIds = [existingThreadMessage.senderId, existingThreadMessage.receiverId];
      if (!participantIds.includes(req.user!.id) || !participantIds.includes(payload.data.receiverId)) {
        return res.status(403).json({ message: "Forbidden thread access" });
      }
      if (existingThreadMessage.threadStatus === MessageThreadStatus.CLOSED) {
        return res.status(403).json({ message: "Thread is closed. Start a new thread." });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId: payload.data.receiverId,
        content: payload.data.content.trim(),
        threadId: payload.data.threadId || randomUUID(),
        kind: MessageKind.USER,
        threadStatus: MessageThreadStatus.OPEN,
        contextType: payload.data.context?.type || existingThreadMessage?.contextType || MessageContextType.GENERAL,
        contextChildId: payload.data.context?.childId || existingThreadMessage?.contextChildId || null,
        contextLectureId: payload.data.context?.lectureId || existingThreadMessage?.contextLectureId || null,
        contextLabel: payload.data.context?.label?.trim() || existingThreadMessage?.contextLabel || null,
        contextPreview: payload.data.context?.preview?.trim() || existingThreadMessage?.contextPreview || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    return res.status(201).json(message);
  });

  router.post(
    "/message-threads/:threadId/close",
    requireAuth,
    requireAnyRole(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: AppRequest, res) => {
      const payload = closeMessageThreadPayloadSchema.safeParse(req.body ?? {});
      if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

      const threadId = req.params.threadId;
      const latestInThread = await prisma.message.findFirst({
        where: { threadId, OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] },
        orderBy: { createdAt: "desc" },
      });
      if (!latestInThread) return res.status(404).json({ message: "Thread not found" });
      if (latestInThread.threadStatus === MessageThreadStatus.CLOSED) {
        return res.json({ threadId, threadStatus: MessageThreadStatus.CLOSED });
      }

      const closer = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { firstName: true, lastName: true },
      });
      const closerName = [closer?.firstName?.trim() || "", closer?.lastName?.trim() || ""].filter(Boolean).join(" ").trim();
      const receiverId = latestInThread.senderId === req.user!.id ? latestInThread.receiverId : latestInThread.senderId;
      const closeMessage = await prisma.message.create({
        data: {
          threadId,
          senderId: req.user!.id,
          receiverId,
          kind: MessageKind.SYSTEM,
          threadStatus: MessageThreadStatus.CLOSED,
          content: payload.data.note || (closerName ? `Conversation closed by ${closerName}.` : "Conversation closed."),
          contextType: latestInThread.contextType,
          contextChildId: latestInThread.contextChildId,
          contextLectureId: latestInThread.contextLectureId,
          contextLabel: latestInThread.contextLabel,
          contextPreview: latestInThread.contextPreview,
        },
      });
      return res.json(closeMessage);
    }
  );

  router.delete("/messages/:id", requireAuth, async (req: AppRequest, res) => {
    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Message not found" });
    if (existing.senderId !== req.user!.id && existing.receiverId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await prisma.message.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  router.get("/lectures", requireAuth, async (req: AppRequest, res) => {
    const query = lectureListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });

    const shouldPaginate = query.data.page !== undefined || query.data.pageSize !== undefined;
    const page = query.data.page ?? 1;
    const pageSize = query.data.pageSize ?? 10;
    const searchTerm = query.data.q?.trim();

    const where = {
      ...(req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined }),
      ...(query.data.nivo !== undefined ? { nivo: query.data.nivo } : {}),
      ...(query.data.status ? { status: query.data.status } : {}),
      ...(searchTerm
        ? {
            OR: [
              { topic: { contains: searchTerm, mode: "insensitive" as const } },
              {
                attendance: {
                  some: {
                    OR: [
                      { child: { firstName: { contains: searchTerm, mode: "insensitive" as const } } },
                      { child: { lastName: { contains: searchTerm, mode: "insensitive" as const } } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const include = {
      community: { select: { id: true, name: true } },
      attendance: {
        include: {
          child: {
            select: { id: true, firstName: true, lastName: true, nivo: true, status: true },
          },
          lesson: {
            select: { id: true, title: true, nivo: true },
          },
        },
      },
    };
    if (shouldPaginate) {
      const [total, items] = await prisma.$transaction([
        prisma.lecture.count({ where }),
        prisma.lecture.findMany({
          where,
          include,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      const itemsWithHomework = await applyHomeworkStateToLectures(items);
      return res.json({ items: itemsWithHomework, total, page, pageSize });
    }

    const lectures = await prisma.lecture.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
    const lecturesWithHomework = await applyHomeworkStateToLectures(lectures);
    return res.json(lecturesWithHomework);
  });

  router.post(
    "/lectures",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        topic: z.string().min(3).optional(),
        nivo: z.number().int().min(1).max(5),
        note: z.string().optional(),
        markCompleted: z.boolean().optional(),
        communityId: z.string().optional(),
        attendance: z
          .array(
            z.object({
              childId: z.string(),
              lessonId: z.string().optional(),
              present: z.boolean(),
              homeworkDone: z.boolean().optional(),
              homeworkTitle: z.string().trim().optional(),
              homeworkDescription: z.string().trim().optional(),
              comment: z.string().optional(),
            })
          )
          .min(1),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    if (!canAccessCommunity(req, communityId)) return res.status(403).json({ message: "Forbidden community" });

    const providedChildIds = payload.data.attendance.map((item) => item.childId);
    const childIds = [...new Set(providedChildIds)];
    if (childIds.length !== providedChildIds.length) {
      return res.status(400).json({ message: "Each child can be reported only once per lecture" });
    }
    const lessonIds = [...new Set(payload.data.attendance.map((item) => item.lessonId).filter((id): id is string => Boolean(id)))];
    const shouldMarkCompleted = payload.data.markCompleted === true;
    if (shouldMarkCompleted && payload.data.attendance.some((item) => !item.lessonId)) {
      return res.status(400).json({ message: "All attendance rows must include a lesson before completion" });
    }
    const hasHomeworkWithoutTitle = payload.data.attendance.some((item) => {
      const hasHomeworkPayload =
        typeof item.homeworkDone === "boolean" || Boolean(item.homeworkDescription?.trim()) || Boolean(item.homeworkTitle?.trim());
      return hasHomeworkPayload && !item.homeworkTitle?.trim();
    });
    if (hasHomeworkWithoutTitle) {
      return res.status(400).json({ message: "Homework title is required when homework is set" });
    }
    const children = await prisma.child.findMany({
      where: {
        id: { in: childIds },
        communityId: communityId!,
        status: ChildStatus.ACTIVE,
        nivo: payload.data.nivo,
      },
      select: { id: true, firstName: true, lastName: true },
    });
    if (children.length !== childIds.length) {
      return res.status(400).json({
        message: "Attendance children must be active and in selected nivo for this community",
      });
    }
    if (lessonIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { id: { in: lessonIds }, nivo: payload.data.nivo },
        select: { id: true, title: true },
      });
      if (lessons.length !== lessonIds.length) {
        return res.status(400).json({ message: "Selected lessons must belong to the selected nivo" });
      }
    }
    const resolvedTopic = payload.data.topic?.trim() || `Nivo ${payload.data.nivo} activity report`;

    const lecture = await prisma.$transaction(async (tx) => {
      const createdLecture = await tx.lecture.create({
        data: {
          topic: resolvedTopic,
          nivo: payload.data.nivo,
          note: payload.data.note,
          status: shouldMarkCompleted ? LectureStatus.COMPLETED : LectureStatus.DRAFT,
          completedAt: shouldMarkCompleted ? new Date() : null,
          adminId: req.user!.id,
          communityId: communityId!,
          attendance: {
            create: payload.data.attendance.map((item) => ({
              ...(Boolean(item.homeworkTitle?.trim()) || Boolean(item.homeworkDescription?.trim()) || typeof item.homeworkDone === "boolean"
                ? {
                    homeworkDone: typeof item.homeworkDone === "boolean" ? item.homeworkDone : false,
                    homeworkTitle: item.homeworkTitle?.trim() || null,
                    homeworkDescription: item.homeworkDescription?.trim() || null,
                  }
                : {
                    homeworkDone: null,
                    homeworkTitle: null,
                    homeworkDescription: null,
                  }),
              childId: item.childId,
              lessonId: item.lessonId,
              present: item.present,
              comment: item.comment,
            })),
          },
        },
        include: {
          attendance: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true, status: true },
              },
              lesson: {
                select: { id: true, title: true, nivo: true },
              },
            },
          },
        },
      });

      return createdLecture;
    });

    const childNameById = new Map(
      children.map((child) => [child.id, formatFullName(child.firstName, child.lastName) || "Child"])
    );
    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: { in: childIds } },
      select: { parentId: true, childId: true },
    });
    if (parentLinks.length > 0) {
      await prisma.notification.createMany({
        data: parentLinks.map((link) => ({
          userId: link.parentId,
          type: NotificationType.ATTENDANCE_UPDATED,
          title: "Attendance updated",
          body: `${childNameById.get(link.childId) || "Child"}: ${resolvedTopic}`,
          targetPath: `/app/children?childId=${link.childId}`,
        })),
      });
    }
    await createAbsenceCommentNotifications(
      prisma,
      payload.data.attendance.map((row) => ({
        childId: row.childId,
        childName: childNameById.get(row.childId) || "Child",
        present: row.present,
        comment: row.comment,
      })),
      req.user!.id
    );

      const lectureWithHomework = await applyHomeworkStateToLecture(lecture);
      return res.status(201).json(lectureWithHomework);
    }
  );

  router.patch(
    "/lectures/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        topic: z.string().min(3).optional(),
        nivo: z.number().int().min(1).max(5).optional(),
        note: z.string().optional(),
        markCompleted: z.boolean().optional(),
        attendance: z
          .array(
            z.object({
              childId: z.string(),
              lessonId: z.string().optional(),
              present: z.boolean(),
              homeworkDone: z.boolean().optional(),
              homeworkTitle: z.string().trim().optional(),
              homeworkDescription: z.string().trim().optional(),
              comment: z.string().optional(),
            })
          )
          .min(1)
          .optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const existing = await prisma.lecture.findUnique({
      where: { id: req.params.id },
      include: { attendance: { select: { lessonId: true } } },
    });
    if (!existing) return res.status(404).json({ message: "Lecture not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    const resolvedNivo = payload.data.nivo ?? existing.nivo;
    if (payload.data.attendance && !resolvedNivo) {
      return res.status(400).json({ message: "Nivo is required when updating attendance" });
    }
    const shouldMarkCompleted = payload.data.markCompleted === true;
    if (payload.data.attendance) {
      const hasHomeworkWithoutTitle = payload.data.attendance.some((item) => {
        const hasHomeworkPayload =
          typeof item.homeworkDone === "boolean" ||
          Boolean(item.homeworkDescription?.trim()) ||
          Boolean(item.homeworkTitle?.trim());
        return hasHomeworkPayload && !item.homeworkTitle?.trim();
      });
      if (hasHomeworkWithoutTitle) {
        return res.status(400).json({ message: "Homework title is required when homework is set" });
      }
    }

    if (payload.data.attendance) {
      const providedChildIds = payload.data.attendance.map((item) => item.childId);
      const childIds = [...new Set(providedChildIds)];
      if (childIds.length !== providedChildIds.length) {
        return res.status(400).json({ message: "Each child can be reported only once per lecture" });
      }
      const lessonIds = [
        ...new Set(payload.data.attendance.map((item) => item.lessonId).filter((id): id is string => Boolean(id))),
      ];
      const children = await prisma.child.findMany({
        where: {
          id: { in: childIds },
          communityId: existing.communityId,
          nivo: resolvedNivo!,
        },
        select: { id: true, firstName: true, lastName: true },
      });
      if (children.length !== childIds.length) {
        return res.status(400).json({
          message: "Attendance children must belong to selected nivo and same community",
        });
      }
      if (lessonIds.length > 0) {
        const lessons = await prisma.lesson.findMany({
          where: { id: { in: lessonIds }, nivo: resolvedNivo! },
          select: { id: true, title: true },
        });
        if (lessons.length !== lessonIds.length) {
          return res.status(400).json({ message: "Selected lessons must belong to the selected nivo" });
        }
      }
    }
    if (shouldMarkCompleted) {
      const rowsToValidate = payload.data.attendance ?? existing.attendance;
      if (!rowsToValidate.length) {
        return res.status(400).json({ message: "Lecture must have attendance records before completion" });
      }
      const hasMissingLesson = rowsToValidate.some((row) => !row.lessonId);
      if (hasMissingLesson) {
        return res.status(400).json({ message: "All attendance rows must include a lesson before completion" });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const lecture = await tx.lecture.update({
        where: { id: req.params.id },
        data: {
          topic: payload.data.topic,
          nivo: payload.data.nivo,
          note: payload.data.note,
          status: shouldMarkCompleted ? LectureStatus.COMPLETED : LectureStatus.DRAFT,
          completedAt: shouldMarkCompleted ? new Date() : null,
        },
      });

      if (payload.data.attendance) {
        await tx.attendance.deleteMany({ where: { lectureId: existing.id } });
        await tx.attendance.createMany({
          data: payload.data.attendance.map((item) => ({
            ...(Boolean(item.homeworkTitle?.trim()) || Boolean(item.homeworkDescription?.trim()) || typeof item.homeworkDone === "boolean"
              ? {
                  homeworkDone: typeof item.homeworkDone === "boolean" ? item.homeworkDone : false,
                  homeworkTitle: item.homeworkTitle?.trim() || null,
                  homeworkDescription: item.homeworkDescription?.trim() || null,
                }
              : {
                  homeworkDone: null,
                  homeworkTitle: null,
                  homeworkDescription: null,
                }),
            lectureId: existing.id,
            childId: item.childId,
            lessonId: item.lessonId,
            present: item.present,
            comment: item.comment,
          })),
        });

        const childIds = [...new Set(payload.data.attendance.map((x) => x.childId))];
        const childrenForRows = await tx.child.findMany({
          where: { id: { in: childIds } },
          select: { id: true, firstName: true, lastName: true },
        });
        const childNameById = new Map(
          childrenForRows.map((child) => [child.id, formatFullName(child.firstName, child.lastName) || "Child"])
        );
        const parentLinks = await tx.parentChild.findMany({
          where: { childId: { in: childIds } },
          select: { parentId: true, childId: true },
        });
        if (parentLinks.length > 0) {
          await tx.notification.createMany({
            data: parentLinks.map((link) => ({
              userId: link.parentId,
              type: NotificationType.ATTENDANCE_UPDATED,
              title: "Attendance updated",
              body: `${childNameById.get(link.childId) || "Child"}: ${lecture.topic}`,
              targetPath: `/app/children?childId=${link.childId}`,
            })),
          });
        }
        await createAbsenceCommentNotifications(
          tx,
          payload.data.attendance.map((row) => ({
            childId: row.childId,
            childName: childNameById.get(row.childId) || "Child",
            present: row.present,
            comment: row.comment,
          })),
          req.user!.id
        );
      }

      return tx.lecture.findUnique({
        where: { id: req.params.id },
        include: {
          attendance: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true, status: true },
              },
              lesson: {
                select: { id: true, title: true, nivo: true },
              },
            },
          },
        },
      });
    });
    const updatedWithHomework = updated ? await applyHomeworkStateToLecture(updated) : updated;
    return res.json(updatedWithHomework);
    }
  );

  router.post(
    "/lectures/:id/complete",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
      const existing = await prisma.lecture.findUnique({
        where: { id: req.params.id },
        include: { attendance: { select: { childId: true, lessonId: true } } },
      });
      if (!existing) return res.status(404).json({ message: "Lecture not found" });
      if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
      if (!existing.attendance.length) {
        return res.status(400).json({ message: "Lecture must have attendance records before completion" });
      }
      const hasMissingLesson = existing.attendance.some((row) => !row.lessonId);
      if (hasMissingLesson) {
        return res.status(400).json({ message: "All attendance rows must include a lesson before completion" });
      }
      const completedLecture = await prisma.lecture.findUnique({
        where: { id: req.params.id },
        include: {
          attendance: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true, status: true },
              },
              lesson: {
                select: { id: true, title: true, nivo: true },
              },
            },
          },
        },
      });
      if (!completedLecture) return res.status(404).json({ message: "Lecture not found" });
      if (completedLecture.status === LectureStatus.COMPLETED) {
        const hydrated = await applyHomeworkStateToLecture(completedLecture);
        return res.json(hydrated);
      }
      const updated = await prisma.lecture.update({
        where: { id: req.params.id },
        data: {
          status: LectureStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          attendance: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true, status: true },
              },
              lesson: {
                select: { id: true, title: true, nivo: true },
              },
            },
          },
        },
      });
      const hydrated = await applyHomeworkStateToLecture(updated);
      return res.json(hydrated);
    }
  );

  router.get("/homework", requireAuth, async (req: AppRequest, res) => {
    const query = homeworkListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });

    const page = query.data.page ?? 1;
    const pageSize = query.data.pageSize ?? 10;
    const searchTerm = query.data.q?.trim();
    const role = req.user!.role;
    const isLinkedScopeRole = role === Role.PARENT || role === Role.USER || role === Role.BOARD_MEMBER;
    const isSuperAdmin = role === Role.SUPER_ADMIN;

    const linkedChildIds = isLinkedScopeRole
      ? (
          await prisma.parentChild.findMany({
            where: { parentId: req.user!.id },
            select: { childId: true },
          })
        ).map((row) => row.childId)
      : [];
    if (isLinkedScopeRole && linkedChildIds.length === 0) {
      return res.json({ items: [], total: 0, page, pageSize });
    }

    let lectureFilter:
      | {
          lectureId: string;
        }
      | undefined;
    if (query.data.lectureId) {
      const lecture = await prisma.lecture.findUnique({
        where: { id: query.data.lectureId },
      });
      if (!lecture) return res.status(404).json({ message: "Lecture not found" });
      if (!canAccessCommunity(req, lecture.communityId)) return res.status(403).json({ message: "Forbidden community" });
      lectureFilter = { lectureId: lecture.id };
    }

    const where = {
      homeworkTitle: { not: null as string | null },
      lessonId: { not: null as string | null },
      ...(typeof query.data.done === "number" ? { homeworkDone: query.data.done === 1 } : {}),
      ...(query.data.childId ? { childId: query.data.childId } : {}),
      child: {
        ...(isSuperAdmin ? {} : { communityId: req.user!.communityId || undefined }),
        ...(query.data.nivo !== undefined ? { nivo: query.data.nivo } : {}),
        ...(isLinkedScopeRole ? { id: { in: linkedChildIds } } : {}),
      },
      AND: [
        ...(lectureFilter ? [lectureFilter] : []),
        ...(searchTerm
          ? [
              {
                OR: [
                  { homeworkTitle: { contains: searchTerm, mode: "insensitive" as const } },
                  { homeworkDescription: { contains: searchTerm, mode: "insensitive" as const } },
                  { child: { firstName: { contains: searchTerm, mode: "insensitive" as const } } },
                  { child: { lastName: { contains: searchTerm, mode: "insensitive" as const } } },
                  { lesson: { title: { contains: searchTerm, mode: "insensitive" as const } } },
                  { lecture: { topic: { contains: searchTerm, mode: "insensitive" as const } } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, items] = await prisma.$transaction([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          lecture: {
            select: {
              id: true,
              topic: true,
              status: true,
              completedAt: true,
              updatedAt: true,
              createdAt: true,
              community: { select: { id: true, name: true } },
            },
          },
          child: { select: { id: true, firstName: true, lastName: true, nivo: true } },
          lesson: { select: { id: true, title: true, nivo: true } },
        },
        orderBy: [{ homeworkDone: "asc" }, { markedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      items: items.map((item) => ({
        id: `${item.lectureId}:${item.childId}`,
        lectureId: item.lectureId,
        childId: item.childId,
        lessonId: item.lessonId as string,
        title: item.homeworkTitle?.trim() || item.lesson?.title || "Homework",
        description: item.homeworkDescription?.trim() || null,
        done: item.homeworkDone === true,
        updatedAt: item.lecture.updatedAt,
        lecture: item.lecture,
        child: item.child,
        lesson: item.lesson,
      })),
      total,
      page,
      pageSize,
    });
  });

  router.patch("/homework/:lectureId/:childId", requireAuth, async (req: AppRequest, res) => {
    const payload = z
      .object({
        done: z.boolean().optional(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existingAttendance = await prisma.attendance.findUnique({
      where: { lectureId_childId: { lectureId: req.params.lectureId, childId: req.params.childId } },
      include: {
        lecture: { select: { id: true, topic: true, status: true, completedAt: true, updatedAt: true, createdAt: true } },
        child: { select: { id: true, communityId: true, firstName: true, lastName: true, nivo: true } },
        lesson: { select: { id: true, title: true, nivo: true } },
      },
    });
    if (!existingAttendance) return res.status(404).json({ message: "Homework not found" });

    const role = req.user!.role;
    if (role !== Role.SUPER_ADMIN && existingAttendance.child.communityId !== req.user!.communityId) {
      return res.status(403).json({ message: "Forbidden community" });
    }
    if (role === Role.PARENT || role === Role.USER || role === Role.BOARD_MEMBER) {
      const linked = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId: req.user!.id, childId: existingAttendance.childId } },
      });
      if (!linked) return res.status(403).json({ message: "Forbidden" });
    }

    const nextHomeworkTitle = payload.data.title !== undefined ? payload.data.title.trim() : (existingAttendance.homeworkTitle || "").trim();
    const isHomeworkMutation = payload.data.done !== undefined || payload.data.title !== undefined || payload.data.description !== undefined;
    if (isHomeworkMutation && !nextHomeworkTitle) {
      return res.status(400).json({ message: "Homework title is required when homework is set" });
    }

    const updated = await prisma.attendance.update({
      where: { lectureId_childId: { lectureId: req.params.lectureId, childId: req.params.childId } },
      data: {
        ...(typeof payload.data.done === "boolean" ? { homeworkDone: payload.data.done } : {}),
        ...(payload.data.title !== undefined ? { homeworkTitle: payload.data.title.trim() } : {}),
        ...(payload.data.description !== undefined ? { homeworkDescription: payload.data.description.trim() || null } : {}),
      },
      include: {
        lecture: { select: { id: true, topic: true, status: true, completedAt: true, updatedAt: true, createdAt: true } },
        child: { select: { id: true, firstName: true, lastName: true, nivo: true } },
        lesson: { select: { id: true, title: true, nivo: true } },
      },
    });
    const wasHomeworkDone = existingAttendance.homeworkDone === true;
    const isHomeworkDone = updated.homeworkDone === true;
    if (!wasHomeworkDone && isHomeworkDone) {
      const parentLinks = await prisma.parentChild.findMany({
        where: { childId: existingAttendance.childId },
        select: { parentId: true },
      });
      const admins = await prisma.user.findMany({
        where: {
          role: Role.ADMIN,
          communityId: existingAttendance.child.communityId,
        },
        select: { id: true },
      });
      const recipientIds = [...new Set([...parentLinks.map((row) => row.parentId), ...admins.map((row) => row.id)])].filter(
        (id) => id !== req.user!.id
      );
      if (recipientIds.length > 0) {
        const childName = formatFullName(existingAttendance.child.firstName, existingAttendance.child.lastName) || "Child";
        const homeworkTitle = updated.homeworkTitle?.trim() || updated.lesson?.title || "Homework";
        await prisma.notification.createMany({
          data: recipientIds.map((recipientId) => ({
            userId: recipientId,
            type: NotificationType.HOMEWORK_COMPLETED,
            title: "Homework done",
            body: `${childName}: ${homeworkTitle}`,
            targetPath: `/app/children?childId=${existingAttendance.childId}`,
          })),
        });
      }
    }

    return res.json({
      id: `${updated.lectureId}:${updated.childId}`,
      lectureId: updated.lectureId,
      childId: updated.childId,
      lessonId: updated.lessonId,
      title: updated.homeworkTitle?.trim() || updated.lesson?.title || "Homework",
      description: updated.homeworkDescription?.trim() || null,
      done: updated.homeworkDone === true,
      updatedAt: updated.lecture.updatedAt,
      lecture: updated.lecture,
      child: updated.child,
      lesson: updated.lesson,
    });
  });

  router.delete(
    "/lectures/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lecture not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.lecture.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    }
  );

  router.get("/nivo-books", requireAuth, async (_req: AppRequest, res) => {
    const books = await Promise.all(
      NIVO_BOOK_NIVOS.map(async (nivo) => {
        const absolutePath = getNivoBookAbsolutePathByNivo(nivo);
        const originalName = getNivoBookFileNameByNivo(nivo);
        if (!absolutePath || !originalName) return null;
        try {
          const stats = await fs.stat(absolutePath);
          if (!stats.isFile()) return null;
          return {
            nivo,
            originalName,
            mimeType: "application/pdf",
            sizeBytes: stats.size,
            updatedAt: new Date(stats.mtimeMs).toISOString(),
          };
        } catch {
          return null;
        }
      })
    );
    const items = books.filter((book): book is NonNullable<(typeof books)[number]> => Boolean(book));
    return res.json(items);
  });

  router.get("/nivo-books/:nivo/preview", requireAuth, async (req: AppRequest, res) => {
    const params = nivoBookParamsSchema.safeParse(req.params);
    if (!params.success) return res.status(400).json({ message: "Invalid nivo" });

    const absolutePath = getNivoBookAbsolutePathByNivo(params.data.nivo);
    const originalName = getNivoBookFileNameByNivo(params.data.nivo);
    if (!absolutePath || !originalName) return res.status(404).json({ message: "Nivo book not found" });

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(originalName)}"`);
      return res.status(200).send(fileBuffer);
    } catch {
      return res.status(404).json({ message: "Nivo book file not found" });
    }
  });

  router.get("/lessons", requireAuth, async (_req: AppRequest, res) => {
    const lessons = await prisma.lesson.findMany({
      orderBy: [{ nivo: "asc" }, { title: "asc" }],
    });
    return res.json(lessons);
  });

  router.post("/lessons", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const payload = lessonPayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const lesson = await prisma.lesson.create({
      data: {
        title: payload.data.title.trim(),
        nivo: payload.data.nivo,
      },
    });

    return res.status(201).json(lesson);
  });

  router.patch("/lessons/:id", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const payload = lessonUpdatePayloadSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lesson not found" });

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        title: payload.data.title?.trim(),
        nivo: payload.data.nivo,
      },
    });

    return res.json(updated);
  });

  router.delete("/lessons/:id", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lesson not found" });

    await prisma.lesson.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  return router;
}
