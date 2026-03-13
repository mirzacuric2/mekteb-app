import { Request } from "express";

type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  communityId: string | null;
};

export type AppRequest = Request<Record<string, string>> & {
  user?: AuthUser;
};
