import { useTranslation } from "react-i18next";
import { ROLE, type Role as PlatformRole } from "../../../types";
import { cn } from "../../../lib/utils";
import { isPlatformRole, ROLE_BADGE_CLASS } from "./role-visual.constants";

const ROLE_LABEL_KEY: Record<PlatformRole, string> = {
  [ROLE.SUPER_ADMIN]: "roleSuperAdmin",
  [ROLE.ADMIN]: "roleAdmin",
  [ROLE.USER]: "roleUser",
  [ROLE.PARENT]: "roleParent",
  [ROLE.BOARD_MEMBER]: "roleBoardMember",
};

export type RoleProps = {
  role: PlatformRole | string;
  className?: string;
  raw?: boolean;
};

export function Role({ role, className, raw }: RoleProps) {
  const { t } = useTranslation();
  const key = isPlatformRole(role) ? role : ROLE.USER;
  const badgeClass = ROLE_BADGE_CLASS[key];
  const label = raw || !isPlatformRole(role) ? role : t(ROLE_LABEL_KEY[key]);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wide",
        badgeClass,
        className
      )}
      title={String(role)}
    >
      {label}
    </span>
  );
}
