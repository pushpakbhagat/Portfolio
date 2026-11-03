import { ViewTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion/split-text";
import type { ProjectWithRelations } from "@/lib/content/types";
import { PROJECT_STATUS_LABELS, formatPeriod, pad } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { BrandIcon } from "./brand-icon";
import { ProjectCover } from "./project-cover";
import { Prose } from "./prose";
import { toCard } from "./sections/projects";

type Props = {
  project: ProjectWithRelations;
  next?: { slug: string; title: string } | null;
  /** Admin preview: no links back into the public site. */
  preview?: boolean;
};

/** The full case study: shared by /projects/[slug] and the admin preview. */
export function CaseStudy({ project, next, preview }: Props) {
  const card = toCard(project, project.sort_order || 1);
  // The admin preview has no motion runtime, so it must not start hidden.
  const intro = (kind: "fade" | "chars") => (preview ? undefined : kind);
  const period = formatPeriod(project.started_on, project.ended_on, project.is_ongoing);
  const meta = [
    { label: "Role", value: project.role },
    { label: "Timeline", value: period },
    { label: "Status", value: project.status ? PROJECT_STATUS_LABELS[project.status] : "" },
    { label: "Category", value: project.category },
  ].filter((m) => m.value);

  const blocks: { title: string; body: ReactNode }[] = [];
  if (project.overview) blocks.push({ title: "Overview", body: <Prose>{project.overview}</Prose> });
  if (project.problem) blocks.push({ title: "The problem", body: <Prose>{project.problem}</Prose> });
  if (project.solution) blocks.push({ title: "The solution", body: <Prose>{project.solution}</Prose> });
  if (project.technologies.length)
    blocks.push({
      title: "Stack",
      body: (
        <ul className="grid max-w-2xl grid-cols-2 pt-px pl-px sm:grid-cols-3">
          {project.technologies.map((t) => (
            <li key={t.id} className="-mt-px -ml-px flex items-center gap-3 border px-4 py-4 text-sm">
              <BrandIcon slug={t.icon_slug} className="size-4 text-muted-foreground" />
              {t.name}
            </li>
          ))}
        </ul>
      ),
    });
  if (project.architecture)
    blocks.push({ title: "Architecture", body: <Prose>{project.architecture}</Prose> });
  if (project.features.length)
    blocks.push({
      title: "Key features",
      body: (
        <ol className="max-w-2xl border-t">
          {project.features.map((f, i) => (
            <li key={i} className="grid grid-cols-[3rem_1fr] border-b py-4 text-[17px] leading-relaxed">
              <span className="eyebrow pt-1.5">{pad(i + 1)}</span>
              {f}
            </li>
          ))}
        </ol>
      ),
    });
  if (project.challenges.length)
    blocks.push({
      title: "Challenges & solutions",
      body: (
        <div className="max-w-2xl space-y-10">
          {project.challenges.map((c, i) => (
            <div key={i} className="grid gap-4 border-t pt-6">
              <p className="text-xl leading-snug font-medium tracking-tight">{c.challenge}</p>
              <p className="flex gap-4 leading-relaxed text-foreground/80">
                <span className="eyebrow shrink-0 pt-1 !text-signal">Solved</span>
                {c.solution}
              </p>
            </div>
          ))}
        </div>
      ),
    });
  if (project.images.length)
    blocks.push({
      title: "Screenshots",
      body: (
        <div className="grid gap-6 sm:grid-cols-2">
          {project.images.map((img, i) => {
            const src = assetUrl(img.path);
            if (!src) return null;
            return (
              <figure key={img.id} className={i === 0 ? "sm:col-span-2" : undefined} data-reveal>
                <div
                  className="relative overflow-hidden rounded-sm border bg-surface"
                  style={{ aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : "16 / 10" }}
                >
                  <Image
                    src={src}
                    alt={img.alt || `${project.title} screenshot ${i + 1}`}
                    fill
                    sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                    className="object-cover"
                  />
                </div>
                {img.caption && <figcaption className="eyebrow mt-3 !normal-case !tracking-normal">{img.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      ),
    });
  if (project.outcomes) blocks.push({ title: "Results", body: <Prose>{project.outcomes}</Prose> });

  return (
    <article>
      <header className="container-page pt-28 md:pt-36">
        {!preview && (
          <Link href="/#work" className="eyebrow !text-foreground link-draw mb-12 inline-flex items-center gap-2">
            <ArrowLeft className="size-3" /> All work
          </Link>
        )}
        <p className="eyebrow mb-6 flex flex-wrap gap-x-6 gap-y-2" data-intro={intro("fade")}>
          <span>Case study</span>
          {project.category && <span>{project.category}</span>}
          {period && <span>{period}</span>}
        </p>
        <h1 className="text-display mb-10 max-w-6xl !text-[clamp(3rem,10vw,10rem)]">
          <SplitText text={project.title} data-intro={intro("chars")} />
        </h1>
        <div className="grid gap-10 border-t pt-8 pb-14 md:grid-cols-12">
          <p className="text-statement !text-[clamp(1.25rem,2.2vw,2rem)] md:col-span-7" data-intro={intro("fade")}>
            {project.summary}
          </p>
          <div className="space-y-8 md:col-span-4 md:col-start-9" data-intro={intro("fade")}>
            {meta.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                {meta.map((m) => (
                  <div key={m.label}>
                    <dt className="eyebrow mb-1">{m.label}</dt>
                    <dd className="text-sm">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="flex flex-wrap gap-3">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  Live demo <ArrowUpRight className="size-4" />
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-foreground/25 px-5 text-sm font-medium transition-colors hover:border-foreground"
                >
                  Source code <ArrowUpRight className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container-page">
        <ViewTransition name={`cover-${project.slug}`} share="cover">
          <ProjectCover project={card} sizes="100vw" preload className="aspect-[16/9] rounded-sm" />
        </ViewTransition>
      </div>

      <div className="container-page py-24 md:py-32">
        {blocks.map((block, i) => (
          <section key={block.title} className="grid gap-6 border-t py-12 md:grid-cols-12 md:gap-8 md:py-16">
            <h2 className="md:col-span-3">
              <span className="eyebrow mb-2 block">{pad(i + 1)}</span>
              <span className="text-xl font-medium tracking-tight">{block.title}</span>
            </h2>
            <div className="md:col-span-9" data-reveal>
              {block.body}
            </div>
          </section>
        ))}
      </div>

      {next && !preview && (
        <Link href={`/projects/${next.slug}`} className="group block border-t">
          <div className="container-page flex items-end justify-between gap-6 py-20 md:py-28">
            <div>
              <p className="eyebrow mb-4">Next project</p>
              <p className="text-headline transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3">
                {next.title}
              </p>
            </div>
            <span className="grid size-16 shrink-0 place-items-center rounded-full border transition-colors duration-500 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background md:size-24">
              <ArrowRight className="size-6" />
            </span>
          </div>
        </Link>
      )}
    </article>
  );
}
