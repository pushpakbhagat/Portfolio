"use server";

import { createHash } from "node:crypto";
import { after } from "next/server";
import { headers } from "next/headers";
import { contactSchema, type ContactInput, type ContactResult } from "@/lib/validation/contact";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const MIN_FILL_MS = 3000; // humans take longer than this to fill the form
const LIMITS = [
  { windowMs: 10 * 60_000, max: 3 },
  { windowMs: 24 * 60 * 60_000, max: 10 },
];

/**
 * Saves a contact message. Visitors cannot write to the table directly (no RLS insert policy),
 * so this action is the only way in: it validates, drops obvious bots, rate-limits by a salted
 * hash of the IP (the raw IP is never stored) and inserts with the service role.
 */
export async function submitContact(
  input: ContactInput & { website?: string; startedAt?: number },
): Promise<ContactResult> {
  // Honeypot filled or form submitted inhumanly fast: pretend it worked, store nothing.
  if (input.website || (input.startedAt && Date.now() - input.startedAt < MIN_FILL_MS)) return { ok: true };

  const parsed = contactSchema.safeParse({ ...input, subject: input.subject ?? "" });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  if (!isServiceRoleConfigured) {
    return { ok: false, error: "The contact form isn't set up yet. Please email me directly instead." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? "portfolio"}:${ip}`)
    .digest("hex");
  const db = createServiceClient();

  for (const { windowMs, max } of LIMITS) {
    const { count, error } = await db
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - windowMs).toISOString());
    if (error) {
      console.error("[contact] rate check:", error.message);
      return { ok: false, error: "Something went wrong. Please try again in a moment." };
    }
    if ((count ?? 0) >= max) {
      return { ok: false, error: "You've sent a few messages already. Please try again later." };
    }
  }

  const message = parsed.data;
  const { error } = await db.from("contact_submissions").insert({
    ...message,
    ip_hash: ipHash,
    user_agent: (h.get("user-agent") ?? "").slice(0, 300),
  });
  if (error) {
    console.error("[contact] insert:", error.message);
    return { ok: false, error: "Something went wrong. Please try again in a moment." };
  }

  // Email notification after the response is sent, so a slow mail API never delays the visitor.
  after(() => notify(message));
  return { ok: true };
}

async function notify(message: ContactInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return;

  const { data } = await createServiceClient().from("admin_settings").select("notification_email").maybeSingle();
  const to = data?.notification_email;
  if (!to) return;

  // Plain text only: visitor input never ends up in HTML.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: message.email,
      subject: `Portfolio message: ${message.subject || `from ${message.name}`}`.slice(0, 200),
      text: `${message.name} <${message.email}>\n\n${message.subject ? `Subject: ${message.subject}\n\n` : ""}${message.message}\n\n— Sent from your portfolio contact form. Reply to answer directly.`,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message }));

  if (!res.ok) console.error(`[contact] email failed (${res.status}): ${await res.text()}`);
}
