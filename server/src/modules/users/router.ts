import { ChildStatus, CommunityStatus, LessonProgram, Role, UserStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { generateRawToken, hashToken, requireAnyRole, requireAuth, requireRole } from "../../auth.js";
import { userUiLanguageSchema, userUiLanguageToPrisma } from "../../common/user-ui-language.js";
import { sendEmail } from "../../email.js";
import { buildVerificationEmailContent, resolveVerificationLogoUrl } from "../../email/verification-email.js";
import { canAccessCommunity } from "../../common/access.js";
import { AppRequest } from "../../types.js";
import { assertChildLessonOutcomeNoDraftReports } from "./lesson-outcome-activity-guard.js";

const CHILD_PARENT_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  communityId: true,
  phoneNumber: true,
  status: true,
} as const;

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
  const lessonProgramSchema = z.nativeEnum(LessonProgram);
  const childListQuerySchema = z.object({
    childId: z.string().uuid().optional(),
    nivo: z.coerce.number().int().min(1).max(5).optional(),
    program: lessonProgramSchema.optional(),
    status: z.nativeEnum(ChildStatus).optional(),
    q: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    mine: z.coerce.number().int().min(0).max(1).optional(),
    communityScope: z.coerce.number().int().min(0).max(1).optional(),
  });
  const MANAGEABLE_USER_ROLES = [Role.ADMIN, Role.BOARD_MEMBER, Role.PARENT] as const;
  const manageableUserRoleSchema = z.enum(MANAGEABLE_USER_ROLES);
  const usersListQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    excludeMe: z.coerce.number().int().min(0).max(1).optional(),
  });
  const applyHomeworkStateToChildren = async <
    T extends {
      attendance?: Array<{
        lectureId: string;
        childId: string;
        lessonId?: string | null;
        homeworkDone?: boolean | null;
        homeworkTitle?: string | null;
        homeworkDescription?: string | null;
      }>;
    },
  >(
    children: T[]
  ): Promise<
    Array<
      T & {
        attendance?: Array<{
          lectureId: string;
          childId: string;
          lessonId?: string | null;
          homeworkDone: boolean | null;
          homeworkTitle: string | null;
          homeworkDescription: string | null;
        }>;
      }
    >
  > => {
    return children.map((child) => ({
      ...child,
      attendance: (child.attendance || []).map((item) => {
        return {
          ...item,
          homeworkDone: typeof item.homeworkDone === "boolean" ? item.homeworkDone : null,
          homeworkTitle: item.homeworkTitle?.trim() || null,
          homeworkDescription: item.homeworkDescription?.trim() || null,
        };
      }),
    }));
  };

  router.get(
    "/users",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_MEMBER),
    async (req: AppRequest, res) => {
      const query = usersListQuerySchema.safeParse(req.query);
      if (!query.success) return res.status(400).json({ message: "Invalid query parameters" });
      const shouldPaginate = query.data.page !== undefined || query.data.pageSize !== undefined;
      const page = query.data.page ?? 1;
      const pageSize = query.data.pageSize ?? 10;
      const searchTerm = query.data.q?.trim();
      const excludeMe = query.data.excludeMe === 1;

      const where = {
        ...(req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId }),
        ...(excludeMe ? { id: { not: req.user!.id } } : {}),
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
    }
  );

  router.get("/directory", requireAuth, async (req: AppRequest, res) => {
    const users = await prisma.user.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, role: true, status: true, communityId: true },
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
        preferredLanguage: userUiLanguageSchema.optional().default("en"),
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
        preferredLanguage: userUiLanguageToPrisma(payload.data.preferredLanguage),
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
      const verifyUrl = `${frontendUrl.replace(/\/$/, "")}/verify?token=${rawToken}`;
      const logoUrl = resolveVerificationLogoUrl(frontendUrl);
      const { subject, html, text } = buildVerificationEmailContent({
        firstName: user.firstName,
        verifyUrl,
        language: payload.data.preferredLanguage,
        logoUrl,
      });
      invitationEmailSent = await sendEmail({
        to: user.email,
        subject,
        html,
        text,
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
        preferredLanguage: userUiLanguageSchema.optional(),
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
        ...(payload.data.preferredLanguage !== undefined
          ? { preferredLanguage: userUiLanguageToPrisma(payload.data.preferredLanguage) }
          : {}),
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
    const mineOnly = query.data.mine === 1;
    const isLinkedChildrenOnlyRole = req.user!.role === Role.USER || req.user!.role === Role.PARENT;
    const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;
    const requestorCommunityId = req.user!.communityId;
    const selectedProgram = query.data.program;
    if (!isSuperAdmin && !isLinkedChildrenOnlyRole && !mineOnly && !requestorCommunityId) {
      return res.status(403).json({ message: "Community assignment required" });
    }
    const whereFilters = {
      ...(query.data.childId ? { id: query.data.childId } : {}),
      ...(query.data.nivo !== undefined ? { nivo: query.data.nivo } : {}),
      ...(selectedProgram ? { programEnrollments: { some: { program: selectedProgram } } } : {}),
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
            select: CHILD_PARENT_USER_SELECT,
          },
        },
      },
      attendance: {
        where: selectedProgram ? { lecture: { program: selectedProgram } } : undefined,
        include: {
          lecture: {
            select: {
              id: true,
              topic: true,
              program: true,
              nivo: true,
              status: true,
              completedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          lesson: {
            select: { id: true, title: true, nivo: true, program: true },
          },
        },
        orderBy: { markedAt: "desc" as const },
      },
      lessonOutcomes: {
        where: selectedProgram ? { lesson: { program: selectedProgram } } : undefined,
        select: {
          lessonId: true,
          passed: true,
          mark: true,
          updatedAt: true,
          markedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      programEnrollments: { select: { program: true } },
    };
    const childrenOrderBy = [{ status: "asc" as const }, { firstName: "asc" as const }, { lastName: "asc" as const }];

    if (isLinkedChildrenOnlyRole || mineOnly) {
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
        const itemsWithHomework = await applyHomeworkStateToChildren(items);
        return res.json({ items: itemsWithHomework, total, page, pageSize });
      }
      const mine = await prisma.child.findMany({
        where: scopedWhere,
        include: childrenInclude,
        orderBy: childrenOrderBy,
      });
      const mineWithHomework = await applyHomeworkStateToChildren(mine);
      return res.json(mineWithHomework);
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
      const itemsWithHomework = await applyHomeworkStateToChildren(items);
      return res.json({ items: itemsWithHomework, total, page, pageSize });
    }
    const items = await prisma.child.findMany({
      where: scopedWhere,
      include: childrenInclude,
      orderBy: childrenOrderBy,
    });
    const itemsWithHomework = await applyHomeworkStateToChildren(items);
    return res.json(itemsWithHomework);
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
        programs: z.array(lessonProgramSchema).min(1),
        communityId: z.string().optional(),
        parentIds: z.array(z.string()).min(1),
        address: childAddressSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const selectedPrograms = payload.data.programs;
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
        programEnrollments: {
          createMany: {
            data: [...new Set(selectedPrograms)].map((program) => ({ program })),
          },
        },
      },
      include: {
        address: true,
        parents: {
          include: {
            parent: {
              select: CHILD_PARENT_USER_SELECT,
            },
          },
        },
        programEnrollments: { select: { program: true } },
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
        programs: z.array(lessonProgramSchema).min(1).optional(),
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
      if (payload.data.programs !== undefined) {
        return res.status(403).json({ message: "Only admin can reassign programs" });
      }
    } else if (!canAccessCommunity(req, existing.communityId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const selectedPrograms = payload.data.programs;

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
        if (selectedPrograms) {
          const programs = [...new Set(selectedPrograms)];
          await tx.childProgramEnrollment.deleteMany({ where: { childId: existing.id } });
          await tx.childProgramEnrollment.createMany({
            data: programs.map((program) => ({ childId: existing.id, program })),
          });
        }
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
                  select: CHILD_PARENT_USER_SELECT,
                },
              },
            },
            programEnrollments: { select: { program: true } },
          },
        });
      });
      return res.json(updated);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (selectedPrograms) {
        const programs = [...new Set(selectedPrograms)];
        await tx.childProgramEnrollment.deleteMany({ where: { childId: existing.id } });
        await tx.childProgramEnrollment.createMany({
          data: programs.map((program) => ({ childId: existing.id, program })),
        });
      }
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
                select: CHILD_PARENT_USER_SELECT,
              },
            },
          },
          programEnrollments: { select: { program: true } },
        },
      });
    });
      return res.json(updated);
    }
  );

  const lessonOutcomePatchSchema = z
    .object({
      passed: z.boolean().nullable().optional(),
      mark: z.number().int().min(1).max(10).nullable().optional(),
    })
    .refine((body) => body.passed !== undefined || body.mark !== undefined, {
      message: "At least one of passed or mark is required",
    });

  const lessonOutcomeBulkSchema = z
    .object({
      lessonId: z.string().uuid(),
      items: z
        .array(
          z.object({
            childId: z.string().uuid(),
            passed: z.boolean(),
            mark: z.union([z.number().int().min(1).max(10), z.null()]),
          })
        )
        .min(1)
        .max(150),
    })
    .refine((body) => new Set(body.items.map((item) => item.childId)).size === body.items.length, {
      message: "Duplicate childId in items",
    });

  // Bulk lesson pass/mark: ADMIN and SUPER_ADMIN only.
  router.post(
    "/children/lesson-outcomes/bulk",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
      const parsed = lessonOutcomeBulkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const lesson = await prisma.lesson.findUnique({ where: { id: parsed.data.lessonId } });
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });

      const childIds = [...new Set(parsed.data.items.map((item) => item.childId))];
      const children = await prisma.child.findMany({
        where: { id: { in: childIds } },
        include: { programEnrollments: { select: { program: true } } },
      });
      if (children.length !== childIds.length) {
        return res.status(404).json({ message: "One or more children not found" });
      }

      for (const child of children) {
        if (!canAccessCommunity(req, child.communityId)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        const isEnrolledInProgram = child.programEnrollments.some((row) => row.program === lesson.program);
        if (!isEnrolledInProgram) {
          return res.status(400).json({ message: "Child is not enrolled in lesson program" });
        }
        if (lesson.program === LessonProgram.ILMIHAL && child.nivo !== lesson.nivo) {
          return res.status(400).json({ message: "Child nivo does not match lesson nivo" });
        }
      }

      for (const item of parsed.data.items) {
        const guard = await assertChildLessonOutcomeNoDraftReports(prisma, item.childId, parsed.data.lessonId);
        if (!guard.ok && (item.passed || item.mark != null)) {
          return res.status(400).json({ message: guard.message, code: "LESSON_ACTIVITY_INCOMPLETE" });
        }
      }

      await prisma.$transaction(
        parsed.data.items.map((item) =>
          prisma.childLessonOutcome.upsert({
            where: {
              childId_lessonId: { childId: item.childId, lessonId: parsed.data.lessonId },
            },
            create: {
              childId: item.childId,
              lessonId: parsed.data.lessonId,
              passed: item.passed,
              mark: item.mark,
              markedById: req.user!.id,
            },
            update: {
              passed: item.passed,
              mark: item.mark,
              markedById: req.user!.id,
            },
          })
        )
      );

      return res.json({ updated: parsed.data.items.length });
    }
  );

  // Lesson pass/mark: ADMIN and SUPER_ADMIN only (not board/parent).
  router.patch(
    "/children/:childId/lesson-outcomes/:lessonId",
    requireAuth,
    requireAnyRole(Role.SUPER_ADMIN, Role.ADMIN),
    async (req: AppRequest, res) => {
      const parsed = lessonOutcomePatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const child = await prisma.child.findUnique({
        where: { id: req.params.childId },
        include: { programEnrollments: { select: { program: true } } },
      });
      if (!child) return res.status(404).json({ message: "Child not found" });
      if (!canAccessCommunity(req, child.communityId)) return res.status(403).json({ message: "Forbidden" });

      const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      const isEnrolledInProgram = child.programEnrollments.some((row) => row.program === lesson.program);
      if (!isEnrolledInProgram) {
        return res.status(400).json({ message: "Child is not enrolled in lesson program" });
      }
      if (lesson.program === LessonProgram.ILMIHAL && lesson.nivo !== child.nivo) {
        return res.status(400).json({ message: "Lesson nivo does not match child nivo" });
      }

      const existingOutcome = await prisma.childLessonOutcome.findUnique({
        where: { childId_lessonId: { childId: req.params.childId, lessonId: req.params.lessonId } },
      });
      const nextPassed =
        parsed.data.passed !== undefined ? parsed.data.passed : (existingOutcome?.passed ?? null);
      const draftGuard = await assertChildLessonOutcomeNoDraftReports(
        prisma,
        req.params.childId,
        req.params.lessonId
      );
      const noDraftReports = draftGuard.ok;

      if (nextPassed === true && !noDraftReports) {
        return res.status(400).json({ message: draftGuard.message, code: "LESSON_ACTIVITY_INCOMPLETE" });
      }

      const existingPassedTrue = existingOutcome?.passed === true;
      if (!noDraftReports && !existingPassedTrue) {
        if (parsed.data.mark !== undefined && parsed.data.mark !== null) {
          return res.status(400).json({
            message: draftGuard.message,
            code: "LESSON_ACTIVITY_INCOMPLETE",
          });
        }
      }

      const outcome = await prisma.childLessonOutcome.upsert({
        where: {
          childId_lessonId: { childId: req.params.childId, lessonId: req.params.lessonId },
        },
        create: {
          childId: req.params.childId,
          lessonId: req.params.lessonId,
          passed: parsed.data.passed !== undefined ? parsed.data.passed : null,
          mark: parsed.data.mark !== undefined ? parsed.data.mark : null,
          markedById: req.user!.id,
        },
        update: {
          ...(parsed.data.passed !== undefined ? { passed: parsed.data.passed } : {}),
          ...(parsed.data.mark !== undefined ? { mark: parsed.data.mark } : {}),
          markedById: req.user!.id,
        },
        include: {
          markedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return res.json(outcome);
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
