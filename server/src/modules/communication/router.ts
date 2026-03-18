import { ChildStatus, LectureStatus, NotificationType, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";

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
          type: NotificationType.POST_PUBLISHED,
          title: "New post",
          body: payload.data.title,
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
    const post = await prisma.post.findUnique({ where: { id: req.params.postId }, select: { id: true, communityId: true } });
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
      select: { id: true, communityId: true, authorId: true },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canReadPostCommunity(req, post.communityId)) return res.status(403).json({ message: "Forbidden community" });
    if (req.user!.role === Role.ADMIN && post.authorId === req.user!.id) {
      return res.status(403).json({ message: "Admin cannot react to own post" });
    }

    const reaction = await prisma.reaction.upsert({
      where: { postId_userId: { postId: req.params.postId, userId: req.user!.id } },
      create: { postId: post.id, userId: req.user!.id, kind: payload.data.kind },
      update: { kind: payload.data.kind },
    });
    return res.json(reaction);
  });

  router.get("/notifications", requireAuth, async (req: AppRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(notifications);
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

  router.get("/messages", requireAuth, async (req: AppRequest, res) => {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] },
      orderBy: { createdAt: "desc" },
    });
    return res.json(messages);
  });

  router.post("/messages", requireAuth, async (req: AppRequest, res) => {
    const payload = z.object({ receiverId: z.string(), content: z.string().min(1) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const receiver = await prisma.user.findUnique({ where: { id: payload.data.receiverId } });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (
      (req.user!.role === Role.USER || req.user!.role === Role.PARENT || req.user!.role === Role.BOARD_MEMBER) &&
      receiver.role !== Role.ADMIN
    ) {
      return res.status(403).json({ message: "User can only message admin" });
    }

    const message = await prisma.message.create({
      data: { senderId: req.user!.id, receiverId: payload.data.receiverId, content: payload.data.content },
    });
    await prisma.notification.create({
      data: {
        userId: payload.data.receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: "New message",
        body: payload.data.content.slice(0, 80),
      },
    });
    return res.status(201).json(message);
  });

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
      select: { id: true },
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

    const parents = await prisma.parentChild.findMany({
      where: { childId: { in: childIds } },
      select: { parentId: true },
    });
    const uniqueParentIds = [...new Set(parents.map((parent) => parent.parentId))];
    await prisma.notification.createMany({
      data: uniqueParentIds.map((parentId) => ({
        userId: parentId,
        type: NotificationType.ATTENDANCE_UPDATED,
        title: "Attendance updated",
        body: `Lecture: ${resolvedTopic}`,
      })),
    });

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
        select: { id: true },
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
        const parents = await tx.parentChild.findMany({
          where: { childId: { in: childIds } },
          select: { parentId: true },
        });
        const uniqueParentIds = [...new Set(parents.map((parent) => parent.parentId))];
        if (uniqueParentIds.length > 0) {
          await tx.notification.createMany({
            data: uniqueParentIds.map((parentId) => ({
              userId: parentId,
              type: NotificationType.ATTENDANCE_UPDATED,
              title: "Attendance updated",
              body: `Lecture: ${lecture.topic}`,
            })),
          });
        }
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
          lecture: { select: { id: true, topic: true, status: true, completedAt: true, updatedAt: true, createdAt: true } },
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
