import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { generateRawToken, hashToken, requireAuth, requireRole } from "../../auth.js";
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

  router.get("/users", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const users = await prisma.user.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId },
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
        role: z.enum(["ADMIN", "USER"]),
        phoneNumber: phoneSchema.optional(),
        communityId: z.string().optional(),
        address: addressSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    if (payload.data.role === "ADMIN" && req.user!.role !== Role.SUPER_ADMIN) {
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
        .json({ message: "Community is required for ADMIN/USER", field: "communityId" });
    }
    if (communityId) {
      const existingCommunity = await prisma.community.findUnique({ where: { id: communityId } });
      if (!existingCommunity) {
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
        isVerified: false,
        isActive: false,
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
        role: z.enum(["ADMIN", "USER"]).optional(),
        communityId: z.string().optional(),
        isActive: z.boolean().optional(),
        address: addressSchema.nullable().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });
    if (req.user!.role !== Role.SUPER_ADMIN && existing.communityId !== req.user!.communityId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (payload.data.role === "ADMIN" && req.user!.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ message: "Only super admin can promote to admin" });
    }
    if (payload.data.communityId && !canAccessCommunity(req, payload.data.communityId)) {
      return res.status(403).json({ message: "Cannot assign outside your community" });
    }
    if (payload.data.communityId) {
      const existingCommunity = await prisma.community.findUnique({
        where: { id: payload.data.communityId },
      });
      if (!existingCommunity) {
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
        isActive: payload.data.isActive,
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
    if (req.user!.role === Role.USER) {
      const mine = await prisma.child.findMany({
        where: { parents: { some: { parentId: req.user!.id } } },
        include: { attendance: true },
      });
      return res.json(mine);
    }

    const items = await prisma.child.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { communityId: req.user!.communityId || undefined },
      include: { parents: true },
    });
    return res.json(items);
  });

  router.post("/children", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        ssn: ssnSchema.optional(),
        birthDate: z.string(),
        level: z.string(),
        communityId: z.string().optional(),
        parentIds: z.array(z.string()).default([]),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const communityId = payload.data.communityId || req.user!.communityId || undefined;
    if (!canAccessCommunity(req, communityId)) return res.status(403).json({ message: "Forbidden community" });

    const child = await prisma.child.create({
      data: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        ssn: payload.data.ssn,
        birthDate: new Date(payload.data.birthDate),
        level: payload.data.level,
        communityId: communityId!,
        parents: { create: payload.data.parentIds.map((parentId) => ({ parentId })) },
      },
      include: { parents: true },
    });
    return res.status(201).json(child);
  });

  router.patch("/children/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        ssn: ssnSchema.optional(),
        birthDate: z.string().optional(),
        level: z.string().optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.child.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Child not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });

    const updated = await prisma.child.update({
      where: { id: req.params.id },
      data: {
        ...payload.data,
        birthDate: payload.data.birthDate ? new Date(payload.data.birthDate) : undefined,
      },
      include: { parents: true },
    });
    return res.json(updated);
  });

  router.delete("/children/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const existing = await prisma.child.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Child not found" });
    if (!canAccessCommunity(req, existing.communityId)) return res.status(403).json({ message: "Forbidden" });
    await prisma.child.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  return router;
}
