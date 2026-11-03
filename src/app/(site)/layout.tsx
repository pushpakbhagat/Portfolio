import { ViewTransition } from "react";
import { CursorLabel } from "@/components/motion/cursor-label";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Preloader } from "@/components/motion/preloader";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { getSiteData } from "@/lib/content/queries";
import { assetUrl } from "@/lib/storage";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { profile, settings, socials, configured } = await getSiteData();

  if (!configured) return <Notice title="Almost there." body="Connect Supabase to show the portfolio: copy .env.example to .env.local, fill in the Supabase keys and run npm run db:setup. The README walks through it." />;
  if (!settings.is_published) return <Notice title="Back soon." body={`${profile.full_name || "This portfolio"} is being updated. Please check back shortly.`} />;

  const showContact = settings.sections.contact !== false;

  return (
    <MotionProvider>
      <Preloader name={profile.full_name} />
      <a
        href="#main"
        className="fixed top-3 left-3 z-[70] -translate-y-20 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <div aria-hidden className="fixed inset-x-0 top-0 z-[55] h-px">
        <div data-progress className="h-full origin-left scale-x-0 bg-signal" />
      </div>

      {settings.announcement_enabled && settings.announcement_text && (
        <div className="relative z-[51] bg-foreground text-background">
          <p className="container-page flex h-9 items-center justify-center gap-3 text-xs">
            <span className="size-1.5 rounded-full bg-signal" aria-hidden />
            {settings.announcement_url ? (
              <a href={settings.announcement_url} className="link-draw">
                {settings.announcement_text} →
              </a>
            ) : (
              settings.announcement_text
            )}
          </p>
        </div>
      )}

      <SiteNav
        name={profile.full_name}
        logo={assetUrl(settings.logo_path)}
        links={settings.nav_links}
        socials={socials}
        availability={profile.availability}
        showContact={showContact}
      />
      <ViewTransition default="page">
        <main id="main">{children}</main>
      </ViewTransition>
      <SiteFooter profile={profile} links={settings.nav_links} socials={socials} footerText={settings.footer_text} />
      <CursorLabel />
    </MotionProvider>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main className="container-page grid min-h-svh content-center gap-6">
      <p className="eyebrow">Portfolio</p>
      <h1 className="text-display">
        <span className="serif-accent">{title}</span>
      </h1>
      <p className="max-w-lg text-lg text-muted-foreground">{body}</p>
    </main>
  );
}
