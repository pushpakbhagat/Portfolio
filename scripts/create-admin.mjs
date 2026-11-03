// Creates an admin account (or grants admin to an existing user) and prints a one-time password.
//
//   npm run admin:create -- --email you@example.com
//   npm run admin:create -- --email you@example.com --reset    new password for an existing admin
//
// Uses the Supabase secret (service role) key from .env.local. Run it yourself in a terminal:
// the password is printed once and is not stored anywhere else. Change it after signing in via
// "Forgot password" on /admin/login, or keep it in your password manager.

import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: { email: { type: "string" }, reset: { type: "boolean", default: false } },
});

const email = values.email?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: npm run admin:create -- --email you@example.com [--reset]");
  process.exit(1);
}

const url = URL.canParse(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const password = randomBytes(18).toString("base64url");

const existing = await findUser(email);
let userId;
if (existing) {
  userId = existing.id;
  if (values.reset) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) fail(error);
  }
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) fail(error);
  userId = data.user.id;
}

const { error: grantError } = await supabase.from("admin_users").upsert({ user_id: userId });
if (grantError) fail(grantError);

if (!existing || values.reset) {
  console.log(`\n✓ Admin ready: ${email}\n  Password (shown once): ${password}\n`);
} else {
  console.log(`\n✓ ${email} already had an account and is now an admin. Password unchanged (use --reset for a new one).\n`);
}

async function findUser(address) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(error);
    const match = data.users.find((u) => u.email?.toLowerCase() === address);
    if (match || data.users.length < 200) return match;
  }
}

function fail(error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
