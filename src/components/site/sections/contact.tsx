import type { Profile, SocialLink } from "@/lib/content/types";
import { AVAILABILITY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ContactForm } from "../contact-form";
import { SplitText } from "@/components/motion/split-text";

export function Contact({ profile, socials, index }: { profile: Profile; socials: SocialLink[]; index: string }) {
  return (
    <section id="contact" className="container-page relative isolate scroll-mt-20 py-20 md:py-36">
      {/* Signal rings radiating from behind the heading, under drifting colour light. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora top-[20%] left-[-6%] size-[36vw] max-w-[34rem] bg-signal/45" />
        <div className="aurora right-[4%] bottom-[0%] size-[28vw] max-w-[26rem] bg-[oklch(0.72_0.11_245)]/50 [animation-delay:-9s]" />
        <div className="absolute top-[34%] left-[22%] size-[min(70vw,40rem)] -translate-x-1/2 -translate-y-1/2">
          {[0, 1.8, 3.6].map((delay) => (
            <span
              key={delay}
              className="pulse-ring absolute inset-0 rounded-full border border-signal/50"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
      <div className="mb-8 flex items-center gap-4 border-t pt-4">
        <p className="eyebrow">§{index} — Contact</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <h2 className="text-display !text-[clamp(3.2rem,8vw,8.5rem)]" data-split-reveal>
            <SplitText text="Let's work" by="words" className="block" />
            <SplitText text="together." by="words" className="serif-accent block" />
          </h2>

          <div className="mt-10 space-y-8 md:mt-12">
            <p className="inline-flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "size-2 rounded-full",
                  profile.availability === "open" ? "bg-signal" : profile.availability === "limited" ? "bg-amber-500" : "bg-muted-foreground",
                )}
              />
              {AVAILABILITY_LABELS[profile.availability]}
              {profile.availability_note && <span className="text-muted-foreground">— {profile.availability_note}</span>}
            </p>
            {profile.email && (
              <div>
                <p className="eyebrow mb-2">Email</p>
                <a href={`mailto:${profile.email}`} className="text-title inline-flex min-h-11 items-center break-all">
                  <span className="link-draw">{profile.email}</span>
                </a>
              </div>
            )}
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full border px-4 text-sm transition-colors hover:border-foreground">
                      {s.label || s.platform} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {profile.location && (
              <p className="text-sm text-muted-foreground">
                <span className="eyebrow mr-3">Based in</span>
                {profile.location}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
