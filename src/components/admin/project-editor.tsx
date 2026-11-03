"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useFormContext } from "react-hook-form";
import { ArrowLeft, Eye, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveProject, setProjectPublished } from "@/lib/admin/actions";
import type { FieldDef } from "@/lib/admin/entities";
import type { ProjectFormValues } from "@/lib/admin/form-values";
import { projectSchema } from "@/lib/admin/schemas";
import { PROJECT_STATUS_LABELS } from "@/lib/format";
import { FieldShell, FormField, UploadsContext } from "./fields";
import { ProjectImages, type AdminImage } from "./project-images";
import { useAdminForm } from "./use-admin-form";

type Values = ProjectFormValues;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const GROUPS: { title: string; description?: string; fields: FieldDef[] }[] = [
  {
    title: "Basics",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "URL slug", type: "text", description: "The page lives at /projects/<slug>." },
      { name: "summary", label: "Short description", type: "textarea", description: "One or two sentences for cards and search results.", wide: true },
      { name: "category", label: "Category", type: "text", placeholder: "Full-stack web application" },
      { name: "role", label: "My role", type: "text", placeholder: "Solo developer" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        allowEmpty: true,
      },
      { name: "is_featured", label: "Featured", type: "switch", description: "Shown in the large showcase on the home page." },
      { name: "started_on", label: "Started", type: "date" },
      { name: "ended_on", label: "Finished", type: "date" },
      { name: "is_ongoing", label: "Still in development", type: "switch", wide: true },
    ],
  },
  {
    title: "Links",
    fields: [
      { name: "github_url", label: "GitHub repository", type: "url", placeholder: "https://github.com/…" },
      { name: "live_url", label: "Live demo", type: "url", placeholder: "https://…" },
    ],
  },
  {
    title: "Case study",
    description: "Every section is optional: empty ones are left out of the page.",
    fields: [
      { name: "overview", label: "Overview", type: "markdown", wide: true },
      { name: "problem", label: "Problem statement", type: "markdown", wide: true },
      { name: "solution", label: "Proposed solution", type: "markdown", wide: true },
      { name: "architecture", label: "Architecture / implementation", type: "markdown", wide: true },
      { name: "features", label: "Key features", type: "list", itemLabel: "feature", wide: true },
    ],
  },
  {
    title: "Stack and media",
    fields: [
      { name: "technologies", label: "Technologies", type: "tags", wide: true },
      { name: "thumbnail_path", label: "Cover image", type: "image", folder: "projects", description: "16:10 works best. Without one, a typographic cover is generated." },
    ],
  },
];

const RESULTS: FieldDef = {
  name: "outcomes",
  label: "Results and outcomes",
  type: "markdown",
  description: "Only real, measurable results. Leave empty rather than guessing.",
  wide: true,
};

const SEO: FieldDef[] = [
  { name: "seo_title", label: "SEO title", type: "text", description: "Defaults to the project title. Up to 70 characters." },
  { name: "seo_description", label: "SEO description", type: "textarea", description: "Defaults to the short description." },
];

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-5 py-4">
        <h2 className="font-medium">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ChallengesInput() {
  const { control, register } = useFormContext<Values>();
  const { fields, append, remove } = useFieldArray({ control, name: "challenges" });
  return (
    <FieldShell label="Challenges and solutions" wide>
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={f.id} className="relative grid gap-2 rounded-md border p-3 pr-10">
            <Textarea rows={2} placeholder="The challenge" {...register(`challenges.${i}.challenge`)} />
            <Textarea rows={3} placeholder="How you solved it" {...register(`challenges.${i}.solution`)} />
            <Button type="button" variant="ghost" size="icon-sm" className="absolute top-2 right-2" onClick={() => remove(i)} aria-label="Remove challenge">
              <X />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ challenge: "", solution: "" })}>
          <Plus /> Add challenge
        </Button>
      </div>
    </FieldShell>
  );
}

