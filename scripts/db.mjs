// Applies supabase/migrations/*.sql in order and optionally runs supabase/seed.sql.
//
//   npm run db:migrate          apply migrations that have not run yet
//   npm run db:seed             run the seed (idempotent: it skips rows that already exist)
//   npm run db:setup            both
//
// Reads SUPABASE_DB_URL from .env.local (the Session pooler connection string in
// Supabase → Connect). Applied migrations are recorded in app_private.migrations, a schema the
// Supabase API does not expose.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const seedFile = path.join(root, "supabase", "seed.sql");

const command = process.argv[2] ?? "setup";
if (!["migrate", "seed", "setup"].includes(command)) {
  console.error(`Unknown command "${command}". Use migrate, seed or setup.`);
  process.exit(1);
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
} catch (error) {
  const hints = {
    ENOTFOUND:
      "The database host wasn't found. Supabase's direct connection (db.<project>.supabase.co) is IPv6-only on the free plan:\n  use the Session pooler string instead (Supabase → Connect → Session pooler).",
    "28P01": "Wrong database password in SUPABASE_DB_URL (replace [YOUR-PASSWORD], brackets included).",
  };
  console.error(`✗ Could not connect: ${error.message}\n  ${hints[error.code] ?? "Check SUPABASE_DB_URL in .env.local."}`);
  process.exit(1);
}

try {
  if (command !== "seed") await migrate();
  if (command !== "migrate") await seed();
} catch (error) {
  console.error(`\n✗ ${error.message}`);
  if (error.position) console.error(`  at character ${error.position}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

async function migrate() {
  await client.query(`
    create schema if not exists app_private;
    create table if not exists app_private.migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  const { rows } = await client.query("select name from app_private.migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`→ ${file} … `);
    // Each migration runs in its own transaction, so a failure leaves nothing half-applied.
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into app_private.migrations (name) values ($1)", [file]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
    console.log("done");
    count++;
  }
  console.log(count ? `✓ Applied ${count} migration(s).` : "✓ Database is up to date.");
}

async function seed() {
  const sql = await readFile(seedFile, "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw new Error(`seed.sql: ${error.message}`, { cause: error });
  }
  console.log("✓ Seed content loaded (existing rows were left alone).");
}
