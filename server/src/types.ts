import { Role } from "@prisma/client";
import { Request } from "express";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  communityId: string | null;
};

export type AppRequest = Request & {
  user?: AuthUser;
};
