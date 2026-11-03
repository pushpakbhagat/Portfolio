"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { pad } from "@/lib/format";
import { ProjectCover, type ProjectCard } from "./project-cover";

/** Non-featured projects as rows; on fine pointers a preview of the hovered one follows the cursor. */
export function ProjectList({ projects, startIndex }: { projects: ProjectCard[]; startIndex: number }) {
  const scope = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ProjectCard | null>(null);

  useGSAP(
    () => {
      const el = preview.current!;
      const mm = gsap.matchMedia();
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          x(e.clientX + 24);
          y(e.clientY - 120);
        };
        window.addEventListener("pointermove", move, { passive: true });
        return () => window.removeEventListener("pointermove", move);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="container-page mt-28">
      <p className="eyebrow mb-6">More projects</p>
      <ul className="border-b" onPointerLeave={() => setActive(null)}>
        {projects.map((project, i) => (
          <li key={project.slug} onPointerEnter={() => setActive(project)}>
            <Link
              href={`/projects/${project.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-t py-6 transition-colors hover:bg-surface md:grid-cols-12 md:gap-6"
            >
              <span className="eyebrow md:col-span-1 md:pl-3">{pad(startIndex + i)}</span>
              <span className="text-title transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:col-span-5">
                {project.title}
              </span>
              <span className="hidden text-sm text-muted-foreground md:col-span-4 md:block">
                {project.technologies.slice(0, 4).join(" / ")}
              </span>
              <span className="eyebrow flex items-center justify-end gap-2 md:col-span-2 md:pr-3">
                {project.period}
                <ArrowUpRight className="size-4 text-foreground transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-40 hidden w-80 transition-opacity duration-300 [@media(pointer:fine)]:block"
        style={{ opacity: active ? 1 : 0 }}
      >
        {active && (
          <ProjectCover project={active} sizes="320px" className="aspect-[4/3] rounded-sm shadow-2xl shadow-black/20" />
        )}
      </div>
    </div>
  );
}
