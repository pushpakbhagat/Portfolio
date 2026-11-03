import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type Admin = { id: string; email: string };

/**
 * The signed-in admin, or null. getUser() asks the Supabase Auth server, so a revoked session is
 * caught; is_admin() checks the admin_users table. Cached per request.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
});

/** For admin pages: redirects to the login page unless the visitor is an admin. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class NotAuthorizedError extends Error {
  constructor() {
    super("You are not signed in as an admin.");
  }
}

/** For Server Actions: throws unless the caller is an admin. */
export async function assertAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new NotAuthorizedError();
  return admin;
}
