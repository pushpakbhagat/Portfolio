import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { NeuralField } from "@/components/motion/neural-field";
import { SmoothLink } from "@/components/motion/smooth-link";
import { SplitText } from "@/components/motion/split-text";
import type { Profile, SocialLink } from "@/lib/content/types";
import { AVAILABILITY_LABELS } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { HeroLight, LocalTime, ScrambleTitle } from "../hero-parts";
import { Portrait, type PortraitChip } from "../portrait";

type Props = { profile: Profile; socials: SocialLink[]; hasProjects: boolean; hasContact: boolean; chips: PortraitChip[] };

export function Hero({ profile, socials, hasProjects, hasContact, chips }: Props) {
  const [first, ...rest] = (profile.full_name || "Hello").split(" ");
  const last = rest.join(" ");
  const photo = assetUrl(profile.photo_path);
  const resume = assetUrl(profile.resume_path);
  const initials = (profile.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <section id="top" className="relative overflow-hidden" aria-label="Introduction">
      <div aria-hidden className="bg-hairlines pointer-events-none absolute inset-0" />
      {/* Colour light drifting behind the portrait side. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora top-[8%] right-[-8%] size-[46vw] max-w-[44rem] bg-signal/60" />
        <div className="aurora bottom-[-12%] right-[22%] size-[30vw] max-w-[28rem] bg-[oklch(0.72_0.11_245)]/70 [animation-delay:-8s]" />
        <div className="aurora top-[30%] left-[-10%] size-[26vw] max-w-[24rem] bg-[oklch(0.82_0.1_80)]/60 [animation-delay:-14s]" />
      </div>
      <NeuralField />
      {/* Light comets falling along three of the grid lines. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[1, 3, 5].map((column, i) => (
          <span
            key={column}
            className="hero-beam"
            style={{ left: `calc(var(--gutter) + ${column} * (100% - 2 * var(--gutter)) / 6)`, animationDelay: `${i * 2.7}s` }}
          />
        ))}
      </div>
      <HeroLight />

      <div
        data-hero-exit
        className="container-page relative grid min-h-svh grid-rows-[auto_1fr_auto] gap-8 pt-20 pb-6 md:gap-10 md:pt-28 md:pb-8"
      >
        {/* Meta strip */}
        <div className="eyebrow flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 md:gap-x-8">
          <span data-intro="fade">Portfolio — {new Date().getFullYear()}</span>
          {profile.location && <span data-intro="fade">{profile.location}</span>}
          {profile.timezone && (
            <span data-intro="fade">
              <LocalTime timezone={profile.timezone} />
            </span>
          )}
          <span data-intro="fade" className="inline-flex w-full items-center gap-2 !text-foreground sm:ml-auto sm:w-auto">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                profile.availability === "open"
                  ? "bg-signal"
                  : profile.availability === "limited"
                    ? "bg-amber-500"
                    : "bg-muted-foreground",
              )}
            />
            {profile.availability_note || AVAILABILITY_LABELS[profile.availability]}
          </span>
        </div>

        {/* Name + portrait */}
        <div className="flex flex-col justify-end gap-4 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 className="text-display relative z-10 max-lg:text-[clamp(4rem,18vw,9rem)] lg:col-span-7 lg:pb-4">
            <SplitText text={first} data-intro="chars" className="block" />
            {last && (
              <SplitText text={last} data-intro="chars" className="serif-accent block pl-[0.06em] text-[0.98em]" />
            )}
          </h1>

          <div data-intro="clip" className="order-first -mb-6 w-44 self-start sm:w-56 lg:order-none lg:col-span-5 lg:-mb-8 lg:w-full lg:max-w-[30rem] lg:justify-self-end">
            <Portrait src={photo} name={profile.full_name} initials={initials} chips={chips} />
          </div>
        </div>

        {/* Role, intro, actions */}
        <div className="grid gap-8 border-t pt-6 md:grid-cols-12">
          <div className="md:col-span-6 lg:col-span-5">
            <p data-intro="fade" className="text-title mb-4">
              <ScrambleTitle titles={profile.titles} />
            </p>
            {profile.intro && (
              <p data-intro="fade" className="max-w-md text-lg text-muted-foreground">
                {profile.intro}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-between gap-6 md:col-span-6 md:items-end lg:col-span-7">
            <div data-intro="fade" className="flex flex-wrap items-center gap-3">
              {hasProjects && (
                <Magnetic>
                  <SmoothLink
                    href="/#work"
                    className="beam group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
                  >
                    View projects
                    <ArrowDown className="size-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                  </SmoothLink>
                </Magnetic>
              )}
              {hasContact && (
                <Magnetic>
                  <SmoothLink
                    href="/#contact"
                    className="inline-flex h-12 items-center rounded-full border border-foreground/25 px-6 text-sm font-medium transition-colors hover:border-foreground"
                  >
                    Contact me
                  </SmoothLink>
                </Magnetic>
              )}
              {resume && (
                <a
                  href={resume}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium"
                >
                  <span className="link-draw">Download resume</span> <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
            {socials.length > 0 && (
              <ul data-intro="fade" className="-my-2 flex flex-wrap gap-x-6">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center">
                      <span className="eyebrow !text-foreground link-draw">{s.label || s.platform} ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
