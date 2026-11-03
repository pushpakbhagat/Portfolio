import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isServiceRoleConfigured = Boolean(supabaseUrl && secretKey);

/**
 * Service-role client. Bypasses Row Level Security: use it only for writes that visitors trigger
 * through validated server code (the contact form), never with data an admin check has not
 * already vetted.
 */
export function createServiceClient() {
  if (!isServiceRoleConfigured) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
