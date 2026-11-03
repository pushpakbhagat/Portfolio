import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadDocuments, loadRows, loadTechnologyNames } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Experience" };

type TechJoin = { sort_order: number; technologies: { name: string } | null }[];

export default async function ExperiencePage() {
  const [rows, technologies, documents] = await Promise.all([
    loadRows("experiences", "*, experience_technologies(sort_order, technologies(name))"),
    loadTechnologyNames(),
    loadDocuments("experience_id"),
  ]);
  const withTags = rows.map(({ experience_technologies, ...row }) => ({
    ...row,
    technologies: [...((experience_technologies as TechJoin) ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((t) => (t.technologies ? [t.technologies.name] : [])),
  }));

  return (
    <>
      <PageHeader title={ENTITIES.experiences.label} description={ENTITIES.experiences.description} />
      <EntityManager entity="experiences" rows={withTags} technologies={technologies} documents={documents} documentsKind="experience" />
    </>
  );
}
