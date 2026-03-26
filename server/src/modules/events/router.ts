import { EventAudience, EventRecurrence, LessonProgram, Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAnyRole, requireAuth } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { prisma } from "../../prisma.js";
import { AppRequest } from "../../types.js";

const EVENT_MANAGER_ROLES = new Set<Role>([Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER]);
const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

const dateTimeSchema = z.string().datetime({ offset: true });
const audienceSchema = z.nativeEnum(EventAudience);
const recurrenceSchema = z.nativeEnum(EventRecurrence);

const eventRangeQuerySchema = z.object({
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
});

const createEventPayloadSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  startAt: dateTimeSchema,
  endAt: dateTimeSchema,
  recurrence: recurrenceSchema.default(EventRecurrence.NONE),
  recurrenceInterval: z.coerce.number().int().min(1).max(52).default(1),
  recurrenceEndsAt: dateTimeSchema.optional(),
  audience: audienceSchema.default(EventAudience.GENERAL),
  childIds: z.array(z.string().uuid()).default([]),
  nivo: z.coerce.number().int().min(1).max(5).optional(),
});

const updateEventPayloadSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  startAt: dateTimeSchema.optional(),
  endAt: dateTimeSchema.optional(),
  recurrence: recurrenceSchema.optional(),
  recurrenceInterval: z.coerce.number().int().min(1).max(52).optional(),
  recurrenceEndsAt: dateTimeSchema.nullable().optional(),
  audience: audienceSchema.optional(),
  childIds: z.array(z.string().uuid()).optional(),
  nivo: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

type EventInputState = {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  recurrence: EventRecurrence;
  recurrenceInterval: number;
  recurrenceEndsAt: Date | null;
  audience: EventAudience;
  childIds: string[];
  nivo: number | null;
};

type EventWithChildren = Prisma.EventGetPayload<{
  include: {
    children: {
      include: {
        child: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            nivo: true;
          };
        };
      };
    };
  };
}>;

function normalizeEventState(raw: z.infer<typeof createEventPayloadSchema>): EventInputState {
  return {
    title: raw.title.trim(),
    description: raw.description?.trim() || undefined,
    startAt: new Date(raw.startAt),
    endAt: new Date(raw.endAt),
    recurrence: raw.recurrence,
    recurrenceInterval: raw.recurrenceInterval,
    recurrenceEndsAt: raw.recurrenceEndsAt ? new Date(raw.recurrenceEndsAt) : null,
    audience: raw.audience,
    childIds: [...new Set(raw.childIds)],
    nivo: raw.nivo ?? null,
  };
}

function validateEventState(state: EventInputState) {
  if (Number.isNaN(state.startAt.getTime()) || Number.isNaN(state.endAt.getTime())) {
    return "Invalid start or end date";
  }
  if (state.endAt <= state.startAt) {
    return "Event end date/time must be after start date/time";
  }
  if (state.recurrence !== EventRecurrence.NONE) {
    if (state.recurrenceEndsAt) {
      if (Number.isNaN(state.recurrenceEndsAt.getTime())) {
        return "Invalid recurrence end date/time";
      }
      if (state.recurrenceEndsAt < state.startAt) {
        return "Recurrence end date/time cannot be before event start date/time";
      }
    }
  }
  if ((state.audience === EventAudience.NIVO || state.audience === EventAudience.ILMIHAL) && !state.nivo) {
    return "Nivo audience requires nivo";
  }
  if (state.audience === EventAudience.CHILDREN && state.childIds.length === 0) {
    return "Children audience requires at least one child";
  }
  return null;
}

function addRecurringStep(date: Date, recurrence: EventRecurrence, interval: number) {
  const next = new Date(date);
  if (recurrence === EventRecurrence.WEEKLY) {
    next.setDate(next.getDate() + interval * 7);
    return next;
  }
  if (recurrence === EventRecurrence.YEARLY) {
    next.setFullYear(next.getFullYear() + interval);
    return next;
  }
  return next;
}

