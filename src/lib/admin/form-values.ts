// Plain helpers shared by admin Server Components (which load the data) and the client forms.
// Kept out of "use client" files: a Server Component can't call a function from a client module.

/** Database row → form values: nulls become "" for text inputs, everything else is kept. */
export function toFormValues<T extends Record<string, unknown>>(defaults: T, row?: Record<string, unknown> | null): T {
  const out: Record<string, unknown> = { ...defaults };
  if (!row) return out as T;
  for (const key of Object.keys(defaults)) {
    const v = row[key];
    if (v === undefined) continue;
    out[key] = v === null && typeof defaults[key] === "string" ? "" : typeof v === "number" && typeof defaults[key] === "string" ? String(v) : v;
  }
  return out as T;
}

export const PROJECT_DEFAULTS = {
  title: "",
  slug: "",
  summary: "",
  overview: "",
  problem: "",
  solution: "",
  architecture: "",
  features: [] as string[],
  challenges: [] as { challenge: string; solution: string }[],
  outcomes: "",
  category: "",
  role: "",
  status: null as string | null,
  started_on: "",
  ended_on: "",
  is_ongoing: false,
  thumbnail_path: null as string | null,
  github_url: "",
  live_url: "",
  is_featured: false,
  seo_title: "",
  seo_description: "",
  technologies: [] as string[],
};

export type ProjectFormValues = typeof PROJECT_DEFAULTS;
