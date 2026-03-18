import { Role } from "@prisma/client";
import { AppRequest } from "../types.js";

export function canAccessCommunity(req: AppRequest, communityId?: string | null) {
  if (!req.user) return false;
  if (req.user.role === Role.SUPER_ADMIN) return true;
  if (req.user.role === Role.ADMIN || req.user.role === Role.BOARD_MEMBER) {
    return req.user.communityId === communityId;
  }
  return false;
}
