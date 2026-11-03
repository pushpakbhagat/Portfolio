import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { DocumentRow, Education, ExperienceWithTech } from "@/lib/content/types";
import { EMPLOYMENT_LABELS, WORK_MODE_LABELS, formatPeriod } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { SectionHeader } from "../section-header";

/** Vertical rule that fills with the signal colour as the list scrolls past. */
function TimelineRule() {
  return (
    <div aria-hidden className="absolute top-0 bottom-0 left-0 hidden w-px bg-border md:left-[25%] md:block">
      <div data-line className="h-full w-full origin-top bg-signal" />
      <span
        data-line-dot
        className="absolute top-0 -left-[4px] size-[9px] -translate-y-1/2 rounded-full bg-signal opacity-0 shadow-[0_0_0_4px_color-mix(in_oklch,var(--signal)_18%,transparent),0_0_18px_var(--signal)]"
      />
    </div>
  );
}

function Logo({ path, name }: { path: string | null; name: string }) {
  const src = assetUrl(path);
  if (!src) return null;
  return (
    <span className="relative inline-block size-9 shrink-0 overflow-hidden rounded-sm border bg-card">
      <Image src={src} alt={`${name} logo`} fill sizes="36px" className="object-contain p-1" />
    </span>
  );
}

/** Links to public supporting documents (certificates, letters). */
export function DocumentLinks({ docs }: { docs?: DocumentRow[] }) {
  if (!docs?.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {docs.map((d) => (
        <li key={d.id}>
          <a href={assetUrl(d.path) ?? "#"} target="_blank" rel="noreferrer" className="link-draw inline-flex items-center gap-1 text-sm">
            {d.title} <ArrowUpRight className="size-3.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
            <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-signal" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExperienceSection({ items, index, documents }: { items: ExperienceWithTech[]; index: string; documents: Record<string, DocumentRow[]> }) {
  return (
    <section id="experience" className="container-page scroll-mt-20 py-24 md:py-32">
      <SectionHeader index={index} label="Experience" title="Where I've" accent="worked." />
      <ol className="relative">
        <TimelineRule />
        {items.map((job) => {
          const meta = [EMPLOYMENT_LABELS[job.employment_type], job.work_mode ? WORK_MODE_LABELS[job.work_mode] : "", job.location]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={job.id} className="grid gap-6 border-t py-10 md:grid-cols-4 md:gap-0" data-reveal>
              <div className="md:pr-8">
                <p className="font-mono text-sm">{formatPeriod(job.started_on, job.ended_on, job.is_current)}</p>
                <p className="eyebrow mt-2">{meta}</p>
                {job.is_current && (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs">
                    <span className="size-1.5 rounded-full bg-signal" /> Current role
                  </p>
                )}
              </div>
              <div className="space-y-6 md:col-span-3 md:pl-12">
                <div className="flex items-start gap-4">
                  <Logo path={job.logo_path} name={job.company} />
                  <div>
                    <h3 className="text-title">{job.title}</h3>
                    <p className="mt-1 text-muted-foreground">
                      {job.company_url ? (
                        <a href={job.company_url} target="_blank" rel="noreferrer" className="-my-3 inline-flex items-center gap-1 py-3">
                          <span className="link-draw">{job.company}</span> <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : (
                        job.company
                      )}
                    </p>
                  </div>
                </div>
                {job.description && <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">{job.description}</p>}
                <div className="grid gap-8 lg:grid-cols-2">
                  <BulletList title="Responsibilities" items={job.responsibilities} />
                  <BulletList title="Achievements" items={job.achievements} />
                </div>
                {job.technologies.length > 0 && (
                  <p className="font-mono text-xs text-muted-foreground">{job.technologies.map((t) => t.name).join(" / ")}</p>
                )}
                <DocumentLinks docs={documents[job.id]} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function EducationSection({ items, index, documents }: { items: Education[]; index: string; documents: Record<string, DocumentRow[]> }) {
  return (
    <section id="education" className="container-page scroll-mt-20 py-24 md:py-32">
      <SectionHeader index={index} label="Education" title="Where I" accent="studied." />
      <ol className="relative">
        <TimelineRule />
        {items.map((edu) => (
          <li key={edu.id} className="grid gap-6 border-t py-10 md:grid-cols-4 md:gap-0" data-reveal>
            <div className="md:pr-8">
              <p className="font-mono text-sm">{formatPeriod(edu.started_on, edu.ended_on, edu.is_current)}</p>
              {edu.location && <p className="eyebrow mt-2">{edu.location}</p>}
            </div>
            <div className="space-y-5 md:col-span-3 md:pl-12">
              <div className="flex items-start gap-4">
                <Logo path={edu.logo_path} name={edu.institution} />
                <div>
                  <h3 className="text-title">
                    {edu.degree}
                    {edu.field_of_study && <span className="serif-accent text-muted-foreground">, {edu.field_of_study}</span>}
                  </h3>
                  <p className="mt-1 text-muted-foreground">{edu.institution}</p>
                </div>
              </div>
              {edu.grade && (
                <p className="text-sm">
                  <span className="eyebrow mr-3">Grade</span>
                  {edu.grade}
                </p>
              )}
              {edu.description && <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">{edu.description}</p>}
              {edu.coursework.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Relevant coursework</p>
                  <ul className="flex flex-wrap gap-2">
                    {edu.coursework.map((c) => (
                      <li key={c} className="rounded-sm border px-2.5 py-1 text-xs">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <DocumentLinks docs={documents[edu.id]} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
