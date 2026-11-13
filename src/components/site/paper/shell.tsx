import type { ReactNode } from "react";
import type { SiteData } from "@/lib/content/queries";
import { DoodleDefs, Scribble } from "./doodles";
import { paperFontClasses } from "./fonts";
import { CommandPalette, Compass, type CompassPin, type PaletteItem } from "./instruments";
import { PaperBoot } from "./interactive";
import { PAPER_PALETTES, paletteStyle } from "./palettes";
import "./paper.css";

const GLYPHS = ["{}", "</>", "#", "$_", "fn", "[]", "=>", "&&", "git", "npm", "db", "api", "::", "!=", "++", "()", "if", "px", "01", "/*"];
// Enough tiles for a long page; the strip clips whatever does not fit.
const TILES = Array.from({ length: 220 }, (_, i) => i);

// Used when no navigation links are set in Admin → Settings.
const DEFAULT_NAV = [
  { label: "about", href: "#about" },
  { label: "work", href: "#work" },
  { label: "connect", href: "#contact" },
];

// The admin describes section links by the studio design's ids; these three are named differently here.
const SECTION_ALIASES: Record<string, string> = { "#skills": "#toolbox", "#achievements": "#wins", "#contact": "#connect" };

/** A link from Settings → Navigation links, pointed at the paper home page's own section ids. */
function paperHref(href: string) {
  return href.startsWith("#") ? `/${SECTION_ALIASES[href] ?? href}` : href;
}

// Compass pins, clockwise from the top. Ids match the sections of the paper home page.
const PINS: CompassPin[] = [
  { id: "about", label: "about", href: "/#about", angle: -60 },
  { id: "work", label: "work", href: "/#work", angle: 0 },
  { id: "toolbox", label: "tools", href: "/#toolbox", angle: 60 },
  { id: "experience", label: "path", href: "/#experience", angle: 120 },
  { id: "connect", label: "hi", href: "/#connect", angle: 180 },
  { id: "off-screen", label: "life", href: "/off-screen", angle: 240 },
];

/**
 * Frame of the paper design: desk background, icon strips, handwritten nav and the footer.
 * It deliberately skips MotionProvider (smooth scrolling and scroll-triggered reveals): pages
 * scroll natively and all content is visible as soon as it loads.
 */
export function PaperShell({
  site,
  projects,
  children,
}: {
  site: SiteData;
  /** Published projects, for the command palette. */
  projects: { slug: string; title: string }[];
  children: ReactNode;
}) {
  const { profile, settings } = site;
  const firstName = profile.full_name.split(" ")[0] || "Portfolio";
  const ticker = [profile.location, profile.current_status, profile.availability_note].filter(Boolean);
  const hasWork = settings.sections.projects !== false && projects.length > 0;
  const shown = (key: string) => (key === "work" ? hasWork : key === "off-screen" ? settings.paper_show_off_screen : true);
  const nav = [
    ...(settings.nav_links.length > 0 ? settings.nav_links : DEFAULT_NAV)
      .filter((l) => l.href !== "#work" || hasWork)
      .map((l) => ({ label: l.label.toLowerCase(), href: paperHref(l.href) })),
    ...(settings.paper_show_off_screen ? [{ label: "off-screen", href: "/off-screen" }] : []),
  ];
  const pins = PINS.filter((p) => shown(p.id));
  const jump: PaletteItem[] = [
    ...pins.map((p) => ({ label: p.id === "off-screen" ? "Off-screen" : p.id[0].toUpperCase() + p.id.slice(1), hint: "section", href: p.href })),
    ...(hasWork ? projects.map((p) => ({ label: p.title, hint: "project", href: `/projects/${p.slug}` })) : []),
    ...(profile.email ? [{ label: "Email me", hint: profile.email, href: `mailto:${profile.email}` }] : []),
  ];

  return (
    <>
      <PaperBoot />
      <div className={`pp ${paperFontClasses}`} style={paletteStyle(PAPER_PALETTES[settings.paper_palette] ?? PAPER_PALETTES.plum)}>
        <DoodleDefs />
        <a
          href="#main"
          className="fixed top-3 left-3 z-[70] -translate-y-20 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground focus:translate-y-0"
        >
          Skip to content
        </a>
        {(["l", "r"] as const).map((side, s) => (
          <div key={side} aria-hidden className={`pp-strip pp-strip-${side}`}>
            {TILES.map((i) => (
              <span key={i}>{GLYPHS[(i * 3 + s * 7) % GLYPHS.length]}</span>
            ))}
          </div>
        ))}

        {settings.announcement_enabled && settings.announcement_text && (
          <p className="pp-banner">
            {settings.announcement_url ? <a href={settings.announcement_url}>{settings.announcement_text} →</a> : settings.announcement_text}
          </p>
        )}

        <div className="pp-wrap">
          <nav aria-label="Main" className="pp-nav">
            {nav.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
                <Scribble />
              </a>
            ))}
            <CommandPalette items={jump} />
          </nav>
        </div>

        {settings.paper_show_compass && <Compass pins={pins} />}

        <main id="main" className="pp-main">
          {children}
        </main>

        <footer className="pp-wrap pp-foot">
          {ticker.length > 0 && (
            <div className="pp-mq">
              <span>{ticker.join("  ·  ")}  ·  </span>
            </div>
          )}
          <span className="pp-sig">{firstName}</span>
          {profile.email && <p>{profile.email}</p>}
          <p>{settings.footer_text || `© ${new Date().getFullYear()} ${profile.full_name}`}</p>
        </footer>
      </div>
    </>
  );
}
