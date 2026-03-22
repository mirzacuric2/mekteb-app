import { ROLE } from "../../../../../types";
import type { HandbookLocaleRegistry } from "../../types";
import { adminHandbookBs } from "./admin";
import { boardMemberHandbookBs } from "./board-member";
import { parentHandbookBs } from "./parent";
import { superAdminHandbookBs } from "./super-admin";

export const handbookRegistryBs: HandbookLocaleRegistry = {
  [ROLE.PARENT]: parentHandbookBs,
  [ROLE.USER]: parentHandbookBs,
  [ROLE.BOARD_MEMBER]: boardMemberHandbookBs,
  [ROLE.ADMIN]: adminHandbookBs,
  [ROLE.SUPER_ADMIN]: superAdminHandbookBs,
};
