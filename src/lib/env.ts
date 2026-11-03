// Public environment values. Server-only secrets are read in src/lib/supabase/admin.ts and
// src/lib/server-env.ts so they can never end up in a client bundle.

/** The project origin only: tolerates a pasted ".../rest/v1/" or trailing slash. */
export function projectOrigin(url: string | undefined) {
  if (!url) return "";
  try {
    return new URL(url.trim()).origin;
  } catch {
    return "";
  }
}

export const supabaseUrl = projectOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
