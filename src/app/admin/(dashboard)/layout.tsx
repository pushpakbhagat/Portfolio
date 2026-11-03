import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const db = await createSessionClient();
  const [unread, projects, profile] = await Promise.all([
    db.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "unread"),
    db.from("projects").select("id, title").order("sort_order"),
    db.from("profile").select("full_name").maybeSingle(),
  ]);

  return (
    <AdminShell
      email={admin.email}
      unread={unread.count ?? 0}
      projects={projects.data ?? []}
      siteName={profile.data?.full_name || "Portfolio"}
    >
      {children}
    </AdminShell>
  );
}
