import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadDocuments, loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Education" };

export default async function EducationPage() {
  const [rows, documents] = await Promise.all([loadRows("education"), loadDocuments("education_id")]);
  return (
    <>
      <PageHeader title={ENTITIES.education.label} description={ENTITIES.education.description} />
      <EntityManager entity="education" rows={rows} documents={documents} documentsKind="education" />
    </>
  );
}
