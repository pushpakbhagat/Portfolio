import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Browser client, used only to send admin uploads straight to Storage. It holds no session: each
 * upload is authorised by a one-time token that an admin-only Server Action issued (createUpload).
 */
export function browserClient() {
  client ??= createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
