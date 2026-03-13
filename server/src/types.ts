import { Request } from "express";

export const AUTH_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type AuthRole = (typeof AUTH_ROLE)[keyof typeof AUTH_ROLE];

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  communityId: string | null;
};

export type AppRequest = Request<Record<string, string>> & {
  user?: AuthUser;
};
