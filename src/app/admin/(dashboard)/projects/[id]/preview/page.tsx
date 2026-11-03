import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/site/case-study";
import { getProjectForPreview } from "@/lib/content/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Preview" };

/** The case study exactly as it will look, drafts included. Only reachable by admins. */
export default async function PreviewProjectPage({ params }: PageProps<"/admin/projects/[id]/preview">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const project = await getProjectForPreview(await createSessionClient(), id);
  if (!project) notFound();

  return (
    <div className="-mx-4 -my-8 lg:-mx-8 lg:-my-10">
      <div className="sticky top-14 z-20 flex items-center justify-between gap-4 border-b bg-signal px-4 py-2 text-sm text-signal-foreground lg:px-8">
        <span>
          Preview{project.publish_status === "draft" ? " — this project is a draft and not visible on your site" : " — published version may differ until you save"}
        </span>
        <a href={`/admin/projects/${id}`} className="font-medium underline underline-offset-4">
          Back to editor
        </a>
      </div>
      <CaseStudy project={project} preview />
    </div>
  );
}
