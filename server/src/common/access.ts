import { Role } from "@prisma/client";
import { AppRequest } from "../types.js";

export function canAccessCommunity(req: AppRequest, communityId?: string | null) {
  if (!req.user) return false;
  if (req.user.role === Role.SUPER_ADMIN) return true;
  if (req.user.role === Role.ADMIN) return req.user.communityId === communityId;
  return false;
}
