import { Marquee } from "@/components/motion/marquee";
import { SpotlightGrid } from "@/components/motion/spotlight-grid";
import type { HomeData } from "@/lib/content/queries";
import { SKILL_LEVEL_LABELS } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { BrandIcon } from "../brand-icon";
import { SectionHeader } from "../section-header";

/** A spec-sheet grid per category: no percentage bars, just what, how well and how long. */
export function Skills({ groups, index }: { groups: HomeData["skillGroups"]; index: string }) {
  const skills = groups.flatMap((g) => g.skills);

  return (
    <section id="skills" className="scroll-mt-20 py-20 md:py-32">
      {/* Endless strip of the whole stack: a hinge between the work above and the detail below. */}
      <div className="mb-20 border-y py-5 md:mb-28 md:py-7">
        <Marquee label="Technologies I use">
          {skills.map((skill) => (
            <span key={skill.id} className="flex items-center gap-3 px-6 text-2xl font-medium tracking-tight whitespace-nowrap md:px-10 md:text-4xl">
              <BrandIcon slug={skill.icon_slug} src={assetUrl(skill.icon_path)} className="size-6 text-muted-foreground md:size-8" />
              {skill.name}
              <span aria-hidden className="ml-6 size-1.5 rounded-full bg-signal md:ml-10" />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container-page">
        <SectionHeader
          index={index}
          label="Toolkit"
          title="The tools I"
          accent="build with."
          aside={
            <span className="eyebrow">
              <span data-count={skills.length}>{skills.length}</span> technologies
            </span>
          }
        />

        <div className="border-b">
          {groups.map((group) => (
            <div key={group.category?.id ?? "other"} className="grid gap-4 border-t py-6 md:grid-cols-12 md:gap-8 md:py-8">
              <div className="md:col-span-3">
                <h3 className="text-lg font-medium tracking-tight">{group.category?.name ?? "Other"}</h3>
                {group.category?.description && (
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">{group.category.description}</p>
                )}
              </div>
              {/* Each cell draws its own border and overlaps its neighbour by 1px, so short rows
                  don't leave rules running across empty space. */}
              <SpotlightGrid className="grid grid-cols-3 pt-px pl-px md:col-span-9 lg:grid-cols-4" data-pop>
                {group.skills.map((skill) => {
                  const meta = [
                    skill.level ? SKILL_LEVEL_LABELS[skill.level] : "",
                    skill.years ? `${skill.years} yr${skill.years === 1 ? "" : "s"}` : "",
                  ].filter(Boolean);
                  return (
                    <li
                      key={skill.id}
                      className="spotlight group -mt-px -ml-px flex min-h-24 flex-col justify-between gap-4 overflow-hidden border p-3 transition-colors duration-500 hover:border-foreground/30 md:min-h-28 md:gap-6 md:p-4"
                    >
                      <span data-pop-item className="relative block size-5 origin-bottom-left">
                        <BrandIcon
                          slug={skill.icon_slug}
                          src={assetUrl(skill.icon_path)}
                          className="size-5 text-muted-foreground transition-colors duration-500 group-hover:text-signal"
                        />
                      </span>
                      <div className="relative">
                        <p className="text-sm leading-tight font-medium tracking-tight md:text-base">{skill.name}</p>
                        {meta.length > 0 && <p className="eyebrow mt-1 !text-[0.625rem] !tracking-[0.06em]">{meta.join(" · ")}</p>}
                        {skill.note && <p className="mt-1 hidden text-xs text-muted-foreground md:block">{skill.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </SpotlightGrid>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
