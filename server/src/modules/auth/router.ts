import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { UserStatus } from "@prisma/client";
import {
  comparePassword,
  generateRawToken,
  hashPassword,
  hashToken,
  requireAuth,
  signRefreshToken,
  signAuthToken,
  verifyRefreshToken,
} from "../../auth.js";
import { userUiLanguageSchema, userUiLanguageToPrisma } from "../../common/user-ui-language.js";
import { AUTH_ME_SELECT } from "./auth-me-select.js";
import { sendEmail } from "../../email.js";
import { buildVerificationEmailContent, resolveVerificationLogoUrl } from "../../email/verification-email.js";
import { AppRequest } from "../../types.js";

export function authRouter() {
  const router = Router();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  router.post("/login", async (req, res) => {
    const payload = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const user = await prisma.user.findUnique({ where: { email: payload.data.email } });
    if (!user || !user.passwordHash) return res.status(400).json({ message: "Invalid credentials" });
    if (user.status === UserStatus.PENDING) return res.status(403).json({ message: "User not verified" });
    if (user.status === UserStatus.INACTIVE) return res.status(403).json({ message: "User inactive" });

    const valid = await comparePassword(payload.data.password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      communityId: user.communityId,
    });
    const refreshToken = signRefreshToken(user.id);

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        communityId: user.communityId,
        preferredLanguage: user.preferredLanguage,
      },
    });
  });

  router.post("/refresh", async (req, res) => {
    const payload = z.object({ refreshToken: z.string().min(1) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    let decoded: { sub: string };
    try {
      decoded = verifyRefreshToken(payload.data.refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });
    if (user.status === UserStatus.PENDING) return res.status(403).json({ message: "User not verified" });
    if (user.status === UserStatus.INACTIVE) return res.status(403).json({ message: "User inactive" });

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      communityId: user.communityId,
    });
    const refreshToken = signRefreshToken(user.id);

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        communityId: user.communityId,
        preferredLanguage: user.preferredLanguage,
      },
    });
  });

  router.post("/verify", async (req, res) => {
    const payload = z.object({ token: z.string(), password: z.string().min(8) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const tokenHash = hashToken(payload.data.token);
    const record = await prisma.verificationToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) return res.status(400).json({ message: "Invalid or expired token" });
    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        passwordHash: await hashPassword(payload.data.password),
      },
    });
    await prisma.verificationToken.deleteMany({ where: { email: user.email } });

    return res.json({ message: "Account verified" });
  });

  router.get("/me", requireAuth, async (req: AppRequest, res) => {
    const me = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: AUTH_ME_SELECT,
    });
    if (!me) return res.status(404).json({ message: "User not found" });
    return res.json(me);
  });

  router.patch("/me", requireAuth, async (req: AppRequest, res) => {
    const payload = z
      .object({
        preferredLanguage: userUiLanguageSchema.optional(),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const updates: { preferredLanguage?: ReturnType<typeof userUiLanguageToPrisma> } = {};
    if (payload.data.preferredLanguage !== undefined) {
      updates.preferredLanguage = userUiLanguageToPrisma(payload.data.preferredLanguage);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      select: AUTH_ME_SELECT,
    });
    return res.json(updated);
  });

  router.post("/invite-token", requireAuth, async (req: AppRequest, res) => {
    const payload = z
      .object({
        email: z.string().email(),
        firstName: z.string().min(2),
        preferredLanguage: userUiLanguageSchema.optional().default("en"),
      })
      .safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const rawToken = generateRawToken();
    await prisma.verificationToken.create({
      data: {
        email: payload.data.email,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
    const verifyUrl = `${frontendUrl.replace(/\/$/, "")}/verify?token=${rawToken}`;
    const logoUrl = resolveVerificationLogoUrl(frontendUrl);
    const { subject, html, text } = buildVerificationEmailContent({
      firstName: payload.data.firstName,
      verifyUrl,
      language: payload.data.preferredLanguage,
      logoUrl,
    });
    await sendEmail({
      to: payload.data.email,
      subject,
      html,
      text,
    });
    return res.status(201).json({ ok: true });
  });

  return router;
}
