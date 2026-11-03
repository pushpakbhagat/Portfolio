import { ArrowUpRight, GitFork, Star } from "lucide-react";
import type { GithubData } from "@/lib/github";
import { SectionHeader } from "../section-header";

const LEVEL_OPACITY = ["0.07", "0.3", "0.5", "0.75", "1"];

export function GithubSection({ data, index }: { data: GithubData; index: string }) {
  const stats = [
    { label: "Public repositories", value: data.publicRepos },
    { label: "Followers", value: data.followers },
    { label: "Contributions, last year", value: data.contributions?.total ?? null },
  ].filter((s) => s.value !== null);

  return (
    <section id="github" className="container-page scroll-mt-20 py-24 md:py-32">
      <SectionHeader
        index={index}
        label="Open source"
        title="Recent work on"
        accent="GitHub."
        aside={
          <a href={data.url} target="_blank" rel="noreferrer" className="eyebrow !text-foreground link-draw">
            @{data.username} ↗
          </a>
        }
      />

      {stats.length > 0 && (
        <dl className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-4" data-reveal-children>
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="text-headline tabular-nums" data-count={s.value ?? undefined}>
                {s.value}
              </dd>
              <dt className="eyebrow mt-2">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {data.contributions && (
        <div className="mb-12 overflow-x-auto pb-2" data-lenis-prevent data-reveal>
          <div className="flex w-max gap-[3px]" role="img" aria-label={`${data.contributions.total} contributions in the last year`}>
            {data.contributions.weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.count} on ${day.date}`}
                    className="size-2.5 rounded-[2px] bg-signal"
                    style={{ opacity: LEVEL_OPACITY[day.level] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.repos.length > 0 && (
        <ul className="grid pt-px pl-px md:grid-cols-2 lg:grid-cols-3" data-reveal-children>
          {data.repos.map((repo) => (
            <li key={repo.fullName} className="-mt-px -ml-px border">
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full min-h-44 flex-col justify-between gap-6 p-6 transition-colors duration-500 hover:bg-surface"
              >
                <div>
                  <p className="flex items-center justify-between gap-4 font-medium tracking-tight">
                    {repo.name}
                    <ArrowUpRight className="size-4 shrink-0 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                  {repo.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{repo.description}</p>}
                </div>
                <p className="eyebrow flex items-center gap-5">
                  {repo.language && <span>{repo.language}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3" /> {repo.stars}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="size-3" /> {repo.forks}
                  </span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
