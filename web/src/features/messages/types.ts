import { Role } from "../../types";

export const MESSAGE_CONTEXT_TYPE = {
  GENERAL: "GENERAL",
  HOMEWORK: "HOMEWORK",
  LECTURE_COMMENT: "LECTURE_COMMENT",
  ABSENCE_COMMENT: "ABSENCE_COMMENT",
} as const;

export type MessageContextType = (typeof MESSAGE_CONTEXT_TYPE)[keyof typeof MESSAGE_CONTEXT_TYPE];

export const MESSAGE_KIND = {
  USER: "USER",
  SYSTEM: "SYSTEM",
} as const;

export type MessageKind = (typeof MESSAGE_KIND)[keyof typeof MESSAGE_KIND];

export const MESSAGE_THREAD_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;

export type MessageThreadStatus = (typeof MESSAGE_THREAD_STATUS)[keyof typeof MESSAGE_THREAD_STATUS];

export type MessageUserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
};

export type MessageRecord = {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  content: string;
  kind: MessageKind;
  threadStatus: MessageThreadStatus;
  contextType: MessageContextType;
  contextChildId: string | null;
  contextLectureId: string | null;
  contextLabel: string | null;
  contextPreview: string | null;
  createdAt: string;
  sender: MessageUserSummary;
  receiver: MessageUserSummary;
};

export type MessageThreadSummary = {
  threadId: string;
  updatedAt: string;
  lastMessageId: string;
  lastMessage: string;
  lastMessageKind: MessageKind;
  threadStatus: MessageThreadStatus;
  contextType: MessageContextType;
  contextChildId: string | null;
  contextLectureId: string | null;
  contextLabel: string | null;
  contextPreview: string | null;
  canWrite: boolean;
  counterpart: MessageUserSummary;
};

export type MessageThreadDetails = {
  threadId: string;
  threadStatus: MessageThreadStatus;
  canWrite: boolean;
  contextType: MessageContextType;
  contextChildId: string | null;
  contextLectureId: string | null;
  contextLabel: string | null;
  contextPreview: string | null;
  messages: MessageRecord[];
};

export type MessageReceiver = {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  communityId?: string | null;
};

export type MessageContextDraft = {
  type: MessageContextType;
  childId?: string;
  lectureId?: string;
  label?: string;
  preview?: string;
};

export type OpenChatPayload = {
  threadId?: string;
  receiverId?: string;
  context?: MessageContextDraft;
  resetComposer?: boolean;
};
