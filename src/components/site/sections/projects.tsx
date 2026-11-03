import type { ProjectWithRelations } from "@/lib/content/types";
import { formatPeriod } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import type { ProjectCard } from "../project-cover";
import { ProjectList } from "../project-list";
import { ProjectsRail } from "../projects-rail";
import { SectionHeader } from "../section-header";

export function toCard(project: ProjectWithRelations, index: number): ProjectCard {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.category,
    period: formatPeriod(project.started_on, project.ended_on, project.is_ongoing).replace(/\b[A-Z][a-z]{2} /g, ""),
    cover: assetUrl(project.thumbnail_path),
    technologies: project.technologies.map((t) => t.name),
    githubUrl: project.github_url,
    liveUrl: project.live_url,
    index,
  };
}

export function Projects({ projects, index }: { projects: ProjectWithRelations[]; index: string }) {
  const cards = projects.map((p, i) => toCard(p, i + 1));
  // With nothing marked featured, the first projects take the showcase.
  const featuredSlugs = new Set(
    projects.some((p) => p.is_featured) ? projects.filter((p) => p.is_featured).map((p) => p.slug) : projects.slice(0, 3).map((p) => p.slug),
  );
  const featured = cards.filter((c) => featuredSlugs.has(c.slug));
  const rest = cards.filter((c) => !featuredSlugs.has(c.slug));

  return (
    // `dark` flips the design tokens for this band only: an ink-coloured section in light mode
    // (a lifted surface in dark mode) so the work stands apart from the paper around it.
    <section id="work" className="dark relative isolate scroll-mt-20 overflow-hidden bg-background py-24 text-foreground md:py-32 dark:bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora top-[-10%] left-[10%] size-[40vw] max-w-[40rem] bg-signal/50" />
        <div className="aurora right-[-6%] bottom-[-14%] size-[34vw] max-w-[34rem] bg-[oklch(0.6_0.12_250)]/60 [animation-delay:-11s]" />
        <div className="bg-dots absolute inset-0 opacity-60" />
      </div>
      <div className="container-page">
        <SectionHeader
          index={index}
          label="Selected work"
          title="Things I've"
          accent="built."
          aside={
            <span className="eyebrow">
              <span data-count={projects.length}>{projects.length}</span> projects
            </span>
          }
        />
      </div>
      <ProjectsRail projects={featured} />
      {rest.length > 0 && <ProjectList projects={rest} startIndex={featured.length + 1} />}
    </section>
  );
}
