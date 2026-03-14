import { BOARD_MEMBER_ROLE, BoardMemberRole } from "./types";

export const COMMUNITIES_QUERY_KEY = "communities";
export const COMMUNITIES_API_PATH = "/communities";
export const BOARD_MEMBERS_QUERY_KEY = "community-board-members";

export const BOARD_MEMBER_ROLE_ORDER: BoardMemberRole[] = [
  BOARD_MEMBER_ROLE.CHAIRPERSON,
  BOARD_MEMBER_ROLE.SECRETARY,
  BOARD_MEMBER_ROLE.ECONOMY,
  BOARD_MEMBER_ROLE.MEMBER,
  BOARD_MEMBER_ROLE.ADVISOR,
];

export const BOARD_MEMBER_ROLE_LABEL: Record<BoardMemberRole, string> = {
  CHAIRPERSON: "Chairperson",
  SECRETARY: "Secretary",
  ECONOMY: "Economy",
  MEMBER: "Member",
  ADVISOR: "Advisor",
};
