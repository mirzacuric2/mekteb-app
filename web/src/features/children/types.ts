import { LessonNivo } from "../lessons/constants";
import { LectureStatus } from "../reporting/types";

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

export type ChildAttendanceRecord = {
  lectureId: string;
  childId: string;
  lessonId?: string | null;
  present: boolean;
  homeworkDone?: boolean | null;
  homeworkTitle?: string | null;
  homeworkDescription?: string | null;
  comment?: string | null;
  markedAt: string;
  lecture: {
    id: string;
    topic: string;
    nivo?: LessonNivo | null;
    status: LectureStatus;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  lesson?: {
    id: string;
    title: string;
    nivo: LessonNivo;
  } | null;
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
  attendance?: ChildAttendanceRecord[];
};

export type ChildrenListResponse = {
  items: ChildRecord[];
  total: number;
  page: number;
  pageSize: number;
};
