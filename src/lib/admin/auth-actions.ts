"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const credentials = z.object({
  email: z.email("Enter your email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

/** Only same-site paths under /admin, so the `next` parameter can't redirect anywhere else. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
};

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // One message for every failure, so the form doesn't reveal which emails have accounts.
  if (error) return { error: "That email and password don't match an admin account." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "That email and password don't match an admin account." };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.email("Enter your email address.").trim().toLowerCase().safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/admin/auth/confirm?next=/admin/reset-password`,
  });
  if (error) console.error("[auth] reset email:", error.message);
  // Same answer whether or not the account exists.
  return { message: "If that email belongs to an admin, a reset link is on its way. Check your inbox." };
}

const newPassword = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128)
      .refine((p) => /[a-z]/i.test(p) && /\d/.test(p), "Mix letters and numbers."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPassword.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  // Sign out everywhere else, so a stolen session can't outlive the password change.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/admin?password=updated");
}
