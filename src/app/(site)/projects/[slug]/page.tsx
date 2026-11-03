import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/site/case-study";
import { JsonLd } from "@/components/site/json-ld";
import { getPublishedProject, getPublishedSlugs, getSiteData } from "@/lib/content/queries";
import { siteUrl } from "@/lib/env";
import { assetUrl } from "@/lib/storage";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getPublishedSlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "Project not found" };
  const title = project.seo_title || project.title;
  const description = project.seo_description || project.summary;
  const image = assetUrl(project.thumbnail_path) ?? `/og?project=${encodeURIComponent(slug)}`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      url: `/projects/${slug}`,
      title,
      description,
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, slugs, { profile }] = await Promise.all([getPublishedProject(slug), getPublishedSlugs(), getSiteData()]);
  if (!project) notFound();

  const i = slugs.findIndex((s) => s.slug === slug);
  const nextSlug = slugs.length > 1 ? slugs[(i + 1) % slugs.length].slug : null;
  const next = nextSlug ? await getPublishedProject(nextSlug) : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.summary,
          url: `${siteUrl}/projects/${slug}`,
          author: { "@type": "Person", name: profile.full_name, url: siteUrl },
          keywords: project.technologies.map((t) => t.name).join(", "),
          ...(project.github_url ? { codeRepository: project.github_url } : {}),
          ...(project.live_url ? { sameAs: project.live_url } : {}),
          ...(assetUrl(project.thumbnail_path) ? { image: assetUrl(project.thumbnail_path) } : {}),
          dateModified: project.updated_at,
        }}
      />
      <CaseStudy project={project} next={next ? { slug: next.slug, title: next.title } : null} />
    </>
  );
}
