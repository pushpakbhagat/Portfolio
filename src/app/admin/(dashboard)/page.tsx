import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Circle, Plus } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActivityEntry, ContactSubmission } from "@/lib/content/types";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const ENTITY_LABELS: Record<string, string> = {
  profile: "Profile",
  site_settings: "Settings",
  social_links: "Social link",
  skill_categories: "Skill category",
  skills: "Skill",
  focus_areas: "Focus area",
  projects: "Project",
  project_images: "Screenshot",
  education: "Education",
  experiences: "Experience",
  accomplishments: "Certification",
  documents: "Document",
  featured_repos: "Repository",
};
const ACTION_LABELS = { create: "Added", update: "Updated", delete: "Deleted" };

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  const { password } = await searchParams;
  const db = await createSessionClient();
  const count = (table: string) => db.from(table).select("id", { count: "exact", head: true });

  const [projects, published, skills, education, experience, accomplishments, messages, unread, settings, profile, recentMessages, activity] =
    await Promise.all([
      count("projects"),
      count("projects").eq("publish_status", "published"),
      count("skills"),
      count("education"),
      count("experiences"),
      count("accomplishments"),
      count("contact_submissions"),
      count("contact_submissions").eq("status", "unread"),
      db.from("site_settings").select("is_published, github_username").maybeSingle(),
      db.from("profile").select("full_name, photo_path, resume_path, email, about").maybeSingle(),
      db
        .from("contact_submissions")
        .select("id, name, subject, message, status, created_at")
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<ContactSubmission[]>(),
      db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8).returns<ActivityEntry[]>(),
    ]);

  const stats = [
    { label: "Projects", value: projects.count ?? 0, detail: `${published.count ?? 0} published`, href: "/admin/projects" },
    { label: "Skills", value: skills.count ?? 0, href: "/admin/skills" },
    { label: "Experience", value: experience.count ?? 0, href: "/admin/experience" },
    { label: "Education", value: education.count ?? 0, href: "/admin/education" },
    { label: "Certifications", value: accomplishments.count ?? 0, href: "/admin/accomplishments" },
    { label: "Messages", value: messages.count ?? 0, detail: `${unread.count ?? 0} unread`, href: "/admin/messages", highlight: (unread.count ?? 0) > 0 },
  ];

  const p = profile.data;
  const checklist = [
    { done: Boolean(p?.photo_path), label: "Upload a profile photo", href: "/admin/profile" },
    { done: Boolean(p?.resume_path), label: "Upload your resume", href: "/admin/profile" },
    { done: Boolean(p?.email), label: "Add a public email", href: "/admin/profile" },
    { done: (experience.count ?? 0) > 0, label: "Add your work experience", href: "/admin/experience" },
    { done: (education.count ?? 0) > 0, label: "Add your education", href: "/admin/education" },
    { done: Boolean(settings.data?.github_username), label: "Set your GitHub username", href: "/admin/settings#github" },
    { done: Boolean(process.env.RESEND_API_KEY), label: "Connect email notifications (RESEND_API_KEY)", href: "/admin/settings" },
    { done: isServiceRoleConfigured, label: "Enable the contact form (SUPABASE_SECRET_KEY)", href: "/admin/messages" },
  ];
  const remaining = checklist.filter((c) => !c.done).length;
  const live = settings.data?.is_published !== false;

  return (
    <>
      {password === "updated" && (
        <p className="mb-6 rounded-md border bg-card px-4 py-3 text-sm" role="status">
          Your password was updated and other sessions were signed out.
        </p>
      )}
      <PageHeader
        title={`Welcome back${p?.full_name ? `, ${p.full_name.split(" ")[0]}` : ""}`}
        description="Here's what's on your portfolio."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/" target="_blank">
                View site <ArrowUpRight />
              </a>
            </Button>
            <Button asChild>
              <Link href="/admin/projects/new">
                <Plus /> New project
              </Link>
            </Button>
          </>
        }
      />

      <Link href="/admin/settings" className="mb-6 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted/50">
        <StatusDot tone={live ? "green" : "amber"} />
        <span className="font-medium">{live ? "Your portfolio is live" : "Your portfolio is hidden"}</span>
        <span className="text-muted-foreground">{live ? "Visitors see your published content." : "Visitors see a “back soon” page."}</span>
        <span className="ml-auto text-xs text-muted-foreground">Change</span>
      </Link>

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-card p-4 transition-colors hover:bg-muted/50">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            {s.detail && <p className={cn("text-xs", s.highlight ? "text-signal" : "text-muted-foreground")}>{s.detail}</p>}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-medium">Recent messages</h2>
            <Link href="/admin/messages" className="text-xs text-muted-foreground hover:text-foreground">
              Open inbox
            </Link>
          </header>
          {recentMessages.data?.length ? (
            <ul className="divide-y">
              {recentMessages.data.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/messages?id=${m.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="mt-2">{m.status === "unread" ? <StatusDot tone="signal" /> : <StatusDot tone="muted" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-3 text-sm">
                        <span className={cn("truncate", m.status === "unread" && "font-semibold")}>{m.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{m.subject || m.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No messages yet.</p>
          )}
        </section>

        <section className="rounded-lg border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-medium">Getting set up</h2>
            <Badge variant={remaining ? "secondary" : "default"}>{remaining ? `${remaining} to go` : "All done"}</Badge>
          </header>
          <ul className="divide-y">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-muted/50">
                  {c.done ? <Check className="size-4 text-emerald-600" /> : <Circle className="size-4 text-muted-foreground" />}
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border bg-card lg:col-span-2">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-medium">Recent activity</h2>
            <Link href="/admin/activity" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </header>
          {activity.data?.length ? (
            <ul className="divide-y">
              {activity.data.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">{ACTION_LABELS[a.action]}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{ENTITY_LABELS[a.entity] ?? a.entity}</span>
                  <span className="min-w-0 flex-1 truncate">{a.summary}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Changes you make will show up here.</p>
          )}
        </section>
      </div>
    </>
  );
}
