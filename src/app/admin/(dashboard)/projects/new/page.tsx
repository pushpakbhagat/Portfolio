import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/project-editor";
import { PROJECT_DEFAULTS } from "@/lib/admin/form-values";
import { loadTechnologyNames } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  return <ProjectEditor id={null} values={PROJECT_DEFAULTS} status="draft" images={[]} technologies={await loadTechnologyNames()} />;
}
