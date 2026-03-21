import { z } from "zod";
import { isValidIsoDateString } from "../../lib/date-time";

export const diplomaFormSchema = z.object({
  ceremonyDate: z
    .string()
    .trim()
    .min(1, "Ceremony date is required.")
    .refine((value) => isValidIsoDateString(value), "Use a valid date (YYYY-MM-DD)."),
});

export type DiplomaFormValues = z.infer<typeof diplomaFormSchema>;
