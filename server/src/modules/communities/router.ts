import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../auth.js";
import { prisma } from "../../prisma.js";
import { AppRequest } from "../../types.js";

export function communitiesRouter() {
  const router = Router();

  router.get("/communities", requireAuth, async (req: AppRequest, res) => {
    const communities = await prisma.community.findMany({
      where: req.user!.role === Role.SUPER_ADMIN ? {} : { id: req.user!.communityId || undefined },
      include: { address: true },
      orderBy: { name: "asc" },
    });
    return res.json(communities);
  });

  router.post("/communities", requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        name: z.string().min(2),
        description: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.object({
          streetLine1: z.string().min(2),
          streetLine2: z.string().optional(),
          postalCode: z.string().min(2),
          city: z.string().min(2),
          state: z.string().optional(),
          country: z.string().min(2),
        }),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const address = await prisma.address.upsert({
      where: {
        streetLine1_postalCode_city_country: {
          streetLine1: payload.data.address.streetLine1,
          postalCode: payload.data.address.postalCode,
          city: payload.data.address.city,
          country: payload.data.address.country,
        },
      },
      update: {
        streetLine2: payload.data.address.streetLine2,
        state: payload.data.address.state,
      },
      create: payload.data.address,
    });

    const community = await prisma.community.create({
      data: {
        name: payload.data.name,
        description: payload.data.description,
        contactEmail: payload.data.contactEmail,
        contactPhone: payload.data.contactPhone,
        addressId: address.id,
      },
      include: { address: true },
    });

    return res.status(201).json(community);
  });

  router.patch("/communities/:id", requireAuth, requireRole(Role.ADMIN), async (req: AppRequest, res) => {
    const payload = z
      .object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z
          .object({
            streetLine1: z.string().min(2),
            streetLine2: z.string().optional(),
            postalCode: z.string().min(2),
            city: z.string().min(2),
            state: z.string().optional(),
            country: z.string().min(2),
          })
          .optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const existing = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Community not found" });
    if (req.user!.role !== Role.SUPER_ADMIN && req.user!.communityId !== existing.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let addressId = existing.addressId;
    if (payload.data.address) {
      const address = await prisma.address.upsert({
        where: {
          streetLine1_postalCode_city_country: {
            streetLine1: payload.data.address.streetLine1,
            postalCode: payload.data.address.postalCode,
            city: payload.data.address.city,
            country: payload.data.address.country,
          },
        },
        update: {
          streetLine2: payload.data.address.streetLine2,
          state: payload.data.address.state,
        },
        create: payload.data.address,
      });
      addressId = address.id;
    }

    const updated = await prisma.community.update({
      where: { id: req.params.id },
      data: {
        name: payload.data.name,
        description: payload.data.description,
        contactEmail: payload.data.contactEmail,
        contactPhone: payload.data.contactPhone,
        addressId,
      },
      include: { address: true },
    });

    return res.json(updated);
  });

  return router;
}
