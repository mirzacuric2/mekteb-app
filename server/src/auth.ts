import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import crypto from "node:crypto";
import { AppRequest, AuthUser } from "./types.js";

const secret = process.env.JWT_SECRET || "dev-secret";
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${secret}-refresh`;

export const roleRank: Record<Role, number> = {
  USER: 10,
  PARENT: 20,
  BOARD_MEMBER: 40,
  ADMIN: 70,
  SUPER_ADMIN: 100,
};

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, refreshSecret, { expiresIn: "30d" });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as { sub: string };
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function requireAuth(req: AppRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = auth.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, secret) as AuthUser;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(minRole: Role) {
  return (req: AppRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (roleRank[req.user.role] < roleRank[minRole]) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

export function requireAnyRole(...allowedRoles: Role[]) {
  return (req: AppRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
