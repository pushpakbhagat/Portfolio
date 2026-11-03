import { z } from "zod";

// Validation for every admin form. Used by react-hook-form in the browser for instant feedback and
// again by the Server Actions, which never trust what the browser sent.

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters.`);
const required = (label: string, max = 160) => text(max).min(1, `${label} is required.`);

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Use a full URL starting with https://");

const date = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date.")
  .transform((v) => v || null);

const requiredDate = (label: string) => z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} is required.`);

const storagePath = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((v) => v || null);

const list = (max = 300) => z.array(text(max)).transform((items) => items.map((i) => i.trim()).filter(Boolean));

const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => (v === "" || v === null ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 60), "Enter a number between 0 and 60.");

const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.union([z.enum(values), z.literal(""), z.null()]).transform((v) => (v ? v : null));

const endAfterStart = (v: { started_on: string | null; ended_on: string | null }) =>
  !v.started_on || !v.ended_on || v.ended_on >= v.started_on;

export const profileSchema = z.object({
  full_name: required("Name", 120),
  titles: list(80).refine((t) => t.length > 0, "Add at least one title."),
  intro: text(400),
  about: text(6000),
  interests: text(1000),
  career_goals: text(1000),
  current_status: text(300),
  experience_summary: text(300),
  location: text(120),
  timezone: text(60).refine((tz) => {
    if (!tz) return true;
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Use an IANA timezone such as Asia/Kolkata."),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
  availability: z.enum(["open", "limited", "unavailable"]),
  availability_note: text(120),
  photo_path: storagePath,
  resume_path: storagePath,
});

const sectionsSchema = z.object({
  focus: z.boolean(),
  projects: z.boolean(),
  skills: z.boolean(),
  experience: z.boolean(),
  education: z.boolean(),
  accomplishments: z.boolean(),
  github: z.boolean(),
  contact: z.boolean(),
});

export const settingsSchema = z.object({
  site_title: required("Site title", 120),
  site_description: text(300),
  seo_keywords: list(60),
  og_image_path: storagePath,
  logo_path: storagePath,
  favicon_path: storagePath,
  default_theme: z.enum(["system", "light", "dark"]),
  nav_links: z
    .array(
      z.object({
        label: required("Label", 40),
        href: required("Link", 200).refine((h) => /^(#|\/|https?:\/\/)/.test(h), "Use #section, /path or a full URL."),
      }),
    )
    .max(8, "Up to 8 links."),
  footer_text: text(300),
  announcement_enabled: z.boolean(),
  announcement_text: text(160),
  announcement_url: httpUrl.or(z.string().regex(/^\/[^\s]*$/)),
  github_username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{0,39}$/, "Only your username, e.g. pushpakbhagat."),
  github_show_activity: z.boolean(),
  sections: sectionsSchema,
  is_published: z.boolean(),
  notification_email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
});

export const socialLinkSchema = z.object({
  platform: required("Platform", 40),
  label: text(40),
  url: z
    .string()
    .trim()
    .max(500)
    .regex(/^(https?:\/\/|mailto:)\S+$/i, "Use a full URL (https://…) or mailto:"),
  is_visible: z.boolean(),
});

export const skillCategorySchema = z.object({
  name: required("Name", 60),
  description: text(300),
  is_visible: z.boolean(),
});

export const skillSchema = z.object({
  name: required("Name", 60),
  category_id: z
    .string()
    .nullable()
    .transform((v) => v || null),
  icon_slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]*$/, "Use the simple-icons slug, e.g. react or nodedotjs."),
  icon_path: storagePath,
  level: optionalEnum(["learning", "working", "proficient", "expert"]),
  years: optionalNumber,
  note: text(160),
  is_visible: z.boolean(),
});

export const focusAreaSchema = z.object({
  title: required("Title", 80),
  description: text(400),
  is_visible: z.boolean(),
});

export const educationSchema = z
  .object({
    institution: required("Institution"),
    degree: required("Degree"),
    field_of_study: text(160),
    location: text(120),
    started_on: date,
    ended_on: date,
    is_current: z.boolean(),
    grade: text(60),
    description: text(2000),
    coursework: list(80),
    logo_path: storagePath,
    is_visible: z.boolean(),
  })
  .refine(endAfterStart, { path: ["ended_on"], message: "The end date is before the start date." })
  .transform((v) => (v.is_current ? { ...v, ended_on: null } : v));

export const experienceSchema = z
  .object({
    company: required("Company"),
    company_url: httpUrl,
    logo_path: storagePath,
    title: required("Job title"),
    employment_type: z.enum(["full_time", "part_time", "internship", "trainee", "freelance", "contract", "apprenticeship"]),
    work_mode: optionalEnum(["onsite", "remote", "hybrid"]),
    location: text(120),
    started_on: requiredDate("Start date"),
    ended_on: date,
    is_current: z.boolean(),
    description: text(3000),
    responsibilities: list(),
    achievements: list(),
    technologies: list(60),
    is_visible: z.boolean(),
  })
  .refine(endAfterStart, { path: ["ended_on"], message: "The end date is before the start date." })
  .transform((v) => (v.is_current ? { ...v, ended_on: null } : v));

export const accomplishmentSchema = z.object({
  kind: z.enum(["certification", "course", "hackathon", "academic", "award", "competition", "other"]),
  title: required("Title"),
  issuer: text(160),
  issued_on: date,
  expires_on: date,
  credential_id: text(120),
  credential_url: httpUrl,
  description: text(1000),
  image_path: storagePath,
  is_visible: z.boolean(),
});

export const featuredRepoSchema = z.object({
  repo: z
    .string()
    .trim()
    .transform((v) => v.replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, ""))
    .pipe(z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/, "Use owner/name, e.g. pushpakbhagat/Interview_Analyzer.")),
  description_override: text(300),
  is_visible: z.boolean(),
});

export const projectSchema = z
  .object({
    title: required("Title", 120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes, e.g. student-hub."),
    summary: text(400),
    overview: text(8000),
    problem: text(8000),
    solution: text(8000),
    architecture: text(8000),
    features: list(),
    challenges: z
      .array(z.object({ challenge: text(600), solution: text(1200) }))
      .transform((items) => items.filter((c) => c.challenge.trim() || c.solution.trim())),
    outcomes: text(8000),
    category: text(80),
    role: text(120),
    status: optionalEnum(["planned", "in_progress", "completed", "maintained", "archived"]),
    started_on: date,
    ended_on: date,
    is_ongoing: z.boolean(),
    thumbnail_path: storagePath,
    github_url: httpUrl,
    live_url: httpUrl,
    is_featured: z.boolean(),
    seo_title: text(70),
    seo_description: text(200),
    technologies: list(60),
  })
  .refine(endAfterStart, { path: ["ended_on"], message: "The end date is before the start date." })
  .transform((v) => (v.is_ongoing ? { ...v, ended_on: null } : v));

export const projectImageSchema = z.object({
  alt: text(200),
  caption: text(300),
});
