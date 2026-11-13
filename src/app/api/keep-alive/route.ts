import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";

// Called once a day by the Vercel cron in vercel.json. Supabase pauses free projects after a
// week without requests; this one tiny anonymous read keeps the project active. It returns no
// content, so it is safe to leave public.

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured) return Response.json({ ok: false, reason: "not-configured" }, { status: 503 });

  const { error } = await createPublicClient().from("site_settings").select("id", { head: true, count: "exact" });
  if (error) return Response.json({ ok: false, reason: "database-unreachable" }, { status: 503 });

  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
