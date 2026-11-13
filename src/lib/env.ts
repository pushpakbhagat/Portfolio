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

/**
 * Canonical site address (server-side only). On Vercel, a missing or localhost value falls back
 * to the production domain Vercel provides, so links and the sitemap never point at localhost.
 */
function resolveSiteUrl() {
  const configured = projectOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(configured);
  if (vercelHost && (!configured || isLocal)) return `https://${vercelHost}`;
  return configured || "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
