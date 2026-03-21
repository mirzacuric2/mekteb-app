export const BOARD_MEMBER_ROLE = {
  CHAIRPERSON: "CHAIRPERSON",
  SECRETARY: "SECRETARY",
  ECONOMY: "ECONOMY",
  MEMBER: "MEMBER",
  ADVISOR: "ADVISOR",
} as const;

export type BoardMemberRole = (typeof BOARD_MEMBER_ROLE)[keyof typeof BOARD_MEMBER_ROLE];

export type AddressRecord = {
  id: string;
  streetLine1: string;
  streetLine2?: string | null;
  postalCode: string;
  city: string;
  state?: string | null;
  country: string;
};

export type CommunityAdminRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type BoardMemberRecord = {
  id: string;
  role: BoardMemberRole;
  isActive: boolean;
  mandateStartDate: string;
  mandateEndDate?: string | null;
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  address?: AddressRecord | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
};

export type CommunityRecord = {
  id: string;
  name: string;
  status?: "ACTIVE" | "INACTIVE";
  deactivatedAt?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: AddressRecord | null;
  users?: CommunityAdminRecord[];
  boardMembers?: BoardMemberRecord[];
  _count?: { boardMembers: number };
  /** Present on API responses; true when a custom PDF template is stored for diplomas. */
  hasCustomDiplomaTemplate?: boolean;
  diplomaLayoutJson?: unknown;
  diplomaDefaultImamLine?: string | null;
};
