import { LessonNivo } from "../lessons/constants";

export const CHILD_STATUS = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  DISCONTINUED: "DISCONTINUED",
  INACTIVE: "INACTIVE",
} as const;

export type ChildStatus = (typeof CHILD_STATUS)[keyof typeof CHILD_STATUS];

export const CHILD_STATUS_LABEL: Record<ChildStatus, string> = {
  [CHILD_STATUS.ACTIVE]: "active",
  [CHILD_STATUS.COMPLETED]: "completed",
  [CHILD_STATUS.DISCONTINUED]: "discontinued",
  [CHILD_STATUS.INACTIVE]: "inactive",
};

export type ChildAddress = {
  streetLine1: string;
  streetLine2?: string | null;
  postalCode: string;
  city: string;
  state?: string | null;
  country: string;
};

export type ChildParent = {
  parentId: string;
  parent?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    communityId?: string | null;
  };
};

export type ChildRecord = {
  id: string;
  firstName: string;
  lastName: string;
  ssn?: string | null;
  birthDate: string;
  nivo: LessonNivo;
  status: ChildStatus;
  communityId: string;
  address?: ChildAddress | null;
  parents: ChildParent[];
};
