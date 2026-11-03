import type { z } from "zod";
import {
  ACCOMPLISHMENT_LABELS,
  EMPLOYMENT_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_MODE_LABELS,
  formatMonth,
  formatPeriod,
} from "@/lib/format";
import {
  accomplishmentSchema,
  educationSchema,
  experienceSchema,
  featuredRepoSchema,
  focusAreaSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
} from "./schemas";

// Describes each simple list module in the admin (table, form fields, validation, how a row is
// summarised). The generic list + form components and the generic Server Actions read this, so a
// new module is a config entry rather than new CRUD code. Projects, profile and settings have
// their own editors because their forms are richer.

export type Option = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  /** Spans both columns of the form grid. */
  wide?: boolean;
} & (
  | { type: "text" | "url" | "email" | "date" | "number" | "textarea" | "markdown" }
  | { type: "select"; options: Option[] | "skill_categories"; allowEmpty?: boolean }
  | { type: "switch" }
  | { type: "list"; itemLabel: string }
  | { type: "tags" }
  | { type: "links" }
  | { type: "image"; folder: string; accept?: "image" | "image+pdf" }
);

type Row = Record<string, unknown>;

export type EntityConfig = {
  table: string;
  label: string;
  singular: string;
  description: string;
  schema: z.ZodType;
  fields: FieldDef[];
  defaults: Row;
  title: (row: Row) => string;
  subtitle?: (row: Row) => string;
  /** Storage paths to delete when the row is deleted or the file replaced. */
  fileFields?: string[];
  /** Technology tags kept in a join table (experiences). */
  tagsKind?: "experience";
  searchable?: boolean;
};

const options = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const s = (v: unknown) => (typeof v === "string" ? v : "");

