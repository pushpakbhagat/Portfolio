import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/site/contact-form";
import type { HomeData, SiteData } from "@/lib/content/queries";
import type { Availability, SectionKey } from "@/lib/content/types";
import { AVAILABILITY_LABELS } from "@/lib/format";
import type { GithubData } from "@/lib/github";
import { assetUrl } from "@/lib/storage";
import { Doodle, HeroArt } from "./doodles";
import { WorkBoard } from "./instruments";
import { GithubSheet, Journey, Toolbox, WhatIDo, Wins } from "./sections";
import { Checklist, SwapWord } from "./interactive";

/** Home page of the paper design. Shows the same content as the studio design, in its own layout. */
export function PaperHome({ site, home, github }: { site: SiteData; home: HomeData; github: GithubData | null }) {
  const { profile, settings, socials } = site;
  const on = (key: SectionKey) => settings.sections[key] !== false;
  const firstName = profile.full_name.split(" ")[0];
  const photo = assetUrl(profile.photo_path);
  const resume = assetUrl(profile.resume_path);
  const meme = assetUrl(settings.paper_meme_path);
  const projects = on("projects") ? home.projects : [];
  const skillGroups = on("skills") ? home.skillGroups : [];
  const experiences = on("experience") ? home.experiences : [];
  const education = on("education") ? home.education : [];
  const wins = on("accomplishments") ? home.accomplishments : [];
  const focusAreas = on("focus") ? home.focusAreas : [];
  const paragraphs = profile.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const facts = [
    { label: "Currently", value: profile.current_status },
    { label: "Experience", value: profile.experience_summary },
    { label: "Interests", value: profile.interests },
  ].filter((f) => f.value);
  const hasJourney = experiences.length > 0 || education.length > 0 || Boolean(profile.career_goals);

  return (
    <div className="pp-home pp-wrap">
      <section id="about" className="pp-section">
        <Doodle name="cup" side="l" top="120px" />
        <Doodle name="terminal" side="r" top="40px" />
        <div className="pp-sheet pp-hero">
          <div>
            {firstName && <span className="pp-sig">{firstName}</span>}
            {profile.titles[0] && <p className="pp-role">{profile.titles[0]}</p>}
            <h1>
              {settings.paper_headline || profile.full_name} <SwapWord words={settings.paper_swap_words} />
            </h1>
            {profile.intro && <p className="pp-intro">{profile.intro}</p>}
            <p className="pp-loc">{[profile.location, profile.timezone].filter(Boolean).join(" · ")}</p>
            <div className="pp-hero-links">
              {projects.length > 0 && (
                <a href="#work" className="pp-btn pp-btn-fill">
                  see my work
                </a>
              )}
              {resume && (
                <a href={resume} target="_blank" rel="noreferrer" className="pp-btn">
                  resume ↗
                </a>
              )}
            </div>
          </div>
          <div>
            <HeroArt />
            <AvailabilityDial availability={profile.availability} note={profile.availability_note} />
          </div>
        </div>

        {(paragraphs.length > 0 || facts.length > 0) && (
          <div className="pp-about">
            {paragraphs.length > 0 && (
              <div className="pp-lined">
                {paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            {facts.length > 0 && (
              <dl className="pp-facts">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </section>

      {focusAreas.length > 0 && <WhatIDo areas={focusAreas} />}

      {settings.paper_beliefs.length > 0 && (
        <section className="pp-section pp-beliefs" aria-labelledby="pp-beliefs">
          <Doodle name="cat" side="r" top="10px" />
          <p className="pp-lab" id="pp-beliefs">
            {settings.paper_beliefs.length} things I believe in
          </p>
          <ul className="pp-scraps">
            {settings.paper_beliefs.map((belief) => (
              <li key={belief} className="pp-scrap">
                {belief}
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section id="work" className="pp-section pp-work" aria-labelledby="pp-work">
          <Doodle name="bug" side="l" top="60px" />
          <Doodle name="bulb" side="r" top="180px" />
          <h2 className="pp-tab" id="pp-work">
            things I built
          </h2>
          <WorkBoard
            switches={settings.paper_show_switchboard}
            projects={projects.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              summary: p.summary,
              cover: assetUrl(p.thumbnail_path),
              tech: p.technologies.map((t) => t.name),
            }))}
          />
        </section>
      )}

      {skillGroups.length > 0 && (
        <div className="pp-section">
          <Doodle name="branch" side="l" top="120px" />
          <Toolbox groups={skillGroups} />
        </div>
      )}

      {hasJourney && <Journey experiences={experiences} education={education} goal={profile.career_goals} documents={home.documents} />}

      {wins.length > 0 && <Wins items={wins} documents={home.documents} />}

      {github && <GithubSheet data={github} />}

      {settings.paper_show_off_screen && (
      <Link href="/off-screen" className="pp-teaser">
        <span>
          <small>side B</small>
          When I&apos;m not coding
        </span>
        <svg aria-hidden viewBox="0 0 64 64" className="pp-d">
          <circle cx="32" cy="32" r="26" />
          <circle cx="32" cy="32" r="9" />
          <path d="M32 6a26 26 0 0 1 22 12M12 46a26 26 0 0 0 14 11" />
        </svg>
        <b>music, films, anime, games →</b>
      </Link>
      )}

      <section id="connect" className="pp-section" aria-label="Connect">
        <Doodle name="rocket" side="r" top="80px" />
        <Doodle name="star" side="l" top="320px" />
        {(photo || settings.paper_looking_for.length > 0) && (
          <div className={`pp-me${photo && settings.paper_looking_for.length > 0 ? "" : " pp-me-solo"}`}>
            {photo && (
              <figure className="pp-pola">
                <div>
                  <Image src={photo} alt={`Portrait of ${profile.full_name}`} fill sizes="230px" />
                </div>
                <span>{firstName}</span>
              </figure>
            )}
            {settings.paper_looking_for.length > 0 && (
              <div className="pp-sheet pp-look">
                <Checklist items={settings.paper_looking_for} />
              </div>
            )}
          </div>
        )}

        {on("contact") && (
          <div className="pp-sheet pp-contact">
            <div>
              <h2 className="pp-h2">Let&apos;s chat!</h2>
              {profile.availability_note && <p>{profile.availability_note}</p>}
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="pp-mail">
                  {profile.email}
                </a>
              )}
              {socials.length > 0 && (
                <ul className="pp-socials">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="pp-btn">
                        {s.label || s.platform} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ContactForm />
          </div>
        )}

        {meme && (
          <figure className="pp-meme" style={{ marginTop: 50 }}>
            <div>
              <Image src={meme} alt={settings.paper_meme_caption} fill sizes="440px" />
            </div>
            {settings.paper_meme_caption && <figcaption>{settings.paper_meme_caption}</figcaption>}
          </figure>
        )}
      </section>
    </div>
  );
}

const DIAL_ANGLE: Record<Availability, number> = { unavailable: -60, limited: 0, open: 60 };

/** A small gauge under the hero drawing: the needle sits on the availability set in Admin → Profile. */
function AvailabilityDial({ availability, note }: { availability: Availability; note: string }) {
  return (
    <div className="pp-dial">
      <svg viewBox="0 0 200 116" role="img" aria-label={AVAILABILITY_LABELS[availability]}>
        <path d="M20 104a80 80 0 0 1 40-69" className="pp-dial-zone" />
        <path d="M66 32a80 80 0 0 1 68 0" className="pp-dial-zone" />
        <path d="M140 35a80 80 0 0 1 40 69" className="pp-dial-zone pp-dial-open" />
        <path d="M100 104V40" className="pp-dial-needle" style={{ transform: `rotate(${DIAL_ANGLE[availability]}deg)` }} />
        <circle cx="100" cy="104" r="7" className="pp-dial-hub" />
      </svg>
      <p>
        <b>{AVAILABILITY_LABELS[availability]}</b>
        {note && <span>{note}</span>}
      </p>
    </div>
  );
}
