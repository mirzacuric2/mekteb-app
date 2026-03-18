import { z } from "zod";

export const postFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  content: z.string().trim().min(3, "Content must be at least 3 characters."),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

export const POST_FORM_DEFAULT_VALUES: PostFormValues = {
  title: "",
  content: "",
};

export const postCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment is required."),
});

export type PostCommentValues = z.infer<typeof postCommentSchema>;
