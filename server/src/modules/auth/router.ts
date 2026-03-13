import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
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
import { sendEmail } from "../../email.js";
import { AppRequest } from "../../types.js";

export function authRouter() {
  const router = Router();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  router.post("/login", async (req, res) => {
    const payload = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });

    const user = await prisma.user.findUnique({ where: { email: payload.data.email } });
    if (!user || !user.passwordHash) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(403).json({ message: "User not verified" });
    if (!user.isActive) return res.status(403).json({ message: "User inactive" });

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
    if (!user.isVerified) return res.status(403).json({ message: "User not verified" });
    if (!user.isActive) return res.status(403).json({ message: "User inactive" });

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
        isVerified: true,
        isActive: true,
        passwordHash: await hashPassword(payload.data.password),
      },
    });
    await prisma.verificationToken.deleteMany({ where: { email: user.email } });

    return res.json({ message: "Account verified" });
  });

  router.get("/me", requireAuth, async (req: AppRequest, res) => {
    const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
    return res.json(me);
  });

  router.post("/invite-token", requireAuth, async (req: AppRequest, res) => {
    const payload = z.object({ email: z.string().email(), firstName: z.string().min(2) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ message: "Invalid payload" });
    const rawToken = generateRawToken();
    await prisma.verificationToken.create({
      data: {
        email: payload.data.email,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
    await sendEmail({
      to: payload.data.email,
      subject: "Verify your Mekteb account",
      html: `<p>Selam ${payload.data.firstName}, verify your account:</p><a href="${frontendUrl}/verify?token=${rawToken}">Verify</a>`,
    });
    return res.status(201).json({ ok: true });
  });

  return router;
}
