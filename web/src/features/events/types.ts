export const EVENT_RECURRENCE = {
  NONE: "NONE",
  WEEKLY: "WEEKLY",
  YEARLY: "YEARLY",
} as const;

export type EventRecurrence = (typeof EVENT_RECURRENCE)[keyof typeof EVENT_RECURRENCE];

export const EVENT_AUDIENCE = {
  GENERAL: "GENERAL",
  CHILDREN: "CHILDREN",
  NIVO: "NIVO",
  ILMIHAL: "ILMIHAL",
  SUFARA: "SUFARA",
  QURAN: "QURAN",
} as const;

export type EventAudience = (typeof EVENT_AUDIENCE)[keyof typeof EVENT_AUDIENCE];

export type EventLinkedChild = {
  eventId: string;
  childId: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    nivo: number;
  };
};

export type CommunityEventRecord = {
  id: string;
  communityId: string;
  createdById: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  recurrence: EventRecurrence;
  recurrenceInterval: number;
  recurrenceEndsAt?: string | null;
  audience: EventAudience;
  nivo?: number | null;
  children: EventLinkedChild[];
  createdAt: string;
  updatedAt: string;
};

export type EventOccurrenceRecord = {
  occurrenceStartAt: string;
  occurrenceEndAt: string;
  sourceStartAt: string;
  sourceEndAt: string;
  event: CommunityEventRecord;
};

export type CommunityEventsResponse = {
  items: EventOccurrenceRecord[];
  range: {
    from: string;
    to: string;
  };
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  recurrence: EventRecurrence;
  recurrenceInterval: number;
  recurrenceEndsAt?: string;
  audience: EventAudience;
  childIds: string[];
  nivo?: number;
};

export type UpdateEventPayload = {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  recurrence?: EventRecurrence;
  recurrenceInterval?: number;
  recurrenceEndsAt?: string | null;
  audience?: EventAudience;
  childIds?: string[];
  nivo?: number | null;
};
