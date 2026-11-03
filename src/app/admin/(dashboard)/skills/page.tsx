import type { Metadata } from "next";
import { EntityManager } from "@/components/admin/entity-manager";
import { PageHeader } from "@/components/admin/ui";
import { ENTITIES } from "@/lib/admin/entities";
import { loadRows } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const [categories, skills] = await Promise.all([loadRows("skill_categories"), loadRows("skills")]);
  const names = Object.fromEntries(categories.map((c) => [c.id, String(c.name)]));
  const tags = Object.fromEntries(skills.map((s) => [s.id, names[String(s.category_id)] ?? "No category"]));

  return (
    <>
      <PageHeader title="Skills" description={ENTITIES.skills.description} />
      <div className="grid gap-12">
        <section>
          <h2 className="mb-3 text-sm font-medium">Skills</h2>
          <EntityManager
            entity="skills"
            rows={skills}
            tags={tags}
            categories={categories.map((c) => ({ value: c.id, label: String(c.name) }))}
          />
        </section>
        <section>
          <h2 className="mb-1 text-sm font-medium">Categories</h2>
          <p className="mb-3 text-xs text-muted-foreground">{ENTITIES.skill_categories.description}</p>
          <EntityManager entity="skill_categories" rows={categories} />
        </section>
      </div>
    </>
  );
}
