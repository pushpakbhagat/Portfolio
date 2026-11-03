import type { Metadata } from "next";
import Link from "next/link";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadRows } from "@/lib/admin/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "GitHub" };

export default async function GithubPage() {
  const db = await createSessionClient();
  const [rows, { data: settings }] = await Promise.all([
    loadRows("featured_repos"),
    db.from("site_settings").select("github_username, github_show_activity").maybeSingle(),
  ]);
  const username = settings?.github_username;

  return (
    <>
      <PageHeader title="GitHub" description={ENTITIES.featured_repos.description} />
      <div className="mb-8 rounded-lg border bg-card p-4 text-sm">
        {username ? (
          <p>
            Showing repositories for <span className="font-medium">@{username}</span>.{" "}
            {process.env.GITHUB_TOKEN
              ? settings?.github_show_activity
                ? "The contribution graph is on."
                : "The contribution graph is off."
              : "Add GITHUB_TOKEN to the environment to show the contribution graph and raise API limits."}{" "}
            <Link href="/admin/settings#github" className="underline underline-offset-4">
              Change in Settings
            </Link>
          </p>
        ) : (
          <p>
            No GitHub username is set, so the GitHub section is hidden.{" "}
            <Link href="/admin/settings#github" className="underline underline-offset-4">
              Add it in Settings
            </Link>
          </p>
        )}
      </div>
      <EntityManager entity="featured_repos" rows={rows} />
    </>
  );
}
