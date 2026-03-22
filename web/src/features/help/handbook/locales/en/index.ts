import { ROLE } from "../../../../../types";
import type { HandbookLocaleRegistry } from "../../types";
import { adminHandbookEn } from "./admin";
import { boardMemberHandbookEn } from "./board-member";
import { parentHandbookEn } from "./parent";
import { superAdminHandbookEn } from "./super-admin";

export const handbookRegistryEn: HandbookLocaleRegistry = {
  [ROLE.PARENT]: parentHandbookEn,
  [ROLE.USER]: parentHandbookEn,
  [ROLE.BOARD_MEMBER]: boardMemberHandbookEn,
  [ROLE.ADMIN]: adminHandbookEn,
  [ROLE.SUPER_ADMIN]: superAdminHandbookEn,
};
