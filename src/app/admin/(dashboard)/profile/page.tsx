import type { Metadata } from "next";
import { ProfileForm } from "@/components/admin/profile-settings-forms";
import { PageHeader } from "@/components/admin/ui";
import { toFormValues } from "@/lib/admin/form-values";
import { EMPTY_PROFILE } from "@/lib/content/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const db = await createSessionClient();
  const { data } = await db.from("profile").select("*").maybeSingle();
  const { updated_at: _, ...defaults } = EMPTY_PROFILE;
  void _;

  return (
    <>
      <PageHeader title="Profile" description="Your name, introduction, about section, availability, photo and resume." />
      <ProfileForm defaultValues={toFormValues({ ...defaults, availability: "open" }, data)} />
    </>
  );
}
