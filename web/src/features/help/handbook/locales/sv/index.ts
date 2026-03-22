import { ROLE } from "../../../../../types";
import type { HandbookLocaleRegistry } from "../../types";
import { adminHandbookSv } from "./admin";
import { boardMemberHandbookSv } from "./board-member";
import { parentHandbookSv } from "./parent";
import { superAdminHandbookSv } from "./super-admin";

export const handbookRegistrySv: HandbookLocaleRegistry = {
  [ROLE.PARENT]: parentHandbookSv,
  [ROLE.USER]: parentHandbookSv,
  [ROLE.BOARD_MEMBER]: boardMemberHandbookSv,
  [ROLE.ADMIN]: adminHandbookSv,
  [ROLE.SUPER_ADMIN]: superAdminHandbookSv,
};
