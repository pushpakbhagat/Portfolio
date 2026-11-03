import { SmoothLink } from "@/components/motion/smooth-link";
import { SplitText } from "@/components/motion/split-text";
import type { NavLink, Profile, SocialLink } from "@/lib/content/types";
import { BackToTop } from "./back-to-top";

type Props = { profile: Profile; links: NavLink[]; socials: SocialLink[]; footerText: string };

export function SiteFooter({ profile, links, socials, footerText }: Props) {
  const year = new Date().getFullYear();
  const [first, ...rest] = (profile.full_name || "Portfolio").split(" ");

  return (
    <footer className="relative overflow-hidden border-t">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 pt-14 pb-8 md:grid-cols-12 md:gap-12 md:pt-16 md:pb-10">
        <div className="col-span-2 md:col-span-5">
          <p className="eyebrow mb-4">{profile.titles[0] ?? ""}</p>
          {footerText && <p className="max-w-sm text-muted-foreground">{footerText}</p>}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="mt-4 inline-flex min-h-11 items-center text-xl tracking-tight break-all">
              <span className="link-draw">{profile.email}</span>
            </a>
          )}
        </div>

        <nav aria-label="Footer" className="md:col-span-2 md:col-start-7">
          <p className="eyebrow mb-2">Index</p>
          <ul className="text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <SmoothLink href={l.href} className="inline-flex min-h-10 items-center">
                  <span className="link-draw">{l.label}</span>
                </SmoothLink>
              </li>
            ))}
          </ul>
        </nav>

        {socials.length > 0 && (
          <div className="md:col-span-2">
            <p className="eyebrow mb-2">Elsewhere</p>
            <ul className="text-sm">
              {socials.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center">
                    <span className="link-draw">{s.label || s.platform} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="col-span-2 md:col-span-2 md:justify-self-end">
          <BackToTop />
        </div>
      </div>

      {/* Oversized wordmark sitting on the bottom rule; descenders are cropped on purpose. */}
      <div aria-hidden className="container-page overflow-hidden select-none">
        <p
          data-split-reveal
          className="h-[0.8em] text-[clamp(3rem,12.2vw,15rem)] leading-[0.95] font-semibold tracking-[-0.06em] whitespace-nowrap"
        >
          <SplitText text={first} />
          {rest.length > 0 && (
            <>
              {" "}
              <SplitText text={rest.join(" ")} className="serif-accent text-muted-foreground" />
            </>
          )}
        </p>
      </div>

      <div className="container-page flex flex-wrap justify-between gap-2 border-t py-5">
        <p className="eyebrow">
          © {year} {profile.full_name}
        </p>
        <p className="eyebrow">Built with Next.js &amp; Supabase</p>
      </div>
    </footer>
  );
}
