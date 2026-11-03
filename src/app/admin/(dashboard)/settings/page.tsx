import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/profile-settings-forms";
import { PageHeader } from "@/components/admin/ui";
import { toFormValues } from "@/lib/admin/form-values";
import { EMPTY_SETTINGS } from "@/lib/content/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

const ALL_SECTIONS = { focus: true, projects: true, skills: true, experience: true, education: true, accomplishments: true, github: true, contact: true };

export default async function SettingsPage() {
  const db = await createSessionClient();
  const [{ data: settings }, { data: admin }] = await Promise.all([
    db.from("site_settings").select("*").maybeSingle(),
    db.from("admin_settings").select("notification_email").maybeSingle(),
  ]);
  const { updated_at: _, ...defaults } = EMPTY_SETTINGS;
  void _;
  const values = toFormValues({ ...defaults, notification_email: "" }, { ...settings, ...admin });

  return (
    <>
      <PageHeader title="Settings" description="Publishing, SEO, navigation, sections, the announcement banner and notifications." />
      <SettingsForm defaultValues={{ ...values, sections: { ...ALL_SECTIONS, ...(settings?.sections ?? {}) } }} />
    </>
  );
}
