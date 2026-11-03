import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectsTable, type ProjectRowData } from "@/components/admin/projects-table";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = (await loadRows(
    "projects",
    "id, slug, title, summary, thumbnail_path, is_featured, publish_status, updated_at, sort_order",
  )) as unknown as ProjectRowData[];
  const published = projects.filter((p) => p.publish_status === "published").length;

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${published} published, ${projects.length - published} draft. Drag to change the order on the site; featured projects get the large showcase.`}
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      <ProjectsTable projects={projects} />
    </>
  );
}
