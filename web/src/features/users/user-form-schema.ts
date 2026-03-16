import { z } from "zod";
import { EDITABLE_ROLE_VALUES, ROLE } from "../../types";
import { LESSON_NIVO } from "../lessons/constants";

const childSchema = z.object({
  firstName: z.string().min(2, "Child first name must be at least 2 characters."),
  lastName: z.string().min(2, "Child last name must be at least 2 characters."),
  ssn: z.string().min(10, "Child SSN must be at least 10 characters."),
  birthDate: z.string().min(1, "Child birth date is required."),
  nivo: z.nativeEnum(LESSON_NIVO),
});

const filledAddressSchema = z.object({
  streetLine1: z.string().trim().min(2, "Street line 1 must be at least 2 characters."),
  streetLine2: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Postal code must be at least 2 characters."),
  city: z.string().trim().min(2, "City must be at least 2 characters."),
  state: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().min(2, "Country must be at least 2 characters."),
});

const emptyAddressSchema = z.object({
  streetLine1: z.literal(""),
  streetLine2: z.string().trim().optional().or(z.literal("")),
  postalCode: z.literal(""),
  city: z.literal(""),
  state: z.string().trim().optional().or(z.literal("")),
  country: z.literal(""),
});

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
} as const;

export const USER_STATUS_VALUES = [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.PENDING] as const;
export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const userFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  ssn: z.string().min(10, "SSN must be at least 10 characters."),
  email: z.string().email("Enter a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 characters.")
    .max(30, "Phone number must be at most 30 characters.")
    .optional()
    .or(z.literal("")),
  role: z.enum(EDITABLE_ROLE_VALUES),
  communityId: z.string().optional().or(z.literal("")),
  status: z.enum(USER_STATUS_VALUES).default(USER_STATUS.PENDING),
  address: z.union([filledAddressSchema, emptyAddressSchema]),
  children: z.array(childSchema).default([]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const USER_FORM_DEFAULT_VALUES: UserFormValues = {
  firstName: "",
  lastName: "",
  ssn: "",
  email: "",
  phoneNumber: "",
  role: ROLE.PARENT,
  communityId: "",
  status: USER_STATUS.PENDING,
  address: {
    streetLine1: "",
    streetLine2: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
  },
  children: [],
};