function expandEventOccurrences(
  event: EventWithChildren,
  from: Date,
  to: Date
) {
  const durationMs = event.endAt.getTime() - event.startAt.getTime();
  if (durationMs <= 0) return [];
  const occurrences: Array<{
    occurrenceStartAt: string;
    occurrenceEndAt: string;
    sourceStartAt: string;
    sourceEndAt: string;
    event: EventWithChildren;
  }> = [];

  if (event.recurrence === EventRecurrence.NONE) {
    if (event.startAt <= to && event.endAt >= from) {
      occurrences.push({
        occurrenceStartAt: event.startAt.toISOString(),
        occurrenceEndAt: event.endAt.toISOString(),
        sourceStartAt: event.startAt.toISOString(),
        sourceEndAt: event.endAt.toISOString(),
        event,
      });
    }
    return occurrences;
  }

  let cursor = new Date(event.startAt);
  if (event.recurrence === EventRecurrence.WEEKLY && cursor < from) {
    const earliestStart = from.getTime() - durationMs;
    const delta = Math.max(0, earliestStart - cursor.getTime());
    const jumpSteps = Math.floor(delta / (WEEK_IN_MS * event.recurrenceInterval));
    if (jumpSteps > 0) {
      cursor = addRecurringStep(cursor, event.recurrence, jumpSteps * event.recurrenceInterval);
    }
  }
  if (event.recurrence === EventRecurrence.YEARLY && cursor < from) {
    const candidate = new Date(cursor);
    const targetYear = from.getUTCFullYear() - 1;
    if (candidate.getUTCFullYear() < targetYear) {
      candidate.setUTCFullYear(targetYear);
      cursor = candidate;
    }
  }

  while (cursor <= to) {
    if (event.recurrenceEndsAt && cursor > event.recurrenceEndsAt) break;
    const occurrenceEnd = new Date(cursor.getTime() + durationMs);
    if (occurrenceEnd >= from) {
      occurrences.push({
        occurrenceStartAt: cursor.toISOString(),
        occurrenceEndAt: occurrenceEnd.toISOString(),
        sourceStartAt: event.startAt.toISOString(),
        sourceEndAt: event.endAt.toISOString(),
        event,
      });
    }
    cursor = addRecurringStep(cursor, event.recurrence, event.recurrenceInterval);
  }
  return occurrences;
}

async function assertCommunityAccessForRead(req: AppRequest, communityId: string) {
  if (req.user!.role === Role.SUPER_ADMIN) return true;
  if (req.user!.role === Role.ADMIN || req.user!.role === Role.BOARD_MEMBER) {
    return canAccessCommunity(req, communityId);
  }
  if (req.user!.role === Role.PARENT || req.user!.role === Role.USER) {
    if (req.user!.communityId === communityId) return true;
    const hasLinkedChild = await prisma.parentChild.findFirst({
      where: { parentId: req.user!.id, child: { communityId } },
      select: { childId: true },
    });
    return Boolean(hasLinkedChild);
  }
  return false;
}

