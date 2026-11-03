import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadDocuments, loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Certifications & achievements" };

export default async function AccomplishmentsPage() {
  const [rows, documents] = await Promise.all([loadRows("accomplishments"), loadDocuments("accomplishment_id")]);
  return (
    <>
      <PageHeader title={ENTITIES.accomplishments.label} description={ENTITIES.accomplishments.description} />
      <EntityManager entity="accomplishments" rows={rows} documents={documents} documentsKind="accomplishment" />
    </>
  );
}
