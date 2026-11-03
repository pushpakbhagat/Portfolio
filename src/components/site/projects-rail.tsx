"use client";

import { useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Tilt } from "@/components/motion/tilt";
import { pad } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProjectCover, type ProjectCard } from "./project-cover";

const PINNED = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * Featured projects.
 * - Large screens with motion allowed: the section pins and the panels move sideways as you scroll.
 * - Phones and tablets: a native swipe carousel with snap points and position dots.
 * - Reduced motion on large screens: the same carousel, scrollable with a trackpad or keyboard.
 */
export function ProjectsRail({ projects }: { projects: ProjectCard[] }) {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      if (projects.length < 2) return;
      const mm = gsap.matchMedia();
      mm.add(PINNED, () => {
        const el = track.current!;
        // While pinned, GSAP moves the track; the native carousel scrolling is switched off.
        el.style.overflow = "visible";
        el.style.scrollSnapType = "none";
        const distance = () => el.scrollWidth - el.clientWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate(self) {
              const i = Math.min(projects.length, Math.floor(self.progress * projects.length) + 1);
              if (counter.current) counter.current.textContent = pad(i);
            },
          },
        });
        return () => {
          el.style.overflow = "";
          el.style.scrollSnapType = "";
        };
      });
      return () => mm.revert();
    },
    { scope: section, dependencies: [projects.length] },
  );

  // Carousel position for the dots (only meaningful when the track scrolls natively).
  function onScroll() {
    const el = track.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    const width = slide ? slide.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : el.clientWidth;
    setActive(Math.min(projects.length - 1, Math.round(el.scrollLeft / width)));
  }

  function goTo(i: number) {
    const slide = track.current?.children[i] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div ref={section} className="relative lg:flex lg:h-svh lg:flex-col lg:justify-center lg:overflow-hidden">
      {projects.length > 1 && (
        <p className="eyebrow container-page mb-6 hidden lg:block" aria-hidden>
          <span ref={counter}>01</span> / {pad(projects.length)}
        </p>
      )}
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-2 [scrollbar-width:none] md:gap-8 lg:w-full lg:gap-[4vw] lg:will-change-transform [&::-webkit-scrollbar]:hidden"
        aria-label="Featured projects"
        tabIndex={0}
      >
        {projects.map((project, i) => (
          <article
            key={project.slug}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${projects.length}: ${project.title}`}
            className={cn(
              "grid w-[86%] shrink-0 snap-start content-start gap-6 sm:w-[72%] lg:w-[78vw] lg:grid-cols-12 lg:items-end lg:gap-10",
              projects.length === 1 && "w-full sm:w-full",
            )}
          >
            <Link
              href={`/projects/${project.slug}`}
              data-cursor="View"
              className="group block lg:col-span-7"
              aria-label={`${project.title} case study`}
            >
              <ViewTransition name={`cover-${project.slug}`} share="cover">
                <Tilt className="rounded-sm">
                  <ProjectCover
                    project={project}
                    sizes="(min-width: 1024px) 46vw, 86vw"
                    preload={i === 0}
                    className="aspect-[16/11] rounded-sm"
                  />
                </Tilt>
              </ViewTransition>
            </Link>

            <div className="lg:col-span-5">
              <p className="eyebrow mb-4 flex gap-4 lg:mb-5">
                <span>{pad(i + 1)}</span>
                {project.category && <span className="truncate">{project.category}</span>}
                {project.period && <span className="ml-auto shrink-0">{project.period}</span>}
              </p>
              <h3 className="text-headline mb-4 !text-[clamp(2rem,6vw,5.75rem)] lg:mb-5 lg:!text-[clamp(2.5rem,min(4.2vw,7svh),4.75rem)]">
                <Link href={`/projects/${project.slug}`} className="hover:text-foreground/80">
                  {project.title}
                </Link>
              </h3>
              <p className="mb-5 line-clamp-3 max-w-md text-muted-foreground lg:mb-6 lg:line-clamp-none">{project.summary}</p>
              {project.technologies.length > 0 && (
                <p className="mb-6 line-clamp-2 max-w-md font-mono text-xs leading-relaxed text-muted-foreground lg:mb-8 lg:line-clamp-none">
                  {project.technologies.join(" / ")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium">
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground"
                >
                  Read case study
                </Link>
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1">
                    <span className="link-draw">Live demo</span> <ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1">
                    <span className="link-draw">Source</span> <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {projects.length > 1 && (
        <div className="container-page mt-6 flex items-center gap-4 lg:hidden motion-reduce:lg:flex">
          <span className="eyebrow tabular-nums">
            {pad(active + 1)} / {pad(projects.length)}
          </span>
          <div className="flex gap-1.5">
            {projects.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${p.title}`}
                aria-current={i === active}
                className="grid h-11 place-items-center px-1"
              >
                <span className={cn("block h-1 rounded-full transition-all duration-500", i === active ? "w-8 bg-signal" : "w-3 bg-border")} />
              </button>
            ))}
          </div>
          <span className="eyebrow ml-auto">Swipe</span>
        </div>
      )}
    </div>
  );
}
