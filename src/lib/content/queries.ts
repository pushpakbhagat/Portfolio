import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  Accomplishment,
  DocumentRow,
  Education,
  ExperienceWithTech,
  FeaturedRepo,
  FocusArea,
  Profile,
  ProjectWithRelations,
  SiteSettings,
  Skill,
  SkillCategory,
  SocialLink,
  Technology,
} from "./types";

// Public reads. Everything here goes through the anonymous client, so Row Level Security returns
// only published / visible rows. A failed query logs and falls back to empty content: the site
// should render (with fewer sections) rather than crash when the database is unreachable.

export const EMPTY_PROFILE: Profile = {
  full_name: "",
  titles: [],
  intro: "",
  about: "",
  interests: "",
  career_goals: "",
  current_status: "",
  experience_summary: "",
  location: "",
  timezone: "",
  email: "",
  availability: "unavailable",
  availability_note: "",
  photo_path: null,
  resume_path: null,
  updated_at: new Date(0).toISOString(),
};

export const EMPTY_SETTINGS: SiteSettings = {
  site_title: "Portfolio",
  site_description: "",
  seo_keywords: [],
  og_image_path: null,
  logo_path: null,
  favicon_path: null,
  default_theme: "system",
  nav_links: [],
  footer_text: "",
  announcement_enabled: false,
  announcement_text: "",
  announcement_url: "",
  github_username: "",
  github_show_activity: false,
  sections: {},
  is_published: true,
  updated_at: new Date(0).toISOString(),
};

export type SiteData = { profile: Profile; settings: SiteSettings; socials: SocialLink[]; configured: boolean };

export type HomeData = {
  focusAreas: FocusArea[];
  skillGroups: { category: SkillCategory | null; skills: Skill[] }[];
  projects: ProjectWithRelations[];
  experiences: ExperienceWithTech[];
  education: Education[];
  accomplishments: Accomplishment[];
  repos: FeaturedRepo[];
  /** Public supporting documents, keyed by the id of the entry they belong to. */
  documents: Record<string, DocumentRow[]>;
};

function report(label: string, error: { message: string } | null) {
  if (error) console.error(`[content] ${label}: ${error.message}`);
}

export const getSiteData = cache(async (): Promise<SiteData> => {
  if (!isSupabaseConfigured) {
    return { profile: EMPTY_PROFILE, settings: EMPTY_SETTINGS, socials: [], configured: false };
  }
  const db = createPublicClient();
  const [profile, settings, socials] = await Promise.all([
    db.from("profile").select("*").maybeSingle<Profile>(),
    db.from("site_settings").select("*").maybeSingle<SiteSettings>(),
    db.from("social_links").select("*").order("sort_order").returns<SocialLink[]>(),
  ]);
  report("profile", profile.error);
  report("site_settings", settings.error);
  report("social_links", socials.error);
  return {
    profile: { ...EMPTY_PROFILE, ...profile.data },
    settings: { ...EMPTY_SETTINGS, ...settings.data },
    socials: socials.data ?? [],
    configured: true,
  };
});

export const PROJECT_SELECT =
  "*, project_images(*), project_technologies(sort_order, technologies(id, name, icon_slug))";

type ProjectRow = Omit<ProjectWithRelations, "images" | "technologies"> & {
  project_images: ProjectWithRelations["images"] | null;
  project_technologies: { sort_order: number; technologies: Technology | null }[] | null;
};

export function toProject(row: ProjectRow): ProjectWithRelations {
  const { project_images, project_technologies, ...project } = row;
  return {
    ...project,
    challenges: Array.isArray(project.challenges) ? project.challenges : [],
    images: [...(project_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    technologies: [...(project_technologies ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((pt) => (pt.technologies ? [pt.technologies] : [])),
  };
}

export const getHomeData = cache(async (): Promise<HomeData> => {
  const empty: HomeData = {
    focusAreas: [],
    skillGroups: [],
    projects: [],
    experiences: [],
    education: [],
    accomplishments: [],
    repos: [],
    documents: {},
  };
  if (!isSupabaseConfigured) return empty;

  const db = createPublicClient();
  const [focus, categories, skills, projects, experiences, education, accomplishments, repos, documents] =
    await Promise.all([
      db.from("focus_areas").select("*").order("sort_order").returns<FocusArea[]>(),
      db.from("skill_categories").select("*").order("sort_order").returns<SkillCategory[]>(),
      db.from("skills").select("*").order("sort_order").returns<Skill[]>(),
      db.from("projects").select(PROJECT_SELECT).order("sort_order").returns<ProjectRow[]>(),
      db
        .from("experiences")
        .select("*, experience_technologies(sort_order, technologies(id, name, icon_slug))")
        .order("sort_order")
        .returns<(ExperienceWithTech & { experience_technologies: ProjectRow["project_technologies"] })[]>(),
      db.from("education").select("*").order("sort_order").returns<Education[]>(),
      db.from("accomplishments").select("*").order("sort_order").returns<Accomplishment[]>(),
      db.from("featured_repos").select("*").order("sort_order").returns<FeaturedRepo[]>(),
      db.from("documents").select("*").order("sort_order").returns<DocumentRow[]>(),
    ]);

  for (const [label, result] of Object.entries({
    focus, categories, skills, projects, experiences, education, accomplishments, repos, documents,
  })) {
    report(label, result.error);
  }

  return {
    focusAreas: focus.data ?? [],
    skillGroups: groupSkills(categories.data ?? [], skills.data ?? []),
    projects: (projects.data ?? []).map(toProject),
    experiences: (experiences.data ?? []).map(({ experience_technologies, ...e }) => ({
      ...e,
      technologies: [...(experience_technologies ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((et) => (et.technologies ? [et.technologies] : [])),
    })),
    education: education.data ?? [],
    accomplishments: accomplishments.data ?? [],
    repos: repos.data ?? [],
    documents: groupDocuments(documents.data ?? []),
  };
});

function groupDocuments(docs: DocumentRow[]) {
  const out: Record<string, DocumentRow[]> = {};
  for (const d of docs) {
    const parent = d.education_id ?? d.experience_id ?? d.accomplishment_id;
    if (parent) (out[parent] ??= []).push(d);
  }
  return out;
}

/** Skills grouped under their (visible) categories, in display order. Uncategorised skills last. */
function groupSkills(categories: SkillCategory[], skills: Skill[]) {
  const groups = categories.map((category) => ({
    category: category as SkillCategory | null,
    skills: skills.filter((s) => s.category_id === category.id),
  }));
  const known = new Set(categories.map((c) => c.id));
  const rest = skills.filter((s) => !s.category_id || !known.has(s.category_id));
  // Skills whose category is hidden stay hidden; only truly uncategorised ones form "Other".
  const uncategorised = rest.filter((s) => !s.category_id);
  if (uncategorised.length) groups.push({ category: null, skills: uncategorised });
  return groups.filter((g) => g.skills.length > 0);
}

export const getPublishedProject = cache(async (slug: string) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient()
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("slug", slug)
    .maybeSingle<ProjectRow>();
  report(`project ${slug}`, error);
  return data ? toProject(data) : null;
});

export async function getPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("projects")
    .select("slug, updated_at")
    .order("sort_order");
  report("project slugs", error);
  return data ?? [];
}

/** Admin preview: reads with the admin's session, so drafts are included. */
export async function getProjectForPreview(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle<ProjectRow>();
  report(`preview ${id}`, error);
  return data ? toProject(data) : null;
}
