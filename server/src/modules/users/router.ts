import { ChildStatus, CommunityStatus, Role, UserStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { generateRawToken, hashToken, requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { sendEmail } from "../../email.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";

export function usersRouter() {
  const router = Router();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const ssnSchema = z.string().min(10).max(20);
  const phoneSchema = z.string().min(6).max(30);
  const addressSchema = z.object({
    streetLine1: z.string().min(2),
    streetLine2: z.string().optional(),
    postalCode: z.string().min(2),
    city: z.string().min(2),
    state: z.string().optional(),
    country: z.string().min(2),
  });
  const childAddressSchema = z.object({
    streetLine1: z.string().trim().min(2),
    streetLine2: z.string().trim().optional(),
    postalCode: z.string().trim().min(2),
    city: z.string().trim().min(2),
    state: z.string().trim().optional(),
    country: z.string().trim().min(2),
  });
  const childSsnSchema = z.string().trim().min(10).max(20);
  const childNivoSchema = z.number().int().min(1).max(5);
  const childListQuerySchema = z.object({
    nivo: z.coerce.number().int().min(1).max(5).optional(),
    status: z.nativeEnum(ChildStatus).optional(),
    q: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  });
  const MANAGEABLE_USER_ROLES = [Role.ADMIN, Role.BOARD_MEMBER, Role.PARENT] as const;
  const manageableUserRoleSchema = z.enum(MANAGEABLE_USER_ROLES);
  const usersListQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  });

  router.get("/users", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const query = usersListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });
    const shouldPaginate = query.data.page !== undefined || query.data.pageSize !== undefined;
    const page = query.data.page ?? 1;
    const pageSize = query.data.pageSize ?? 10;
    const searchTerm = query.data.q?.trim();

    const where = {
      ...(req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId }),
      ...(query.data.role ? { role: query.data.role } : {}),
      ...(query.data.status ? { status: query.data.status } : {}),
      ...(searchTerm
        ? {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" as const } },
              { lastName: { contains: searchTerm, mode: "insensitive" as const } },
              { email: { contains: searchTerm, mode: "insensitive" as const } },
              { ssn: { contains: searchTerm, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    if (shouldPaginate) {
      const [total, items] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: { address: true },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return res.json({ items, total, page, pageSize });
    }
    const users = await prisma.user.findMany({
      where,
      include: { address: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  });

  router.get("/directory", requireAuth, async (req: AppRequest, res) => {
    const users = await prisma.user.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, role: true, communityId: true },
    });
    return res.json(users);
  });

  router.post("/users", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        ssn: ssnSchema.optional(),
        email: z.string().email(),
        role: manageableUserRoleSchema,
        phoneNumber: phoneSchema.optional(),
        communityId: z.string().optional(),
        address: addressSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) {
      const parentIdsIssue = payload.error.issues.find((issue) => issue.path[0] === "parentIds");
      if (parentIdsIssue) {
        return res.status(400).json({ message: "At least one parent is required", field: "parentIds" });
      }
      return res.status(400).json({ message: "Invalid payload" });
    }

    if (payload.data.role === Role.ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ message: "Only super admin can create admin" });
    }

    const email = payload.data.email.toLowerCase();
    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    const ssn = payload.data.ssn?.trim() || undefined;
    const phoneNumber = payload.data.phoneNumber?.trim() || undefined;
    let addressId: string | undefined;

    if (payload.data.address) {
      const normalizedAddress = {
        streetLine1: payload.data.address.streetLine1.trim(),
        streetLine2: payload.data.address.streetLine2?.trim() || undefined,
        postalCode: payload.data.address.postalCode.trim(),
        city: payload.data.address.city.trim(),
        state: payload.data.address.state?.trim() || undefined,
        country: payload.data.address.country.trim(),
      };

      const address = await prisma.address.upsert({
        where: {
          streetLine1_postalCode_city_country: {
            streetLine1: normalizedAddress.streetLine1,
            postalCode: normalizedAddress.postalCode,
            city: normalizedAddress.city,
            country: normalizedAddress.country,
          },
        },
        update: {
          streetLine2: normalizedAddress.streetLine2,
          state: normalizedAddress.state,
        },
        create: normalizedAddress,
      });

      addressId = address.id;
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return res.status(409).json({ message: "Email already exists", field: "email" });
    }

    if (ssn) {
      const existingBySsn = await prisma.user.findUnique({ where: { ssn } });
      if (existingBySsn) {
        return res.status(409).json({ message: "SSN already exists", field: "ssn" });
      }
    }

    if (!canAccessCommunity(req, communityId)) {
      return res.status(403).json({ message: "Cannot assign outside your community" });
    }
    if (!communityId) {
      return res
        .status(400)
        .json({ message: "Community is required for ADMIN/BOARD_MEMBER/PARENT", field: "communityId" });
    }
    if (communityId) {
      const existingCommunity = await prisma.community.findUnique({ where: { id: communityId } });
      if (!existingCommunity || existingCommunity.status !== CommunityStatus.ACTIVE) {
        return res.status(400).json({ message: "Community not found", field: "communityId" });
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        ssn,
        phoneNumber,
        email,
        role: payload.data.role,
        invitedById: req.user!.id,
        communityId: communityId || null,
        addressId: addressId || null,
        status: UserStatus.PENDING,
      },
      include: { address: true },
    });

    const rawToken = generateRawToken();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
    let invitationEmailSent = false;
    try {
      invitationEmailSent = await sendEmail({
        to: user.email,
        subject: "Verify your Mekteb account",
        html: `<p>Selam ${user.firstName}, verify your account:</p><a href="${frontendUrl}/verify?token=${rawToken}">Verify</a>`,
      });
    } catch (error) {
      console.error("Failed to send verification email", error);
    }

    return res.status(201).json({ ...user, invitationEmailSent });
  });

  router.patch("/users/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        ssn: ssnSchema.optional(),
        phoneNumber: phoneSchema.optional(),
        role: manageableUserRoleSchema.optional(),
        communityId: z.string().optional(),
        status: z.nativeEnum(UserStatus).optional(),
        address: addressSchema.nullable().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) {
      const parentIdsIssue = payload.error.issues.find((issue) => issue.path[0] === "parentIds");
      if (parentIdsIssue) {
        return res.status(400).json({ message: "At least one parent is required", field: "parentIds" });
      }
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });
    if (req.user!.role !== Role.SUPER_ADMIN && existing.communityId !== req.user!.communityId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (payload.data.role === Role.ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ message: "Only super admin can promote to admin" });
    }
    if (payload.data.communityId && !canAccessCommunity(req, payload.data.communityId)) {
      return res.status(403).json({ message: "Cannot assign outside your community" });
    }
    if (payload.data.communityId) {
      const existingCommunity = await prisma.community.findUnique({
        where: { id: payload.data.communityId },
      });
      if (!existingCommunity || existingCommunity.status !== CommunityStatus.ACTIVE) {
        return res.status(400).json({ message: "Community not found", field: "communityId" });
      }
    }

    const ssn = payload.data.ssn?.trim();
    if (ssn) {
      const existingBySsn = await prisma.user.findUnique({ where: { ssn } });
      if (existingBySsn && existingBySsn.id !== existing.id) {
        return res.status(409).json({ message: "SSN already exists", field: "ssn" });
      }
    }

    let addressIdUpdate: string | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(payload.data, "address")) {
      if (payload.data.address === null) {
        addressIdUpdate = null;
      } else if (payload.data.address) {
        const normalizedAddress = {
          streetLine1: payload.data.address.streetLine1.trim(),
          streetLine2: payload.data.address.streetLine2?.trim() || undefined,
          postalCode: payload.data.address.postalCode.trim(),
          city: payload.data.address.city.trim(),
          state: payload.data.address.state?.trim() || undefined,
          country: payload.data.address.country.trim(),
        };

        const address = await prisma.address.upsert({
          where: {
            streetLine1_postalCode_city_country: {
              streetLine1: normalizedAddress.streetLine1,
              postalCode: normalizedAddress.postalCode,
              city: normalizedAddress.city,
              country: normalizedAddress.country,
            },
          },
          update: {
            streetLine2: normalizedAddress.streetLine2,
            state: normalizedAddress.state,
          },
          create: normalizedAddress,
        });

        addressIdUpdate = address.id;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        role: payload.data.role,
        communityId: payload.data.communityId,
        status: payload.data.status,
        ssn: ssn || undefined,
        phoneNumber: payload.data.phoneNumber?.trim() || undefined,
        addressId: addressIdUpdate,
      },
      include: { address: true },
    });
    return res.json(updated);
  });

  router.delete("/users/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });
    if (existing.role === Role.SUPER_ADMIN) return res.status(403).json({ message: "Cannot delete super admin" });
    if (req.user!.role !== Role.SUPER_ADMIN && existing.communityId !== req.user!.communityId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  router.get("/children", requireAuth, async (req: AppRequest, res) => {
    const query = childListQuerySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });
    const shouldPaginate = query.data.page !== undefined || query.data.pageSize !== undefined;
    const page = query.data.page ?? 1;
    const pageSize = query.data.pageSize ?? 10;
    const searchTerm = query.data.q?.trim();
    const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;
    const requestorCommunityId = req.user!.communityId;
    if (!isSuperAdmin && !requestorCommunityId) {
      return res.status(403).json({ message: "Community assignment required" });
    }
    const whereFilters = {
      ...(query.data.nivo !== undefined ? { nivo: query.data.nivo } : {}),
      ...(query.data.status !== undefined ? { status: query.data.status } : {}),
      ...(searchTerm
        ? {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" as const } },
              { lastName: { contains: searchTerm, mode: "insensitive" as const } },
              { ssn: { contains: searchTerm, mode: "insensitive" as const } },
              {
                parents: {
                  some: {
                    parent: {
                      OR: [
                        { firstName: { contains: searchTerm, mode: "insensitive" as const } },
                        { lastName: { contains: searchTerm, mode: "insensitive" as const } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const childrenInclude = {
      address: true,
      parents: {
        include: {
          parent: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true, communityId: true },
          },
        },
      },
      attendance: {
        include: {
          lecture: {
            select: { id: true, topic: true, nivo: true, createdAt: true, updatedAt: true },
          },
          lesson: {
            select: { id: true, title: true, nivo: true },
          },
        },
        orderBy: { markedAt: "desc" as const },
      },
    };
    const childrenOrderBy = [{ status: "asc" as const }, { firstName: "asc" as const }, { lastName: "asc" as const }];

    if (req.user!.role === Role.USER || req.user!.role === Role.PARENT) {
      const scopedWhere = {
        parents: { some: { parentId: req.user!.id } },
        ...whereFilters,
      };
      if (shouldPaginate) {
        const [total, items] = await prisma.$transaction([
          prisma.child.count({ where: scopedWhere }),
          prisma.child.findMany({
            where: scopedWhere,
            include: childrenInclude,
            orderBy: childrenOrderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
        ]);
        return res.json({ items, total, page, pageSize });
      }
      const mine = await prisma.child.findMany({
        where: scopedWhere,
        include: childrenInclude,
        orderBy: childrenOrderBy,
      });
      return res.json(mine);
    }

    const scopedWhere = isSuperAdmin ? whereFilters : { communityId: requestorCommunityId!, ...whereFilters };
    if (shouldPaginate) {
      const [total, items] = await prisma.$transaction([
        prisma.child.count({ where: scopedWhere }),
        prisma.child.findMany({
          where: scopedWhere,
          include: childrenInclude,
          orderBy: childrenOrderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return res.json({ items, total, page, pageSize });
    }
    const items = await prisma.child.findMany({
      where: scopedWhere,
      include: childrenInclude,
      orderBy: childrenOrderBy,
    });
    return res.json(items);
  });

  router.post(
    "/children",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        ssn: childSsnSchema,
        birthDate: z.string(),
        nivo: childNivoSchema,
        communityId: z.string().optional(),
        parentIds: z.array(z.string()).min(1),
        address: childAddressSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    if (!communityId) {
      return res.status(400).json({ message: "Community is required for child creation", field: "communityId" });
    }
    if (!canAccessCommunity(req, communityId)) return res.status(403).json({ message: "Forbidden community" });

    const existingCommunity = await prisma.community.findUnique({ where: { id: communityId } });
    if (!existingCommunity || existingCommunity.status !== CommunityStatus.ACTIVE) {
      return res.status(400).json({ message: "Community not found", field: "communityId" });
    }

    const ssn = payload.data.ssn.trim();
    const existingBySsn = await prisma.child.findUnique({ where: { ssn } });
    if (existingBySsn) {
      return res.status(409).json({ message: "SSN already exists", field: "ssn" });
    }

    const uniqueParentIds = [...new Set(payload.data.parentIds)];
    const parents = await prisma.user.findMany({
      where: {
        id: { in: uniqueParentIds },
        role: { not: Role.SUPER_ADMIN },
        communityId,
      },
      select: { id: true },
    });
    if (parents.length !== uniqueParentIds.length) {
      return res.status(400).json({ message: "All parents must exist in the same community", field: "parentIds" });
    }

    let addressId: string | undefined;
    if (payload.data.address) {
      const normalizedAddress = {
        streetLine1: payload.data.address.streetLine1.trim(),
        streetLine2: payload.data.address.streetLine2?.trim() || undefined,
        postalCode: payload.data.address.postalCode.trim(),
        city: payload.data.address.city.trim(),
        state: payload.data.address.state?.trim() || undefined,
        country: payload.data.address.country.trim(),
      };
      const address = await prisma.address.upsert({
        where: {
          streetLine1_postalCode_city_country: {
            streetLine1: normalizedAddress.streetLine1,
            postalCode: normalizedAddress.postalCode,
            city: normalizedAddress.city,
            country: normalizedAddress.country,
          },
        },
        update: {
          streetLine2: normalizedAddress.streetLine2,
          state: normalizedAddress.state,
        },
        create: normalizedAddress,
      });
      addressId = address.id;
    }

    const child = await prisma.child.create({
      data: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        ssn,
        birthDate: new Date(payload.data.birthDate),
        nivo: payload.data.nivo,
        status: ChildStatus.ACTIVE,
        communityId,
        addressId: addressId || null,
        parents: { create: uniqueParentIds.map((parentId) => ({ parentId })) },
      },
      include: {
        address: true,
        parents: {
          include: {
            parent: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, communityId: true },
            },
          },
        },
      },
    });
      return res.status(201).json(child);
    }
  );

  router.patch(
    "/children/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.PARENT, Role.USER),
    async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        ssn: childSsnSchema.optional(),
        birthDate: z.string().optional(),
        nivo: childNivoSchema.optional(),
        communityId: z.string().optional(),
        parentIds: z.array(z.string()).min(1).optional(),
        status: z.nativeEnum(ChildStatus).optional(),
        address: childAddressSchema.nullable().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.child.findUnique({
      where: { id: req.params.id },
      include: { parents: { select: { parentId: true } } },
    });
    if (!existing) return res.status(404).json({ message: "Child not found" });
    const isParentScoped = req.user!.role === Role.PARENT || req.user!.role === Role.USER;

    if (isParentScoped) {
      const ownsChild = existing.parents.some((parent) => parent.parentId === req.user!.id);
      if (!ownsChild) return res.status(403).json({ message: "Forbidden" });
      if (payload.data.communityId !== undefined || payload.data.nivo !== undefined) {
        return res.status(403).json({ message: "Only admin can update community or nivo" });
      }
      if (payload.data.status !== undefined) {
        return res.status(403).json({ message: "Only admin can update child status" });
      }
      if (payload.data.parentIds !== undefined) {
        return res.status(403).json({ message: "Only admin can reassign parents" });
      }
    } else if (!canAccessCommunity(req, existing.communityId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let targetCommunityId = existing.communityId;
    if (!isParentScoped && payload.data.communityId) {
      if (!canAccessCommunity(req, payload.data.communityId)) {
        return res.status(403).json({ message: "Cannot assign outside your community" });
      }
      const existingCommunity = await prisma.community.findUnique({ where: { id: payload.data.communityId } });
      if (!existingCommunity || existingCommunity.status !== CommunityStatus.ACTIVE) {
        return res.status(400).json({ message: "Community not found", field: "communityId" });
      }
      targetCommunityId = payload.data.communityId;
    }

    const nextSsn = payload.data.ssn?.trim() ?? existing.ssn?.trim() ?? "";
    const isStatusOnlyPatch =
      payload.data.status !== undefined &&
      payload.data.firstName === undefined &&
      payload.data.lastName === undefined &&
      payload.data.ssn === undefined &&
      payload.data.birthDate === undefined &&
      payload.data.nivo === undefined &&
      payload.data.communityId === undefined &&
      payload.data.parentIds === undefined &&
      payload.data.address === undefined;

    if (!isStatusOnlyPatch && !nextSsn) {
      return res.status(400).json({ message: "SSN is required", field: "ssn" });
    }

    if (nextSsn) {
      const existingBySsn = await prisma.child.findUnique({ where: { ssn: nextSsn } });
      if (existingBySsn && existingBySsn.id !== existing.id) {
        return res.status(409).json({ message: "SSN already exists", field: "ssn" });
      }
    }

    let addressIdUpdate: string | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(payload.data, "address")) {
      if (payload.data.address === null) {
        addressIdUpdate = null;
      } else if (payload.data.address) {
        const normalizedAddress = {
          streetLine1: payload.data.address.streetLine1.trim(),
          streetLine2: payload.data.address.streetLine2?.trim() || undefined,
          postalCode: payload.data.address.postalCode.trim(),
          city: payload.data.address.city.trim(),
          state: payload.data.address.state?.trim() || undefined,
          country: payload.data.address.country.trim(),
        };
        const address = await prisma.address.upsert({
          where: {
            streetLine1_postalCode_city_country: {
              streetLine1: normalizedAddress.streetLine1,
              postalCode: normalizedAddress.postalCode,
              city: normalizedAddress.city,
              country: normalizedAddress.country,
            },
          },
          update: {
            streetLine2: normalizedAddress.streetLine2,
            state: normalizedAddress.state,
          },
          create: normalizedAddress,
        });
        addressIdUpdate = address.id;
      }
    }

    if (!isParentScoped && payload.data.parentIds) {
      const uniqueParentIds = [...new Set(payload.data.parentIds)];
      const parents = await prisma.user.findMany({
        where: {
          id: { in: uniqueParentIds },
          role: { not: Role.SUPER_ADMIN },
          communityId: targetCommunityId,
        },
        select: { id: true },
      });
      if (parents.length !== uniqueParentIds.length) {
        return res.status(400).json({ message: "All parents must exist in the same community", field: "parentIds" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.parentChild.deleteMany({ where: { childId: existing.id } });
        await tx.parentChild.createMany({
          data: uniqueParentIds.map((parentId) => ({ parentId, childId: existing.id })),
        });
        return tx.child.update({
          where: { id: req.params.id },
          data: {
            firstName: payload.data.firstName,
            lastName: payload.data.lastName,
            ssn: payload.data.ssn !== undefined ? nextSsn : undefined,
            birthDate: payload.data.birthDate ? new Date(payload.data.birthDate) : undefined,
            nivo: payload.data.nivo,
            communityId: payload.data.communityId,
            status: payload.data.status,
            deactivatedAt:
              payload.data.status === undefined
                ? undefined
                : payload.data.status === ChildStatus.INACTIVE
                  ? new Date()
                  : null,
            addressId: addressIdUpdate,
          },
          include: {
            address: true,
            parents: {
              include: {
                parent: {
                  select: { id: true, firstName: true, lastName: true, email: true, role: true, communityId: true },
                },
              },
            },
          },
        });
      });
      return res.json(updated);
    }

    const updated = await prisma.child.update({
      where: { id: req.params.id },
      data: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        ssn: payload.data.ssn !== undefined ? nextSsn : undefined,
        birthDate: payload.data.birthDate ? new Date(payload.data.birthDate) : undefined,
        nivo: payload.data.nivo,
        communityId: payload.data.communityId,
        status: payload.data.status,
        deactivatedAt:
          payload.data.status === undefined
            ? undefined
            : payload.data.status === ChildStatus.INACTIVE
              ? new Date()
              : null,
        addressId: addressIdUpdate,
      },
      include: {
        address: true,
        parents: {
          include: {
            parent: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, communityId: true },
            },
          },
        },
      },
    });
      return res.json(updated);
    }
  );

  router.delete(
    "/children/:id",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
    const existing = await prisma.child.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Child not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.child.update({
      where: { id: req.params.id },
      data: {
        status: ChildStatus.INACTIVE,
        deactivatedAt: new Date(),
      },
    });
      return res.status(204).send();
    }
  );

  return router;
}
