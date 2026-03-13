export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
export const EDITABLE_ROLE_VALUES = [ROLE.ADMIN, ROLE.USER] as const;
export type EditableRole = (typeof EDITABLE_ROLE_VALUES)[number];

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  communityId: string | null;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: SessionUser;
};
