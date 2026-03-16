import { ChildStatus, NotificationType, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";

export function communicationRouter() {
  const router = Router();
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
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  });

  router.get("/posts", requireAuth, async (req: AppRequest, res) => {
    const where = req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined };
    const posts = await prisma.post.findMany({
      where,
      include: { comments: true, reactions: true, author: true },
      orderBy: { publishedAt: "desc" },
    });
    return res.json(posts);
  });

  router.post(
    "/posts",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        title: z.string().min(3),
        content: z.string().min(3),
        communityId: z.string().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    if (!canAccessCommunity(req, communityId)) return res.status(403).json({ message: "Forbidden community" });

    const post = await prisma.post.create({
      data: { title: payload.data.title, content: payload.data.content, authorId: req.user!.id, communityId: communityId! },
    });

    const users = await prisma.user.findMany({
      where: { role: { in: [Role.USER, Role.PARENT, Role.BOARD_MEMBER] }, communityId: communityId! },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: NotificationType.POST_PUBLISHED,
        title: "New post",
        body: payload.data.title,
      })),
    });
      return res.status(201).json(post);
    }
  );

  router.patch(
    "/posts/:postId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        title: z.string().min(3).optional(),
        content: z.string().min(3).optional(),
      })
      .safeParse(req.body);
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
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const existing = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.post.delete({ where: { id: req.params.postId } });
      return res.status(204).send();
    }
  );

  router.post("/posts/:postId/comments", requireAuth, async (req: AppRequest, res) => {
    const payload = z.object({ content: z.string().min(1) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const comment = await prisma.comment.create({
      data: { postId: req.params.postId, authorId: req.user!.id, content: payload.data.content },
    });
    return res.status(201).json(comment);
  });

  router.post("/posts/:postId/reactions", requireAuth, async (req: AppRequest, res) => {
    const payload = z.object({ kind: z.string().default("like") }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const reaction = await prisma.reaction.upsert({
      where: { postId_userId: { postId: req.params.postId, userId: req.user!.id } },
      create: { postId: req.params.postId, userId: req.user!.id, kind: payload.data.kind },
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
      return res.json({ items, total, page, pageSize });
    }

    const lectures = await prisma.lecture.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
    return res.json(lectures);
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
        communityId: z.string().optional(),
        attendance: z
          .array(
            z.object({
              childId: z.string(),
              lessonId: z.string().optional(),
              present: z.boolean(),
              homeworkDone: z.boolean().optional(),
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
        select: { id: true },
      });
      if (lessons.length !== lessonIds.length) {
        return res.status(400).json({ message: "Selected lessons must belong to the selected nivo" });
      }
    }
    const resolvedTopic = payload.data.topic?.trim() || `Nivo ${payload.data.nivo} activity report`;

    const lecture = await prisma.lecture.create({
      data: {
        topic: resolvedTopic,
        nivo: payload.data.nivo,
        note: payload.data.note,
        adminId: req.user!.id,
        communityId: communityId!,
        attendance: {
          create: payload.data.attendance.map((item) => ({
            childId: item.childId,
            lessonId: item.lessonId,
            present: item.present,
            homeworkDone: item.homeworkDone,
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

      return res.status(201).json(lecture);
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
        attendance: z
          .array(
            z.object({
              childId: z.string(),
              lessonId: z.string().optional(),
              present: z.boolean(),
              homeworkDone: z.boolean().optional(),
              comment: z.string().optional(),
            })
          )
          .min(1)
          .optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lecture not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    const resolvedNivo = payload.data.nivo ?? existing.nivo;
    if (payload.data.attendance && !resolvedNivo) {
      return res.status(400).json({ message: "Nivo is required when updating attendance" });
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
          select: { id: true },
        });
        if (lessons.length !== lessonIds.length) {
          return res.status(400).json({ message: "Selected lessons must belong to the selected nivo" });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const lecture = await tx.lecture.update({
        where: { id: req.params.id },
        data: {
          topic: payload.data.topic,
          nivo: payload.data.nivo,
          note: payload.data.note,
        },
      });

      if (payload.data.attendance) {
        await tx.attendance.deleteMany({ where: { lectureId: existing.id } });
        await tx.attendance.createMany({
          data: payload.data.attendance.map((item) => ({
            lectureId: existing.id,
            childId: item.childId,
            lessonId: item.lessonId,
            present: item.present,
            homeworkDone: item.homeworkDone,
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
    return res.json(updated);
    }
  );

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
