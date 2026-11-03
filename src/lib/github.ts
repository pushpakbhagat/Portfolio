import "server-only";
import type { FeaturedRepo } from "@/lib/content/types";

// GitHub data is a nice-to-have: every call has a timeout, is cached for an hour and returns null
// on any failure (rate limit, network, unknown user), and the section simply leaves it out.

const token = process.env.GITHUB_TOKEN;
const REVALIDATE = 3600;

export type Repo = {
  fullName: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
};

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type GithubData = {
  username: string;
  url: string;
  publicRepos: number | null;
  followers: number | null;
  repos: Repo[];
  contributions: { total: number; weeks: ContributionDay[][] } | null;
};

async function gh<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(5000),
      cache: "force-cache",
      next: { revalidate: REVALIDATE, tags: ["github"] },
    });
    if (!res.ok) {
      console.warn(`[github] ${path}: ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[github] ${path}: ${(error as Error).message}`);
    return null;
  }
}

type ApiRepo = {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

const toRepo = (r: ApiRepo, override = ""): Repo => ({
  fullName: r.full_name,
  name: r.name,
  description: override || r.description || "",
  url: r.html_url,
  homepage: r.homepage ?? "",
  language: r.language,
  stars: r.stargazers_count,
  forks: r.forks_count,
  pushedAt: r.pushed_at,
});

export async function getGithubData(username: string, featured: FeaturedRepo[], showActivity: boolean): Promise<GithubData | null> {
  if (!username) return null;
  const user = encodeURIComponent(username);

  const [profile, repos, contributions] = await Promise.all([
    gh<{ html_url: string; public_repos: number; followers: number }>(`/users/${user}`),
    featured.length
      ? Promise.all(
          featured.map(async (f) => {
            const repo = await gh<ApiRepo>(`/repos/${f.repo}`);
            return repo ? toRepo(repo, f.description_override) : null;
          }),
        ).then((list) => list.filter((r): r is Repo => r !== null))
      : gh<ApiRepo[]>(`/users/${user}/repos?sort=pushed&per_page=30&type=owner`).then((list) =>
          (list ?? [])
            .filter((r) => !r.fork && !r.archived)
            .slice(0, 6)
            .map((r) => toRepo(r)),
        ),
    showActivity && token ? getContributions(username) : Promise.resolve(null),
  ]);

  if (!profile && repos.length === 0) return null;
  return {
    username,
    url: profile?.html_url ?? `https://github.com/${username}`,
    publicRepos: profile?.public_repos ?? null,
    followers: profile?.followers ?? null,
    repos,
    contributions,
  };
}

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** Last year of contributions. Needs GITHUB_TOKEN (the GraphQL API has no anonymous access). */
async function getContributions(username: string) {
  const data = await gh<{
    data?: {
      user?: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
          };
        };
      };
    };
  }>("/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
        totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`,
      variables: { login: username },
    }),
  });
  const calendar = data?.data?.user?.contributionsCollection.contributionCalendar;
  if (!calendar) return null;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
    ),
  };
}
