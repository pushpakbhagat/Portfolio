// Nova's "brain": a small, local intent matcher over the portfolio's own data. No external AI
// service is called (free, private, instant), so every answer is something the site already says.

export type NovaKnowledge = {
  name: string;
  firstName: string;
  title: string;
  intro: string;
  location: string;
  availability: string;
  email: string;
  resumeUrl: string | null;
  projects: { title: string; slug: string; summary: string; tech: string[] }[];
  skills: { category: string; items: string[] }[];
  experience: { title: string; company: string; period: string }[];
  education: { degree: string; institution: string; period: string }[];
  socials: { label: string; url: string }[];
};

export type NovaAction =
  | { label: string; kind: "scroll"; target: string }
  | { label: string; kind: "link"; href: string; external?: boolean }
  | { label: string; kind: "theme" }
  | { label: string; kind: "ask"; question: string };

export type NovaReply = { text: string; actions?: NovaAction[]; effect?: "theme" };

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Word starts: "educat" matches "education". */
const has = (q: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}`, "i").test(q));
/** Whole words only, so "hi" doesn't match "his". */
const hasWord = (q: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(q));

export const SUGGESTIONS: NovaAction[] = [
  { label: "Show his projects", kind: "ask", question: "What has he built?" },
  { label: "His tech stack", kind: "ask", question: "What is his stack?" },
  { label: "Experience", kind: "ask", question: "Where has he worked?" },
  { label: "How to contact", kind: "ask", question: "How can I contact him?" },
];

export function greeting(k: NovaKnowledge): NovaReply {
  return {
    text: `Hi, I'm Nova, ${k.firstName}'s site guide. Ask me about his projects, skills, experience or how to reach him.`,
    actions: SUGGESTIONS,
  };
}

/** Picks the best answer for a question using keywords and the portfolio's own data. */
export function answer(question: string, k: NovaKnowledge): NovaReply {
  const q = question.toLowerCase().trim();
  const he = k.firstName;

  // A project mentioned by name wins over everything else.
  const project = k.projects.find(
    (p) => q.includes(p.title.toLowerCase()) || q.includes(p.slug.replace(/-/g, " ")) || q.includes(p.slug),
  );
  if (project) {
    return {
      text: `${project.title}: ${project.summary}${project.tech.length ? ` Built with ${list(project.tech.slice(0, 5))}.` : ""}`,
      actions: [{ label: "Read the case study", kind: "link", href: `/projects/${project.slug}` }],
    };
  }

  if (!q || hasWord(q, ["hi", "hii", "hello", "helo", "hey", "yo", "namaste", "sup"])) return greeting(k);

  if (has(q, ["thank"]) || hasWord(q, ["cool", "nice", "great", "awesome", "ok", "okay"])) {
    return { text: "Happy to help. Anything else you'd like to know?", actions: SUGGESTIONS.slice(0, 2) };
  }

  if (hasWord(q, ["dark", "light", "theme", "mode"])) {
    return { text: "Switching the lights for you.", effect: "theme", actions: [{ label: "Switch back", kind: "theme" }] };
  }

  if (has(q, ["resume", "cv", "curriculum"])) {
    return k.resumeUrl
      ? { text: `Here's ${he}'s resume as a PDF.`, actions: [{ label: "Open resume", kind: "link", href: k.resumeUrl, external: true }] }
      : { text: `${he} hasn't uploaded a resume yet, but you can reach him directly.`, actions: [{ label: "Contact", kind: "scroll", target: "contact" }] };
  }

  if (has(q, ["contact", "email", "mail", "hire", "reach", "talk", "available", "availability", "freelance", "job offer", "message"])) {
    const parts = [k.availability ? `${he} is ${k.availability.charAt(0).toLowerCase()}${k.availability.slice(1)}.` : ""];
    if (k.email) parts.push(`Email: ${k.email}.`);
    parts.push("Or send a message with the form below.");
    return {
      text: parts.filter(Boolean).join(" "),
      actions: [
        { label: "Open contact form", kind: "scroll", target: "contact" },
        ...(k.email ? [{ label: "Email him", kind: "link" as const, href: `mailto:${k.email}` }] : []),
      ],
    };
  }

  if (has(q, ["project", "built", "build", "work", "portfolio", "case stud", "made", "app"])
    && !has(q, ["worked", "company", "job", "intern"])) {
    if (!k.projects.length) return { text: `${he} is adding projects soon.` };
    return {
      text: `${he} has built ${list(k.projects.map((p) => p.title))}. Pick one to open its case study.`,
      actions: [
        ...k.projects.slice(0, 3).map((p) => ({ label: p.title, kind: "link" as const, href: `/projects/${p.slug}` })),
        { label: "See all work", kind: "scroll", target: "work" },
      ],
    };
  }

  if (has(q, ["skill", "stack", "tech", "language", "framework", "tool", "know", "use", "react", "node", "python", "django"])) {
    if (!k.skills.length) return { text: `${he}'s skills list is on its way.` };
    const lines = k.skills.slice(0, 4).map((s) => `${s.category}: ${list(s.items.slice(0, 5))}`);
    return { text: `${lines.join(". ")}.`, actions: [{ label: "See the full toolkit", kind: "scroll", target: "skills" }] };
  }

  if (has(q, ["experience", "worked", "job", "intern", "company", "career", "employ"])) {
    if (!k.experience.length) return { text: `${he} hasn't listed his experience here yet.` };
    const jobs = k.experience.slice(0, 3).map((e) => `${e.title} at ${e.company}${e.period ? ` (${e.period})` : ""}`);
    return { text: `${list(jobs)}.`, actions: [{ label: "Open experience", kind: "scroll", target: "experience" }] };
  }

  if (has(q, ["educat", "degree", "college", "universit", "study", "studied", "school"])) {
    if (!k.education.length) return { text: `${he} hasn't added his education here yet.` };
    const items = k.education.slice(0, 2).map((e) => `${e.degree}, ${e.institution}${e.period ? ` (${e.period})` : ""}`);
    return { text: `${list(items)}.`, actions: [{ label: "Open education", kind: "scroll", target: "education" }] };
  }

  if (has(q, ["github", "code", "repo", "linkedin", "social", "twitter"])) {
    if (!k.socials.length) return { text: `No profiles are linked yet.` };
    return {
      text: `You can find ${he} on ${list(k.socials.map((s) => s.label))}.`,
      actions: k.socials.slice(0, 3).map((s) => ({ label: s.label, kind: "link" as const, href: s.url, external: true })),
    };
  }

  if (has(q, ["where", "location", "based", "city", "live"])) {
    return { text: k.location ? `${he} is based in ${k.location}.` : `${he} hasn't shared his location here.` };
  }

  if (has(q, ["who", "about", "yourself", "him", "intro", k.firstName.toLowerCase()])) {
    return {
      text: `${k.name} is a ${k.title.toLowerCase() || "developer"}. ${k.intro}`,
      actions: [{ label: "Read more", kind: "scroll", target: "about" }],
    };
  }

  if (has(q, ["you", "nova", "bot", "ai"])) {
    return { text: "I'm Nova, a small guide built into this site. I answer from what's on the portfolio, so I won't make things up." };
  }

  return {
    text: "I'm not sure about that one. I can tell you about his projects, skills, experience, resume or how to get in touch.",
    actions: SUGGESTIONS,
  };
}

/** What Nova says when a section scrolls into view (once per visit). */
export function sectionTip(id: string, k: NovaKnowledge): string | null {
  const he = k.firstName;
  switch (id) {
    case "about":
      return `This is ${he} in his own words.`;
    case "work":
      return k.projects.length ? `Click a cover to open the full case study.` : null;
    case "skills":
      return `${he}'s toolkit, grouped by what each tool is for.`;
    case "experience":
      return `The dot follows his timeline as you scroll.`;
    case "contact":
      return `Messages sent here go straight to ${he}'s inbox.`;
    default:
      return null;
  }
}
