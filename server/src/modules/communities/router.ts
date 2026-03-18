import { BoardMemberRole, CommunityStatus, Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { canAccessCommunity } from "../../common/access.js";
import { prisma } from "../../prisma.js";
import { AppRequest } from "../../types.js";

const addressSchema = z.object({
  streetLine1: z.string().trim().min(2),
  streetLine2: z.string().trim().optional(),
  postalCode: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().optional(),
  country: z.string().trim().min(2),
});

const boardMemberRoleSchema = z.nativeEnum(BoardMemberRole);

const createBoardMemberSchema = z.object({
  role: boardMemberRoleSchema,
  userId: z.string().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  address: addressSchema.optional(),
});

const updateBoardMemberSchema = z.object({
  role: boardMemberRoleSchema.optional(),
  userId: z.string().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  address: addressSchema.nullable().optional(),
});

const communityBoardMembersInputSchema = z.array(
  z.object({
    userId: z.string().min(1),
    role: boardMemberRoleSchema,
  })
);

function toAddressPayload(address: z.infer<typeof addressSchema>) {
  return {
    streetLine1: address.streetLine1.trim(),
    streetLine2: address.streetLine2?.trim() || undefined,
    postalCode: address.postalCode.trim(),
    city: address.city.trim(),
    state: address.state?.trim() || undefined,
    country: address.country.trim(),
  };
}

async function upsertAddress(
  db: Prisma.TransactionClient | typeof prisma,
  address: z.infer<typeof addressSchema>
) {
  const payload = toAddressPayload(address);
  return db.address.upsert({
    where: {
      streetLine1_postalCode_city_country: {
        streetLine1: payload.streetLine1,
        postalCode: payload.postalCode,
        city: payload.city,
        country: payload.country,
      },
    },
    update: {
      streetLine2: payload.streetLine2,
      state: payload.state,
    },
    create: payload,
  });
}

async function resolveBoardMemberUser(userId: string, communityId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      communityId: true,
    },
  });
  if (!user) return { error: "Linked user not found" as const };
  if (user.communityId && user.communityId !== communityId) {
    return { error: "Linked user must belong to the same community" as const };
  }
  return { user };
}

function hasRequiredStandaloneIdentity(data: z.infer<typeof createBoardMemberSchema> | z.infer<typeof updateBoardMemberSchema>) {
  return Boolean(data.firstName?.trim() && data.lastName?.trim());
}

function boardAssignmentKey(data: { userId: string; role: BoardMemberRole }) {
  return `${data.userId}:${data.role}`;
}