export function eventsRouter() {
  const router = Router();

  router.get(
    "/communities/:id/events",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER, Role.PARENT, Role.USER),
    async (req: AppRequest, res) => {
      const query = eventRangeQuerySchema.safeParse(req.query);
      if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });

      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        select: { id: true, status: true },
      });
      if (!community) return res.status(404).json({ message: "Community not found" });
      if (!(await assertCommunityAccessForRead(req, community.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const from = query.data.from ? new Date(query.data.from) : new Date();
      const to = query.data.to ? new Date(query.data.to) : new Date(from.getTime() + WEEK_IN_MS * 4);
      if (to <= from) {
        return res.status(400).json({ message: "Query 'to' must be after 'from'" });
      }

      const events = await prisma.event.findMany({
        where: {
          communityId: req.params.id,
          OR: [
            {
              recurrence: EventRecurrence.NONE,
              startAt: { lte: to },
              endAt: { gte: from },
            },
            {
              recurrence: { not: EventRecurrence.NONE },
              startAt: { lte: to },
              OR: [{ recurrenceEndsAt: null }, { recurrenceEndsAt: { gte: from } }],
            },
          ],
        },
        include: {
          children: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true },
              },
            },
          },
        },
        orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
      });

      if (req.user!.role === Role.ADMIN || req.user!.role === Role.BOARD_MEMBER || req.user!.role === Role.SUPER_ADMIN) {
        const occurrences = events
          .flatMap((event) => expandEventOccurrences(event, from, to))
          .sort((left, right) => left.occurrenceStartAt.localeCompare(right.occurrenceStartAt));
        return res.json({ items: occurrences, range: { from: from.toISOString(), to: to.toISOString() } });
      }

      const links = await prisma.parentChild.findMany({
        where: { parentId: req.user!.id, child: { communityId: req.params.id } },
        select: { childId: true, child: { select: { nivo: true, programEnrollments: { select: { program: true } } } } },
      });
      const linkedChildIds = new Set(links.map((item) => item.childId));
      const linkedNivos = new Set(links.map((item) => item.child.nivo));
      const linkedPrograms = new Set(links.flatMap((item) => item.child.programEnrollments.map((row) => row.program)));

      const visibleEvents = events.filter((event) => {
        if (event.audience === EventAudience.GENERAL) return true;
        if (event.audience === EventAudience.NIVO || event.audience === EventAudience.ILMIHAL) {
          return event.nivo !== null && linkedNivos.has(event.nivo);
        }
        if (event.audience === EventAudience.SUFARA) return linkedPrograms.has(LessonProgram.SUFARA);
        if (event.audience === EventAudience.QURAN) return linkedPrograms.has(LessonProgram.QURAN);
        if (event.audience === EventAudience.CHILDREN) {
          return event.children.some((row) => linkedChildIds.has(row.childId));
        }
        return false;
      });

      const occurrences = visibleEvents
        .flatMap((event) => expandEventOccurrences(event, from, to))
        .sort((left, right) => left.occurrenceStartAt.localeCompare(right.occurrenceStartAt));

      return res.json({ items: occurrences, range: { from: from.toISOString(), to: to.toISOString() } });
    }
  );

  router.get(
    "/communities/:id/events/:eventId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER, Role.PARENT, Role.USER),
    async (req: AppRequest, res) => {
      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!community) return res.status(404).json({ message: "Community not found" });
      if (!(await assertCommunityAccessForRead(req, community.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const event = await prisma.event.findUnique({
        where: { id: req.params.eventId },
        include: {
          children: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true },
              },
            },
          },
        },
      });
      if (!event || event.communityId !== req.params.id) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (req.user!.role === Role.PARENT || req.user!.role === Role.USER) {
        if (event.audience === EventAudience.GENERAL) return res.json(event);
        const links = await prisma.parentChild.findMany({
          where: { parentId: req.user!.id, child: { communityId: req.params.id } },
          select: { childId: true, child: { select: { nivo: true, programEnrollments: { select: { program: true } } } } },
        });
        const linkedChildIds = new Set(links.map((item) => item.childId));
        const linkedNivos = new Set(links.map((item) => item.child.nivo));
        const linkedPrograms = new Set(links.flatMap((item) => item.child.programEnrollments.map((row) => row.program)));
        if (event.audience === EventAudience.NIVO || event.audience === EventAudience.ILMIHAL) {
          if (event.nivo === null || !linkedNivos.has(event.nivo)) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        if (event.audience === EventAudience.SUFARA && !linkedPrograms.has(LessonProgram.SUFARA)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (event.audience === EventAudience.QURAN && !linkedPrograms.has(LessonProgram.QURAN)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (event.audience === EventAudience.CHILDREN) {
          const isLinked = event.children.some((row) => linkedChildIds.has(row.childId));
          if (!isLinked) return res.status(403).json({ message: "Forbidden" });
        }
      }
      return res.json(event);
    }
  );

  router.post(
    "/communities/:id/events",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      if (!EVENT_MANAGER_ROLES.has(req.user!.role as Role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!canAccessCommunity(req, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!community) return res.status(404).json({ message: "Community not found" });

      const payload = createEventPayloadSchema.safeParse(req.body);
      if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
      const state = normalizeEventState(payload.data);
      const validationError = validateEventState(state);
      if (validationError) return res.status(400).json({ message: validationError });

      if (state.audience === EventAudience.CHILDREN) {
        const children = await prisma.child.findMany({
          where: { id: { in: state.childIds }, communityId: req.params.id },
          select: { id: true },
        });
        if (children.length !== state.childIds.length) {
          return res.status(400).json({ message: "All selected children must belong to this community" });
        }
      }

      const created = await prisma.event.create({
        data: {
          communityId: req.params.id,
          createdById: req.user!.id,
          title: state.title,
          description: state.description,
          startAt: state.startAt,
          endAt: state.endAt,
          recurrence: state.recurrence,
          recurrenceInterval: state.recurrenceInterval,
          recurrenceEndsAt: state.recurrenceEndsAt,
          audience: state.audience,
          nivo: state.audience === EventAudience.NIVO || state.audience === EventAudience.ILMIHAL ? state.nivo : null,
          color: null,
          children:
            state.audience === EventAudience.CHILDREN
              ? { createMany: { data: state.childIds.map((childId) => ({ childId })) } }
              : undefined,
        },
        include: {
          children: {
            include: {
              child: {
                select: { id: true, firstName: true, lastName: true, nivo: true },
              },
            },
          },
        },
      });

      return res.status(201).json(created);
    }
  );

  router.patch(
    "/communities/:id/events/:eventId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      if (!EVENT_MANAGER_ROLES.has(req.user!.role as Role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!canAccessCommunity(req, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const payload = updateEventPayloadSchema.safeParse(req.body);
      if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

      const existing = await prisma.event.findUnique({
        where: { id: req.params.eventId },
        include: { children: { select: { childId: true } } },
      });
      if (!existing || existing.communityId !== req.params.id) {
        return res.status(404).json({ message: "Event not found" });
      }

      const mergedState: EventInputState = {
        title: payload.data.title ?? existing.title,
        description:
          payload.data.description !== undefined ? payload.data.description.trim() || undefined : existing.description || undefined,
        startAt: payload.data.startAt ? new Date(payload.data.startAt) : existing.startAt,
        endAt: payload.data.endAt ? new Date(payload.data.endAt) : existing.endAt,
        recurrence: payload.data.recurrence ?? existing.recurrence,
        recurrenceInterval: payload.data.recurrenceInterval ?? existing.recurrenceInterval,
        recurrenceEndsAt:
          payload.data.recurrenceEndsAt !== undefined
            ? payload.data.recurrenceEndsAt
              ? new Date(payload.data.recurrenceEndsAt)
              : null
            : existing.recurrenceEndsAt,
        audience: payload.data.audience ?? existing.audience,
        childIds: payload.data.childIds ?? existing.children.map((item) => item.childId),
        nivo:
          payload.data.nivo !== undefined
            ? payload.data.nivo
            : existing.nivo,
      };

      const validationError = validateEventState(mergedState);
      if (validationError) return res.status(400).json({ message: validationError });

      if (mergedState.audience === EventAudience.CHILDREN) {
        const children = await prisma.child.findMany({
          where: { id: { in: mergedState.childIds }, communityId: req.params.id },
          select: { id: true },
        });
        if (children.length !== mergedState.childIds.length) {
          return res.status(400).json({ message: "All selected children must belong to this community" });
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.event.update({
          where: { id: existing.id },
          data: {
            title: mergedState.title,
            description: mergedState.description,
            startAt: mergedState.startAt,
            endAt: mergedState.endAt,
            recurrence: mergedState.recurrence,
            recurrenceInterval: mergedState.recurrenceInterval,
            recurrenceEndsAt: mergedState.recurrenceEndsAt,
            audience: mergedState.audience,
            nivo:
              mergedState.audience === EventAudience.NIVO || mergedState.audience === EventAudience.ILMIHAL
                ? mergedState.nivo
                : null,
            color: null,
          },
        });

        await tx.eventChild.deleteMany({ where: { eventId: existing.id } });
        if (mergedState.audience === EventAudience.CHILDREN && mergedState.childIds.length > 0) {
          await tx.eventChild.createMany({
            data: mergedState.childIds.map((childId) => ({ eventId: existing.id, childId })),
          });
        }

        return tx.event.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            children: {
              include: {
                child: {
                  select: { id: true, firstName: true, lastName: true, nivo: true },
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
    "/communities/:id/events/:eventId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      if (!EVENT_MANAGER_ROLES.has(req.user!.role as Role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!canAccessCommunity(req, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const existing = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!existing || existing.communityId !== req.params.id) {
        return res.status(404).json({ message: "Event not found" });
      }
      await prisma.event.delete({ where: { id: existing.id } });
      return res.status(204).send();
    }
  );

  return router;
}
