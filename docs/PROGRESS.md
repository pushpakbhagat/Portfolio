# Progress

The running record for the portfolio + admin CMS: what is done, what is next, open questions and
the decisions behind the architecture.

## Status (3 Nov 2026)

| # | Milestone | Status |
|---|---|---|
| 0 | Project setup | Done |
| 1 | Database: migrations, RLS, storage buckets, audit log, seed, setup scripts | Done. SQL and RLS verified on an embedded Postgres; **not yet applied to a real Supabase project** |
| 2 | Design system and shell | Done |
| 3 | Public sections (hero, about, what I do, projects, skills, experience, education, certifications, GitHub, contact, footer) | Done |
| 4 | Case study pages, page transitions, SEO (metadata, OG images, sitemap, robots, JSON-LD) | Done |
| 5 | Admin foundation: login, logout, password reset, guard, shell, overview | Done |
| 6 | Admin modules: profile, settings, projects (editor, screenshots, drafts, preview), skills, focus areas, experience, education, certifications, social links, GitHub repos, documents | Done |
| 7 | Contact pipeline and inbox | Done |
| 8 | End-to-end testing against Supabase | **Pending: needs the Supabase project** |
| 9 | Deployment (Netlify) | Later |

## Frontend pass (3 Nov 2026)

Bugs fixed: duplicate "Contact" and partial-height mobile menu; hero photo hidden on phones; oversized
About photo on phones; GSAP "target not found" warnings; deprecated `priority` on images (now
`preload`, fixes the LCP warning); unstyled default 404; no error or loading pages; tap targets under
44px; awkward wrapping of the availability line; long single-column skills list on phones.

Added: first-visit intro overlay (once per session), text-scramble titles, light beams on the hero
grid, blur-to-sharp section headings, 3D tilt + glare on project covers, endless tech marquee that
reacts to scroll speed, cursor spotlight + pop-in icons in skills, border beam on primary buttons,
travelling dot on the timeline, count-up numbers, footer wordmark reveal, mobile swipe carousel for
projects (snap + dots), designed 404 / error pages, case-study and admin loading skeletons.
All effects are GSAP or CSS (no second animation library) and switch off with reduced motion.

## How it was verified

- `npm run lint`, `npm run typecheck` and `npm run build` pass.
- Migrations and seed run on PGlite (embedded Postgres) with stand-ins for Supabase's `auth` and
  `storage` schemas. Checked: seed is idempotent; visitors see only published projects and visible
  rows; visitors cannot insert contact messages or edit content; a signed-in non-admin cannot
  edit; `reorder` and `set_technologies` work; changes are logged without logging pure reorders.
- The public site was rendered against the seed data (served by a throwaway local stand-in for the
  Supabase REST API) at desktop, mobile, light and dark: hero entrance, about, what I do, the
  pinned project rail, skills, contact, footer and the StudentHub case study. No horizontal
  overflow on mobile.
- `/admin/*` redirects to the login page when signed out.

## Not verified yet (needs Supabase)

Sign-in, password reset email, every admin save / upload / reorder / delete, the contact form
insert and the email notification. Run through the checklist below once `.env.local` is filled in.

### Checklist after connecting Supabase

1. `npm run db:setup`, then `npm run admin:create -- --email …`.
2. Sign in at `/admin`; edit the profile and check the home page updates.
3. Upload a photo and a resume; check they appear and that “Download resume” works.
4. Create a project, save as draft, open Preview, then Publish and check `/projects/<slug>`.
5. Add screenshots, reorder them, edit alt text, delete one.
6. Add an experience entry with technologies and a private document; open the document link.
7. Send a message from the contact form; check it in Messages, mark read, archive, delete.
8. Sign out and confirm `/admin` redirects to the login page.

## Open questions

- **GitHub username.** Repo remotes use `pushpakbhagat` (used in the seed); the README author lines
  say `griffithhhhhh`. Change it in Admin → Social links and Settings → GitHub if needed.
- **Public email** and the notification email: set them in Admin → Profile and Settings.
- **StudentHub live URL** (`student-managment-system-by-pushpak.netlify.app`) comes from the
  project README's deployment example; confirm it is live.
- **Availability** is seeded as “open”. Change it in Admin → Profile if that's not right.
- The **about** and **hero intro** text are drafts written from the project READMEs. Rewrite them
  in your own words.

## Decisions

- **Separate repo** in `Pushpak_personal/portfolio`, next to StudentHub and Interview Analyzer.
- **No Docker.** A hosted Supabase project is used for development; migrations are plain SQL files
  applied by `scripts/db.mjs` over the Session pooler connection.
- **Caching:** the standard Next.js model (not Cache Components). Public pages are prerendered and
  every admin save calls `revalidatePath("/", "layout")`; a one-hour revalidate is the safety net.
- **One animation system:** GSAP + ScrollTrigger driven by Lenis on GSAP's ticker. Motion (Framer)
  is not used, to avoid two systems. Sections opt in with data attributes so they stay Server
  Components. Everything is off for `prefers-reduced-motion`; touch keeps native scrolling.
- **Page transitions** use React's `<ViewTransition>` (crossfade + project cover morph).
- **Brand icons** come from `simple-icons`, rendered on the server (Lucide 1.x has no brand logos).
- **Contact inserts use the secret key** behind a Server Action; there is no RLS insert policy.
- **Certifications and achievements share one table** (`accomplishments.kind`).
- **Supporting documents** (`documents`) attach to exactly one education / experience /
  accomplishment row (check constraint) and are public or private (bucket).
- **Generic admin modules:** simple list types are configured in `src/lib/admin/entities.ts`;
  one list manager, one form renderer and one set of Server Actions serve them all.
- **Writes use the admin's session**, not the secret key, so RLS stays in force on every write.
- **No dummy content.** Education, experience and certifications start empty, and their sections
  stay hidden until entries exist.

## Environment variables

See `.env.example` and the README. Required: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` (scripts only).
Optional: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `GITHUB_TOKEN`, `IP_HASH_SALT`,
`NEXT_PUBLIC_SITE_URL`.

## Known issues / follow-ups

- `npm audit` reports moderate advisories in the create-next-app dev dependency tree. Review before
  deploying; don't run `npm audit fix --force`.
- If a private document upload succeeds but saving its record fails, the file stays in the private
  bucket (public files are cleaned up). Rare; can be removed from Supabase Storage.
- Netlify's Next.js support is not yet a verified adapter: test Server Actions, the proxy, image
  optimisation and revalidation there before going live.
- No automated end-to-end tests yet (Playwright would be the natural fit once Supabase is connected).
