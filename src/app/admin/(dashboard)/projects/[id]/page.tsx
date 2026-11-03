import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";
import { PROJECT_DEFAULTS, toFormValues } from "@/lib/admin/form-values";
import { loadTechnologyNames } from "@/lib/admin/queries";
import { getProjectForPreview } from "@/lib/content/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createSessionClient();
  const [project, technologies] = await Promise.all([getProjectForPreview(db, id), loadTechnologyNames()]);
  if (!project) notFound();

  const values = toFormValues(PROJECT_DEFAULTS, { ...project, technologies: project.technologies.map((t) => t.name) });
  return (
    <ProjectEditor
      key={project.updated_at}
      id={project.id}
      values={values}
      status={project.publish_status}
      images={project.images}
      technologies={technologies}
    />
  );
}
