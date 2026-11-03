import { ArrowUpRight } from "lucide-react";
import { ScrubText } from "@/components/motion/split-text";
import type { Profile } from "@/lib/content/types";
import { assetUrl } from "@/lib/storage";
import { SectionHeader } from "../section-header";

export function hasAbout(profile: Profile) {
  return Boolean(
    profile.about ||
      profile.interests ||
      profile.career_goals ||
      profile.current_status ||
      profile.experience_summary,
  );
}

export function About({ profile, index }: { profile: Profile; index: string }) {
  const [lead, ...paragraphs] = profile.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const resume = assetUrl(profile.resume_path);
  const facts = [
    { label: "Currently", value: profile.current_status },
    { label: "Experience", value: profile.experience_summary },
    { label: "Based in", value: profile.location },
    { label: "Interests", value: profile.interests },
    { label: "Goals", value: profile.career_goals },
  ].filter((f) => f.value);

  return (
    <section id="about" className="container-page scroll-mt-20 py-20 md:py-40">
      <SectionHeader index={index} label="About" />

      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <aside className="order-last md:order-none md:col-span-4 lg:col-span-3">
          <div className="space-y-8 md:sticky md:top-28 md:space-y-10">
            {facts.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-6 border-t md:grid-cols-1" data-reveal-children>
                {facts.map((f) => (
                  <div key={f.label} className="grid content-start gap-1 border-b py-4">
                    <dt className="eyebrow">{f.label}</dt>
                    <dd className="text-sm leading-relaxed whitespace-pre-line">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {resume && (
              <a
                href={resume}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium"
              >
                <span className="link-draw">Download resume</span>
                <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>
        </aside>

        <div className="md:col-span-8 lg:col-span-8 lg:col-start-5">
          {lead && <ScrubText text={lead} className="text-statement text-balance" />}
          {paragraphs.length > 0 && (
            <div className="mt-12 max-w-2xl space-y-6 text-lg leading-relaxed text-muted-foreground md:ml-[16.66%]" data-reveal-children>
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
