import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Social links" };

export default async function SocialPage() {
  const rows = await loadRows("social_links");
  return (
    <>
      <PageHeader title={ENTITIES.social_links.label} description={ENTITIES.social_links.description} />
      <EntityManager entity="social_links" rows={rows} />
    </>
  );
}
