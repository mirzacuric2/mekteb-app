import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";

export function communicationRouter() {
  const router = Router();

  router.get("/posts", requireAuth, async (req: AppRequest, res) => {
    const where = req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined };
    const posts = await prisma.post.findMany({
      where,
      include: { comments: true, reactions: true, author: true },
      orderBy: { publishedAt: "desc" },
    });
    return res.json(posts);
  });

  router.post("/posts", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
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

    const users = await prisma.user.findMany({ where: { role: Role.USER, communityId: communityId! }, select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "POST_PUBLISHED",
        title: "New post",
        body: payload.data.title,
      })),
    });
    return res.status(201).json(post);
  });

  router.patch("/posts/:postId", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
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
  });

  router.delete("/posts/:postId", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.post.delete({ where: { id: req.params.postId } });
    return res.status(204).send();
  });

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
    if (req.user!.role === Role.USER && receiver.role !== Role.ADMIN) {
      return res.status(403).json({ message: "User can only message admin" });
    }

    const message = await prisma.message.create({
      data: { senderId: req.user!.id, receiverId: payload.data.receiverId, content: payload.data.content },
    });
    await prisma.notification.create({
      data: {
        userId: payload.data.receiverId,
        type: "MESSAGE_RECEIVED",
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
    const lectures = await prisma.lecture.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined },
      include: { attendance: true },
      orderBy: { heldAt: "desc" },
    });
    return res.json(lectures);
  });

  router.post("/lectures", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        topic: z.string().min(3),
        heldAt: z.string(),
        note: z.string().optional(),
        communityId: z.string().optional(),
        attendance: z
          .array(z.object({ childId: z.string(), present: z.boolean(), comment: z.string().optional() }))
          .default([]),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    if (!canAccessCommunity(req, communityId)) return res.status(403).json({ message: "Forbidden community" });

    const lecture = await prisma.lecture.create({
      data: {
        topic: payload.data.topic,
        heldAt: new Date(payload.data.heldAt),
        note: payload.data.note,
        adminId: req.user!.id,
        communityId: communityId!,
        attendance: {
          create: payload.data.attendance.map((item) => ({
            childId: item.childId,
            present: item.present,
            comment: item.comment,
          })),
        },
      },
      include: { attendance: true },
    });

    const childIds = payload.data.attendance.map((x) => x.childId);
    const parents = await prisma.parentChild.findMany({
      where: { childId: { in: childIds } },
      select: { parentId: true },
    });
    await prisma.notification.createMany({
      data: parents.map((p) => ({
        userId: p.parentId,
        type: "ATTENDANCE_UPDATED",
        title: "Attendance updated",
        body: `Lecture: ${payload.data.topic}`,
      })),
    });

    return res.status(201).json(lecture);
  });

  router.patch("/lectures/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        topic: z.string().min(3).optional(),
        note: z.string().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lecture not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    const updated = await prisma.lecture.update({ where: { id: req.params.id }, data: payload.data });
    return res.json(updated);
  });

  router.delete("/lectures/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Lecture not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.lecture.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  return router;
}
