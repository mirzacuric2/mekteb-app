import { z } from "zod";
import { EVENT_AUDIENCE } from "./types";

export type CommunityEventFormMessages = {
  titleMin: string;
  dateRequired: string;
  startTimeRequired: string;
  endTimeRequired: string;
  dateOrStartInvalid: string;
  endTimeInvalid: string;
  endAfterStart: string;
  nivoRequiredForAudience: string;
};

export function createCommunityEventFormSchema(messages: CommunityEventFormMessages) {
  return z
    .object({
      title: z.string().trim().min(2, messages.titleMin),
      description: z.string().trim().optional(),
      eventDate: z.string().min(1, messages.dateRequired),
      startTime: z.string().min(1, messages.startTimeRequired),
      endTime: z.string().min(1, messages.endTimeRequired),
      isWeeklyRecurring: z.boolean().default(false),
      audience: z.nativeEnum(EVENT_AUDIENCE),
      nivo: z.number().int().min(1).max(5).optional(),
    })
    .superRefine((value, context) => {
      const startAt = new Date(`${value.eventDate}T${value.startTime}`);
      const endAt = new Date(`${value.eventDate}T${value.endTime}`);
      if (Number.isNaN(startAt.getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventDate"],
          message: messages.dateOrStartInvalid,
        });
      }
      if (Number.isNaN(endAt.getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: messages.endTimeInvalid,
        });
      }
      if (!Number.isNaN(startAt.getTime()) && !Number.isNaN(endAt.getTime()) && endAt <= startAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: messages.endAfterStart,
        });
      }

      if ((value.audience === EVENT_AUDIENCE.NIVO || value.audience === EVENT_AUDIENCE.ILMIHAL) && !value.nivo) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nivo"],
          message: messages.nivoRequiredForAudience,
        });
      }
    });
}

export type CommunityEventFormValues = z.infer<ReturnType<typeof createCommunityEventFormSchema>>;

export const COMMUNITY_EVENT_DEFAULT_VALUES: CommunityEventFormValues = {
  title: "",
  description: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  isWeeklyRecurring: false,
  audience: EVENT_AUDIENCE.GENERAL,
  nivo: undefined,
};