export const ENTITIES = {
  social_links: {
    table: "social_links",
    label: "Social links",
    singular: "social link",
    description: "Profiles shown in the hero, contact section, menu and footer.",
    schema: socialLinkSchema,
    defaults: { platform: "", label: "", url: "", is_visible: true },
    fields: [
      { name: "platform", label: "Platform", type: "text", placeholder: "github, linkedin, x, dribbble…" },
      { name: "label", label: "Display label", type: "text", placeholder: "GitHub" },
      { name: "url", label: "URL", type: "url", placeholder: "https://github.com/you", wide: true },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.label) || s(r.platform),
    subtitle: (r) => s(r.url),
  },

  skill_categories: {
    table: "skill_categories",
    label: "Skill categories",
    singular: "category",
    description: "Groups for the skills section, in the order they appear.",
    schema: skillCategorySchema,
    defaults: { name: "", description: "", is_visible: true },
    fields: [
      { name: "name", label: "Name", type: "text", placeholder: "Frontend Development", wide: true },
      { name: "description", label: "Description", type: "textarea", placeholder: "Optional one-liner under the name", wide: true },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.name),
    subtitle: (r) => s(r.description),
  },

  skills: {
    table: "skills",
    label: "Skills",
    singular: "skill",
    description: "Everything in your toolkit. Level and years are optional and only shown when set.",
    schema: skillSchema,
    defaults: { name: "", category_id: null, icon_slug: "", icon_path: null, level: null, years: "", note: "", is_visible: true },
    fields: [
      { name: "name", label: "Name", type: "text", placeholder: "React" },
      { name: "category_id", label: "Category", type: "select", options: "skill_categories", allowEmpty: true },
      {
        name: "icon_slug",
        label: "Icon",
        type: "text",
        placeholder: "react",
        description: "A slug from simpleicons.org (e.g. react, nodedotjs, postgresql). Leave empty for no icon.",
      },
      { name: "icon_path", label: "Or upload an icon", type: "image", folder: "icons" },
      { name: "level", label: "Proficiency", type: "select", options: options(SKILL_LEVEL_LABELS), allowEmpty: true },
      { name: "years", label: "Years of experience", type: "number", placeholder: "Optional" },
      { name: "note", label: "Note", type: "text", placeholder: "Optional, e.g. “used daily at work”", wide: true },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.name),
    subtitle: (r) => [r.level ? SKILL_LEVEL_LABELS[s(r.level)] : "", r.years ? `${r.years} yrs` : ""].filter(Boolean).join(" · "),
    fileFields: ["icon_path"],
    searchable: true,
  },

  focus_areas: {
    table: "focus_areas",
    label: "What I do",
    singular: "area",
    description: "The areas you work in, shown as numbered rows. Keep descriptions to a sentence or two.",
    schema: focusAreaSchema,
    defaults: { title: "", description: "", is_visible: true },
    fields: [
      { name: "title", label: "Title", type: "text", placeholder: "Backend and APIs", wide: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.title),
    subtitle: (r) => s(r.description),
  },

  experiences: {
    table: "experiences",
    label: "Experience",
    singular: "position",
    description: "Jobs, internships, trainee positions and freelance work, newest first.",
    schema: experienceSchema,
    defaults: {
      company: "",
      company_url: "",
      logo_path: null,
      title: "",
      employment_type: "full_time",
      work_mode: null,
      location: "",
      started_on: "",
      ended_on: "",
      is_current: false,
      description: "",
      responsibilities: [],
      achievements: [],
      technologies: [],
      is_visible: true,
    },
    fields: [
      { name: "title", label: "Job title", type: "text", placeholder: "Software Developer Intern" },
      { name: "company", label: "Company", type: "text" },
      { name: "employment_type", label: "Employment type", type: "select", options: options(EMPLOYMENT_LABELS) },
      { name: "work_mode", label: "Work mode", type: "select", options: options(WORK_MODE_LABELS), allowEmpty: true },
      { name: "started_on", label: "Start date", type: "date" },
      { name: "ended_on", label: "End date", type: "date", description: "Leave empty if this is your current role." },
      { name: "is_current", label: "I currently work here", type: "switch" },
      { name: "location", label: "Location", type: "text", placeholder: "Pune, India" },
      { name: "company_url", label: "Company website", type: "url", placeholder: "https://", wide: true },
      { name: "description", label: "Summary", type: "textarea", wide: true },
      { name: "responsibilities", label: "Responsibilities", type: "list", itemLabel: "responsibility", wide: true },
      { name: "achievements", label: "Achievements", type: "list", itemLabel: "achievement", wide: true },
      { name: "technologies", label: "Technologies used", type: "tags", wide: true },
      { name: "logo_path", label: "Company logo", type: "image", folder: "logos" },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => [s(r.title), s(r.company)].filter(Boolean).join(" — "),
    subtitle: (r) =>
      [EMPLOYMENT_LABELS[s(r.employment_type)], formatPeriod(s(r.started_on) || null, s(r.ended_on) || null, Boolean(r.is_current))]
        .filter(Boolean)
        .join(" · "),
    fileFields: ["logo_path"],
    tagsKind: "experience",
  },

  education: {
    table: "education",
    label: "Education",
    singular: "qualification",
    description: "Degrees, diplomas and schooling. Only what you enter is shown: nothing is assumed.",
    schema: educationSchema,
    defaults: {
      institution: "",
      degree: "",
      field_of_study: "",
      location: "",
      started_on: "",
      ended_on: "",
      is_current: false,
      grade: "",
      description: "",
      coursework: [],
      logo_path: null,
      is_visible: true,
    },
    fields: [
      { name: "degree", label: "Degree", type: "text", placeholder: "B.E." },
      { name: "field_of_study", label: "Specialisation", type: "text", placeholder: "Computer Engineering" },
      { name: "institution", label: "Institution", type: "text", wide: true },
      { name: "started_on", label: "Start date", type: "date" },
      { name: "ended_on", label: "End date", type: "date" },
      { name: "is_current", label: "Currently studying here", type: "switch" },
      { name: "grade", label: "Grade / CGPA / percentage", type: "text", placeholder: "Optional" },
      { name: "location", label: "Location", type: "text" },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "coursework", label: "Relevant coursework", type: "list", itemLabel: "course", wide: true },
      { name: "logo_path", label: "Institution logo", type: "image", folder: "logos" },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => [s(r.degree), s(r.field_of_study)].filter(Boolean).join(", "),
    subtitle: (r) => [s(r.institution), formatPeriod(s(r.started_on) || null, s(r.ended_on) || null, Boolean(r.is_current))].filter(Boolean).join(" · "),
    fileFields: ["logo_path"],
  },

  accomplishments: {
    table: "accomplishments",
    label: "Certifications & achievements",
    singular: "entry",
    description: "Certifications, courses, hackathons, awards and other recognition.",
    schema: accomplishmentSchema,
    defaults: {
      kind: "certification",
      title: "",
      issuer: "",
      issued_on: "",
      expires_on: "",
      credential_id: "",
      credential_url: "",
      description: "",
      image_path: null,
      is_visible: true,
    },
    fields: [
      { name: "kind", label: "Type", type: "select", options: options(ACCOMPLISHMENT_LABELS) },
      { name: "title", label: "Title", type: "text" },
      { name: "issuer", label: "Issuer / organiser", type: "text" },
      { name: "issued_on", label: "Date", type: "date" },
      { name: "credential_url", label: "Credential URL", type: "url", placeholder: "https://", wide: true },
      { name: "credential_id", label: "Credential ID", type: "text" },
      { name: "expires_on", label: "Expires", type: "date" },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "image_path", label: "Certificate image", type: "image", folder: "certificates" },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.title),
    subtitle: (r) => [ACCOMPLISHMENT_LABELS[s(r.kind)], s(r.issuer), formatMonth(s(r.issued_on) || null)].filter(Boolean).join(" · "),
    fileFields: ["image_path"],
    searchable: true,
  },

  featured_repos: {
    table: "featured_repos",
    label: "Featured repositories",
    singular: "repository",
    description: "Repositories to show in the GitHub section. With none, your most recently updated public repositories are shown.",
    schema: featuredRepoSchema,
    defaults: { repo: "", description_override: "", is_visible: true },
    fields: [
      { name: "repo", label: "Repository", type: "text", placeholder: "owner/name or a github.com URL", wide: true },
      {
        name: "description_override",
        label: "Description",
        type: "textarea",
        description: "Optional. Replaces the description from GitHub.",
        wide: true,
      },
      { name: "is_visible", label: "Visible on the site", type: "switch" },
    ],
    title: (r) => s(r.repo),
    subtitle: (r) => s(r.description_override),
  },
} satisfies Record<string, EntityConfig>;

export type EntityKey = keyof typeof ENTITIES;

export function getEntity(key: string): EntityConfig | null {
  return Object.hasOwn(ENTITIES, key) ? (ENTITIES as Record<string, EntityConfig>)[key] : null;
}
