import { About, hasAbout } from "@/components/site/sections/about";
import { Accomplishments } from "@/components/site/sections/accomplishments";
import { Contact } from "@/components/site/sections/contact";
import { Focus } from "@/components/site/sections/focus";
import { GithubSection } from "@/components/site/sections/github";
import { Hero } from "@/components/site/sections/hero";
import { Projects } from "@/components/site/sections/projects";
import { Skills } from "@/components/site/sections/skills";
import { EducationSection, ExperienceSection } from "@/components/site/sections/timeline";
import { JsonLd } from "@/components/site/json-ld";
import { getHomeData, getSiteData } from "@/lib/content/queries";
import type { SectionKey } from "@/lib/content/types";
import { siteUrl } from "@/lib/env";
import { pad } from "@/lib/format";
import { getGithubData } from "@/lib/github";
import { assetUrl } from "@/lib/storage";

// Rebuilt whenever the admin saves (revalidatePath); the hour is only a safety net.
export const revalidate = 3600;

export default async function HomePage() {
  const [{ profile, settings, socials }, home] = await Promise.all([getSiteData(), getHomeData()]);
  const on = (key: SectionKey) => settings.sections[key] !== false;
  const github = on("github")
    ? await getGithubData(settings.github_username, home.repos, settings.github_show_activity)
    : null;

  // Sections render only when switched on in Settings and when they have content, and they are
  // numbered in the order they actually appear.
  const sections = [
    hasAbout(profile) && ((i: string) => <About key="about" profile={profile} index={i} />),
    on("focus") && home.focusAreas.length > 0 && ((i: string) => <Focus key="focus" areas={home.focusAreas} index={i} />),
    on("projects") && home.projects.length > 0 && ((i: string) => <Projects key="projects" projects={home.projects} index={i} />),
    on("skills") && home.skillGroups.length > 0 && ((i: string) => <Skills key="skills" groups={home.skillGroups} index={i} />),
    on("experience") && home.experiences.length > 0 &&
      ((i: string) => <ExperienceSection key="experience" items={home.experiences} index={i} documents={home.documents} />),
    on("education") && home.education.length > 0 &&
      ((i: string) => <EducationSection key="education" items={home.education} index={i} documents={home.documents} />),
    on("accomplishments") && home.accomplishments.length > 0 &&
      ((i: string) => <Accomplishments key="accomplishments" items={home.accomplishments} index={i} />),
    github && ((i: string) => <GithubSection key="github" data={github} index={i} />),
    on("contact") && ((i: string) => <Contact key="contact" profile={profile} socials={socials} index={i} />),
  ].filter((s): s is (i: string) => React.JSX.Element => typeof s === "function");

  // One skill (with an icon) from each of the first categories floats around the portrait.
  const heroChips = home.skillGroups
    .map((g) => g.skills.find((s) => s.icon_slug || s.icon_path) ?? g.skills[0])
    .filter(Boolean)
    .slice(0, 4)
    .map((s) => ({ name: s.name, slug: s.icon_slug, src: assetUrl(s.icon_path) }));

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    jobTitle: profile.titles[0],
    description: profile.intro,
    url: siteUrl,
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    ...(assetUrl(profile.photo_path) ? { image: assetUrl(profile.photo_path) } : {}),
    ...(profile.location ? { address: { "@type": "PostalAddress", addressLocality: profile.location } } : {}),
    sameAs: socials.filter((s) => s.url.startsWith("http")).map((s) => s.url),
    knowsAbout: home.skillGroups.flatMap((g) => g.skills.map((s) => s.name)),
  };

  return (
    <>
      <JsonLd data={person} />
      <Hero
        profile={profile}
        socials={socials}
        hasProjects={on("projects") && home.projects.length > 0}
        hasContact={on("contact")}
        chips={heroChips}
      />
      {sections.map((render, i) => render(pad(i + 1)))}
    </>
  );
}