export function ProjectEditor({
  id,
  values,
  status,
  images,
  technologies,
}: {
  id: string | null;
  values: Values;
  status: "draft" | "published";
  images: AdminImage[];
  technologies: string[];
}) {
  const router = useRouter();
  const [publishStatus, setPublishStatus] = useState(status);
  const [publishing, startPublish] = useTransition();
  const slugTouched = useRef(Boolean(values.slug));
  const publishAfterSave = useRef(false);

  const { form, submit, pending, uploads } = useAdminForm({
    schema: projectSchema,
    defaultValues: values,
    save: (v) => saveProject(id, v),
    successMessage: id ? "Project saved" : "Draft created",
    onSaved: (result) => {
      const savedId = result?.id ?? id;
      if (publishAfterSave.current && savedId) {
        publishAfterSave.current = false;
        togglePublish(savedId, true);
      }
      if (!id && savedId) router.replace(`/admin/projects/${savedId}`);
      else router.refresh();
    },
  });

  function togglePublish(projectId: string, publish: boolean) {
    startPublish(async () => {
      const result = await setProjectPublished(projectId, publish);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPublishStatus(publish ? "published" : "draft");
      toast.success(publish ? "Published. It's live on your site." : "Moved to drafts. It's no longer public.");
      router.refresh();
    });
  }

  const titleField = form.register("title");
  const published = publishStatus === "published";
  const busy = pending || publishing;

  return (
    <UploadsContext.Provider value={uploads}>
      <FormProvider {...form}>
        <form onSubmit={submit} noValidate>
          <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/projects" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3" /> Projects
              </Link>
              <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                {form.watch("title") || (id ? "Untitled project" : "New project")}
                {id && <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {id && (
                <Button type="button" variant="outline" asChild>
                  <a href={`/admin/projects/${id}/preview`} target="_blank">
                    <Eye /> Preview
                  </a>
                </Button>
              )}
              {id && published && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => togglePublish(id, false)}>
                  Unpublish
                </Button>
              )}
              <Button type="submit" variant={published ? "default" : "outline"} disabled={busy}>
                {pending && <Loader2 className="animate-spin" />}
                {published ? "Save changes" : "Save draft"}
              </Button>
              {!published && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (id && !form.formState.isDirty) togglePublish(id, true);
                    else {
                      publishAfterSave.current = true;
                      void submit();
                    }
                  }}
                >
                  {publishing && <Loader2 className="animate-spin" />}
                  {id ? "Publish" : "Save and publish"}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {GROUPS.map((group) => (
              <Card key={group.title} title={group.title} description={group.description}>
                {group.fields.map((field) =>
                  field.name === "title" ? (
                    <FieldShell key="title" label="Title" htmlFor="project-title" error={form.formState.errors.title?.message}>
                      <input
                        id="project-title"
                        className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        {...titleField}
                        onChange={(e) => {
                          void titleField.onChange(e);
                          if (!slugTouched.current) form.setValue("slug", slugify(e.target.value), { shouldDirty: true });
                        }}
                      />
                    </FieldShell>
                  ) : field.name === "slug" ? (
                    <div key="slug" onInput={() => (slugTouched.current = true)} className="contents">
                      <FormField field={field} />
                    </div>
                  ) : (
                    <FormField key={field.name} field={field} technologies={technologies} />
                  ),
                )}
                {group.title === "Case study" && (
                  <>
                    <ChallengesInput />
                    <FormField field={RESULTS} />
                  </>
                )}
              </Card>
            ))}

            {id ? (
              <ProjectImages projectId={id} images={images} />
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Save the draft to add screenshots.</p>
            )}

            <Card title="Search engines and sharing">
              {SEO.map((field) => (
                <FormField key={field.name} field={field} />
              ))}
            </Card>
          </div>
        </form>
      </FormProvider>
    </UploadsContext.Provider>
  );
}
