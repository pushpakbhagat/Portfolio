# Portfolio

Personal developer portfolio with a private admin CMS. Every piece of content (profile, projects,
skills, experience, education, certifications, links, settings) is edited at `/admin`; nothing
personal is hard-coded.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · GSAP + Lenis · Supabase
(Postgres, Auth, Storage).

## First-time setup

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com). Then copy the env template:

```bash
cp .env.example .env.local
```

Fill in from the Supabase dashboard:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable (or legacy `anon`) key |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → secret (or legacy `service_role`) key. Server only |
| `SUPABASE_DB_URL` | Connect → **Session pooler** connection string, with your database password |

### 2. Create the tables and load the starting content

```bash
npm install
npm run db:setup
```

This applies `supabase/migrations/*.sql` (tables, Row Level Security, storage buckets) and
`supabase/seed.sql` (StudentHub, Interview Analyzer, your skills). It is safe to run again: applied
migrations are skipped and seed rows that already exist are left alone.

### 3. Create your admin account

```bash
npm run admin:create -- --email you@example.com
```

It prints a one-time password. Sign in at <http://localhost:3000/admin>, then choose your own
password from the account menu → **Change password**. To reset a forgotten password from the
terminal: `npm run admin:create -- --email you@example.com --reset`.

There is no public sign-up: only users created this way (listed in `admin_users`) can sign in.

### 4. Password reset emails (optional)

For **Forgot password** on the login page to work, in Supabase → Authentication → URL
Configuration set **Site URL** to your site and add `http://localhost:3000/admin/auth/confirm` (and
your production URL's equivalent) to **Redirect URLs**.

## Run it

```bash
npm run dev        # http://localhost:3000, admin at /admin
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Optional services

| Variable | Enables |
|---|---|
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` | Email notification for each contact message (to the address in Admin → Settings). Without them messages are still saved in the inbox |
| `GITHUB_TOKEN` | GitHub contribution graph and higher API limits. A fine-grained token with no extra permissions is enough |
| `IP_HASH_SALT` | Salt for the hashed IPs used in contact-form rate limiting |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap and share images. Set it to your real domain in production |

## Where things are

| Path | What |
|---|---|
| `supabase/migrations/` | Schema, Row Level Security, storage buckets, audit triggers |
| `supabase/seed.sql` | Starting content (verified facts only) |
| `scripts/db.mjs`, `scripts/create-admin.mjs` | `db:*` and `admin:create` commands |
| `src/app/(site)/` | Public site: home page, `/projects/[slug]`, contact Server Action |
| `src/app/admin/` | Admin: login and password reset, then `(dashboard)/` for every module |
| `src/components/site/` | Public sections, case study, navigation, footer |
| `src/components/motion/` | Lenis + GSAP setup, text splitting, magnetic buttons, cursor label |
| `src/components/admin/` | Admin shell, generic list manager, form fields, project editor, inbox |
| `src/lib/admin/` | Admin Server Actions, Zod schemas, content-type configuration |
| `src/lib/content/` | Public queries and row types |
| `src/proxy.ts` | Session refresh and the sign-in redirect for `/admin` |
| `docs/PROGRESS.md` | What's done, what's next, decisions, known issues |

## Security model

- Visitors read through the publishable key; Row Level Security only returns published projects and
  visible rows. Drafts and hidden entries never leave the database.
- Admin pages and every Server Action check `is_admin()` on the server, and RLS checks it again on
  every write, so a bug in one layer is caught by the other.
- Contact messages cannot be inserted with the publishable key. The Server Action validates, drops
  bots (honeypot + minimum fill time), rate-limits by salted IP hash and inserts with the secret key.
- Uploads are admin-only, limited to 10 MB, checked against an allow-list and the file's first bytes,
  SVGs with scripts are rejected, and files get random names. Private documents live in a private
  bucket and open only through 5-minute signed links.
- The secret key is only imported from `server-only` modules.
