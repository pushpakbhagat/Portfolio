import "server-only";
import type { NovaKnowledge } from "@/components/site/nova/brain";
import { AVAILABILITY_LABELS, formatPeriod } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import type { HomeData, SiteData } from "./queries";

/** The slice of published portfolio content that Nova answers from. Only public data goes in. */
export function novaKnowledge({ profile, socials }: SiteData, home: HomeData): NovaKnowledge {
  return {
    name: profile.full_name,
    firstName: profile.full_name.split(" ")[0] || "He",
    title: profile.titles[0] ?? "",
    intro: profile.intro,
    location: profile.location,
    availability: profile.availability_note || AVAILABILITY_LABELS[profile.availability] || "",
    email: profile.email,
    resumeUrl: assetUrl(profile.resume_path),
    projects: home.projects.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      tech: p.technologies.map((t) => t.name),
    })),
    skills: home.skillGroups.map((g) => ({ category: g.category?.name ?? "Other", items: g.skills.map((s) => s.name) })),
    experience: home.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      period: formatPeriod(e.started_on, e.ended_on, e.is_current),
    })),
    education: home.education.map((e) => ({
      degree: [e.degree, e.field_of_study].filter(Boolean).join(", "),
      institution: e.institution,
      period: formatPeriod(e.started_on, e.ended_on, e.is_current),
    })),
    socials: socials.filter((s) => /^https?:\/\//.test(s.url)).map((s) => ({ label: s.label || s.platform, url: s.url })),
  };
}
