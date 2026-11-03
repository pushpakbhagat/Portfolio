// Row shapes of the content tables (supabase/migrations/0001_schema.sql).

export type Availability = "open" | "limited" | "unavailable";
export type PublishStatus = "draft" | "published";
export type ProjectStatus = "planned" | "in_progress" | "completed" | "maintained" | "archived";
export type SkillLevel = "learning" | "working" | "proficient" | "expert";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "internship"
  | "trainee"
  | "freelance"
  | "contract"
  | "apprenticeship";
export type WorkMode = "onsite" | "remote" | "hybrid";
export type AccomplishmentKind =
  | "certification"
  | "course"
  | "hackathon"
  | "academic"
  | "award"
  | "competition"
  | "other";
export type MessageStatus = "unread" | "read" | "archived";

export type NavLink = { label: string; href: string };

export type SectionKey =
  | "focus"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "accomplishments"
  | "github"
  | "contact";

export type Profile = {
  full_name: string;
  titles: string[];
  intro: string;
  about: string;
  interests: string;
  career_goals: string;
  current_status: string;
  experience_summary: string;
  location: string;
  timezone: string;
  email: string;
  availability: Availability;
  availability_note: string;
  photo_path: string | null;
  resume_path: string | null;
  updated_at: string;
};

export type SiteSettings = {
  site_title: string;
  site_description: string;
  seo_keywords: string[];
  og_image_path: string | null;
  logo_path: string | null;
  favicon_path: string | null;
  default_theme: "system" | "light" | "dark";
  nav_links: NavLink[];
  footer_text: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_url: string;
  github_username: string;
  github_show_activity: boolean;
  sections: Partial<Record<SectionKey, boolean>>;
  is_published: boolean;
  updated_at: string;
};

type Listed = { id: string; sort_order: number; is_visible: boolean; created_at: string; updated_at: string };

export type SocialLink = Listed & { platform: string; label: string; url: string };

export type SkillCategory = Listed & { name: string; description: string };

export type Skill = Listed & {
  category_id: string | null;
  name: string;
  icon_slug: string;
  icon_path: string | null;
  level: SkillLevel | null;
  years: number | null;
  note: string;
};

export type Technology = { id: string; name: string; icon_slug: string };

export type FocusArea = Listed & { title: string; description: string };

export type Challenge = { challenge: string; solution: string };

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  problem: string;
  solution: string;
  architecture: string;
  features: string[];
  challenges: Challenge[];
  outcomes: string;
  category: string;
  role: string;
  status: ProjectStatus | null;
  started_on: string | null;
  ended_on: string | null;
  is_ongoing: boolean;
  thumbnail_path: string | null;
  github_url: string;
  live_url: string;
  is_featured: boolean;
  publish_status: PublishStatus;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  path: string;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
  sort_order: number;
};

export type ProjectWithRelations = Project & {
  images: ProjectImage[];
  technologies: Technology[];
};

export type Education = Listed & {
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  started_on: string | null;
  ended_on: string | null;
  is_current: boolean;
  grade: string;
  description: string;
  coursework: string[];
  logo_path: string | null;
};

export type Experience = Listed & {
  company: string;
  company_url: string;
  logo_path: string | null;
  title: string;
  employment_type: EmploymentType;
  work_mode: WorkMode | null;
  location: string;
  started_on: string;
  ended_on: string | null;
  is_current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
};

export type ExperienceWithTech = Experience & { technologies: Technology[] };

export type Accomplishment = Listed & {
  kind: AccomplishmentKind;
  title: string;
  issuer: string;
  issued_on: string | null;
  expires_on: string | null;
  credential_id: string;
  credential_url: string;
  description: string;
  image_path: string | null;
};

export type DocumentRow = {
  id: string;
  title: string;
  bucket: "public-assets" | "private-documents";
  path: string;
  mime_type: string;
  size_bytes: number | null;
  education_id: string | null;
  experience_id: string | null;
  accomplishment_id: string | null;
  sort_order: number;
  created_at: string;
};

export type FeaturedRepo = Listed & { repo: string; description_override: string };

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  read_at: string | null;
  created_at: string;
};

export type ActivityEntry = {
  id: number;
  action: "create" | "update" | "delete";
  entity: string;
  entity_id: string;
  summary: string;
  created_at: string;
};
