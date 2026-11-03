import Image from "next/image";
import { cn } from "@/lib/utils";

export type ProjectCard = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  period: string;
  cover: string | null;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  index: number;
};

/**
 * The project's thumbnail, or, until one is uploaded, a typographic cover built from the
 * project's own title, index and stack, so a missing image still looks designed.
 */
export function ProjectCover({
  project,
  sizes,
  preload,
  className,
}: {
  project: ProjectCard;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {project.cover ? (
        <Image
          src={project.cover}
          alt={`${project.title} screenshot`}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-[6%]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 1px), linear-gradient(to right, color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 1px)",
              backgroundSize: "12.5% 20%",
            }}
          />
          <span
            aria-hidden
            className="absolute -right-[4%] -bottom-[18%] text-[clamp(8rem,22vw,22rem)] leading-none font-semibold tracking-tighter text-transparent [-webkit-text-stroke:1px_color-mix(in_oklch,var(--foreground)_22%,transparent)]"
          >
            {String(project.index).padStart(2, "0")}
          </span>
          <span className="eyebrow relative">{project.category || "Project"}</span>
          <div className="relative">
            <p className="serif-accent max-w-[80%] text-[clamp(2rem,4.4vw,4.6rem)] leading-[0.95] transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
              {project.title}
            </p>
            {project.technologies.length > 0 && (
              <p className="eyebrow mt-4 max-w-[70%] !normal-case !tracking-normal">
                {project.technologies.slice(0, 6).join(" / ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
