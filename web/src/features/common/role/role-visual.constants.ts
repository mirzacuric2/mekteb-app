import { ROLE, type Role } from "../../../types";

export function isPlatformRole(value: string): value is Role {
  return (Object.values(ROLE) as string[]).includes(value);
}

export const ROLE_ACCENT_HEX: Record<Role, string> = {
  [ROLE.SUPER_ADMIN]: "#4f46e5",
  [ROLE.ADMIN]: "#0ea5e9",
  [ROLE.USER]: "#8b5cf6",
  [ROLE.PARENT]: "#22c55e",
  [ROLE.BOARD_MEMBER]: "#f59e0b",
};

export const ROLE_BADGE_CLASS: Record<Role, string> = {
  [ROLE.SUPER_ADMIN]: "border border-indigo-500/80 bg-transparent text-indigo-800",
  [ROLE.ADMIN]: "border border-sky-500/85 bg-transparent text-sky-800",
  [ROLE.USER]: "border border-violet-500/80 bg-transparent text-violet-800",
  [ROLE.PARENT]: "border border-green-600/80 bg-transparent text-green-800",
  [ROLE.BOARD_MEMBER]: "border border-amber-500/85 bg-transparent text-amber-900",
};
