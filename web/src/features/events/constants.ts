import { EVENT_AUDIENCE, EVENT_RECURRENCE, EventAudience, EventRecurrence } from "./types";

export const COMMUNITY_EVENTS_QUERY_KEY = "community-events";

export const WEEK_SUMMARY_VARIANT = {
  FAMILY: "FAMILY",
  COMMUNITY: "COMMUNITY",
} as const;

export type WeekSummaryVariant = (typeof WEEK_SUMMARY_VARIANT)[keyof typeof WEEK_SUMMARY_VARIANT];

export const EVENT_RECURRENCE_ORDER: EventRecurrence[] = [
  EVENT_RECURRENCE.NONE,
  EVENT_RECURRENCE.WEEKLY,
  EVENT_RECURRENCE.YEARLY,
];

export const EVENT_RECURRENCE_LABEL: Record<EventRecurrence, string> = {
  [EVENT_RECURRENCE.NONE]: "Does not repeat",
  [EVENT_RECURRENCE.WEEKLY]: "Weekly",
  [EVENT_RECURRENCE.YEARLY]: "Yearly",
};

export const EVENT_AUDIENCE_ORDER: EventAudience[] = [
  EVENT_AUDIENCE.GENERAL,
  EVENT_AUDIENCE.ILMIHAL,
  EVENT_AUDIENCE.SUFARA,
  EVENT_AUDIENCE.QURAN,
];

export const EVENT_AUDIENCE_LABEL: Record<EventAudience, string> = {
  [EVENT_AUDIENCE.GENERAL]: "General community event",
  [EVENT_AUDIENCE.CHILDREN]: "Selected children",
  [EVENT_AUDIENCE.NIVO]: "Nivo group",
  [EVENT_AUDIENCE.ILMIHAL]: "Ilmihal by nivo",
  [EVENT_AUDIENCE.SUFARA]: "Sufara",
  [EVENT_AUDIENCE.QURAN]: "Qur'an",
};
