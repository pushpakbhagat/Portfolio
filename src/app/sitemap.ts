import type { MetadataRoute } from "next";
import { getPublishedSlugs, getSiteData } from "@/lib/content/queries";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ settings, profile }, projects] = await Promise.all([getSiteData(), getPublishedSlugs()]);
  if (!settings.is_published) return [];
  return [
    { url: siteUrl, lastModified: new Date(profile.updated_at), changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
