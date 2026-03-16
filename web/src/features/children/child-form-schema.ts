import { z } from "zod";
import { LESSON_NIVO, LessonNivo } from "../lessons/constants";
import { isValidIsoDateString } from "../../lib/date-time";
import { CHILD_FORM_CONSTRAINTS } from "./child-form.constants";

export const childFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(CHILD_FORM_CONSTRAINTS.minTextLength, "First name must be at least 2 characters."),
    lastName: z
      .string()
      .trim()
      .min(CHILD_FORM_CONSTRAINTS.minTextLength, "Last name must be at least 2 characters."),
    ssn: z.string().trim().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSN is required." });
        return;
      }
      if (
        value.length < CHILD_FORM_CONSTRAINTS.ssnMinLength ||
        value.length > CHILD_FORM_CONSTRAINTS.ssnMaxLength
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSN must be between 10 and 20 characters." });
      }
    }),
    birthDate: z
      .string()
      .trim()
      .min(1, "Birth date is required.")
      .refine((value) => isValidIsoDateString(value), "Birth date must be valid (YYYY-MM-DD)."),
    communityId: z.string().trim(),
    parentIds: z.array(z.string().trim()),
    streetLine1: z.string().trim(),
    streetLine2: z.string().trim(),
    postalCode: z.string().trim(),
    city: z.string().trim(),
    stateValue: z.string().trim(),
    country: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    const hasAnyAddressValue = Boolean(
      values.streetLine1 || values.streetLine2 || values.postalCode || values.city || values.stateValue || values.country
    );
    if (!hasAnyAddressValue) return;

    if (values.streetLine1.length < CHILD_FORM_CONSTRAINTS.minTextLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["streetLine1"],
        message: "Street line 1 must be at least 2 characters.",
      });
    }
    if (values.postalCode.length < CHILD_FORM_CONSTRAINTS.minTextLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message: "Postal code must be at least 2 characters.",
      });
    }
    if (values.city.length < CHILD_FORM_CONSTRAINTS.minTextLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "City must be at least 2 characters.",
      });
    }
    if (values.country.length < CHILD_FORM_CONSTRAINTS.minTextLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Country must be at least 2 characters.",
      });
    }
  });

export type ChildFormValues = z.infer<typeof childFormSchema> & {
  nivo: LessonNivo;
};

export const CHILD_FORM_DEFAULT_VALUES: ChildFormValues = {
  firstName: "",
  lastName: "",
  ssn: "",
  birthDate: "",
  communityId: "",
  parentIds: [],
  streetLine1: "",
  streetLine2: "",
  postalCode: "",
  city: "",
  stateValue: "",
  country: "",
  nivo: LESSON_NIVO.First,
};
