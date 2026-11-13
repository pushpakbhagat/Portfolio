import Image from "next/image";
import { DocumentLinks } from "@/components/site/sections/timeline";
import type { HomeData } from "@/lib/content/queries";
import type { Accomplishment, DocumentRow, Education, ExperienceWithTech, FocusArea, SkillLevel } from "@/lib/content/types";
import {
  ACCOMPLISHMENT_LABELS,
  EMPLOYMENT_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_MODE_LABELS,
  formatMonth,
  formatPeriod,
} from "@/lib/format";
import type { GithubData } from "@/lib/github";
import { assetUrl } from "@/lib/storage";

// Content sections of the paper home page. Each one shows everything its admin page collects, and
// leaves out whatever is empty.

type Docs = Record<string, DocumentRow[]>;

/** "What I do": the focus areas as index cards. */
export function WhatIDo({ areas }: { areas: FocusArea[] }) {
  return (
    <section id="focus" className="pp-section pp-focus" aria-labelledby="pp-focus">
      <p className="pp-lab" id="pp-focus">
        what I do
      </p>
      <ul>
        {areas.map((area, i) => (
          <li key={area.id}>
            <span aria-hidden>{String(i + 1).padStart(2, "0")}</span>
            <h3>{area.title}</h3>
            {area.description && <p>{area.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const LEVEL_DOTS: Record<SkillLevel, number> = { learning: 1, working: 2, proficient: 3, expert: 4 };

/** Skills as stickers, grouped by category. Dots show the proficiency level when one is set. */
export function Toolbox({ groups }: { groups: HomeData["skillGroups"] }) {
  const hasLevels = groups.some((g) => g.skills.some((s) => s.level));
  return (
    <section id="toolbox" className="pp-section pp-sheet pp-tools" aria-labelledby="pp-tools">
      <h2 className="pp-h2" id="pp-tools">
        My toolbox
      </h2>
      {groups.map((group) => (
        <div key={group.category?.id ?? "other"}>
          {group.category && (
            <h3>
              {group.category.name}
              {group.category.description && <small>{group.category.description}</small>}
            </h3>
          )}
          <ul className="pp-tags">
            {group.skills.map((skill) => {
              const icon = assetUrl(skill.icon_path);
              return (
                <li key={skill.id} title={skill.note || undefined}>
                  {icon && <Image src={icon} alt="" width={16} height={16} />}
                  {skill.name}
                  {skill.years ? <small>{skill.years}y</small> : null}
                  {skill.level && (
                    <span className="pp-level" role="img" aria-label={SKILL_LEVEL_LABELS[skill.level]}>
                      {Array.from({ length: 4 }, (_, n) => (
                        <i key={n} data-on={n < LEVEL_DOTS[skill.level!]} />
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {hasLevels && <p className="pp-hint">Dots: learning, working knowledge, proficient, expert.</p>}
    </section>
  );
}

function Logo({ path, name }: { path: string | null; name: string }) {
  const src = assetUrl(path);
  if (!src) return null;
  return <Image src={src} alt={`${name} logo`} width={44} height={44} className="pp-logo" />;
}

/** Experience and education as stops on one route, newest first, ending at the career goal. */
export function Journey({
  experiences,
  education,
  goal,
  documents,
}: {
  experiences: ExperienceWithTech[];
  education: Education[];
  goal: string;
  documents: Docs;
}) {
  // Newest first: the current role leads, then by start date.
  const jobs = [...experiences].sort((a, b) => Number(b.is_current) - Number(a.is_current) || b.started_on.localeCompare(a.started_on));
  return (
    <section className="pp-section pp-journey" aria-labelledby="pp-journey">
      <p className="pp-lab">the route so far</p>
      <h2 className="pp-h2 pp-h2-chalk" id="pp-journey">
        Journey
      </h2>
      <ol className="pp-route">
        {goal && (
          <li className="pp-stop pp-stop-next">
            <div className="pp-stop-card">
              <b className="pp-when">Next stop</b>
              <h3>{goal}</h3>
            </div>
          </li>
        )}

        {jobs.map((job, i) => (
          <li key={job.id} id={i === 0 ? "experience" : undefined} className="pp-stop" data-now={job.is_current}>
            <div className="pp-sheet pp-stop-card">
              <b className="pp-when">
                {formatPeriod(job.started_on, job.ended_on, job.is_current)}
                {job.is_current && <em>you are here</em>}
              </b>
              <div className="pp-stop-head">
                <Logo path={job.logo_path} name={job.company} />
                <div>
                  <h3>{job.title}</h3>
                  <p>
                    {job.company_url ? (
                      <a href={job.company_url} target="_blank" rel="noreferrer">
                        {job.company} ↗
                      </a>
                    ) : (
                      job.company
                    )}
                    {[EMPLOYMENT_LABELS[job.employment_type], job.work_mode && WORK_MODE_LABELS[job.work_mode], job.location]
                      .filter(Boolean)
                      .map((bit) => ` · ${bit}`)}
                  </p>
                </div>
              </div>
              {job.description && <p>{job.description}</p>}
              {(job.responsibilities.length > 0 || job.achievements.length > 0) && (
                <div className="pp-stop-lists">
                  {job.responsibilities.length > 0 && (
                    <div>
                      <h4>What I did</h4>
                      <ul>
                        {job.responsibilities.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.achievements.length > 0 && (
                    <div>
                      <h4>What came of it</h4>
                      <ul className="pp-ticks">
                        {job.achievements.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {job.technologies.length > 0 && (
                <ul className="pp-chips">
                  {job.technologies.map((t) => (
                    <li key={t.id}>{t.name}</li>
                  ))}
                </ul>
              )}
              <DocumentLinks docs={documents[job.id]} />
            </div>
          </li>
        ))}

        {education.map((school, i) => (
          <li key={school.id} id={i === 0 ? "education" : undefined} className="pp-stop pp-stop-school" data-now={school.is_current}>
            <div className="pp-sheet pp-stop-card">
              <b className="pp-when">{formatPeriod(school.started_on, school.ended_on, school.is_current)}</b>
              {school.grade && (
                <span className="pp-grade">
                  <small>grade</small>
                  {school.grade}
                </span>
              )}
              <div className="pp-stop-head">
                <Logo path={school.logo_path} name={school.institution} />
                <div>
                  <h3>{[school.degree, school.field_of_study].filter(Boolean).join(", ")}</h3>
                  <p>{[school.institution, school.location].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              {school.description && <p>{school.description}</p>}
              {school.coursework.length > 0 && (
                <>
                  <h4>Coursework</h4>
                  <ul className="pp-chips">
                    {school.coursework.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </>
              )}
              <DocumentLinks docs={documents[school.id]} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Certifications and achievements, with everything the admin collects for each. */
export function Wins({ items, documents }: { items: Accomplishment[]; documents: Docs }) {
  return (
    <section id="wins" className="pp-section pp-sheet pp-wins" aria-labelledby="pp-wins">
      <h2 className="pp-h2" id="pp-wins">
        Small wins
      </h2>
      <ul>
        {items.map((win) => {
          const image = assetUrl(win.image_path);
          return (
            <li key={win.id}>
              {image && <Image src={image} alt="" width={72} height={54} className="pp-win-img" />}
              <div>
                {win.credential_url ? (
                  <a href={win.credential_url} target="_blank" rel="noreferrer">
                    {win.title} ↗
                  </a>
                ) : (
                  win.title
                )}
                <small>
                  {[
                    ACCOMPLISHMENT_LABELS[win.kind],
                    win.issuer,
                    formatMonth(win.issued_on),
                    win.expires_on && `expires ${formatMonth(win.expires_on)}`,
                    win.credential_id && `ID ${win.credential_id}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {win.description && <p>{win.description}</p>}
                <DocumentLinks docs={documents[win.id]} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** GitHub: a few counts, the contribution year drawn on graph paper, and the featured repositories. */
export function GithubSheet({ data }: { data: GithubData }) {
  const stats = [
    { label: "public repos", value: data.publicRepos },
    { label: "followers", value: data.followers },
    { label: "contributions this year", value: data.contributions?.total ?? null },
  ].filter((s) => s.value !== null);

  return (
    <section id="github" className="pp-section pp-sheet pp-github" aria-labelledby="pp-github">
      <div className="pp-github-head">
        <h2 className="pp-h2" id="pp-github">
          On GitHub
        </h2>
        <a href={data.url} target="_blank" rel="noreferrer" className="pp-btn">
          @{data.username} ↗
        </a>
      </div>
      {stats.length > 0 && (
        <dl className="pp-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <dd>{s.value}</dd>
              <dt>{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {data.contributions && (
        <div className="pp-contrib" role="img" aria-label={`${data.contributions.total} contributions in the last year`}>
          {data.contributions.weeks.map((week, w) => (
            <span key={w}>
              {week.map((day) => (
                <i key={day.date} data-level={day.level} title={`${day.count} on ${day.date}`} />
              ))}
            </span>
          ))}
        </div>
      )}
      {data.repos.length > 0 && (
        <ul className="pp-repos">
          {data.repos.map((repo) => (
            <li key={repo.fullName}>
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name} ↗
              </a>
              {repo.description && <p>{repo.description}</p>}
              <small>{[repo.language, `★ ${repo.stars}`, `⑂ ${repo.forks}`].filter(Boolean).join(" · ")}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