export function communitiesRouter() {
  const router = Router();

  router.get("/communities", requireAuth, async (req: AppRequest, res) => {
    const communities = await prisma.community.findMany({
      where:
        req.user!.role === Role.SUPER_ADMIN
          ? {}
          : { id: req.user!.communityId || undefined, status: CommunityStatus.ACTIVE },
      include: {
        address: true,
        users: {
          where: { role: Role.ADMIN },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: "asc" },
        },
        _count: { select: { boardMembers: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });
    return res.json(communities);
  });

  router.get(
    "/communities/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const community = await prisma.community.findFirst({
      where: { id: req.params.id, status: CommunityStatus.ACTIVE },
      include: {
        address: true,
        users: {
          where: { role: Role.ADMIN },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: "asc" },
        },
        boardMembers: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            address: true,
          },
          orderBy: [{ role: "asc" }, { mandateStartDate: "asc" }],
        },
      },
    });
    if (!community) return res.status(404).json({ message: "Community not found" });
    if (!canAccessCommunity(req, community.id)) return res.status(403).json({ message: "Forbidden" });
    return res.json(community);
    }
  );

  router.post("/communities", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        name: z.string().trim().min(2),
        description: z.string().trim().optional(),
        contactEmail: z.string().trim().email().optional(),
        contactPhone: z.string().trim().optional(),
        address: addressSchema,
        adminUserIds: z.array(z.string()).default([]),
        boardMembers: z.array(createBoardMemberSchema).default([]),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    if (!payload.data.adminUserIds.length) {
      return res.status(400).json({ message: "At least one admin assignment is required (multiple are allowed)" });
    }

    const adminUsers = payload.data.adminUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: payload.data.adminUserIds }, role: Role.ADMIN },
          select: { id: true },
        })
      : [];
    if (adminUsers.length !== payload.data.adminUserIds.length) {
      return res.status(400).json({ message: "All admin assignments must reference existing ADMIN users" });
    }

    const address = await upsertAddress(prisma, payload.data.address);

    const community = await prisma.$transaction(async (tx) => {
      const createdCommunity = await tx.community.create({
        data: {
          name: payload.data.name,
          description: payload.data.description?.trim() || undefined,
          contactEmail: payload.data.contactEmail?.trim() || undefined,
          contactPhone: payload.data.contactPhone?.trim() || undefined,
          addressId: address.id,
        },
      });

      if (payload.data.adminUserIds.length) {
        await tx.user.updateMany({
          where: { id: { in: payload.data.adminUserIds } },
          data: { communityId: createdCommunity.id },
        });
      }

      for (const boardMember of payload.data.boardMembers) {
        let linkedUserId: string | undefined;
        let firstName = boardMember.firstName?.trim() || undefined;
        let lastName = boardMember.lastName?.trim() || undefined;
        let email = boardMember.email?.trim() || undefined;
        let phoneNumber = boardMember.phoneNumber?.trim() || undefined;
        let addressId: string | undefined;

        if (boardMember.userId) {
          const linkedUser = await tx.user.findUnique({
            where: { id: boardMember.userId },
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, communityId: true },
          });
          if (!linkedUser) throw new Error("Linked user not found");
          if (linkedUser.communityId !== createdCommunity.id) {
            await tx.user.update({
              where: { id: linkedUser.id },
              data: { communityId: createdCommunity.id },
            });
          }
          linkedUserId = linkedUser.id;
          firstName = linkedUser.firstName;
          lastName = linkedUser.lastName;
          email = linkedUser.email;
          phoneNumber = linkedUser.phoneNumber || undefined;
        } else if (!hasRequiredStandaloneIdentity(boardMember)) {
          throw new Error("Standalone board member requires first and last name");
        }

        if (boardMember.address) {
          const boardAddress = await upsertAddress(tx, boardMember.address);
          addressId = boardAddress.id;
        }

        await tx.communityBoardMember.create({
          data: {
            communityId: createdCommunity.id,
            role: boardMember.role,
            userId: linkedUserId,
            isActive: true,
            mandateStartDate: new Date(),
            mandateEndDate: null,
            firstName,
            lastName,
            email,
            phoneNumber,
            notes: boardMember.notes?.trim() || undefined,
            addressId,
          },
        });
      }

      return tx.community.findUniqueOrThrow({
        where: { id: createdCommunity.id },
        include: {
          address: true,
          users: {
            where: { role: Role.ADMIN },
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: { firstName: "asc" },
          },
          boardMembers: {
            where: { isActive: true },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
              address: true,
            },
            orderBy: [{ role: "asc" }, { mandateStartDate: "asc" }],
          },
        },
      });
    });
    return res.status(201).json(community);
  });

  router.patch(
    "/communities/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        name: z.string().trim().min(2).optional(),
        description: z.string().trim().optional(),
        contactEmail: z.string().trim().email().optional(),
        contactPhone: z.string().trim().optional(),
        address: addressSchema.optional(),
        adminUserIds: z.array(z.string()).optional(),
        boardMembers: communityBoardMembersInputSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    if (payload.data.adminUserIds && req.user!.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ message: "Only super admin can assign admins to a community" });
    }

    const existing = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.status !== CommunityStatus.ACTIVE) return res.status(404).json({ message: "Community not found" });
    if (!canAccessCommunity(req, existing.id)) return res.status(403).json({ message: "Forbidden" });

    if (
      (req.user!.role === Role.ADMIN || req.user!.role === Role.BOARD_MEMBER) &&
      (payload.data.name !== undefined || payload.data.description !== undefined)
    ) {
      return res.status(403).json({
        message: "Only super admin can update community name or description",
      });
    }

    let addressId = existing.addressId;
    if (payload.data.address) {
      const address = await upsertAddress(prisma, payload.data.address);
      addressId = address.id;
    }
    if (!addressId) {
      return res.status(400).json({ message: "Community address is required" });
    }

    if (payload.data.adminUserIds) {
      const adminUsers = await prisma.user.findMany({
        where: { id: { in: payload.data.adminUserIds }, role: Role.ADMIN },
        select: { id: true },
      });
      if (adminUsers.length !== payload.data.adminUserIds.length) {
        return res.status(400).json({ message: "All admin assignments must reference existing ADMIN users" });
      }
      await prisma.user.updateMany({
        where: { id: { in: payload.data.adminUserIds } },
        data: { communityId: existing.id },
      });
    }

    if (payload.data.boardMembers) {
      const seen = new Set<string>();
      const requestedAssignments = payload.data.boardMembers.map((member) => ({
        userId: member.userId,
        role: member.role,
      }));

      if (req.user!.role === Role.BOARD_MEMBER) {
        const activeSelfAssignments = await prisma.communityBoardMember.findMany({
          where: { communityId: existing.id, isActive: true, userId: req.user!.id },
          select: { userId: true, role: true },
        });
        const activeSelfKeys = new Set(
          activeSelfAssignments.map((assignment) =>
            boardAssignmentKey({ userId: assignment.userId || "", role: assignment.role })
          )
        );
        const requestedSelfKeys = new Set(
          requestedAssignments
            .filter((assignment) => assignment.userId === req.user!.id)
            .map((assignment) => boardAssignmentKey(assignment))
        );
        if (
          activeSelfKeys.size !== requestedSelfKeys.size ||
          [...activeSelfKeys].some((key) => !requestedSelfKeys.has(key))
        ) {
          return res.status(403).json({ message: "Board members cannot update their own board-member assignment" });
        }
      }

      for (const boardMember of payload.data.boardMembers) {
        const uniqueKey = boardAssignmentKey({ userId: boardMember.userId, role: boardMember.role });
        if (seen.has(uniqueKey)) {
          return res.status(400).json({ message: "Duplicate board member role assignment in payload" });
        }
        seen.add(uniqueKey);

        const linkedUser = await prisma.user.findUnique({
          where: { id: boardMember.userId },
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, communityId: true },
        });
        if (!linkedUser) {
          return res.status(400).json({ message: "Linked user not found for board member assignment" });
        }
        if (linkedUser.communityId !== existing.id) {
          await prisma.user.update({
            where: { id: linkedUser.id },
            data: { communityId: existing.id },
          });
        }
      }

      const activeAssignments = await prisma.communityBoardMember.findMany({
        where: { communityId: existing.id, isActive: true, userId: { not: null } },
        select: { id: true, userId: true, role: true },
      });
      const activeKeySet = new Set(
        activeAssignments.map((assignment) => boardAssignmentKey({ userId: assignment.userId!, role: assignment.role }))
      );
      const requestedKeySet = new Set(
        requestedAssignments.map((assignment) => boardAssignmentKey({ userId: assignment.userId, role: assignment.role }))
      );

      const idsToEnd = activeAssignments
        .filter((assignment) => !requestedKeySet.has(boardAssignmentKey({ userId: assignment.userId!, role: assignment.role })))
        .map((assignment) => assignment.id);

      const assignmentsToCreate = requestedAssignments.filter(
        (assignment) => !activeKeySet.has(boardAssignmentKey({ userId: assignment.userId, role: assignment.role }))
      );

      await prisma.$transaction(async (tx) => {
        if (idsToEnd.length) {
          await tx.communityBoardMember.updateMany({
            where: { id: { in: idsToEnd } },
            data: { isActive: false, mandateEndDate: new Date() },
          });
        }

        for (const boardMember of assignmentsToCreate) {
          const linkedUser = await tx.user.findUniqueOrThrow({
            where: { id: boardMember.userId },
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
          });

          await tx.communityBoardMember.create({
            data: {
              communityId: existing.id,
              role: boardMember.role,
              userId: linkedUser.id,
              isActive: true,
              mandateStartDate: new Date(),
              mandateEndDate: null,
              firstName: linkedUser.firstName,
              lastName: linkedUser.lastName,
              email: linkedUser.email,
              phoneNumber: linkedUser.phoneNumber || undefined,
            },
          });
        }
      });
    }

    const updated = await prisma.community.update({
      where: { id: req.params.id },
      data: {
        name: payload.data.name,
        description: payload.data.description?.trim() || undefined,
        contactEmail: payload.data.contactEmail?.trim() || undefined,
        contactPhone: payload.data.contactPhone?.trim() || undefined,
        addressId,
      },
      include: {
        address: true,
        users: {
          where: { role: Role.ADMIN },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: "asc" },
        },
        boardMembers: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            address: true,
          },
          orderBy: [{ role: "asc" }, { mandateStartDate: "asc" }],
        },
      },
    });

    return res.json(updated);
    }
  );

  router.delete("/communities/:id", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.status !== CommunityStatus.ACTIVE) return res.status(404).json({ message: "Community not found" });
    await prisma.community.update({
      where: { id: existing.id },
      data: {
        status: CommunityStatus.INACTIVE,
        deactivatedAt: new Date(),
      },
    });
    return res.status(204).send();
  });

  router.get(
    "/communities/:id/board-members",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    if (!canAccessCommunity(req, req.params.id)) return res.status(403).json({ message: "Forbidden" });
    const community = await prisma.community.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true },
    });
    if (!community || community.status !== CommunityStatus.ACTIVE) return res.status(404).json({ message: "Community not found" });
    const members = await prisma.communityBoardMember.findMany({
      where: { communityId: req.params.id, isActive: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        address: true,
      },
      orderBy: [{ role: "asc" }, { mandateStartDate: "asc" }],
    });
      return res.json(members);
    }
  );

  router.post(
    "/communities/:id/board-members",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
    const payload = createBoardMemberSchema.safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    if (!canAccessCommunity(req, req.params.id)) return res.status(403).json({ message: "Forbidden" });

    const existingCommunity = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!existingCommunity || existingCommunity.status !== CommunityStatus.ACTIVE) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (req.user!.role === Role.BOARD_MEMBER && payload.data.userId === req.user!.id) {
      return res.status(403).json({ message: "Board members cannot update their own board-member assignment" });
    }

    let linkedUserId: string | undefined;
    let firstName = payload.data.firstName?.trim() || undefined;
    let lastName = payload.data.lastName?.trim() || undefined;
    let email = payload.data.email?.trim() || undefined;
    let phoneNumber = payload.data.phoneNumber?.trim() || undefined;

    if (payload.data.userId) {
      const linked = await resolveBoardMemberUser(payload.data.userId, req.params.id);
      if ("error" in linked) return res.status(400).json({ message: linked.error });
      const activeExistingAssignment = await prisma.communityBoardMember.findFirst({
        where: {
          communityId: req.params.id,
          userId: linked.user.id,
          role: payload.data.role,
          isActive: true,
        },
        select: { id: true },
      });
      if (activeExistingAssignment) {
        return res.status(400).json({ message: "Board member assignment already exists" });
      }
      linkedUserId = linked.user.id;
      firstName = linked.user.firstName;
      lastName = linked.user.lastName;
      email = linked.user.email;
      phoneNumber = linked.user.phoneNumber || undefined;
    } else if (!hasRequiredStandaloneIdentity(payload.data)) {
      return res.status(400).json({ message: "Standalone board member requires first and last name" });
    }

    const address = payload.data.address ? await upsertAddress(prisma, payload.data.address) : null;

    const member = await prisma.communityBoardMember.create({
      data: {
        communityId: req.params.id,
        role: payload.data.role,
        userId: linkedUserId,
        isActive: true,
        mandateStartDate: new Date(),
        mandateEndDate: null,
        firstName,
        lastName,
        email,
        phoneNumber,
        notes: payload.data.notes?.trim() || undefined,
        addressId: address?.id || undefined,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        address: true,
      },
    });
      return res.status(201).json(member);
    }
  );

  router.patch(
    "/communities/:id/board-members/:boardMemberId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      const payload = updateBoardMemberSchema.safeParse(req.body);
      if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
      if (!canAccessCommunity(req, req.params.id)) return res.status(403).json({ message: "Forbidden" });
      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        select: { id: true, status: true },
      });
      if (!community || community.status !== CommunityStatus.ACTIVE) return res.status(404).json({ message: "Community not found" });

      const existing = await prisma.communityBoardMember.findUnique({ where: { id: req.params.boardMemberId } });
      if (!existing || existing.communityId !== req.params.id) {
        return res.status(404).json({ message: "Board member not found" });
      }
      if (!existing.isActive) {
        return res.status(404).json({ message: "Board member not found" });
      }
      if (req.user!.role === Role.BOARD_MEMBER && existing.userId === req.user!.id) {
        return res.status(403).json({ message: "Board members cannot update their own board-member assignment" });
      }

      let linkedUserId = existing.userId || undefined;
      let firstName = payload.data.firstName?.trim();
      let lastName = payload.data.lastName?.trim();
      let email = payload.data.email?.trim();
      let phoneNumber = payload.data.phoneNumber?.trim();

      if (Object.prototype.hasOwnProperty.call(payload.data, "userId")) {
        if (payload.data.userId) {
          const linked = await resolveBoardMemberUser(payload.data.userId, req.params.id);
          if ("error" in linked) return res.status(400).json({ message: linked.error });
          const nextRole = payload.data.role ?? existing.role;
          const duplicateActiveAssignment = await prisma.communityBoardMember.findFirst({
            where: {
              communityId: req.params.id,
              userId: linked.user.id,
              role: nextRole,
              isActive: true,
              id: { not: existing.id },
            },
            select: { id: true },
          });
          if (duplicateActiveAssignment) {
            return res.status(400).json({ message: "Board member assignment already exists" });
          }
          linkedUserId = linked.user.id;
          firstName = linked.user.firstName;
          lastName = linked.user.lastName;
          email = linked.user.email;
          phoneNumber = linked.user.phoneNumber || undefined;
        } else {
          linkedUserId = undefined;
        }
      }

      if (linkedUserId && payload.data.role && !Object.prototype.hasOwnProperty.call(payload.data, "userId")) {
        const duplicateActiveAssignment = await prisma.communityBoardMember.findFirst({
          where: {
            communityId: req.params.id,
            userId: linkedUserId,
            role: payload.data.role,
            isActive: true,
            id: { not: existing.id },
          },
          select: { id: true },
        });
        if (duplicateActiveAssignment) {
          return res.status(400).json({ message: "Board member assignment already exists" });
        }
      }

      if (!linkedUserId) {
        const finalFirstName = firstName ?? existing.firstName;
        const finalLastName = lastName ?? existing.lastName;
        if (!finalFirstName?.trim() || !finalLastName?.trim()) {
          return res.status(400).json({ message: "Standalone board member requires first and last name" });
        }
      }

      let addressIdUpdate: string | null | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(payload.data, "address")) {
        if (payload.data.address === null) {
          addressIdUpdate = null;
        } else if (payload.data.address) {
          const boardAddress = await upsertAddress(prisma, payload.data.address);
          addressIdUpdate = boardAddress.id;
        }
      }

      const updated = await prisma.communityBoardMember.update({
        where: { id: req.params.boardMemberId },
        data: {
          role: payload.data.role,
          userId: linkedUserId,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
          notes: payload.data.notes?.trim() || undefined,
          addressId: addressIdUpdate,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          address: true,
        },
      });
      return res.json(updated);
    }
  );

  router.delete(
    "/communities/:id/board-members/:boardMemberId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      if (!canAccessCommunity(req, req.params.id)) return res.status(403).json({ message: "Forbidden" });
      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        select: { id: true, status: true },
      });
      if (!community || community.status !== CommunityStatus.ACTIVE) return res.status(404).json({ message: "Community not found" });
      const existing = await prisma.communityBoardMember.findUnique({ where: { id: req.params.boardMemberId } });
      if (!existing || existing.communityId !== req.params.id) {
        return res.status(404).json({ message: "Board member not found" });
      }
      if (!existing.isActive) {
        return res.status(404).json({ message: "Board member not found" });
      }
      if (req.user!.role === Role.BOARD_MEMBER && existing.userId === req.user!.id) {
        return res.status(403).json({ message: "Board members cannot update their own board-member assignment" });
      }
      await prisma.communityBoardMember.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          mandateEndDate: new Date(),
        },
      });
      return res.status(204).send();
    }
  );

  return router;
}
