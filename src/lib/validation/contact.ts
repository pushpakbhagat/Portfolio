import { z } from "zod";

// Shared by the contact form (instant feedback) and the Server Action (the check that counts).
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please tell me your name.").max(120, "That name is a bit long."),
  email: z.email("That doesn't look like an email address.").trim().max(254),
  subject: z.string().trim().max(200, "Keep the subject under 200 characters."),
  message: z
    .string()
    .trim()
    .min(10, "A few more words, please (at least 10 characters).")
    .max(5000, "Please keep it under 5000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof ContactInput, string>> };
