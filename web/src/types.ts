export type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

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
