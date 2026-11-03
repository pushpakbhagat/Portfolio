const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "Mar 2024" from an ISO date (yyyy-mm-dd). */
export function formatMonth(date: string | null | undefined) {
  return date ? monthYear.format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "";
}

export function formatDate(date: string | null | undefined) {
  return date ? fullDate.format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "";
}

export function formatDateTime(date: string | null | undefined) {
  return date ? dateTime.format(new Date(date)) : "";
}

/** "Mar 2024 — Present", "2022 — 2024", or "" when no dates are set. */
export function formatPeriod(start: string | null, end: string | null, current = false) {
  const from = formatMonth(start);
  const to = current ? "Present" : formatMonth(end);
  if (from && to) return `${from} — ${to}`;
  return from || to;
}

export function timeAgo(date: string) {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return "just now";
}

export const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  trainee: "Trainee",
  freelance: "Freelance",
  contract: "Contract",
  apprenticeship: "Apprenticeship",
};

export const WORK_MODE_LABELS: Record<string, string> = { onsite: "On-site", remote: "Remote", hybrid: "Hybrid" };

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  maintained: "Maintained",
  archived: "Archived",
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  learning: "Learning",
  working: "Working knowledge",
  proficient: "Proficient",
  expert: "Expert",
};

export const ACCOMPLISHMENT_LABELS: Record<string, string> = {
  certification: "Certification",
  course: "Course",
  hackathon: "Hackathon",
  academic: "Academic",
  award: "Award",
  competition: "Competition",
  other: "Other",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  open: "Available for work",
  limited: "Limited availability",
  unavailable: "Not available",
};

/** Two-digit index used in section and project numbering: 1 → "01". */
export const pad = (n: number) => String(n).padStart(2, "0");
