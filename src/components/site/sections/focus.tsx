import type { FocusArea } from "@/lib/content/types";
import { pad } from "@/lib/format";
import { SectionHeader } from "../section-header";

export function Focus({ areas, index }: { areas: FocusArea[]; index: string }) {
  return (
    <section className="container-page py-24 md:py-32" aria-labelledby="focus-title">
      <SectionHeader index={index} label="What I do" />
      <h2 id="focus-title" className="sr-only">
        What I do
      </h2>
      <ol className="border-b" data-reveal-children>
        {areas.map((area, i) => (
          <li
            key={area.id}
            className="group grid gap-3 border-t py-8 transition-colors duration-500 hover:bg-surface md:grid-cols-12 md:items-baseline md:gap-6 md:py-10"
          >
            <span className="eyebrow md:col-span-1 md:pl-3">{pad(i + 1)}</span>
            <h3 className="text-title transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 md:col-span-5">
              {area.title}
            </h3>
            <p className="max-w-xl text-muted-foreground md:col-span-5 md:col-start-8">{area.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
