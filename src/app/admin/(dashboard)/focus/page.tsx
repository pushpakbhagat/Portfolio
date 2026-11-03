import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "What I do" };

export default async function FocusPage() {
  const rows = await loadRows("focus_areas");
  return (
    <>
      <PageHeader title={ENTITIES.focus_areas.label} description={ENTITIES.focus_areas.description} />
      <EntityManager entity="focus_areas" rows={rows} />
    </>
  );
}
