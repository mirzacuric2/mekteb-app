import { useMemo } from "react";
import { ROLE, Role } from "../../types";
import { useSession } from "./session-context";

const ADMIN_ROLES: Role[] = [ROLE.ADMIN, ROLE.SUPER_ADMIN];
const PARENT_EDIT_ROLES: Role[] = [ROLE.PARENT, ROLE.USER];

export function useRoleAccess() {
  const { session } = useSession();

  return useMemo(() => {
    const role = session?.user.role;
    const isSuperAdmin = role === ROLE.SUPER_ADMIN;
    const isAdmin = role === ROLE.ADMIN;
    const isParent = role === ROLE.PARENT;
    const isUser = role === ROLE.USER;
    const isBoardMember = role === ROLE.BOARD_MEMBER;

    const canAdminManage = role ? ADMIN_ROLES.includes(role) : false;
    const canParentEdit = role ? PARENT_EDIT_ROLES.includes(role) : false;
    const canEditChildren = canAdminManage || canParentEdit;
    const canInactivate = canAdminManage;
    const canChooseCommunity = isSuperAdmin;

    return {
      role,
      isSuperAdmin,
      isAdmin,
      isParent,
      isUser,
      isBoardMember,
      canAdminManage,
      canParentEdit,
      canEditChildren,
      canInactivate,
      canChooseCommunity,
    };
  }, [session?.user.role]);
}
