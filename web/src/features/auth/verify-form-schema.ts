import { z } from "zod";

export const verifyAccountFormSchema = z
  .object({
    password: z.string().min(8, { message: "verifyPasswordTooShort" }),
    confirmPassword: z.string().min(1, { message: "verifyConfirmRequired" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "verifyPasswordMismatch",
  });

export type VerifyAccountFormValues = z.infer<typeof verifyAccountFormSchema>;
